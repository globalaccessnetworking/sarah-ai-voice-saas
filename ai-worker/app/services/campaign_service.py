import os
import json
import logging
import psycopg2
from datetime import datetime, timedelta

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
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'retry_scheduled' THEN 1 ELSE 0 END) as retry_scheduled
                FROM campaign_numbers
                WHERE campaign_id = %s
                """,
                (campaign_id,)
            )
            result = cur.fetchone()
            if not result:
                return
            
            total, completed, failed, processing, pending, retry_scheduled = result
            total = int(total or 0)
            completed = int(completed or 0)
            failed = int(failed or 0)
            processing = int(processing or 0)
            pending = int(pending or 0)
            retry_scheduled = int(retry_scheduled or 0)
            
            # Reconstruct JSONB stats
            stats_json = json.dumps({
                "total": total,
                "completed": completed,
                "failed": failed,
                "processing": processing,
                "pending": pending,
                "retry_scheduled": retry_scheduled
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
    # Defensive guard: reject missing, placeholder, or preview IDs before any DB call.
    _invalid_campaign = (
        not campaign_id
        or str(campaign_id).strip().lower() in ("none", "null", "", "default_campaign")
    )
    _preview_lead = lead_id and str(lead_id).lower().startswith("preview_")
    if _invalid_campaign or _preview_lead:
        logger.info(
            f"[CampaignLifecycle] skipping mark_completed — preview/invalid ids "
            f"campaign_id={campaign_id!r} lead_id={lead_id!r}"
        )
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
                SET status = 'completed', called_at = %s, last_call_duration_seconds = %s, disposition = 'success',
                    failure_reason = NULL, next_retry_at = NULL
                WHERE id = %s AND campaign_id = %s
                """,
                (datetime.utcnow(), duration, lead_id, campaign_id)
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

def mark_campaign_call_failed(campaign_id: str, lead_id: str, reason: str = "", duration: int = 0):
    # Defensive guard: reject missing, placeholder, or preview IDs before any DB call.
    _invalid_campaign = (
        not campaign_id
        or str(campaign_id).strip().lower() in ("none", "null", "", "default_campaign")
    )
    _preview_lead = lead_id and str(lead_id).lower().startswith("preview_")
    if _invalid_campaign or _preview_lead:
        logger.info(
            f"[CampaignLifecycle] skipping mark_failed — preview/invalid ids "
            f"campaign_id={campaign_id!r} lead_id={lead_id!r} reason={reason!r}"
        )
        return

    logger.info(f"[CampaignLifecycle] Marking lead failed/retry campaign_id={campaign_id} lead_id={lead_id} reason={reason}")
    conn = get_db_connection()
    if not conn:
        return
        
    try:
        with conn.cursor() as cur:
            # Fetch campaign rules and current lead attempts
            cur.execute("SELECT retry_attempts, retry_delay_seconds FROM campaigns WHERE id = %s", (campaign_id,))
            campaign_rules = cur.fetchone()
            if not campaign_rules:
                return
            retry_attempts, retry_delay_seconds = campaign_rules
            retry_attempts = retry_attempts or 3
            retry_delay_seconds = retry_delay_seconds or 3600
            
            cur.execute("SELECT attempt_count FROM campaign_numbers WHERE id = %s", (lead_id,))
            lead_info = cur.fetchone()
            if not lead_info:
                return
            attempt_count = lead_info[0] or 1
            
            disposition = reason[:50] if reason else "failed"
            
            is_retryable = attempt_count < retry_attempts
            logger.info(f"[RetryRules] failure reason={reason} retryable={str(is_retryable).lower()} attempt={attempt_count} max_attempts={retry_attempts} retry_delay_seconds={retry_delay_seconds}")
            
            if is_retryable:
                # Schedule retry
                next_retry_dt = datetime.utcnow() + timedelta(seconds=retry_delay_seconds)
                logger.info(f"[RetryRules] scheduling retry lead={lead_id} next_retry_at={next_retry_dt.isoformat()} retry_delay_seconds={retry_delay_seconds}")
                cur.execute(
                    """
                    UPDATE campaign_numbers 
                    SET status = 'retry_scheduled', 
                        called_at = %s,
                        next_retry_at = NOW() + (%s * interval '1 second'),
                        failure_reason = %s,
                        disposition = %s,
                        last_call_duration_seconds = %s
                    WHERE id = %s AND campaign_id = %s
                    """,
                    (datetime.utcnow(), retry_delay_seconds, reason, disposition, duration, lead_id, campaign_id)
                )
            else:
                # Max retries reached, fail permanently
                logger.info(f"[RetryRules] final failed lead={lead_id} reason={reason} attempt={attempt_count} max_attempts={retry_attempts} retry_delay_seconds={retry_delay_seconds}")
                cur.execute(
                    """
                    UPDATE campaign_numbers 
                    SET status = 'failed', 
                        called_at = %s,
                        failure_reason = %s,
                        disposition = %s,
                        last_call_duration_seconds = %s
                    WHERE id = %s AND campaign_id = %s
                    """,
                    (datetime.utcnow(), reason, disposition, duration, lead_id, campaign_id)
                )

            if cur.rowcount == 0:
                logger.warning(f"[CampaignLifecycle] no campaign_numbers row updated for {lead_id}")
        # Update campaign stats
        _update_campaign_stats(campaign_id, conn)
        conn.commit()
    except Exception as e:
        logger.error(f"Error failing/retrying campaign lead: {e}")
    finally:
        conn.close()
