import os
import aiohttp
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger("webhook_utility")

async def trigger_post_call_email(call_data: dict, client_email: str):
    """
    Fires a secure webhook to the Next.js Dashboard to trigger 
    the post-call email report.
    """
    dashboard_url = os.getenv("DASHBOARD_URL", "http://localhost:3000")
    webhook_secret = os.getenv("INTERNAL_WEBHOOK_SECRET")
    
    if not webhook_secret:
        logger.error("[Webhook] INTERNAL_WEBHOOK_SECRET not found in .env. Skipping.")
        return False

    webhook_url = f"{dashboard_url}/api/webhooks/call-ended"
    
    headers = {
        "Authorization": f"Bearer {webhook_secret}",
        "Content-Type": "application/json"
    }
    
    # Enrich payload with client target
    payload = {
        **call_data,
        "client_email": client_email
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(webhook_url, headers=headers, json=payload) as response:
                if response.status == 200:
                    logger.info(f"[Webhook] Post-call report triggered for {client_email}")
                    return True
                else:
                    text = await response.text()
                    logger.error(f"[Webhook] Failed to trigger report. Status: {response.status}, Error: {text}")
                    return False
    except Exception as e:
        logger.error(f"[Webhook] Connection error: {str(e)}")
        return False

if __name__ == "__main__":
    # Quick Mock Test
    import asyncio
    mock_data = {
        "call_id": "call_test_123",
        "agent_name": "Nexus-Prime",
        "caller_number": "+123456789",
        "duration": "4m 20s",
        "total_cost": "$0.45"
    }
    asyncio.run(trigger_post_call_email(mock_data, "admin@globalaccess.ai"))
