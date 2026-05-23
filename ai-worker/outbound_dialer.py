import asyncio
import json
import logging
import os
import redis
import psycopg2
from datetime import datetime
from dotenv import load_dotenv
from livekit import api

# --- Configuration & Logging ---
load_dotenv()
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("SarahOutboundDialer")

# LiveKit Config
LIVEKIT_URL = os.getenv("LIVEKIT_URL")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")
SIP_TRUNK_ID = os.getenv("LIVEKIT_SIP_TRUNK_ID", "ST_UcwwHJJ7Kf38") # Nayatel Fallback

# Redis Config
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))
QUEUE_NAME = "sarah_robocall_queue"

# DB Config
DATABASE_URL = os.getenv("DATABASE_URL")

class OutboundDialer:
    def __init__(self):
        self.redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True)
        self.db_conn = psycopg2.connect(DATABASE_URL)
        self.db_conn.autocommit = True
        logger.info("Outbound Dialer initialized.")

    async def get_db_cursor(self):
        if self.db_conn.closed:
            self.db_conn = psycopg2.connect(DATABASE_URL)
            self.db_conn.autocommit = True
        return self.db_conn.cursor()

    async def update_complaint_status(self, ticket_id, status, sip_call_id=None, error=None):
        try:
            cursor = await self.get_db_cursor()
            if sip_call_id:
                cursor.execute(
                    "UPDATE complaints SET outbound_status = %s, outbound_sip_call_id = %s, last_called_at = %s WHERE ticket_id = %s",
                    (status, sip_call_id, datetime.now(), ticket_id)
                )
            elif error:
                cursor.execute(
                    "UPDATE complaints SET outbound_status = %s, outbound_error = %s, last_called_at = %s WHERE ticket_id = %s",
                    (status, error, datetime.now(), ticket_id)
                )
            else:
                cursor.execute(
                    "UPDATE complaints SET outbound_status = %s, last_called_at = %s WHERE ticket_id = %s",
                    (status, datetime.now(), ticket_id)
                )
            cursor.close()
        except Exception as e:
            logger.error(f"Failed to update DB for {ticket_id}: {e}")

    async def make_outbound_call(self, lkapi, payload):
        ticket_id = payload.get("ticket_id")
        phone = payload.get("phone")
        citizen_name = payload.get("citizen_name")
        agent_config = payload.get("config", {})

        room_name = f"call_{phone.replace('+', '')}_{ticket_id}"
        logger.info(f"Dispatching SIP call to {phone} for Ticket {ticket_id}...")

        # Prepare Metadata Tunnel
        metadata = json.dumps({
            "type": "outbound",
            "agent_id": payload.get("agent_id"),
            "ticket_id": ticket_id,
            "citizen_name": citizen_name,
            "issue_type": payload.get("issue_type", "General Complaint"),
            "config": agent_config
        })

        try:
            # Create SIP Participant (Nayatel Bridge)
            request = api.CreateSIPParticipantRequest(
                sip_trunk_id=SIP_TRUNK_ID,
                sip_call_to=phone,
                room_name=room_name,
                participant_identity=f"sarah_outbound_{ticket_id}",
                participant_name="Sarah",
                participant_metadata=metadata
            )
            
            response = await lkapi.sip.create_sip_participant(request)
            sip_call_id = response.sip_call_id
            
            logger.info(f"Call successfully dispatched. SIP ID: {sip_call_id}")
            await self.update_complaint_status(ticket_id, "calling", sip_call_id=sip_call_id)
            
        except Exception as e:
            logger.error(f"SIP Bridge Error for {ticket_id}: {e}")
            await self.update_complaint_status(ticket_id, "failed", error=str(e))

    async def run(self):
        async with api.LiveKitAPI(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET) as lkapi:
            logger.info("Connected to LiveKit API.")
            while True:
                try:
                    # BRPOP (Blocking Pop) from Redis
                    # result is a tuple: (queue_name, data)
                    result = self.redis_client.brpop(QUEUE_NAME, timeout=5)
                    if result:
                        payload = json.loads(result[1])
                        await self.make_outbound_call(lkapi, payload)
                except Exception as e:
                    logger.error(f"Dialer Loop Error: {e}")
                    await asyncio.sleep(2)

if __name__ == "__main__":
    dialer = OutboundDialer()
    try:
        asyncio.run(dialer.run())
    except KeyboardInterrupt:
        logger.info("Dialer stopped by user.")
