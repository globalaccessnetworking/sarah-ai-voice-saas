import aiohttp
import json
import logging
import asyncio
from typing import Dict, Any, Optional, Callable
from livekit.agents import function_tool, RunContext

logger = logging.getLogger("ai_worker.services.webhooks")

async def execute_webhook(
    url: str, 
    payload: Dict[str, Any], 
    headers: Optional[Dict[str, str]] = None,
    timeout: int = 15
) -> str:
    """
    Executes an asynchronous HTTP POST request to a webhook URL.
    Returns a JSON success string or an error message.
    """
    if not url:
        return "Error: Webhook URL is missing."

    try:
        logger.info(f"Firing Webhook: {url} | Payload: {json.dumps(payload)}")
        
        default_headers = {
            "Content-Type": "application/json",
            "User-Agent": "GlobalAccess-AI-Worker/1.0"
        }
        if headers:
            default_headers.update(headers)

        async with aiohttp.ClientSession() as session:
            async with session.post(
                url, 
                json=payload, 
                headers=default_headers, 
                timeout=aiohttp.ClientTimeout(total=timeout)
            ) as response:
                
                resp_text = await response.text()
                
                if response.status >= 200 and response.status < 300:
                    logger.info(f"Webhook Success: {url} (Status: {response.status})")
                    return json.dumps({
                        "status": "success", 
                        "http_code": response.status,
                        "response": resp_text[:500] # Cap response length
                    })
                else:
                    logger.error(f"Webhook Failed: {url} (Status: {response.status}) | Resp: {resp_text}")
                    return json.dumps({
                        "status": "error", 
                        "http_code": response.status,
                        "message": f"Server returned status {response.status}"
                    })

    except asyncio.TimeoutError:
        logger.error(f"Webhook Timeout: {url}")
        return "Error: Webhook request timed out."
    except Exception as e:
        logger.error(f"Webhook Error: {url} | Exception: {e}")
        return f"Error: Failed to trigger webhook: {str(e)}"

def generate_webhook_tool(webhook_config: Dict[str, Any]) -> Callable:
    """
    Dynamically generates a LiveKit @function_tool from a webhook configuration.
    
    webhook_config: {
        "name": "tool_name",
        "description": "tool description",
        "endpointUrl": "https://api.example.com/webhook",
        "parametersSchema": { ... } # Optional JSON schema
    }
    """
    name = webhook_config.get("name")
    description = webhook_config.get("description", f"Triggers the {name} webhook.")
    url = webhook_config.get("endpointUrl")

    @function_tool(name=name)
    async def webhook_tool(ctx: RunContext, **kwargs):
        # We use a nested function with explicit name/docstring for LiveKit v1.4 inference
        return await execute_webhook(url, kwargs)
    
    # Set the docstring explicitly to guide the LLM
    webhook_tool.__doc__ = description
    
    return webhook_tool
