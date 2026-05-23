import os
import logging
import asyncpg
from datetime import datetime

logger = logging.getLogger("ai_worker.services.complaint")
DATABASE_URL = os.getenv("DATABASE_URL")

async def verify_complaint(ticket_id: str):
    """
    Phase 6: Mark ticket as verified by citizen.
    Updates outbound_status and citizen_feedback columns.
    """
    if not DATABASE_URL:
        logger.error("DATABASE_URL not found in environment.")
        return
    try:
        # Use asyncpg for non-blocking DB operation inside the agent loop
        conn = await asyncpg.connect(DATABASE_URL)
        try:
            await conn.execute("""
                UPDATE complaints 
                SET outbound_status = 'completed', 
                    citizen_feedback = 'verified' 
                WHERE ticket_id = $1
            """, ticket_id)
            logger.info(f"✅ DB SYNC (Phase 6): Ticket {ticket_id} marked as VERIFIED.")
        finally:
            await conn.close()
    except Exception as e:
        logger.error(f"Failed to verify complaint {ticket_id}: {e}")

async def reopen_complaint(ticket_id: str):
    """
    Phase 7: Mark ticket as unresolved when citizen rejects the resolution.
    Flips status back to 'Unresolved' and logs the feedback.
    """
    if not DATABASE_URL:
        logger.error("DATABASE_URL not found in environment.")
        return
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        try:
            timestamp = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
            # 1. Flip status back to Unresolved
            # 2. Mark citizen feedback as still_issue
            # 3. Append note to audit trail
            await conn.execute("""
                UPDATE complaints 
                SET status = 'Unresolved', 
                    outbound_status = 'completed', 
                    citizen_feedback = 'still_issue',
                    notes = COALESCE(notes, '') || E'\n[' || $2 || '] Citizen rejected resolution via Sarah automated robocall.'
                WHERE ticket_id = $1
            """, ticket_id, timestamp)
            logger.info(f"❌ DB SYNC (Phase 7): Ticket {ticket_id} RE-OPENED (Status: Unresolved).")
        finally:
            await conn.close()
    except Exception as e:
        logger.error(f"Failed to re-open complaint {ticket_id}: {e}")
