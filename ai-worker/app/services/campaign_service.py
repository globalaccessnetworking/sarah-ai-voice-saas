import os
import json
import logging
import psycopg2
from datetime import datetime

logger = logging.getLogger("ai_worker.services.campaign_service")

DATABASE_URL = os.environ.get("DATABASE_URL")

if DATABASE_URL:
    logger.info(f"[CampaignLifecycle] DATABASE_URL present=True")
else:
    logger.warning(f"[CampaignLifecycle] DATABASE_URL present=False")

def get_db_connection():
    if not DATABASE_URL:
        return None
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        return None

def _update_campaign_stats(campaign_id: str, conn):
    """Calculates if the campaign is completely finished and updates stats/status."""
    try:
        with conn.cursor() as cur:
            # Get current stats and total leads
            cur.execute(
                """
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                    SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
                FROM campaign_numbers
                WHERE campaign_id = %s
                """,
                (campaign_id,)
            )
            result = cur.fetchone()
            if not result:
                return
            
            total, completed, failed, processing, pending = result
            total = int(total or 0)
            completed = int(completed or 0)
            failed = int(failed or 0)
            processing = int(processing or 0)
            pending = int(pending or 0)
            
            # Reconstruct JSONB stats
            stats_json = json.dumps({
                "total": total,
                "completed": completed,
                "failed": failed,
                "processing": processing,
                "pending": pending
            })

            # Check if all leads are done
            new_status = 'completed' if (completed + failed) >= total and total > 0 else None

            if new_status:
                cur.execute(
                    """
                    UPDATE campaigns 
                    SET stats = %s, status = %s, updated_at = %s
                    WHERE id = %s AND status != 'paused' AND status != 'stopped'
                    """,
                    (stats_json, new_status, datetime.utcnow(), campaign_id)
                )
            else:
                cur.execute(
                    """
                    UPDATE campaigns 
                    SET stats = %s, updated_at = %s
                    WHERE id = %s
                    """,
                    (stats_json, datetime.utcnow(), campaign_id)
                )
            
            logger.info(f"[CampaignLifecycle] Campaign stats updated completed={completed} failed={failed} total={total} status={new_status or 'unchanged'}")

    except Exception as e:
        logger.error(f"Error updating campaign stats: {e}")


def mark_campaign_call_completed(campaign_id: str, lead_id: str, duration: int = 0, transcript_count: int = 0):
    if not campaign_id or not lead_id:
        return
        
    logger.info(f"[CampaignLifecycle] Marking lead completed campaign_id={campaign_id} lead_id={lead_id}")
    conn = get_db_connection()
    if not conn:
        return
        
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE campaign_numbers 
                SET status = 'completed', called_at = %s
                WHERE id = %s AND campaign_id = %s
                """,
                (datetime.utcnow(), lead_id, campaign_id)
            )
            if cur.rowcount == 0:
                logger.warning(f"[CampaignLifecycle] no campaign_numbers row updated for {lead_id}")
        # Update campaign stats
        _update_campaign_stats(campaign_id, conn)
        conn.commit()
    except Exception as e:
        logger.error(f"Error completing campaign lead: {e}")
    finally:
        conn.close()

def mark_campaign_call_failed(campaign_id: str, lead_id: str, reason: str = ""):
    if not campaign_id or not lead_id:
        return
        
    logger.info(f"[CampaignLifecycle] Marking lead failed campaign_id={campaign_id} lead_id={lead_id} reason={reason}")
    conn = get_db_connection()
    if not conn:
        return
        
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE campaign_numbers 
                SET status = 'failed', called_at = %s
                WHERE id = %s AND campaign_id = %s
                """,
                (datetime.utcnow(), lead_id, campaign_id)
            )
            if cur.rowcount == 0:
                logger.warning(f"[CampaignLifecycle] no campaign_numbers row updated for {lead_id}")
        # Update campaign stats
        _update_campaign_stats(campaign_id, conn)
        conn.commit()
    except Exception as e:
        logger.error(f"Error failing campaign lead: {e}")
    finally:
        conn.close()
