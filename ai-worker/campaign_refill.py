import asyncio
import json
import logging
import os
import time
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

class CampaignRefillWorker:
    def __init__(self):
        self.redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True)
        self.db_conn = psycopg2.connect(DATABASE_URL)
        self.db_conn.autocommit = True
        logger.info(f"Campaign Refill Worker initialized.")

    def get_db_cursor(self):
        if self.db_conn.closed:
            self.db_conn = psycopg2.connect(DATABASE_URL)
            self.db_conn.autocommit = True
        return self.db_conn.cursor(cursor_factory=DictCursor)

    def process_campaigns(self):
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
                
                # Check active processing numbers
                cursor.execute("""
                    SELECT COUNT(*) FROM campaign_numbers 
                    WHERE campaign_id = %s AND status = 'processing'
                """, (campaign_id,))
                active_calls = cursor.fetchone()[0]
                
                available_slots = concurrency - active_calls
                
                if available_slots <= 0:
                    continue
                    
                # Fetch pending numbers
                cursor.execute("""
                    SELECT * FROM campaign_numbers 
                    WHERE campaign_id = %s AND status = 'pending' 
                    LIMIT %s
                """, (campaign_id, available_slots))
                pending_numbers = cursor.fetchall()
                
                if not pending_numbers:
                    # Mark campaign as completed if all numbers are done
                    cursor.execute("""
                        SELECT COUNT(*) FROM campaign_numbers 
                        WHERE campaign_id = %s AND status = 'pending'
                    """, (campaign_id,))
                    if cursor.fetchone()[0] == 0 and active_calls == 0:
                        logger.info(f"Campaign {campaign['name']} completed. Marking as completed.")
                        cursor.execute("UPDATE campaigns SET status = 'completed' WHERE id = %s", (campaign_id,))
                    continue

                # Fetch related agent and trunk data once per campaign
                cursor.execute("SELECT * FROM agents WHERE id = %s", (campaign['agent_id'],))
                agent = cursor.fetchone()
                if not agent:
                    logger.error(f"Agent {campaign['agent_id']} not found for campaign {campaign_id}")
                    continue
                    
                trunk_id = campaign.get('sip_trunk_id')
                if trunk_id:
                    cursor.execute("SELECT * FROM sip_trunks WHERE id = %s", (trunk_id,))
                    trunk = cursor.fetchone()
                else:
                    cursor.execute("SELECT * FROM sip_trunks WHERE type = 'outbound' LIMIT 1")
                    trunk = cursor.fetchone()
                
                if not trunk:
                    logger.error(f"No SIP trunk available for campaign {campaign_id}")
                    continue

                # Enqueue available slots
                for number in pending_numbers:
                    trunk_numbers = trunk.get('numbers', [])
                    default_caller_id = trunk_numbers[0] if trunk_numbers else trunk.get('name')
                    
                    payload = {
                        "type": "outbound_campaign_call",
                        "direction": "outbound",
                        "campaign_id": campaign_id,
                        "campaign_name": campaign.get('name'),
                        "lead_id": number['id'],
                        "external_record_id": number['id'],
                        "contact_name": number.get('name') or "Customer",
                        "phone": number['phone'],
                        "agent_id": agent['id'],
                        "agent_slug": agent['slug'],
                        "agent_name": "outbound-agent",
                        "sip_trunk_id": trunk['id'],
                        "caller_id": campaign.get('caller_id') or default_caller_id,
                        "opening_message": campaign.get('opening_message'),
                        "call_goal": campaign.get('call_goal') or f"Campaign Outbound Call - {campaign.get('name')}",
                        "legacy_complaint_mode": False
                    }

                    # Push to Redis
                    self.redis_client.lpush(QUEUE_NAME, json.dumps(payload))
                    
                    # Update status
                    cursor.execute("UPDATE campaign_numbers SET status = 'processing' WHERE id = %s", (number['id'],))
                    
                logger.info(f"Campaign {campaign['name']}: Enqueued {len(pending_numbers)} new calls.")
                
        except Exception as e:
            logger.error(f"Error in campaign refill loop: {e}")
        finally:
            if 'cursor' in locals() and cursor:
                cursor.close()

    async def run(self):
        logger.info("Starting Campaign Refill loop...")
        while True:
            self.process_campaigns()
            await asyncio.sleep(5)  # Run every 5 seconds

if __name__ == "__main__":
    worker = CampaignRefillWorker()
    try:
        asyncio.run(worker.run())
    except KeyboardInterrupt:
        logger.info("Refill Worker stopped by user.")
