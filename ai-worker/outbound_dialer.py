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
from pathlib import Path
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(env_path, override=True)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("SarahOutboundDialer")
logger.info(f"[ENV] ai-worker .env loaded path={env_path} exists={env_path.exists()}")
logger.info(f"[ENV] DEEPGRAM_API_KEY present={bool(os.getenv('DEEPGRAM_API_KEY'))}")
logger.info(f"[ENV] DEEPGRAM_API_KEY length={len(os.getenv('DEEPGRAM_API_KEY') or '')}")
logger.info(f"[ENV] OUTBOUND_GREETING_MODE={os.getenv('OUTBOUND_GREETING_MODE')}")
# LiveKit Config
LIVEKIT_URL = os.getenv("LIVEKIT_URL")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")
SIP_TRUNK_ID = os.getenv("LIVEKIT_SIP_TRUNK_ID", "ST_UcwwHJJ7Kf38") # Nayatel Fallback

# Redis Config
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))
QUEUE_NAME = os.getenv("AI_DIALER_OUTBOUND_QUEUE", "ai_dialer_outbound_queue")
FALLBACK_QUEUE = os.getenv("SARAH_ROBOCALL_QUEUE", "sarah_robocall_queue")

# DB Config
DATABASE_URL = os.getenv("DATABASE_URL")

class OutboundDialer:
    def __init__(self):
        self.redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True)
        self.db_conn = psycopg2.connect(DATABASE_URL)
        self.db_conn.autocommit = True
        logger.info(f"Outbound Dialer initialized. Listening on {QUEUE_NAME} and {FALLBACK_QUEUE}")

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
        import time
        legacy_mode = payload.get("legacy_complaint_mode", False)
        
        external_record_id = payload.get("external_record_id") or payload.get("lead_id") or (payload.get("ticket_id") if legacy_mode else None) or f"CALL-{int(time.time())}"
        
        phone = payload.get("phone") or (payload.get("to_number") if legacy_mode else None)
        if not phone:
            logger.error("No phone number provided in payload")
            return
            
        sip_call_to = payload.get("sip_call_to")
        if not sip_call_to:
            sip_call_to = phone.replace("+", "").replace(" ", "").replace("-", "").strip()
            
        contact_name = payload.get("contact_name") or payload.get("lead_name") or (payload.get("citizen_name") if legacy_mode else None) or "Valued Customer"
        call_goal = payload.get("call_goal") or (payload.get("issue_type") if legacy_mode else None) or "General Inquiry"
        # Preserve None for preview calls (payload sends campaign_id: null).
        # Do NOT coerce None to "default_campaign" — that string is truthy and
        # would bypass preview detection in run_agents.py and campaign_service.py.
        campaign_id = payload.get("campaign_id") or None
        # agent_display_name = human-readable DB name (e.g. "Generic AI Dialer") — used in metadata for
        # routing lookups inside run_agents.py. Do NOT use for LiveKit dispatch.
        agent_display_name = payload.get("agent_name") or "outbound-agent"
        # dispatch_agent_name = the name registered in WorkerOptions (AGENT_NAME env var).
        # LiveKit dispatch MUST use this exact string or no worker will accept the job.
        dispatch_agent_name = os.getenv("AGENT_NAME", "outbound-agent")
        logger.info(f"[Dialer] agent_display_name={agent_display_name!r} dispatch_agent_name={dispatch_agent_name!r}")
        agent_slug = payload.get("agent_slug")
        trunk_id = payload.get("sip_trunk_id") or (payload.get("trunk_id") if legacy_mode else None) or SIP_TRUNK_ID
        agent_config = payload.get("config", {})
        opening_message = payload.get("opening_message")

        timestamp_val = int(time.time())
        room_name = f"outbound_{sip_call_to}_{external_record_id}_{timestamp_val}"
        
        logger.info(f"Dispatching SIP call to {sip_call_to} for Campaign {campaign_id} (Record {external_record_id})...")

        # Prepare Metadata Tunnel (Generic SaaS Format)
        metadata_obj = {
            "type": payload.get("type") or "outbound",
            "source": payload.get("source") or "outbound",
            "direction": payload.get("direction") or "outbound",
            "call_direction": payload.get("call_direction") or "outbound",
            "agent_id": payload.get("agent_id"),
            "agent_slug": agent_slug,
            "agent_name": agent_display_name,
            "phone": phone,
            "to_number": phone,
            "contact_name": contact_name,
            "lead_name": contact_name,
            "campaign_id": campaign_id or None,  # Keep null for preview calls; never coerce to "default_campaign"
            "lead_id": payload.get("lead_id") or payload.get("external_record_id") or external_record_id,
            "external_record_id": payload.get("external_record_id") or payload.get("lead_id") or external_record_id,
            "room_name": room_name,
            "call_goal": call_goal,
            "opening_message": opening_message,
            
            "config": agent_config
        }
        
        # Inject full lead_data and dynamic fields to ensure personalization at runtime
        lead_data_src = payload.get("lead_data") or {}
        if lead_data_src:
            metadata_obj["lead_data"] = lead_data_src
            for key in ["company_name", "business_nature", "pain_point", "designation", "industry", "website", "gmb_reviews", "number_of_employees"]:
                if key in lead_data_src:
                    metadata_obj[key] = lead_data_src[key]
        elif "company_name" in payload:
            metadata_obj["company_name"] = payload.get("company_name")
        
        if legacy_mode:
            metadata_obj["citizen_name"] = contact_name
            metadata_obj["issue_type"] = call_goal
            metadata_obj["ticket_id"] = external_record_id
            
        metadata = json.dumps(metadata_obj, ensure_ascii=False)

        # PREWARM GREETING CACHE
        greeting_mode = os.getenv("OUTBOUND_GREETING_MODE", "session_say").strip().lower()
        if greeting_mode == "cached_pcm" and opening_message:
            try:
                import hashlib
                import time
                import wave
                from pathlib import Path
                from run_agents import get_tts
                from app.services.personalization import render_template
                
                # Combine payload and lead_data for greeting template rendering
                lead_data = payload.get("lead_data") or {}
                combined_data = { **payload, **lead_data }
                
                fast_greeting = render_template(opening_message, combined_data)
                
                from app.services.greeting_cache import resolve_effective_tts_config, get_greeting_cache_key
                
                # Log raw payload tts_config so we can confirm it arrives from frontend
                logger.info(f"[GREETING_PREWARM] payload_tts_config={payload.get('tts_config')}")
                
                # Conditional DB fallback: only query DB when payload is missing provider or model
                _payload_tts = payload.get("tts_config") or {}
                _needs_db_fallback = (
                    not _payload_tts.get("provider") or
                    str(_payload_tts.get("provider", "")).strip() in ("", "None", "N/A") or
                    not _payload_tts.get("model") or
                    str(_payload_tts.get("model", "")).strip() in ("", "None", "N/A")
                )
                
                if _needs_db_fallback:
                    _lookup_key = payload.get("agent_slug") or payload.get("agent_id")
                    if _lookup_key:
                        try:
                            from app.services.agent_storage import get_agent_config_by_id_or_slug
                            _db_agent = await get_agent_config_by_id_or_slug(_lookup_key)
                            if _db_agent and _db_agent.get("tts_config", {}).get("provider"):
                                payload["tts_config"] = _db_agent["tts_config"]
                                logger.info(f"[GREETING_PREWARM] tts_config resolved from DB: {payload['tts_config']}")
                            else:
                                logger.warning(f"[GREETING_PREWARM] DB lookup returned no tts_config for slug/id={_lookup_key}")
                        except Exception as db_e:
                            logger.warning(f"[GREETING_PREWARM] DB fallback failed: {db_e}; using defaults")
                    else:
                        logger.warning("[GREETING_PREWARM] no agent_slug/agent_id for DB fallback; using defaults")
                
                tts_provider, effective_model, effective_voice = resolve_effective_tts_config(payload, agent_config)
                
                logger.info(f"[GREETING_PREWARM] tts_config provider={tts_provider} model={effective_model} voice_id={effective_voice}")
                
                from app.services.config_service import config_service
                api_key = config_service.get_api_key(tts_provider.lower()) or os.getenv(f"{tts_provider.upper()}_API_KEY") or os.getenv("DEEPGRAM_API_KEY")
                api_key_present = bool(api_key)
                logger.info(f"[GREETING_PREWARM] api_key_present={str(api_key_present).lower()} provider={tts_provider}")
                
                cache_key = get_greeting_cache_key(fast_greeting, tts_provider, effective_model, effective_voice)
                cache_file = Path("/tmp/ai_greetings") / f"{cache_key}.wav"
                
                logger.info(f"[GREETING_CACHE] provider={tts_provider} model={effective_model} voice_id={effective_voice} key={cache_key}")
                logger.info(f"[GREETING_PREWARM] start cache_key={cache_key}")
                
                if cache_file.exists():
                    logger.info(f"[GREETING_PREWARM] cache_hit=true path={cache_file}")
                else:
                    logger.info(f"[GREETING_PREWARM] cache_hit=false; synthesizing...")
                    ts_cache_start = time.time()
                    
                    if not api_key_present and tts_provider.lower() == "deepgram":
                        logger.error("[GREETING_PREWARM] failed reason=deepgram_api_key_missing; continuing_without_cache=true")
                    else:
                        logger.info(f"[GREETING_PREWARM] rendered_text={fast_greeting[:220]}")
                        
                        async def build_cache_audio():
                            raw_pcm = bytearray()
                            sample_rate = 16000
                            num_channels = 1
                            
                            if tts_provider.lower() == "deepgram":
                                import aiohttp
                                url = f"https://api.deepgram.com/v1/speak?model={effective_model}&encoding=linear16&sample_rate=24000"
                                headers = {
                                    "Authorization": f"Token {api_key}",
                                    "Content-Type": "application/json"
                                }
                                payload_data = {"text": fast_greeting}
                                async with aiohttp.ClientSession() as session:
                                    async with session.post(url, headers=headers, json=payload_data) as resp:
                                        if resp.status == 200:
                                            audio_bytes = await resp.read()
                                            raw_pcm.extend(audio_bytes)
                                            sample_rate = 24000
                                            num_channels = 1
                                        else:
                                            error_text = await resp.text()
                                            raise Exception(f"Deepgram REST error {resp.status}: {error_text}")
                                logger.info(f"[GREETING_PREWARM] tts_ready provider={tts_provider} model={effective_model}")
                            else:
                                greeting_tts = None
                                if tts_provider.lower() == "cartesia":
                                    import livekit.plugins.cartesia
                                    greeting_tts = livekit.plugins.cartesia.TTS(voice=effective_voice, api_key=api_key)
                                elif tts_provider.lower() == "elevenlabs":
                                    import livekit.plugins.elevenlabs
                                    greeting_tts = livekit.plugins.elevenlabs.TTS(voice=effective_voice, api_key=api_key)
                                else:
                                    greeting_tts = get_tts(agent_config)
                                
                                if not greeting_tts:
                                    raise Exception("get_tts_returned_none")
                                    
                                logger.info(f"[GREETING_PREWARM] tts_ready provider={tts_provider} model={effective_model}")
                                async for audio_event in greeting_tts.synthesize(fast_greeting):
                                    if audio_event.frame:
                                        sample_rate = audio_event.frame.sample_rate
                                        num_channels = audio_event.frame.num_channels
                                        raw_pcm.extend(audio_event.frame.data)
                                    
                            cache_file.parent.mkdir(parents=True, exist_ok=True)
                            with wave.open(str(cache_file), 'wb') as wav:
                                wav.setnchannels(num_channels)
                                wav.setsampwidth(2)
                                wav.setframerate(sample_rate)
                                wav.writeframes(raw_pcm)
                                
                            duration_ms = int((len(raw_pcm) / (sample_rate * num_channels * 2)) * 1000)
                            logger.info(f"[GREETING_PREWARM] ready path={cache_file} duration_ms={duration_ms} cache_synthesis_ms={int((time.time() - ts_cache_start)*1000)}")

                        try:
                            try:
                                _prewarm_timeout = float(os.getenv("OUTBOUND_GREETING_PREWARM_TIMEOUT_SEC", "10.0"))
                            except ValueError:
                                logger.warning("[GREETING_PREWARM] invalid OUTBOUND_GREETING_PREWARM_TIMEOUT_SEC; using 10.0s")
                                _prewarm_timeout = 10.0
                            logger.info(f"[GREETING_PREWARM] synthesis_timeout={_prewarm_timeout}s")
                            await asyncio.wait_for(build_cache_audio(), timeout=_prewarm_timeout)
                        except asyncio.TimeoutError:
                            logger.error(f"[GREETING_PREWARM] failed reason=timeout; continuing_without_cache=true")
                        except Exception as syn_e:
                            logger.error(f"[GREETING_PREWARM] failed reason={syn_e}; continuing_without_cache=true")
                
                # Confirm readiness before SIP dispatch (non-fatal either way)
                if cache_file.exists():
                    logger.info(f"[GREETING_PREWARM] confirmed_ready path={cache_file}")
                else:
                    logger.warning("[GREETING_PREWARM] cache_not_ready before SIP dispatch; worker will use session_say fallback")
                    
            except Exception as prewarm_err:
                logger.error(f"[GREETING_PREWARM] failed reason={prewarm_err}")

        try:
            # Step 1: Create SIP Participant
            request = api.CreateSIPParticipantRequest(
                sip_trunk_id=trunk_id,
                sip_call_to=sip_call_to,
                room_name=room_name,
                participant_identity=f"sip_{sip_call_to}_{timestamp_val}",
                participant_name=contact_name,
                participant_metadata=metadata
            )
            
            response = await lkapi.sip.create_sip_participant(request)
            sip_call_id = getattr(response, "sip_call_id", "")
            
            logger.info(f"SIP Call successfully dispatched. SIP ID: {sip_call_id}")
            
            # Step 2: Explicitly Dispatch Agent
            # CRITICAL: agent_name here MUST match the name registered in WorkerOptions
            # (i.e. AGENT_NAME env var = "outbound-agent"), NOT the DB display name.
            logger.info(f"[Dialer] Dispatching agent to room={room_name} worker={dispatch_agent_name!r}")
            dispatch_request = api.CreateAgentDispatchRequest(
                agent_name=dispatch_agent_name,
                room=room_name,
                metadata=metadata,
            )
            dispatch = await lkapi.agent_dispatch.create_dispatch(dispatch_request)
            dispatch_id = getattr(dispatch, "id", "") or getattr(dispatch, "dispatch_id", "")
            
            logger.info(f"Agent explicitly dispatched. Dispatch ID: {dispatch_id}")
            
            # Legacy DB update for complaints
            if payload.get("ticket_id") or payload.get("legacy_complaint_mode"):
                await self.update_complaint_status(external_record_id, "calling", sip_call_id=sip_call_id)
            
        except Exception as e:
            logger.error(f"SIP Bridge Error for {external_record_id}: {e}")
            if payload.get("ticket_id") or payload.get("legacy_complaint_mode"):
                await self.update_complaint_status(external_record_id, "failed", error=str(e))

    async def run(self):
        async with api.LiveKitAPI(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET) as lkapi:
            logger.info("Connected to LiveKit API.")
            while True:
                try:
                    # BRPOP (Blocking Pop) from Redis
                    # result is a tuple: (queue_name, data)
                    result = self.redis_client.brpop([QUEUE_NAME, FALLBACK_QUEUE], timeout=5)
                    if result:
                        q_name = result[0]
                        payload = json.loads(result[1])
                        logger.info(f"[Dialer] Received job from queue={q_name}")
                        logger.info(f"[Dialer] Payload keys={list(payload.keys())}")
                        logger.info(f"[Dialer] Calling sip_call_to={payload.get('sip_call_to')} phone={payload.get('phone')} campaign_id={payload.get('campaign_id')}")
                        await self.make_outbound_call(lkapi, payload)
                except Exception as e:
                    logger.exception("Dialer Loop Error")
                    await asyncio.sleep(2)

if __name__ == "__main__":
    dialer = OutboundDialer()
    try:
        asyncio.run(dialer.run())
    except KeyboardInterrupt:
        logger.info("Dialer stopped by user.")
