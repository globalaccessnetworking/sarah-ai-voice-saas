import asyncio
import logging
import json
from typing import List, Dict, Any, Optional, Callable
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from mcp.client.sse import sse_client
from contextlib import AsyncExitStack

logger = logging.getLogger("ai_worker.services.mcp_client")

class MCPClientManager:
    """Manages connections to multiple MCP servers."""
    
    def __init__(self):
        self.sessions: Dict[str, ClientSession] = {}
        self.exit_stack = AsyncExitStack()

    async def connect_to_server(self, server_id: str, config: Dict[str, Any]):
        """
        Connects to an MCP server (SSE or Stdio).
        config: { "type": "sse"|"stdio", "url": "...", "command": "...", "args": [] }
        """
        try:
            transport_type = config.get("type", "sse")
            
            if transport_type == "stdio":
                command = config.get("command")
                args = config.get("args", [])
                env = config.get("env")
                
                server_params = StdioServerParameters(
                    command=command,
                    args=args,
                    env=env
                )
                
                read, write = await self.exit_stack.enter_async_context(stdio_client(server_params))
                session = await self.exit_stack.enter_async_context(ClientSession(read, write))
                
                await session.initialize()
                self.sessions[server_id] = session
                logger.info(f"Connected to Stdio MCP Server: {server_id}")
                
            elif transport_type == "sse":
                url = config.get("url")
                
                read, write = await self.exit_stack.enter_async_context(sse_client(url))
                session = await self.exit_stack.enter_async_context(ClientSession(read, write))
                
                await session.initialize()
                self.sessions[server_id] = session
                logger.info(f"Connected to SSE MCP Server: {server_id}")
                
            else:
                logger.error(f"Unknown MCP transport type: {transport_type}")
                
        except Exception as e:
            logger.error(f"Failed to connect to MCP server {server_id}: {e}")

    async def get_all_tools(self) -> List[Dict[str, Any]]:
        """Fetches tools from all connected sessions."""
        all_tools = []
        for server_id, session in self.sessions.items():
            try:
                result = await session.list_tools()
                for tool in result.tools:
                    tool_data = {
                        "server_id": server_id,
                        "name": tool.name,
                        "description": tool.description,
                        "input_schema": tool.inputSchema
                    }
                    all_tools.append(tool_data)
            except Exception as e:
                logger.error(f"Error listing tools for MCP server {server_id}: {e}")
        return all_tools

    async def get_wrapped_tools(self) -> List[Callable]:
        """
        Fetches tools from all connected MCP servers and returns 
        them as LiveKit @function_tool decorated handlers.
        """
        from livekit.agents import function_tool, RunContext
        
        wrapped_tools = []
        all_tools = await self.get_all_tools()
        
        for tool_def in all_tools:
            name = tool_def["name"]
            description = tool_def.get("description", f"MCP Tool: {name}")
            server_id = tool_def["server_id"]
            
            # Create the closure for the handler
            def create_handler(s_id, t_name, t_desc):
                @function_tool(name=t_name)
                async def mcp_tool(ctx: RunContext, **kwargs):
                    return await self.call_tool(s_id, t_name, kwargs)
                
                mcp_tool.__doc__ = t_desc
                return mcp_tool

            wrapped_tools.append(create_handler(server_id, name, description))
            logger.info(f"Wrapped MCP tool: {name} (server: {server_id})")
            
        return wrapped_tools

    async def call_tool(self, server_id: str, name: str, arguments: Dict[str, Any]) -> str:
        """Executes a tool on a specific MCP server."""
        session = self.sessions.get(server_id)
        if not session:
            return f"Error: MCP server {server_id} not connected."
            
        try:
            # MCP SDK call_tool takes name and arguments
            result = await session.call_tool(name, arguments)
            
            # Extract text from result content
            # result.content is a list of content blocks (TextContent, ImageContent, etc.)
            texts = []
            for item in result.content:
                if hasattr(item, "text"):
                    texts.append(item.text)
                elif isinstance(item, dict) and "text" in item:
                    texts.append(item["text"])
            
            if not texts:
                return "Tool executed successfully but returned no text content."
                
            return "\n".join(texts)
        except Exception as e:
            logger.error(f"Error calling MCP tool {name} on {server_id}: {e}")
            return f"Error: MCP tool execution failed: {str(e)}"

    async def cleanup(self):
        """Closes all connections."""
        await self.exit_stack.aclose()
        self.sessions = {}
