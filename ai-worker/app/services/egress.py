import logging
import asyncio
import os
from typing import Optional

logger = logging.getLogger("voice-agent")

async def start_call_recording(ctx_ref: dict) -> str:
    """
    Programmatically start recording the current Call/Room.
    
    Args:
        ctx_ref: Reference to the LiveKit JobContext.
        
    Returns:
        Egress ID or confirmation string.
    """
    logger.info("Programmatic recording trigger received.")
    
    try:
        # We leverage the existing start_auto_recording logic in run_agents.py
        # but since we are in a tool context, we need to access the context carefully.
        
        ctx = ctx_ref.get("ctx")
        if not ctx:
            return "Error: Job context not available for recording."
            
        # Check if already recording
        if hasattr(ctx, "_auto_record_egress_id") and getattr(ctx, "_auto_record_egress_id"):
            return f"Recording is already active (Egress ID: {getattr(ctx, '_auto_record_egress_id')})"

        # Dynamic import to avoid circular dependency
        from run_agents import start_auto_recording
        
        egress_id = await start_auto_recording(ctx)
        
        if egress_id:
            # Store it so we don't start it again
            setattr(ctx, "_auto_record_egress_id", egress_id)
            return f"Recording started successfully. Egress ID: {egress_id}. The file will be available in the dashboard after the call."
        else:
            return "Failed to start recording. Ensure LiveKit Egress is configured."
            
    except Exception as e:
        logger.error(f"Error triggering recording: {e}")
        return f"Recording trigger failed: {str(e)}"
