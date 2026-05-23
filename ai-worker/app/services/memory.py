import os
import logging
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Optional

logger = logging.getLogger("memory-service")

def get_memory_prompt(phone_number: str) -> Optional[str]:
    """
    Fetch the last interaction summary for a given phone number.
    Returns a formatted string to be injected into the system prompt.
    """
    if not phone_number:
        return None

    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        logger.warning("DATABASE_URL not set, memory service disabled")
        return None

    try:
        conn = psycopg2.connect(db_url, cursor_factory=RealDictCursor)
        with conn.cursor() as cur:
            # Fetch the latest summary for this number
            cur.execute("""
                SELECT summary, started_at 
                FROM call_logs 
                WHERE from_number = %s AND summary IS NOT NULL 
                ORDER BY started_at DESC 
                LIMIT 1
            """, (phone_number,))
            row = cur.fetchone()
            
            if row and row['summary']:
                date_str = row['started_at'].strftime("%Y-%m-%d")
                logger.info(f"Retrieved memory for {phone_number}: {row['summary'][:50]}...")
                return f"\n\n[CONTEXT: Previous interaction on {date_str}: {row['summary']}]"
    except Exception as e:
        logger.error(f"Failed to fetch memory for {phone_number}: {e}")
    finally:
        if 'conn' in locals():
            conn.close()
    
    return None
