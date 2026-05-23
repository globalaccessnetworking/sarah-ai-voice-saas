import os
import json
import logging
import psycopg2
from datetime import datetime

logger = logging.getLogger("ai_worker.services.call_history")

# Global connection string
DATABASE_URL = os.environ.get("DATABASE_URL")

def get_db_connection():
    if not DATABASE_URL:
        # Avoid spamming logs if DB is intentionaly disabled
        return None
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        return None

def create_call_record(call_id: str, agent_id: str, room_name: str, direction: str = "inbound", from_number: str = None, to_number: str = None, metadata: dict = None):
    """Creates a new record in call_logs."""
    logger.info(f"Creating call record: {call_id} for agent {agent_id}")
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO call_logs (id, agent_id, room_name, direction, from_number, to_number, status, started_at, metadata)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET room_name = EXCLUDED.room_name, metadata = EXCLUDED.metadata
                """,
                (call_id, agent_id, room_name, direction, from_number, to_number, "ongoing", datetime.utcnow(), json.dumps(metadata) if metadata else None)
            )
        conn.commit()
        return call_id
    except Exception as e:
        logger.error(f"Error creating call record: {e}")
        return None
    finally:
        conn.close()

def save_transcription(room_name: str, transcript: list):
    """Updates the transcript field for call logs matching the room name."""
    logger.info(f"Saving transcription for room {room_name}")
    conn = get_db_connection()
    if not conn:
        return
    
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE call_logs 
                SET transcript = %s
                WHERE room_name = %s
                """,
                (json.dumps(transcript), room_name)
            )
        conn.commit()
    except Exception as e:
        logger.error(f"Error saving transcription: {e}")
    finally:
        conn.close()

def complete_call_record(room_name: str, final_payload: dict):
    """Finalizes a call record with analytics, summary, and end timestamp."""
    logger.info(f"Completing call record for room {room_name}")
    conn = get_db_connection()
    if not conn:
        return
    
    try:
        summary = final_payload.get("summary")
        duration = final_payload.get("duration", 0)
        
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE call_logs 
                SET status = 'completed',
                    summary = %s,
                    duration_seconds = %s,
                    metadata = %s,
                    ended_at = %s
                WHERE room_name = %s
                """,
                (summary, int(duration), json.dumps(final_payload), datetime.utcnow(), room_name)
            )
        conn.commit()
    except Exception as e:
        logger.error(f"Error completing call record: {e}")
    finally:
        conn.close()

def delete_call(call_id: str):
    """Deletes a call record (optional)."""
    conn = get_db_connection()
    if not conn:
        return
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM call_logs WHERE id = %s", (call_id,))
        conn.commit()
    finally:
        conn.close()
