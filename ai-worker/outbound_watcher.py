#!/usr/bin/env python3
import asyncio
import json
import logging
import os
import time
from datetime import datetime, time as dt_time, timedelta, timezone
from pathlib import Path
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
from dotenv import load_dotenv

# Setup Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("outbound_trigger.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("SarahOutboundTrigger")

# Load environment
ENV_PATH = Path(__file__).parent / ".env"
load_dotenv(ENV_PATH)

# Immutable Config
DB_URL = os.environ.get("DATABASE_URL")
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
POLL_INTERVAL = int(os.environ.get("OUTBOUND_POLL_INTERVAL", 15))  # 15 seconds for near-instant dispatch

def is_within_operating_hours(start_str, end_str):
    """Checks if current time in PKT is within the dynamically defined operating window."""
    try:
        # Parse HH:MM strings
        start_h, start_m = map(int, start_str.split(':'))
        end_h, end_m = map(int, end_str.split(':'))
        
        start_t = dt_time(start_h, start_m)
        end_t = dt_time(end_h, end_m)
        
        # Calculate Current PKT (UTC+5)
        # Using timezone-aware UTC to resolve DeprecationWarning
        now_utc = datetime.now(timezone.utc)
        now_pkt = now_utc + timedelta(hours=5)
        current_time = now_pkt.time()
        
        is_open = start_t <= current_time <= end_t
        if not is_open:
            logger.info(f"Outside operating hours (PKT: {now_pkt.strftime('%H:%M')}). Window: {start_str}-{end_str}")
        return is_open
    except Exception as e:
        logger.error(f"Error parsing operating window ({start_str}-{end_str}): {e}")
        return True # Default to open on error to avoid blocking emergency fixes

async def get_db_conn():
    try:
        return psycopg2.connect(DB_URL, cursor_factory=RealDictCursor)
    except Exception as e:
        logger.error(f"Postgres Connection Error: {e}")
        return None

async def scan_and_trigger():
    conn = await get_db_conn()
    if not conn:
        return

    try:
        with conn.cursor() as cur:
            # 1. Fetch Sarah Outbound Agent Governance Settings
            cur.execute("""
                SELECT id, "outbound_batch_limit", "outbound_retry_interval", 
                       "outbound_max_retries", "outbound_allowed_start", "outbound_allowed_end",
                       "bypass_operating_hours",
                       "outbound_greeting_text", "outbound_greeting_wav", 
                       "resolved_farewell_text", "resolved_farewell_wav", 
                       "unresolved_farewell_text", "unresolved_farewell_wav",
                       "system_prompt",
                       "knowledge_base",
                       "tool_instructions",
                       "outbound_stt_model",
                       "stt_language",
                       "outbound_llm_model", 
                       "outbound_llm_temperature", "outbound_tts_voice_id",
                       "outbound_tts_dictionary_id", "outbound_watchdog_nudge_text",
                       "bypass_outbound_dictionary"
                FROM agents 
                WHERE is_outbound_active = true 
                LIMIT 1
            """)
            agent = cur.fetchone()

            if not agent:
                logger.warning("No active outbound agent configured in Dashboard. Sleeping...")
                return

            # 2. Check Dynamic Time Window (PKT) — Bypass if enabled
            bypass_time = agent['bypass_operating_hours']
            if not bypass_time:
                if not is_within_operating_hours(agent['outbound_allowed_start'], agent['outbound_allowed_end']):
                    return
            else:
                logger.info("⚠️ Robocall Time Bypass ACTIVE. Dispatching outside operating hours.")

            # 3. Fetch Candidates using Dynamic Governance
            # outbound_retry_interval is in minutes, convert to INTERVAL for SQL
            query = """
                SELECT id, ticket_id, name, phone, asterisk_number, issue, outbound_retry_count 
                FROM complaints 
                WHERE status = 'Resolved' 
                AND outbound_status = 'pending'
                AND outbound_retry_count < %s
                AND (last_called_at IS NULL OR last_called_at < NOW() - (%s * INTERVAL '1 minute'))
                LIMIT %s
            """
            cur.execute(query, (
                agent['outbound_max_retries'], 
                agent['outbound_retry_interval'], 
                agent['outbound_batch_limit']
            ))
            tickets = cur.fetchall()

            if not tickets:
                logger.info("No tickets found for outbound dialing (respecting cooldown/limits).")
                return

            logger.info(f"Found {len(tickets)} candidates based on GUI Governance.")

            # 4. Process Batch
            r = redis.from_url(REDIS_URL)
            
            for t in tickets:
                ticket_id = t['ticket_id']
                # Priority Logic: Dial verified asterisk_number first, fallback to transcribed phone
                dial_number = t.get('asterisk_number') or t.get('phone')
                citizen_name = t['name'] or "Citizen"

                logger.info(f"Triggering call for Ticket {ticket_id} ({citizen_name}) -> {dial_number}")

                # Metadata & Prompt Injection (The GUI fields use PascalCase in DB via Drizzle)
                def inject(text):
                    if not text: return ""
                    return text.replace("{ticket_id}", str(ticket_id)).replace("{citizen_name}", str(citizen_name))

                payload = {
                    "ticket_id": ticket_id,
                    "phone": dial_number,
                    "citizen_name": citizen_name,
                    "issue_type": t.get("issue") or "General Complaint",
                    "agent_id": agent['id'],
                    "config": {
                        # ── Greeting & Farewell ──
                        "greeting_text":   inject(agent['outbound_greeting_text']),
                        "greeting_wav":    agent['outbound_greeting_wav'],
                        "resolved_text":   inject(agent['resolved_farewell_text']),
                        "resolved_wav":    agent['resolved_farewell_wav'],
                        "unresolved_text": inject(agent['unresolved_farewell_text']),
                        "unresolved_wav":  agent['unresolved_farewell_wav'],
                        # ── Brain (from GUI Behavior/LLM + Identity tabs) ──
                        "system_prompt":    inject(agent['system_prompt']),
                        "knowledge_base":   agent.get('knowledge_base', ''),
                        "tool_instructions": agent.get('tool_instructions', ''),
                        # ── STT (from GUI Speech Recognition tab) ──
                        "stt_model":    agent['outbound_stt_model'],
                        "stt_language": agent.get('stt_language', 'ur'),
                        # ── LLM (from GUI Outbound Robocall tab) ──
                        "llm_model":       agent['outbound_llm_model'],
                        "llm_temperature": float(agent['outbound_llm_temperature'] or 0.5),
                        # ── TTS (from GUI Voice/TTS tab) ──
                        "voice_id": agent['outbound_tts_voice_id'],
                        "tts_dictionary_id": None if agent.get('bypass_outbound_dictionary') else agent.get('outbound_tts_dictionary_id'),
                        "watchdog_nudge_text": agent.get('outbound_watchdog_nudge_text')
                    },
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }

                # Push to Redis Queue
                r.lpush("sarah_robocall_queue", json.dumps(payload))

                # Update Status to 'calling' (Safety Lock)
                cur.execute("""
                    UPDATE complaints 
                    SET outbound_status = 'calling', 
                        last_called_at = NOW(),
                        outbound_retry_count = outbound_retry_count + 1
                    WHERE id = %s
                """, (t['id'],))
                
            conn.commit()
            logger.info(f"Batch of {len(tickets)} successfully queued.")

    except Exception as e:
        logger.error(f"Scan Loop Error: {e}")
        conn.rollback()
    finally:
        conn.close()

async def main():
    logger.info("Sarah Outbound Trigger Service (V2 - Zero-Hardcoding) Started.")
    while True:
        try:
            # Note: Operating hours checked inside scan_and_trigger to use dynamic GUI settings
            await scan_and_trigger()
            
            logger.info(f"Sleeping for {POLL_INTERVAL} seconds...")
            await asyncio.sleep(POLL_INTERVAL)
        except Exception as e:
            logger.error(f"Main Loop Exception: {e}")
            await asyncio.sleep(60)

if __name__ == "__main__":
    asyncio.run(main())
