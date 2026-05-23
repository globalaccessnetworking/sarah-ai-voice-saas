import logging
import asyncio
import json
from typing import Optional

logger = logging.getLogger("voice-agent")

async def transfer_to_specialist(target_agent_slug: str, transfer_reason: str, session_ref: dict) -> str:
    """
    Gracefully transfer the current call to a specialist agent.
    
    Args:
        target_agent_slug: The slug/ID of the agent to transfer to.
        transfer_reason: Why the transfer is happening.
        session_ref: Reference to the current session and room context.
        
    Returns:
        Confirmation string.
    """
    logger.info(f"Initiating handoff to {target_agent_slug}. Reason: {transfer_reason}")
    
    try:
        room = session_ref.get("room")
        if not room:
            return "Error: Active room not found for transfer."
            
        # Implementation Note:
        # Multi-agent handoff in LiveKit involves:
        # 1. Publishing a custom 'handoff' event via data channel
        # 2. Setting metadata on the room or participant to trigger the Dispatcher
        # 3. Or using the internal AgentEventListener to swap the brain
        
        # We leverage the existing AgentEventListener to trigger a 'transfer' event
        # which is already handled in run_agents.py (AgentEventListener._handle_transfer)
        
        handoff_payload = {
            "type": "transfer",
            "target_agent": target_agent_slug,
            "reason": transfer_reason,
            "silent": False
        }
        
        # Publish handoff event to the room
        handoff_data = json.dumps(handoff_payload).encode('utf-8')
        await room.local_participant.publish_data(handoff_data, reliable=True)
        
        return f"Transfer to {target_agent_slug} initiated successfully. Please wait while I connect you."
        
    except Exception as e:
        logger.error(f"Error during handoff: {e}")
        return f"Failed to transfer: {str(e)}"
