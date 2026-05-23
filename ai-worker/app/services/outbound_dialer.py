import asyncio
import os
import logging
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
from livekit import api

logger = logging.getLogger("outbound-dialer")

class OutboundDialer:
    def __init__(self):
        self.db_url = os.getenv("DATABASE_URL")
        self.lk_url = os.getenv("LIVEKIT_URL")
        self.lk_api_key = os.getenv("LIVEKIT_API_KEY")
        self.lk_api_secret = os.getenv("LIVEKIT_API_SECRET")
        self.running = False
        self._lk_api = None

    async def start(self):
        """Start the outbound dialer polling loop."""
        if not all([self.db_url, self.lk_url, self.lk_api_key, self.lk_api_secret]):
            logger.error("Missing configuration for Outbound Dialer. Ensure DATABASE_URL and LIVEKIT_* variables are set.")
            return

        try:
            self._lk_api = api.LiveKitAPI(self.lk_url, self.lk_api_key, self.lk_api_secret)
            self.running = True
            logger.info("Outbound Dialer Engine Online")
            
            while self.running:
                try:
                    await self._poll_campaigns()
                except Exception as e:
                    logger.error(f"Error in dialer poll cycle: {e}")
                
                # Poll every 30 seconds
                await asyncio.sleep(30)
        except Exception as e:
            logger.error(f"Failed to start Outbound Dialer: {e}")
        finally:
            if self._lk_api:
                await self._lk_api.aclose()

    def stop(self):
        """Stop the dialer loop."""
        self.running = False
        logger.info("Outbound Dialer stopping...")

    async def _poll_campaigns(self):
        """Check for active campaigns and pending numbers."""
        conn = psycopg2.connect(self.db_url, cursor_factory=RealDictCursor)
        try:
            with conn.cursor() as cur:
                # Find all campaigns that are currently active
                cur.execute("SELECT * FROM campaigns WHERE status = 'active'")
                active_campaigns = cur.fetchall()
                
                if not active_campaigns:
                    return

                for campaign in active_campaigns:
                    await self._process_campaign(campaign, cur, conn)
        except Exception as e:
            logger.debug(f"Database error in dialer poll: {e}")
        finally:
            conn.close()

    async def _process_campaign(self, campaign, cur, conn):
        """Process a single campaign's queue."""
        campaign_id = campaign['id']
        concurrency = campaign.get('concurrency') or 1
        sip_trunk_id = campaign.get('sip_trunk_id')
        agent_id = campaign.get('agent_id')

        if not sip_trunk_id:
            logger.warning(f"Campaign {campaign['name']} has no SIP Trunk configured. Skipping.")
            return

        # Count active calls for this campaign
        cur.execute("SELECT count(*) FROM campaign_numbers WHERE campaign_id = %s AND status = 'calling'", (campaign_id,))
        current_active = cur.fetchone()['count']

        if current_active >= concurrency:
            return

        # Fetch pending numbers
        needed = concurrency - current_active
        cur.execute("""
            SELECT * FROM campaign_numbers 
            WHERE campaign_id = %s AND status = 'pending' 
            ORDER BY id ASC 
            LIMIT %s
        """, (campaign_id, needed))
        numbers = cur.fetchall()

        for contact in numbers:
            await self._initiate_call(campaign, contact, sip_trunk_id, agent_id, cur, conn)

    async def _initiate_call(self, campaign, contact, sip_trunk_id, agent_id, cur, conn):
        """Initiate a SIP call via LiveKit API."""
        phone = contact['phone']
        contact_id = contact['id']
        
        # Room name format: campaign-{id}-{phone}
        room_name = f"campaign-{campaign['id'][:8]}-{phone.replace('+', '')}"
        
        logger.info(f"Initiating SIP Call: {phone} | Campaign: {campaign['name']} | Room: {room_name}")

        try:
            # Mark as calling immediately to prevent double-dialing
            cur.execute("UPDATE campaign_numbers SET status = 'calling', called_at = NOW() WHERE id = %s", (contact_id,))
            conn.commit()

            # Create SIP Participant
            # NOTE: LiveKit SIP Ingress must be configured with this Trunk ID
            request = api.CreateSIPParticipantRequest(
                sip_trunk_id=str(sip_trunk_id),
                sip_number=phone,
                room_name=room_name,
                participant_identity=f"sip-{phone}",
                participant_name=contact.get('name') or "Customer"
            )
            
            # Metadata for the agent to use
            # We can't pass it directly in CreateSIPParticipantRequest, 
            # but the room name and participant identity can be used by the worker to look up context.
            
            await self._lk_api.sip.create_sip_participant(request)
            logger.info(f"Successfully dispatched SIP request for {phone}")

        except Exception as e:
            logger.error(f"Critical failure dialing {phone}: {e}")
            cur.execute("UPDATE campaign_numbers SET status = 'failed' WHERE id = %s", (contact_id,))
            conn.commit()
