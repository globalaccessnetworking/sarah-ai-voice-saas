import asyncio
import os
import json
import logging
import psycopg2
from psycopg2.extras import RealDictCursor
from livekit import api
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("outbound_dispatcher")

class OutboundDispatcher:
    def __init__(self):
        self.db_url = os.getenv("DATABASE_URL")
        self.lk_api_key = os.getenv("LIVEKIT_API_KEY")
        self.lk_api_secret = os.getenv("LIVEKIT_API_SECRET")
        self.lk_url = os.getenv("LIVEKIT_URL")
        
        if not all([self.db_url, self.lk_api_key, self.lk_api_secret, self.lk_url]):
            logger.error("Missing critical environment variables for dispatcher.")
            
        self.lk_api = api.LiveKitAPI(self.lk_url, self.lk_api_key, self.lk_api_secret)

    def get_db_connection(self):
        return psycopg2.connect(self.db_url, cursor_factory=RealDictCursor)

    async def poll_and_dispatch(self):
        logger.info("Starting outbound dispatcher polling loop...")
        while True:
            try:
                conn = self.get_db_connection()
                cur = conn.cursor()

                # Get running campaigns
                cur.execute("SELECT * FROM campaigns WHERE status = 'running'")
                campaigns = cur.fetchall()

                for campaign in campaigns:
                    # Check concurrency (simplified: just fetch one lead at a time per campaign loop)
                    # Real implementation would track active rooms
                    cur.execute(
                        "SELECT * FROM campaign_numbers WHERE campaign_id = %s AND status = 'pending' LIMIT %s",
                        (campaign['id'], campaign['concurrency'] or 1)
                    )
                    leads = cur.fetchall()

                    for lead in leads:
                        await self.dispatch_lead(campaign, lead)
                        
                        # Mark as calling
                        cur.execute(
                            "UPDATE campaign_numbers SET status = 'calling', called_at = %s WHERE id = %s",
                            (datetime.now(), lead['id'])
                        )
                        conn.commit()

                cur.close()
                conn.close()
            except Exception as e:
                logger.error(f"Dispatcher polling error: {e}")
            
            await asyncio.sleep(5) # Poll every 5 seconds

    async def dispatch_lead(self, campaign, lead):
        try:
            # Fetch SIP trunk info
            conn = self.get_db_connection()
            cur = conn.cursor()
            cur.execute("SELECT * FROM sip_trunks WHERE id = %s", (campaign['sip_trunk_id'],))
            trunk = cur.fetchone()
            cur.close()
            conn.close()

            if not trunk:
                logger.error(f"Campaign {campaign['id']} has invalid SIP trunk {campaign['sip_trunk_id']}")
                return

            room_name = f"outbound_{lead['phone']}_{datetime.now().strftime('%M%S')}"
            
            # Metadata for context injection in run_agents.py
            metadata = {
                "lead_id": lead['id'],
                "lead_name": lead['name'] or "Customer",
                "campaign_id": campaign['id'],
                "agent_id": campaign['agent_id'],
                "outbound": True,
                "custom_data": lead.get('company_name', '') # Use companyName as custom data for now
            }

            logger.info(f"Initiating outbound call to {lead['phone']} via trunk {trunk['name']}")
            
            # LiveKit SIP Outbound Call
            # We use CreateSIPParticipant which requires a SIP URI
            # Format: sip:phone@hostname
            sip_uri = f"sip:{lead['phone']}@{trunk['address']}"
            
            await self.lk_api.room.create_sip_participant(
                api.CreateSIPParticipantRequest(
                    room_name=room_name,
                    sip_trunk_id=trunk['id'],
                    sip_number=lead['phone'], # Note: Some versions prefer full URI, some just terminal number
                    participant_identity=f"sip_{lead['phone']}",
                    participant_name=lead['name'] or "Lead",
                    participant_metadata=json.dumps(metadata)
                )
            )
            
            logger.info(f"Successfully dispatched SIP Participant for lead {lead['phone']}")

        except Exception as e:
            logger.error(f"Failed to dispatch lead {lead['phone']}: {e}")

async def main():
    dispatcher = OutboundDispatcher()
    await dispatcher.poll_and_dispatch()

if __name__ == "__main__":
    asyncio.run(main())
