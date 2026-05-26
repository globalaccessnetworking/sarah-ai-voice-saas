import os
import json
import random
import logging
import asyncio
import asyncpg
import requests
import uuid
import aiohttp
import wave
import io
from datetime import datetime
from typing import Annotated, Optional, Literal
from livekit.agents import llm, function_tool
from livekit import rtc

logger = logging.getLogger("AgenticSuite")

class SovereignToolProvider:
    def __init__(self, session_ref, room, agent_config, start_time: Optional[datetime] = None, to_number: Optional[str] = None, from_number: Optional[str] = None):
        self.session_ref = session_ref
        self.room = room
        self.agent_config = agent_config
        self.tools_config = agent_config.get("tools_config", {})
        self.is_transferring = False
        self._is_terminating = False
        self.db_url = os.getenv("DATABASE_URL")
        self.start_time = start_time or datetime.now()
        self.to_number = to_number
        self.from_number = from_number.strip() if from_number else None
        if self.from_number:
            # Normalization Policy: Local Pakistani Format (03XXXXXXXXX)
            # Clean sip:, @, and + as per user request
            clean_num = self.from_number.replace("sip:", "").split("@")[0].replace("+", "")
            
            # Strip ALL leading 92s and 0s (Recursive Normalization)
            while clean_num.startswith('92') or clean_num.startswith('0'):
                if clean_num.startswith('92'):
                    clean_num = clean_num[2:]
                elif clean_num.startswith('0'):
                    clean_num = clean_num[1:]
            
            self.from_number = '0' + clean_num
        
        # Detect Agent Identity for specialized stabilization logic
        self.agent_name = str(agent_config.get("name", "")).lower()
        self.is_outbound = "outbound" in self.agent_name or agent_config.get("direction") == "outbound"
        self.is_sarah_inbound = "sarah" in self.agent_name and not self.is_outbound
        
        logger.info(f"AgenticSuite: Mode={'SARAH_INBOUND' if self.is_sarah_inbound else 'STANDARD'} for {self.agent_name}")

    @property
    def session(self):
        return self.session_ref.get("session")

    def _find_sip_participant(self):
        """High-resilience search for the SIP caller."""
        if not self.room:
            return None
        for p in self.room.remote_participants.values():
            if p.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP or str(p.identity).startswith("sip_"):
                return p
        return None

    async def _background_room_disconnect(self, delay: float = 4.0):
        """Helper to disconnect the room after a delay without blocking the tool return."""
        logger.info(f"⏳ DISCONNECT_LOG: Scheduling background disconnect in {delay}s for room {self.room.name if self.room else 'Unknown'}")
        await asyncio.sleep(delay)
        try:
            logger.info(f"🚀 DISCONNECT_LOG: Starting atomic disconnect sequence for {self.room.name if self.room else 'Unknown'}")
            # 1. Aggressive SIP Drop: Force Asterisk BYE before closing room
            sip_p = self._find_sip_participant()
            if sip_p:
                logger.info(f"📞 DISCONNECT_LOG: Found SIP participant {sip_p.identity}. Sending Room Delete request.")
                try:
                    url = os.getenv("LIVEKIT_URL", "").replace("wss://", "https://").replace("ws://", "http://")
                    api_key = os.getenv("LIVEKIT_API_KEY", "")
                    api_secret = os.getenv("LIVEKIT_API_SECRET", "")
                    
                    from livekit import api
                    lkapi = api.LiveKitAPI(url=url, api_key=api_key, api_secret=api_secret)
                    try:
                        # ATOMIC BYE: Forcefully delete the entire room for this unique caller.
                        await lkapi.room.delete_room(api.DeleteRoomRequest(room=self.room.name))
                        logger.warning(f"✅ DISCONNECT_LOG: ATOMIC HANGUP SUCCESS: Room {self.room.name} deleted via Server API.")
                    finally:
                        await lkapi.aclose()
                except Exception as lk_err:
                    logger.error(f"❌ DISCONNECT_LOG: ATOMIC HANGUP ERROR: {lk_err}")

            # 2. Final WebRTC Cleanup
            if self.room:
                await self.room.disconnect()
                logger.warning(f"✅ DISCONNECT_LOG: BACKGROUND DISCONNECT: Room {self.room.name} closed successfully.")
        except Exception as e:
            logger.error(f"❌ DISCONNECT_LOG: BACKGROUND DISCONNECT ERROR: {e}")

    async def _background_transfer(self, destination: str, participant_identity: str, delay: float = 3.0):
        """Helper to fire SIP transfer after a delay to ensure speech finishes."""
        await asyncio.sleep(delay)
        try:
            url = os.getenv("LIVEKIT_URL", "").replace("wss://", "https://").replace("ws://", "http://")
            api_key = os.getenv("LIVEKIT_API_KEY", "")
            api_secret = os.getenv("LIVEKIT_API_SECRET", "")
            
            from livekit import api
            async with api.LiveKitAPI(url=url, api_key=api_key, api_secret=api_secret) as lkapi:
                await lkapi.sip.transfer_sip_participant(
                    api.TransferSIPParticipantRequest(
                        participant_identity=participant_identity,
                        room_name=self.room.name,
                        transfer_to=destination
                    )
                )
            logger.warning(f"BACKGROUND TRANSFER: Successfully fired transfer for {participant_identity} to {destination}")
        except Exception as e:
            error_msg = str(e)
            logger.error(f"BACKGROUND TRANSFER ERROR: {error_msg}")
            
            # Graceful Failure: Sarah informs the caller if the PBX is unreachable
            if self.session:
                try:
                    fail_speech = "معذرت، اس وقت ہم آپ کی کال آگے ٹرانسفر نہیں کر پا رہے۔ براہ کرم تھوڑی دیر بعد دوبارہ کوشش کریں یا لائن پر رہیں۔"
                    # Reset termination flag so she can speak
                    self._is_terminating = False
                    self.is_transferring = False
                    await self.session.say(fail_speech, allow_interruptions=True)
                    logger.warning("TRANSFER FAIL NOTIFICATION: Sarah informed the caller of the PBX error.")
                except Exception as say_err:
                    logger.error(f"Failed to speak transfer error: {say_err}")

    async def _play_wav_apology(self, url: str):
        """Streaming PCM injection with dynamic sample rate support. Defer disconnect until finished."""
        try:
            # Absolute timeout for the entire apology process
            async with asyncio.timeout(15.0):
                async with aiohttp.ClientSession() as http_sess:
                    async with http_sess.get(url, timeout=5) as resp:
                        if resp.status != 200:
                            raise Exception(f"HTTP_{resp.status}")
                        wav_bytes = await resp.read()
                
                with wave.open(io.BytesIO(wav_bytes), 'rb') as wav:
                    sample_rate = wav.getframerate()
                    num_channels = wav.getnchannels()
                    raw_pcm = wav.readframes(wav.getnframes())

                logger.info(f"REJECT_TOOL PLAYBACK: WAV {sample_rate}Hz {num_channels}ch, Bytes={len(raw_pcm)}")

                source = rtc.AudioSource(sample_rate, num_channels)
                track = rtc.LocalAudioTrack.create_audio_track("apology", source)
                publication = await self.room.local_participant.publish_track(track)
                
                # 100ms chunking based on sample rate
                # 2 bytes per sample (PCM16)
                samples_per_100ms = sample_rate // 10
                chunk_size = samples_per_100ms * num_channels * 2
                
                start_time = asyncio.get_event_loop().time()

                for i in range(0, len(raw_pcm), chunk_size):
                    # Standard loop without 'is_closed' check (SDK handles disconnects via capture_frame failures)
                    chunk = raw_pcm[i:i+chunk_size]
                    if len(chunk) < chunk_size:
                        chunk = chunk.ljust(chunk_size, b'\x00')
                    
                    await source.capture_frame(rtc.AudioFrame(chunk, sample_rate, num_channels, len(chunk) // (2 * num_channels)))
                    
                    expected_time = start_time + (i + chunk_size) / (sample_rate * num_channels * 2)
                    sleep_duration = expected_time - asyncio.get_event_loop().time()
                    if sleep_duration > 0:
                        await asyncio.sleep(sleep_duration)

                await self.room.local_participant.unpublish_track(publication.sid)
                logger.info("REJECT_TOOL: Audio injection finished. Firing atomic hangup.")
        except Exception as e:
            logger.error(f"REJECT_TOOL AUDIO ERROR: {e}")
        finally:
            # Ensure the call is disconnected regardless of success/fail
            await self._background_room_disconnect(1.0)

    @function_tool(
        description="Instantly disconnects and disqualifies a caller who violates eligibility rules (wrong city, excluded area, or commercial property)."
    )
    async def reject_service(
        self, 
        reason: Annotated[Literal['city', 'area', 'commercial'], "The reason for rejection"]
    ):
        if self._is_terminating:
            return "Rejection already in progress."
        self._is_terminating = True
        
        rules = self.agent_config.get("eligibility_rules", {})
        if isinstance(rules, str):
            try:
                rules = json.loads(rules)
            except Exception as e:
                logger.error(f"REJECT_TOOL: Failed to parse eligibility_rules JSON string: {e}")
                rules = {}
        
        if not isinstance(rules, dict):
            rules = {}
            
        url = None
        text = None
        
        # Resolve assets based on reason
        if reason == 'city':
            url = rules.get("cityApologyAudio")
            text = rules.get("cityApologyText", "ہم اس وقت سروسز صرف لاہور میں دے رہے ہیں۔ آپ کی کال کا شکریہ۔")
        elif reason == 'area':
            url = rules.get("areaApologyAudio")
            text = rules.get("areaApologyText", "ہم اس ایریا میں سروسز نہیں دیتے۔ آپ کی کال کا شکریہ۔")
        elif reason == 'commercial':
            url = rules.get("commercialApologyAudio")
            text = rules.get("commercialApologyText", "ہم معذرت خواہ ہیں، ہماری سروسز کمرشل ایریاز کے لیے نہیں ہیں۔")

        logger.info(f"REJECT_SERVICE: Reason='{reason}' Audio='{url is not None}'")

        if url:
            # 🔇 ATOMIC SILENCE: Force mute Sarah's TTS instantly so she doesn't talk over the WAV file
            if self.session:
                try:
                    self.session.interrupt()
                    self.session.mute()
                    logger.info("🔇 [ATOMIC SILENCE] Sarah's TTS muted for WAV playback.")
                except Exception as e:
                    pass
            # Priority 1: Direct Audio Injection (Player handles disconnect)
            asyncio.create_task(self._play_wav_apology(url))
        else:
            # Priority 2: TTS Fallback
            async def run_tts_rejection():
                if self.session:
                    try:
                        self.session.interrupt()
                        await asyncio.sleep(0.12)
                    except: pass
                    await self.session.say(text, allow_interruptions=False)
                await self._background_room_disconnect(1.0)
            
            asyncio.create_task(run_tts_rejection())
        
        return f"SUCCESS: Rejected for reason {reason}. [FINAL_ACTION_COMPLETE: Silent Exit Protocol Active. DO NOT generate any verbal response.]"

    # --- 1. submit_ticket (Inbound Generation) ---
    @function_tool(
        description="Final submission of a new complaint. Call this ONLY after collecting Name, Phone, Issue, District, Address, and Landmark."
    )
    async def submit_ticket(
        self,
        caller_name: Annotated[str, "Citizen name"],
        phone: Annotated[str, "Citizen phone"],
        issue: Annotated[str, "Problem description"],
        district: Annotated[str, "District"],
        address: Annotated[str, "Detailed address"],
        landmark: Annotated[str, "Landmark"]
    ):
        if self._is_terminating:
            return "Action ignored: session already terminating."
        self._is_terminating = True
        try:
            prefix = self.tools_config.get("ticket_prefix", "TKT-")
            conn = await asyncpg.connect(self.db_url)
            try:
                row = await conn.fetchrow("""
                    INSERT INTO complaints (name, phone, issue, district, address, landmark, status, priority, room_name, asterisk_number)
                    VALUES ($1, $2, $3, $4, $5, $6, 'Pending', 'Normal', $7, $8)
                    RETURNING id
                """, caller_name, phone, issue, district, address, landmark, self.room.name, self.from_number)
                
                tkt_id = f"{prefix}{row['id']}"
                await conn.execute("UPDATE complaints SET ticket_id = $1 WHERE id = $2", tkt_id, row['id'])
                
                # Build speech from GUI-configured template (ticket_speech), falling back to default
                default_speech = f"آپ کی شکایت کامیابی کے ساتھ درج کر لی گئی ہے۔ آپ کا شکایت نمبر ہے {tkt_id}۔ پنجاب ہیلپ لائن پر رابطہ کرنے کا شکریہ، اللہ حافظ۔"
                template = self.tools_config.get("ticket_speech", "")
                speech = template.replace("{ticket_id}", tkt_id) if template else default_speech
                
                if self.session:
                    # Silence Guard: Forcefully clear any pending generation/speech
                    try:
                        self.session.interrupt()
                        await asyncio.sleep(0.12) # Propagation yield
                    except: pass
                    
                    await self.session.say(speech, allow_interruptions=False)
                # GUI-Configurable Delay: Pull from tools_config, falling back to identity-based defaults
                delay_override = self.tools_config.get("ticket_disconnect_delay")
                if delay_override is not None:
                    delay = float(delay_override)
                else:
                    delay = 10.0 if self.is_sarah_inbound else 6.0
                    
                asyncio.create_task(self._background_room_disconnect(delay))
                logger.info(f"SUBMIT_TICKET: Background disconnect scheduled ({delay}s).")
                                
                return f"SUCCESS: Ticket {tkt_id} submitted. [FINAL_ACTION_COMPLETE: Silent Exit Protocol Active. DO NOT generate any verbal response.]"
            finally:
                await conn.close()
        except Exception as e:
            return f"Error: {e}"

    # --- 2. mark_unresolved (Outbound Feedback) ---
    @function_tool(description="Call this if the citizen confirms the issue is NOT resolved.")
    async def mark_unresolved(self, ticket_id: str):
        if self._is_terminating:
            return "Action ignored: session already terminating."
        self._is_terminating = True
        try:
            speech = self.tools_config.get("unresolved_speech", "مجھے یہ سن کر بہت افسوس ہوا کہ آپ کا مسئلہ ابھی تک حل نہیں ہو سکا۔ میں آپ سے دلی معذرت خواہ ہوں۔ میں نے آپ کی اس شکایت کو ارجنٹ مارک کر کے اعلیٰ حکام تک پہنچا دیا ہے۔ آپ کا ستھرا پنجاب میں کال کرنے کا بہت شکریہ، اللہ حافظ۔")
            conn = await asyncpg.connect(self.db_url)
            try:
                # Update Complaint Table
                await conn.execute("""
                    UPDATE complaints 
                    SET status = 'Unresolved', 
                        outbound_status = 'completed', 
                        citizen_feedback = 'still_issue' 
                    WHERE ticket_id = $1
                """, ticket_id)
                
                # Log to Call Logs (Analytics) - Race-safe canonical updates
                duration = int((datetime.now() - self.start_time).total_seconds())
                log_id = str(uuid.uuid4())
                incoming_metadata = {
                    "ticket_id": ticket_id,
                    "feedback": "still_issue",
                    "direction": "outbound",
                    "source": "digital_ear"
                }

                # Exclusive transaction-level advisory lock by room_name
                await conn.execute("SELECT pg_advisory_xact_lock(hashtext($1))", self.room.name)
                logger.info(f"[CALL_LOG_PERSIST] action=advisory_lock_acquired room_name={self.room.name} source=agentic_suite_unresolved")

                # Fetch all rows matching the room name to select the canonical one
                rows = await conn.fetch("""
                    SELECT id, duration_seconds, transcript, summary, metadata FROM call_logs
                    WHERE room_name = $1
                """, self.room.name)

                existing_id = None
                existing_metadata = {}
                existing_duration = 0

                if rows:
                    def sort_key(r):
                        r_id, dur, tr, sm, md = r
                        has_dur = 1 if (dur and dur > 0) else 0
                        has_tr = 1 if tr else 0
                        has_sm = 1 if sm else 0
                        meta_len = len(md) if md else 0
                        return (has_dur, has_tr, has_sm, meta_len)

                    sorted_rows = sorted(rows, key=sort_key, reverse=True)
                    existing_id = sorted_rows[0]['id']
                    existing_duration = sorted_rows[0]['duration_seconds'] or 0
                    existing_meta_raw = sorted_rows[0]['metadata']

                    if existing_meta_raw:
                        if isinstance(existing_meta_raw, dict):
                            existing_metadata = existing_meta_raw
                        elif isinstance(existing_meta_raw, str):
                            try:
                                existing_metadata = json.loads(existing_meta_raw)
                            except: pass

                # Merge metadata safely
                merged_metadata = {**existing_metadata}
                merged_metadata.update(incoming_metadata)
                resolved_duration = max(existing_duration, duration)

                if existing_id:
                    logger.info(f"[CALL_LOG_PERSIST] action=update_existing room_name={self.room.name} id={existing_id} source=agentic_suite_unresolved")
                    await conn.execute("""
                        UPDATE call_logs
                        SET status = 'completed',
                            duration_seconds = $1,
                            metadata = $2
                        WHERE id = $3
                    """, resolved_duration, json.dumps(merged_metadata), existing_id)
                else:
                    logger.info(f"[CALL_LOG_PERSIST] action=create room_name={self.room.name} id={log_id} source=agentic_suite_unresolved")
                    await conn.execute("""
                        INSERT INTO call_logs (id, agent_id, room_name, direction, status, to_number, duration_seconds, metadata)
                        VALUES ($1, $2, $3, 'outbound', 'completed', $4, $5, $6)
                    """, log_id, self.agent_config.get("id"), self.room.name, self.to_number, resolved_duration, json.dumps(merged_metadata))

                if self.session:
                    # Silence Guard: Stop the current chatter before playing unresolved notice
                    try:
                        self.session.interrupt()
                        await asyncio.sleep(0.12) # Propagation yield
                    except: pass
                    
                    await self.session.say(speech, allow_interruptions=False)
                    # GUI-Configurable Delay: Pull from tools_config, falling back to identity-based defaults
                    delay_override = self.tools_config.get("resolution_disconnect_delay")
                    if delay_override is not None:
                        delay = float(delay_override)
                    else:
                        delay = 12.0 if self.is_sarah_inbound else 4.0
                        
                    asyncio.create_task(self._background_room_disconnect(delay))
                return f"SUCCESS: Unresolved for {ticket_id}. [FINAL_ACTION_COMPLETE: Silent Exit Protocol Active. DO NOT generate any verbal response.]"
            finally:
                await conn.close()
        except Exception as e:
            logger.error(f"Error in mark_unresolved: {e}")
            return f"Error: {e}"

    # --- 3. mark_resolved (Outbound Success) ---
    @function_tool(description="Call this if the citizen confirms the issue IS resolved.")
    async def mark_resolved(self, ticket_id: str):
        if self._is_terminating:
            return "Action ignored: session already terminating."
        self._is_terminating = True
        try:
            speech = self.tools_config.get("resolved_speech", "آپ کی تصدیق کا شکریہ۔ اللہ حافظ۔")
            conn = await asyncpg.connect(self.db_url)
            try:
                # Update Complaint Table
                await conn.execute("""
                    UPDATE complaints 
                    SET status = 'Resolved', 
                        outbound_status = 'completed', 
                        citizen_feedback = 'verified' 
                    WHERE ticket_id = $1
                """, ticket_id)

                # Log to Call Logs (Analytics) - Race-safe canonical updates
                duration = int((datetime.now() - self.start_time).total_seconds())
                log_id = str(uuid.uuid4())
                incoming_metadata = {
                    "ticket_id": ticket_id,
                    "feedback": "verified",
                    "direction": "outbound",
                    "source": "digital_ear"
                }

                # Exclusive transaction-level advisory lock by room_name
                await conn.execute("SELECT pg_advisory_xact_lock(hashtext($1))", self.room.name)
                logger.info(f"[CALL_LOG_PERSIST] action=advisory_lock_acquired room_name={self.room.name} source=agentic_suite_resolved")

                # Fetch all rows matching the room name to select the canonical one
                rows = await conn.fetch("""
                    SELECT id, duration_seconds, transcript, summary, metadata FROM call_logs
                    WHERE room_name = $1
                """, self.room.name)

                existing_id = None
                existing_metadata = {}
                existing_duration = 0

                if rows:
                    def sort_key(r):
                        r_id, dur, tr, sm, md = r
                        has_dur = 1 if (dur and dur > 0) else 0
                        has_tr = 1 if tr else 0
                        has_sm = 1 if sm else 0
                        meta_len = len(md) if md else 0
                        return (has_dur, has_tr, has_sm, meta_len)

                    sorted_rows = sorted(rows, key=sort_key, reverse=True)
                    existing_id = sorted_rows[0]['id']
                    existing_duration = sorted_rows[0]['duration_seconds'] or 0
                    existing_meta_raw = sorted_rows[0]['metadata']

                    if existing_meta_raw:
                        if isinstance(existing_meta_raw, dict):
                            existing_metadata = existing_meta_raw
                        elif isinstance(existing_meta_raw, str):
                            try:
                                existing_metadata = json.loads(existing_meta_raw)
                            except: pass

                # Merge metadata safely
                merged_metadata = {**existing_metadata}
                merged_metadata.update(incoming_metadata)
                resolved_duration = max(existing_duration, duration)

                if existing_id:
                    logger.info(f"[CALL_LOG_PERSIST] action=update_existing room_name={self.room.name} id={existing_id} source=agentic_suite_resolved")
                    await conn.execute("""
                        UPDATE call_logs
                        SET status = 'completed',
                            duration_seconds = $1,
                            metadata = $2
                        WHERE id = $3
                    """, resolved_duration, json.dumps(merged_metadata), existing_id)
                else:
                    logger.info(f"[CALL_LOG_PERSIST] action=create room_name={self.room.name} id={log_id} source=agentic_suite_resolved")
                    await conn.execute("""
                        INSERT INTO call_logs (id, agent_id, room_name, direction, status, to_number, duration_seconds, metadata)
                        VALUES ($1, $2, $3, 'outbound', 'completed', $4, $5, $6)
                    """, log_id, self.agent_config.get("id"), self.room.name, self.to_number, resolved_duration, json.dumps(merged_metadata))

                if self.session:
                    # Silence Guard: Stop the current chatter before playing resolved confirmation
                    try:
                        self.session.interrupt()
                        await asyncio.sleep(0.12) # Propagation yield
                    except: pass
                    
                    await self.session.say(speech, allow_interruptions=False)
                    # GUI-Configurable Delay: Pull from tools_config, falling back to identity-based defaults
                    delay_override = self.tools_config.get("resolution_disconnect_delay")
                    if delay_override is not None:
                        delay = float(delay_override)
                    else:
                        delay = 12.0 if self.is_sarah_inbound else 4.0
                        
                    asyncio.create_task(self._background_room_disconnect(delay))
                return f"SUCCESS: Resolved for {ticket_id}. [FINAL_ACTION_COMPLETE: Silent Exit Protocol Active. DO NOT generate any verbal response.]"
            finally:
                await conn.close()
        except Exception as e:
            logger.error(f"Error in mark_resolved: {e}")
            return f"Error: {e}"

    @function_tool(description="Transfer to a human.")
    async def transfer_to_human(self):
        if self._is_terminating or self.is_transferring:
            return "Action ignored: session already terminating or transfer in progress."
            
        sip_p = self._find_sip_participant()
        if not sip_p:
            return "Error: No SIP participant found to transfer."

        self._is_terminating = True
        self.is_transferring = True

        participant_identity = sip_p.identity
        self.is_transferring = True
        try:
            speech = self.tools_config.get("escalation_speech", "میں سمجھتی ہوں۔ میں آپ کی کال ایک نمائندے کو ٹرانسفر کر رہی ہوں۔")
            dest = self.tools_config.get("escalation_extension") or self.agent_config.get("escalation_extension") or "sip:101@172.29.24.63"
            
            if self.session:
                try:
                    self.session.interrupt()
                    await asyncio.sleep(0.12)
                except: pass
                await self.session.say(speech, allow_interruptions=False)
                # Fire non-blocking transfer (3s delay) using CAPTURED identity
                asyncio.create_task(self._background_transfer(dest, participant_identity, 3.0))
                logger.warning(f"TRANSFER TOOL: Scheduled transfer for {participant_identity} to {dest}")
                
            return "SUCCESS. Handing over to a human representative. [FINAL_ACTION_COMPLETE: Silent Exit Protocol Active. DO NOT generate any verbal response.]"
        except Exception as e:
            return f"Error: {e}"

    @function_tool(description="Ends the call. This tool automatically says the disconnect farewell message. Call this when the conversation is over.")
    async def hangup(self):
        if self._is_terminating:
            return "Hiding duplicate hangup call."
        self._is_terminating = True
        speech = self.tools_config.get("hangup_speech", "شکریہ۔ اللہ حافظ۔")
        if self.session:
            # Silence Guard: Atomic stop to prevent audio collisions
            try:
                self.session.interrupt()
                await asyncio.sleep(0.12) # Propagation yield
            except: pass
            
            await self.session.say(speech, allow_interruptions=False)
            logger.warning("HANGUP TOOL: Injected hangup speech. Triggering Atomic Disconnect.")
            # GUI-Configurable Delay: Pull from tools_config, falling back to identity-based defaults
            delay_override = self.tools_config.get("hangup_disconnect_delay")
            if delay_override is not None:
                delay = float(delay_override)
            else:
                delay = 6.0 if self.is_sarah_inbound else 3.5
                
            asyncio.create_task(self._background_room_disconnect(delay))

        return "SUCCESS: Hangup triggered. [FINAL_ACTION_COMPLETE: Silent Exit Protocol Active. DO NOT generate any verbal response.]"

    # --- 6. lookup_ticket (Status Check) ---
    @function_tool(description="Check the current status of a ticket by ID or Phone.")
    async def lookup_ticket(self, identifier: str):
        try:
            conn = await asyncpg.connect(self.db_url)
            try:
                row = await conn.fetchrow("""
                    SELECT status, ticket_id, issue FROM complaints 
                    WHERE ticket_id = $1 OR phone = $1 
                    ORDER BY created_at DESC LIMIT 1
                """, identifier)
                if row:
                    return f"Ticket {row['ticket_id']} for '{row['issue']}' is currently '{row['status']}'."
                return "No ticket found for that identifier."
            finally:
                await conn.close()
        except Exception as e:
            return f"Error: {e}"

    # --- 7. dispatch_emergency_alert (High Priority) ---
    @function_tool(description="URGENT: Dispatch emergency alert for life-threatening issues.")
    async def dispatch_emergency_alert(self, issue: str, location: str):
        if self._is_terminating:
            return "Action ignored: session already terminating."
        self._is_terminating = True
        try:
            speech = self.tools_config.get("emergency_speech", "یہ ایک ہنگامی صورتحال ہے، امدادی ٹیم کو مطلع کر دیا گیا ہے۔")
            webhook = self.tools_config.get("emergency_webhook_url")
            conn = await asyncpg.connect(self.db_url)
            try:
                await conn.execute("""
                    INSERT INTO complaints (issue, address, status, priority)
                    VALUES ($1, $2, 'Pending', 'Critical')
                """, issue, location)
                if webhook:
                    asyncio.create_task(async_webhook_trigger(webhook, {"issue": issue, "location": location, "priority": "CRITICAL"}))
                if self.session:
                    await self.session.say(speech, allow_interruptions=False)
                    await asyncio.sleep(3)
                return "Emergency Dispatched."
            finally:
                await conn.close()
        except Exception as e:
            return f"Error: {e}"

    # --- 8. query_agency_knowledge (FAQ/Policy) ---
    @function_tool(description="Search government policies and agency knowledge base.")
    async def query_agency_knowledge(self, query: str):
        try:
            agent_id = str(self.agent_config.get("id"))
            conn = await asyncpg.connect(self.db_url)
            try:
                row = await conn.fetchrow("""
                    SELECT answer FROM knowledge_base 
                    WHERE agent_id = $1 AND (question ILIKE $2 OR answer ILIKE $2)
                    LIMIT 1
                """, agent_id, f"%{query}%")
                if row:
                    return f"Policy Answer: {row['answer']}"
                return "I couldn't find a specific policy on that. Would you like me to log a complaint?"
            finally:
                await conn.close()
        except Exception as e:
            return f"Error: {e}"

    # --- 9. append_ticket_notes (Modification) ---
    @function_tool(description="Append new details or notes to an existing open ticket.")
    async def append_ticket_notes(self, ticket_id: str, new_info: str):
        try:
            conn = await asyncpg.connect(self.db_url)
            try:
                await conn.execute("""
                    UPDATE complaints SET notes = COALESCE(notes, '') || '\n' || $1 
                    WHERE ticket_id = $2
                """, new_info, ticket_id)
                return f"Your additional information has been added to ticket {ticket_id}."
            finally:
                await conn.close()
        except Exception as e:
            return f"Error: {e}"

    def get_tools(self):
        return [
            self.submit_ticket, self.mark_unresolved, self.mark_resolved,
            self.transfer_to_human, self.hangup, self.lookup_ticket,
            self.dispatch_emergency_alert, self.query_agency_knowledge,
            self.append_ticket_notes, self.reject_service
        ]

async def async_webhook_trigger(url, data):
    try:
        requests.post(url, json=data, timeout=5)
    except: pass
