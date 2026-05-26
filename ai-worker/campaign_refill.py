import asyncio
import json
import logging
import os
import time
import re
import redis
import psycopg2
from psycopg2.extras import DictCursor
from datetime import datetime
from dotenv import load_dotenv

# --- Configuration & Logging ---
load_dotenv()
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("SarahCampaignRefill")

# Redis Config
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))
QUEUE_NAME = os.getenv("AI_DIALER_OUTBOUND_QUEUE", "ai_dialer_outbound_queue")

# DB Config
DATABASE_URL = os.getenv("DATABASE_URL")

def normalize_phone(phone: str) -> str:
    if not phone:
        return ""
    return re.sub(r'[\+\s\-\(\)]', '', phone)

class CampaignRefillWorker:
    def __init__(self):
        self.redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True)
        self.db_conn = psycopg2.connect(DATABASE_URL)
        self.db_conn.autocommit = True
        logger.info(f"[CampaignRefill] Campaign Refill Worker initialized.")

    def get_db_cursor(self):
        try:
            if self.db_conn.closed:
                logger.info("[CampaignRefill] DB Connection is closed. Reconnecting...")
                self.db_conn = psycopg2.connect(DATABASE_URL)
                self.db_conn.autocommit = True
            else:
                with self.db_conn.cursor() as test_cur:
                    test_cur.execute("SELECT 1")
        except Exception as e:
            logger.warning(f"[CampaignRefill] DB Connection test failed: {e}. Reconnecting...")
            try:
                self.db_conn = psycopg2.connect(DATABASE_URL)
                self.db_conn.autocommit = True
            except Exception as conn_err:
                logger.critical(f"[CampaignRefill] Could not reconnect to database: {conn_err}")
                raise conn_err
        return self.db_conn.cursor(cursor_factory=DictCursor)

    def process_campaigns(self):
        cursor = None
        try:
            cursor = self.get_db_cursor()
            
            # Fetch all running campaigns (excluding vicidial)
            cursor.execute("""
                SELECT * FROM campaigns 
                WHERE status = 'running' 
                AND campaign_type != 'vicidial'
            """)
            campaigns = cursor.fetchall()
            
            if not campaigns:
                return
                
            for campaign in campaigns:
                campaign_id = campaign['id']
                concurrency = campaign.get('concurrency') or 1
                call_delay = campaign.get('call_delay_seconds') or 0
                
                # Use transactional block to check active numbers and lock pending numbers
                self.db_conn.autocommit = False
                pending_ids = []
                pending_numbers = []
                active_calls = 0
                
                try:
                    # Check active processing numbers
                    cursor.execute("""
                        SELECT COUNT(*) FROM campaign_numbers 
                        WHERE campaign_id = %s AND status = 'processing'
                    """, (campaign_id,))
                    active_calls = cursor.fetchone()[0]
                    
                    available_slots = concurrency - active_calls
                    
                    if available_slots <= 0:
                        self.db_conn.rollback()
                        continue
                        
                    # Fetch pending numbers with row locking to prevent race conditions
                    cursor.execute("""
                        SELECT * FROM campaign_numbers 
                        WHERE campaign_id = %s AND status = 'pending' 
                        ORDER BY id ASC
                        LIMIT %s
                        FOR UPDATE SKIP LOCKED
                    """, (campaign_id, available_slots))
                    pending_numbers = cursor.fetchall()
                    
                    if not pending_numbers:
                        self.db_conn.rollback()
                        
                        # Completion check: check if all numbers are done
                        cursor.execute("""
                            SELECT COUNT(*) FROM campaign_numbers 
                            WHERE campaign_id = %s AND status = 'pending'
                        """, (campaign_id,))
                        pending_count = cursor.fetchone()[0]
                        
                        if pending_count == 0 and active_calls == 0:
                            logger.info(f"[CampaignRefill] Campaign {campaign['name']} has no pending or processing leads left. Marking status='completed'.")
                            cursor.execute("""
                                UPDATE campaigns 
                                SET status = 'completed', updated_at = NOW() 
                                WHERE id = %s AND status = 'running'
                            """, (campaign_id,))
                            self.db_conn.commit()
                        else:
                            self.db_conn.rollback()
                        continue

                    # Atomic state transition from pending -> processing
                    pending_ids = [number['id'] for number in pending_numbers]
                    cursor.execute("""
                        UPDATE campaign_numbers 
                        SET status = 'processing'
                        WHERE id = ANY(%s)
                    """, (pending_ids,))
                    
                    self.db_conn.commit()
                    
                except Exception as campaign_tx_err:
                    logger.error(f"[CampaignRefill] Transaction error for campaign {campaign['name']}: {campaign_tx_err}")
                    self.db_conn.rollback()
                    continue
                finally:
                    self.db_conn.autocommit = True

                # Fetch agent
                cursor.execute("SELECT * FROM agents WHERE id = %s", (campaign['agent_id'],))
                agent = cursor.fetchone()
                if not agent:
                    logger.error(f"[CampaignRefill] Agent {campaign['agent_id']} not found for campaign {campaign_id}. Reverting locks.")
                    cursor.execute("""
                        UPDATE campaign_numbers 
                        SET status = 'pending'
                        WHERE id = ANY(%s)
                    """, (pending_ids,))
                    continue
                    
                # Fetch SIP Trunk
                trunk_id = campaign.get('sip_trunk_id')
                if trunk_id:
                    cursor.execute("SELECT * FROM sip_trunks WHERE id = %s", (trunk_id,))
                    trunk = cursor.fetchone()
                else:
                    cursor.execute("SELECT * FROM sip_trunks WHERE type = 'outbound' LIMIT 1")
                    trunk = cursor.fetchone()
                
                if not trunk:
                    logger.error(f"[CampaignRefill] No SIP trunk available for campaign {campaign_id}. Reverting locks.")
                    cursor.execute("""
                        UPDATE campaign_numbers 
                        SET status = 'pending'
                        WHERE id = ANY(%s)
                    """, (pending_ids,))
                    continue

                # Enqueue the leads
                enqueued_successfully = []
                for index, number in enumerate(pending_numbers):
                    # Inter-call delay support
                    if index > 0 and call_delay > 0:
                        logger.info(f"[CampaignRefill] Sleeping {call_delay} seconds between enqueues for campaign {campaign['name']}")
                        time.sleep(call_delay)
                        
                    # Re-verify campaign status if we had a delay
                    if call_delay > 0:
                        cursor.execute("SELECT status FROM campaigns WHERE id = %s", (campaign_id,))
                        current_status = cursor.fetchone()
                        if not current_status or current_status[0] != 'running':
                            logger.info(f"[CampaignRefill] Campaign {campaign['name']} status is '{current_status[0] if current_status else 'deleted'}' (not 'running'). Halting enqueues.")
                            revert_ids = [n['id'] for n in pending_numbers[index:]]
                            cursor.execute("""
                                UPDATE campaign_numbers 
                                SET status = 'pending'
                                WHERE id = ANY(%s)
                            """, (revert_ids,))
                            break

                    sip_call_to = normalize_phone(number['phone'])
                    trunk_numbers = trunk.get('numbers', []) if trunk.get('numbers') else []
                    
                    if isinstance(trunk_numbers, str):
                        try:
                            trunk_numbers = json.loads(trunk_numbers)
                        except Exception:
                            trunk_numbers = [trunk_numbers]
                            
                    default_caller_id = trunk_numbers[0] if (isinstance(trunk_numbers, list) and len(trunk_numbers) > 0) else trunk.get('name')
                    caller_id = campaign.get('caller_id') or default_caller_id
                    
                    lead_data = number.get('lead_data')
                    if isinstance(lead_data, str):
                        try:
                            lead_data = json.loads(lead_data)
                        except Exception:
                            pass

                    payload = {
                        "type": "outbound_campaign_call",
                        "direction": "outbound",
                        "campaign_id": campaign_id,
                        "campaign_name": campaign.get('name'),
                        "lead_id": number['id'],
                        "external_record_id": number['id'],
                        "contact_name": number.get('name') or "Customer",
                        "company_name": number.get('company_name') or "",
                        "phone": number['phone'],
                        "lead_data": lead_data or None,
                        "sip_call_to": sip_call_to,
                        "agent_id": agent['id'],
                        "agent_slug": agent['slug'],
                        "agent_name": "outbound-agent",
                        "sip_trunk_id": trunk['id'],
                        "caller_id": caller_id,
                        "opening_message": campaign.get('opening_message'),
                        "call_goal": campaign.get('call_goal') or f"Campaign Outbound Call - {campaign.get('name')}",
                        "script": campaign.get('script'),
                        "tts_config": {
                            "provider": agent.get('tts_provider') or agent.get('ttsProvider'),
                            "model": agent.get('tts_model') or agent.get('ttsModel'),
                            "voice_id": agent.get('tts_voice_id') or agent.get('ttsVoiceId')
                        },
                        "legacy_complaint_mode": False
                    }

                    try:
                        logger.info(f"[CampaignRefill] Enqueueing to Redis. lead_id={number['id']} phone={number['phone']} campaign={campaign['name']}")
                        self.redis_client.lpush(QUEUE_NAME, json.dumps(payload))
                        enqueued_successfully.append(number['id'])
                    except Exception as redis_err:
                        logger.error(f"[CampaignRefill] Redis enqueue failed for lead {number['id']}: {redis_err}. Reverting state to pending.")
                        cursor.execute("""
                            UPDATE campaign_numbers 
                            SET status = 'pending'
                            WHERE id = %s
                        """, (number['id'],))

                if enqueued_successfully:
                    logger.info(f"[CampaignRefill] Campaign {campaign['name']}: enqueued {len(enqueued_successfully)} leads successfully.")
                
        except Exception as e:
            logger.error(f"[CampaignRefill] Error in process_campaigns: {e}")
        finally:
            if 'cursor' in locals() and cursor:
                try:
                    cursor.close()
                except Exception:
                    pass
            try:
                self.db_conn.autocommit = True
            except Exception:
                pass

    async def run(self):
        interval = float(os.getenv("CAMPAIGN_REFILL_INTERVAL_SEC", 5))
        logger.info(f"[CampaignRefill] Starting Campaign Refill loop with interval={interval}s...")
        while True:
            self.process_campaigns()
            await asyncio.sleep(interval)

if __name__ == "__main__":
    worker = CampaignRefillWorker()
    try:
        asyncio.run(worker.run())
    except KeyboardInterrupt:
        logger.info("[CampaignRefill] Refill Worker stopped by user.")
