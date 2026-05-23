import asyncio
import logging
from mcp.server.models import InitializationOptions
from mcp.server import NotificationOptions, Server
from mcp.server.stdio import stdio_server
import mcp.types as types

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mcp-sidekick-server")

server = Server("sidekick-mcp-server")

@server.list_tools()
async def handle_list_tools() -> list[types.Tool]:
    """
    List available tools.
    Each tool specifies its arguments using JSON Schema.
    """
    return [
        types.Tool(
            name="lookup_crm_order",
            description="Lookup the status of a CRM order by its order ID.",
            inputSchema={
                "type": "object",
                "properties": {
                    "order_id": {"type": "string", "description": "The unique order ID to lookup."},
                },
                "required": ["order_id"],
            },
        )
    ]

@server.call_tool()
async def handle_call_tool(
    name: str, arguments: dict | None
) -> list[types.TextContent | types.ImageContent | types.EmbeddedResource]:
    """
    Handle tool execution requests.
    Tools can return strategies to read more files, run commands, or write to files.
    """
    if name == "lookup_crm_order":
        order_id = arguments.get("order_id")
        if not order_id:
            raise ValueError("Missing order_id")

        logger.info(f"Looking up CRM order: {order_id}")
        
        # Mock data logic
        # In a real server, this would hit a DB or API
        mock_orders = {
            "123": "Order 123 is Shipped and will arrive tomorrow.",
            "456": "Order 456 is Processing and will ship in 2 days.",
            "789": "Order 789 was Delivered last Tuesday."
        }
        
        result = mock_orders.get(order_id, f"Order {order_id} not found in the CRM system.")
        
        return [
            types.TextContent(
                type="text",
                text=result,
            )
        ]
    
    raise ValueError(f"Unknown tool: {name}")

async def main():
    # Run the server using stdio transport
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="sidekick-mcp-server",
                server_version="0.1.0",
                capabilities=server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                ),
            ),
        )

if __name__ == "__main__":
    asyncio.run(main())
