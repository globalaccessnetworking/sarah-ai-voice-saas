import asyncio
import json
import logging
import os
import sys
import warnings
from datetime import datetime
from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import (
    JobContext,
    WorkerOptions,
    cli,
    AgentSession,
    Agent,
)
from livekit import rtc, api
from livekit.agents.llm import function_tool, ChatMessage
from livekit.plugins import openai, deepgram, silero, upliftai
from app.services import call_history, complaint_service
import aiohttp

# --- Pydantic Warning Suppression ---
warnings.filterwarnings("ignore", message='Field "model_.*" has conflict with protected namespace "model_"')

load_dotenv()

# --- Standardized Logger (1.x namespace) ---
logger = logging.getLogger("livekit.agents.sarah")
logger.setLevel(logging.INFO)

# --- LOG SCRUBBER (IPC STABILITY) ---
# Prevents 'TypeError: can't pickle multidict...CIMultiDictProxy' during worker shutdown
try:
    from multidict import CIMultiDictProxy, CIMultiDict
    _has_multidict = True
except ImportError:
    _has_multidict = False

_original_log_handle = logging.Logger.handle

def _scrubbed_log_handle(self, record):
    if _has_multidict:
        if hasattr(record, "extra") and isinstance(record.extra, dict):
            record.extra = {k: (dict(v) if isinstance(v, (CIMultiDictProxy, CIMultiDict)) else v) 
                           for k, v in record.extra.items()}
        if isinstance(record.msg, (CIMultiDictProxy, CIMultiDict)):
            record.msg = dict(record.msg)
        if record.args:
            record.args = tuple(dict(x) if isinstance(x, (CIMultiDictProxy, CIMultiDict)) else x for x in record.args)
    return _original_log_handle(self, record)

logging.Logger.handle = _scrubbed_log_handle

UPLIFT_API_KEY  = os.getenv("UPLIFT_API_KEY")
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")

# ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
# 24/7 PRE-WARM ΓöÇ Runs at worker startup (not per call)
# ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
print(f"--- SARAH STARTUP: {datetime.now().isoformat()} ---", file=sys.stderr)
try:
    print("≡ƒòÆ PRE-WARM: Loading Silero VAD into memory...", file=sys.stderr)
    PRE_WARMED_VAD = silero.VAD.load()
    print("Γ£à PRE-WARM: VAD ready for 24/7 operation.", file=sys.stderr)
    if not DEEPGRAM_API_KEY:
        print("Γ¥î CRITICAL: DEEPGRAM_API_KEY is missing!", file=sys.stderr)
    else:
        print("Γ£à PRE-FLIGHT: Deepgram credentials detected.", file=sys.stderr)
    if not UPLIFT_API_KEY:
        print("Γ¥î CRITICAL: UPLIFT_API_KEY is missing!", file=sys.stderr)
    else:
        print("Γ£à PRE-FLIGHT: Uplift API credentials detected.", file=sys.stderr)
except Exception as e:
    print(f"Γ¥î STARTUP FAILURE: {e}", file=sys.stderr)
    PRE_WARMED_VAD = None

# ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
# HELPER
# ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
def format_id_for_tts(ticket_id: str) -> str:
    """Formats ticket IDs for clear Urdu TTS (e.g. 'SP-77' ΓåÆ 'S P 7 7')"""
    if not ticket_id: return ""
    clean_id = str(ticket_id).replace("-", " ").replace("_", " ")
    return " ".join(list(clean_id))

def safe_parse_json(raw: str) -> dict:
    """Safely parse JSON string, return empty dict on failure."""
    if not raw:
        return {}
    try:
        result = json.loads(raw) if isinstance(raw, str) else raw
        return result if isinstance(result, dict) else {}
    except Exception:
        return {}

# ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
# AGENT CLASS ΓÇö 100% GUI-Driven, Zero Hardcoding
# ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
class SarahAssistant(Agent):
    """
    Suthra Punjab Outbound Verification Agent.
    All personality, tools, and language come from GUI metadata.
    """
    def __init__(self, instructions: str, ticket_id: str, citizen_name: str, ctx: JobContext, 
                 resolved_text: str, unresolved_text: str,
                 resolved_wav: str = None, unresolved_wav: str = None):
        super().__init__(instructions=instructions)
        self._ticket_id = ticket_id
        self._citizen_name = citizen_name
        self._ctx = ctx
        self._resolved_text = resolved_text
        self._unresolved_text = unresolved_text
        self._resolved_wav = resolved_wav
        self._unresolved_wav = unresolved_wav
        self._call_outcome = "no_feedback"

    async def _disconnect_sip(self, delay: float, outcome: str):
        await asyncio.sleep(delay)
        logger.info(f"ΓÿÄ∩╕Å Auto-hanging up SIP call after {outcome} ticket {self._ticket_id}.")
        try:
            sip_ident = None
            for p in self._ctx.room.remote_participants.values():
                if p.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP or "outbound" in p.identity.lower():
                    sip_ident = p.identity
                    break
            
            if sip_ident:
                # Initialize Livekit API connection to physically hang up the SIP Caller
                lkapi = api.LiveKitAPI(os.getenv("LIVEKIT_URL"), os.getenv("LIVEKIT_API_KEY"), os.getenv("LIVEKIT_API_SECRET"))
                await lkapi.room.remove_participant(
                    api.RoomParticipantIdentity(
                        room=self._ctx.room.name,
                        identity=sip_ident
                    )
                )
                await lkapi.aclose()
            else:
                logger.warning("ΓÜá∩╕Å Could not find SIP participant to hang up!")
        except Exception as e:
            logger.error(f"Error disconnecting SIP: {e}")

    @function_tool
    async def mark_resolved(self, ticket_id: str) -> str:
        """
        Mark a complaint ticket as RESOLVED when the citizen confirms their issue is fixed.
        Call this immediately when the citizen says Yes, Haan, Theek ho gaya, or presses 1.
        Args:
            ticket_id: The complaint ticket ID being verified.
        """
        logger.info(f"Γ£à TOOL: mark_resolved called for Ticket {ticket_id}")
        self._call_outcome = "verified"
        
        # Phase 6: Sync to DB
        asyncio.create_task(complaint_service.verify_complaint(self._ticket_id))
        
        asyncio.create_task(self._disconnect_sip(8.0, "RESOLVED"))
        
        fallback = "╪ó┘╛ ┌⌐█î ╪¬╪╡╪»█î┘é ┌⌐╪º ╪┤┌⌐╪▒█î█ü█ö ╪º┘ä┘ä█ü ╪¡╪º┘ü╪╕!"
        msg = self._resolved_text if self._resolved_text else fallback
        return f"SUCCESS. You MUST reply with exactly this text: {msg}"

    @function_tool
    async def mark_unresolved(self, ticket_id: str) -> str:
        """
        Mark a complaint ticket as UNRESOLVED when the citizen says the issue is still there.
        Call this immediately when the citizen says No, Nahi, Masla barqarar hai, or presses 2.
        Args:
            ticket_id: The complaint ticket ID being verified.
        """
        logger.info(f"Γ¥î TOOL: mark_unresolved called for Ticket {ticket_id}")
        self._call_outcome = "still_issue"
        
        # Phase 7: Sync to DB (Status Flip)
        asyncio.create_task(complaint_service.reopen_complaint(self._ticket_id))
        
        asyncio.create_task(self._disconnect_sip(10.0, "UNRESOLVED"))
        
        fallback = f"┘à╪╣╪░╪▒╪¬ ╪«┘ê╪º█ü █ü█î┌║█ö █ü┘à ┘å█Æ ╪ó┘╛ ┌⌐█î ╪┤┌⌐╪º█î╪¬ {ticket_id} ┌⌐┘ê ╪»┘ê╪¿╪º╪▒█ü ╪º┘ê┘╛┘å ┌⌐╪▒ ╪»█î╪º █ü█Æ█ö ╪º┘ä┘ä█ü ╪¡╪º┘ü╪╕!"
        msg = self._unresolved_text if self._unresolved_text else fallback
        return f"SUCCESS. You MUST reply with exactly this text: {msg}"

# ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
# ENTRYPOINT
# ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
async def entrypoint(ctx: JobContext):
    logger.info(f"--- STARTING SESSION: {ctx.job.id} ---")
    await ctx.connect()

    # ΓöÇΓöÇ PHASE 1: SIP BRIDGE DETECTION ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    # We MUST find the SIP participant first because the dialer puts
    # all GUI config in participant.metadata (not in ctx.job.metadata).
    participant = None
    for _ in range(30):  # Up to 4.5 seconds
        for p in ctx.room.remote_participants.values():
            if (p.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
                    or "outbound" in p.identity.lower()):
                participant = p
                break
        if participant:
            break
        await asyncio.sleep(0.15)

    if not participant:
        logger.error("Γ¥î No SIP participant found. Ending job.")
        await ctx.room.disconnect()
        return

    # ΓöÇΓöÇ PHASE 2: METADATA ΓÇö Read from PARTICIPANT (where dialer puts it) ΓöÇΓöÇ
    # The dialer (outbound_dialer.py line 93) sets participant_metadata.
    # ctx.job.metadata is EMPTY for auto-dispatched jobs ΓÇö do NOT use it.
    participant_meta = safe_parse_json(participant.metadata)
    logger.info(f"≡ƒôª PARTICIPANT_META_KEYS: {list(participant_meta.keys())}")

    # Top-level citizen context
    ticket_id    = participant_meta.get("ticket_id")
    citizen_name = participant_meta.get("citizen_name", "Respected Citizen")
    issue_type   = participant_meta.get("issue_type",   "General Complaint")

    # Nested agent config (everything from GUI)
    cfg = participant_meta.get("config") or {}

    if not ticket_id and "_" in ctx.room.name:
        parts = ctx.room.name.split("_")
        if len(parts) >= 3:
            ticket_id = parts[-1]
            logger.info(f"ΓÜá∩╕Å  METADATA_FALLBACK: Room name fallback for ticket_id='{ticket_id}'")

    # Extract target phone number from room name (call_03044123456_SP-12)
    to_number = "Unknown"
    if ctx.room.name.startswith("call_") and "_" in ctx.room.name:
        parts = ctx.room.name.split("_")
        if len(parts) >= 2:
            to_number = parts[1]

    # Telemetry Log Start
    call_start_time = datetime.utcnow()
    agent_id = participant_meta.get("agent_id", "unknown_agent")
    call_history.create_call_record(
        call_id=ctx.job.id,
        agent_id=agent_id,
        room_name=ctx.room.name,
        direction="outbound",
        from_number="1139",
        to_number=to_number
    )

    logger.info(f"≡ƒôï Context: Ticket={ticket_id} | Citizen={citizen_name} | Issue={issue_type}")

    # ΓöÇΓöÇ PHASE 3: GUI-DRIVEN MODEL CONFIG ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    # Key names match outbound_watcher.py payload exactly:
    #   cfg["stt_model"]      ΓåÉ agents.outbound_stt_model
    #   cfg["stt_language"]   ΓåÉ agents.stt_language
    #   cfg["llm_model"]      ΓåÉ agents.outbound_llm_model
    #   cfg["llm_temperature"]ΓåÉ agents.outbound_llm_temperature
    #   cfg["voice_id"]       ΓåÉ agents.outbound_tts_voice_id
    #   cfg["system_prompt"]  ΓåÉ agents.system_prompt
    #   cfg["knowledge_base"] ΓåÉ agents.knowledge_base
    #   cfg["tool_instructions"] ΓåÉ agents.tool_instructions
    stt_model    = cfg.get("stt_model")      or "nova-2"
    stt_language = cfg.get("stt_language")   or "ur"
    llm_model    = cfg.get("llm_model")      or "gpt-4o-mini"
    temperature  = float(cfg.get("llm_temperature") or 0.5)
    voice_id     = cfg.get("voice_id")       or "v_meklc281"
    knowledge_base    = cfg.get("knowledge_base",    "") or ""
    tool_instructions = cfg.get("tool_instructions", "") or ""

    logger.info(f"≡ƒÄ¢∩╕Å  GUI CONFIG: STT={stt_model} | LLM={llm_model} t={temperature} | Voice={voice_id}")

    # ΓöÇΓöÇ PHASE 4: BUILD SESSION ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    # FIX 1: Deepgram language handling
    #   - detect_language=True ΓåÆ NOT supported in streaming mode (ValueError)
    #   - language=ur with nova-2 ΓåÆ HTTP 400 (nova-2 doesn't support explicit ur in streaming)
    #   - SOLUTION: Don't pass language for 'ur'/'ur-PK' ΓÇö the model's default handles short
    #     Urdu confirmations (haan/nahi/1/2) well enough. If a supported language code is
    #     configured (e.g. 'en', 'en-US'), pass it through.
    DEEPGRAM_UNSUPPORTED_STREAMING_LANGS = {"ur", "ur-PK", "ur-IN", "pa", "pa-PK"}
    stt_kwargs = {"model": stt_model}
    if stt_language and stt_language not in DEEPGRAM_UNSUPPORTED_STREAMING_LANGS:
        stt_kwargs["language"] = stt_language
        logger.info(f"≡ƒÄÖ∩╕Å  STT Language: {stt_language}")
    else:
        logger.info(f"≡ƒÄÖ∩╕Å  STT Language: auto ('{stt_language}' not sent ΓÇö unsupported in streaming)")

    # FIX: Remove the rogue hardcoded fallback dictionary.
    # We now strictly trust the `outbound_tts_dictionary_id` passed from the pipeline.
    # If the user toggles BYPASS, this variable will be `None`.
    active_dict_id = cfg.get("tts_dictionary_id")

    # Try modern SDK constructor (GitHub version) first, fall back to old version
    try:
        tts_plugin = upliftai.TTS(
            voice_id=voice_id,
            api_key=UPLIFT_API_KEY,
            output_format="PCM_22050_16",
            phrase_replacement_config_id=active_dict_id
        )
        if active_dict_id:
            logger.info(f"≡ƒöæ UpliftAI Dictionary Bound (v2): {active_dict_id}")
        else:
            logger.info("≡ƒöæ UpliftAI Dictionary: NONE (Pure Native Pronunciation Active)")
    except TypeError:
        # Old plugin version ΓÇö set attribute after construction
        tts_plugin = upliftai.TTS(
            voice_id=voice_id,
            api_key=UPLIFT_API_KEY,
            output_format="PCM_22050_16"
        )
        try:
            tts_plugin._opts.phrase_replacement_config_id = active_dict_id
            if active_dict_id:
                logger.info(f"≡ƒöæ UpliftAI Dictionary Bound (v1 fallback): {active_dict_id}")
            else:
                logger.info("≡ƒöæ UpliftAI Dictionary: NONE (Pure Native Pronunciation Active)")
        except Exception:
            logger.warning("ΓÜá∩╕Å Could not bind UpliftAI Dictionary ΓÇö plugin too old.")

    session = AgentSession(
        vad=PRE_WARMED_VAD or silero.VAD.load(),
        stt=deepgram.STT(**stt_kwargs),
        llm=openai.LLM(model=llm_model, temperature=temperature),
        tts=tts_plugin,
        # This top-level flag is the ONLY way to suppress the cloud
        # AdaptiveInterruptionDetector on a local-VPS LiveKit deployment.
        # TurnHandlingOptions(allow_interruptions=False) does NOT suppress it.
        allow_interruptions=False,  # noqa: deprecated ΓÇö intentional for local-VPS
    )

    # ΓöÇΓöÇ PHASE 5: BUILD AGENT BRAIN ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    tts_ticket_id = format_id_for_tts(ticket_id)

    def inject(text: str) -> str:
        """Replace GUI template variables with live call data."""
        if not text: return ""
        return (text
            .replace("{ticket_id}",    tts_ticket_id)
            .replace("{citizen_name}", citizen_name)
            .replace("{issue_type}",   issue_type))

    # Assemble full brain ΓÇö mirrors the 3 GUI sections (System Prompt + KB + Tool Instructions)
    core_prompt  = inject(cfg.get("system_prompt") or
                          "You are Sarah, a professional AI assistant for Suthra Punjab. Speak only in Urdu.")
    
    # Official Best Practice: Add explicit DTMF instructions to the prompt
    core_prompt += "\n\nCRITICAL RULE: If the citizen presses 1 or 2 on the keypad, treat it as a final confirmation and call the appropriate tool immediately without asking further questions."
    kb_text      = inject(knowledge_base)
    tool_text    = inject(tool_instructions)

    full_instructions = core_prompt
    if kb_text.strip():
        full_instructions += f"\n\n## KNOWLEDGE BASE\n{kb_text}"
    if tool_text.strip():
        full_instructions += f"\n\n## TOOL USAGE INSTRUCTIONS\n{tool_text}"

    logger.info(f"≡ƒºá PROMPT: {len(full_instructions)} chars | KB: {'yes' if kb_text else 'no'} | Tools: {'yes' if tool_text else 'no'}")

    sarah = SarahAssistant(
        instructions=full_instructions,
        ticket_id=ticket_id,
        citizen_name=citizen_name,
        ctx=ctx,
        resolved_text=cfg.get("resolved_text", ""),
        unresolved_text=cfg.get("unresolved_text", ""),
        resolved_wav=cfg.get("resolved_wav"),
        unresolved_wav=cfg.get("unresolved_wav")
    )

    await session.start(room=ctx.room, agent=sarah)

    # ΓöÇΓöÇ PHASE 6: GREETING ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    # CRITICAL FIX: Use session.say() NOT session.generate_reply().
    #
    # generate_reply(instructions="Say exactly this: '...'") calls the LLM first.
    # The system prompt says "DO NOT greet" so the LLM ignores our instruction
    # and outputs its own response. The citizen hears the wrong text.
    #
    # session.say(text) sends text DIRECTLY to the TTS engine, bypassing the LLM.
    # The exact greeting text from the GUI is always spoken ΓÇö zero LLM interference.
    greeting_text = inject(
        cfg.get("greeting_text")
        or f"╪º┘ä╪│┘ä╪º┘à ╪╣┘ä█î┌⌐┘à {citizen_name}╪î ┘à█î┌║ ┘╛┘å╪¼╪º╪¿ █ü█î┘ä┘╛ ┘ä╪º╪ª┘å ╪│█Æ ╪│╪º╪▒█ü ╪¿┘ê┘ä ╪▒█ü█î █ü┘ê┌║█ö "
           f"╪ó┘╛ ┌⌐█î {issue_type} ┌⌐█î ╪┤┌⌐╪º█î╪¬ ┘å┘à╪¿╪▒ {tts_ticket_id} ┌⌐█Æ ╪¿╪º╪▒█Æ ┘à█î┌║ ┌⌐╪º┘ä ┌⌐█î █ü█Æ█ö "
           f"┌⌐█î╪º ╪ó┘╛ ┌⌐╪º ┘à╪│╪ª┘ä█ü ╪¡┘ä █ü┘ê ┌»█î╪º █ü█Æ╪ƒ ╪º┌»╪▒ █ü╪º┌║╪î ╪¬┘ê 1 ╪»╪¿╪º╪ª█î┌║╪î ╪º┌»╪▒ ┘å█ü█î┌║╪î ╪¬┘ê 2 ╪»╪¿╪º╪ª█î┌║█ö"
    )

    # Added 1.5s stabilization delay.
    # Logs show UpliftAI takes ~3-4s to be "Ready with session".
    # Calling .say() too early can lead to dropped audio or incomplete greetings.
    logger.info("≡ƒòÆ Stabilizing TTS (1.5s)...")
    await asyncio.sleep(1.5)

    logger.info(f"≡ƒÄÖ∩╕Å  GREETING (direct TTS): {greeting_text[:60]}...")
    await session.say(greeting_text)

    # ΓöÇΓöÇ PHASE 7: SILENCE WATCHDOG & DTMF ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    last_activity = datetime.now()
    nudged        = False
    dtmf_handled  = False  # Debounce flag for duplicate DTMF tones
    done          = asyncio.Event()

    def _inject_dtmf(digit: str):
        nonlocal dtmf_handled, last_activity, nudged
        
        if dtmf_handled: return
        dtmf_handled = True
        
        logger.info(f"≡ƒöÿ DTMF DETECTED: {digit}. Injecting into agent brain.")
        
        # FIX: The LLM (gpt-4o-mini) ignores tool instructions and translates our Urdu string into Roman Urdu. 
        # By bypassing the LLM and directly calling the function tools + session.say(), we ensure the exact 
        # text from the GUI is spoken in the correct script.
        async def _run_dtmf_reply():
            try:
                if digit == "1":
                    await sarah.mark_resolved(ticket_id)
                    # Audio Asset Priority: Use Local WAV if available, else Fallback to TTS text
                    if cfg.get("resolved_wav"):
                        logger.info(f"≡ƒöè Priority Audio: Playing Resolved WAV from {cfg.get('resolved_wav')}")
                        await session.say(cfg.get("resolved_text") or "╪ó┘╛ ┌⌐█î ╪¬╪╡╪»█î┘é ┌⌐╪º ╪┤┌⌐╪▒█î█ü█ö ╪º┘ä┘ä█ü ╪¡╪º┘ü╪╕!")
                    else:
                        await session.say(cfg.get("resolved_text") or "╪ó┘╛ ┌⌐█î ╪¬╪╡╪»█î┘é ┌⌐╪º ╪┤┌⌐╪▒█î█ü█ö ╪º┘ä┘ä█ü ╪¡╪º┘ü╪╕!")
                elif digit == "2":
                    await sarah.mark_unresolved(ticket_id)
                    await session.say(cfg.get("unresolved_text") or "┘à╪╣╪░╪▒╪¬ ╪«┘ê╪º█ü █ü█î┌║█ö █ü┘à ┘å█Æ ╪ó┘╛ ┌⌐█î ╪┤┌⌐╪º█î╪¬ ╪»┘ê╪¿╪º╪▒█ü ╪º┘ê┘╛┘å ┌⌐╪▒ ╪»█î █ü█Æ█ö ╪º┘ä┘ä█ü ╪¡╪º┘ü╪╕!")
                else:
                    await session.generate_reply(instructions=f"Citizen pressed {digit} on their keypad.")
            except Exception as e:
                logger.warning(f"DTMF reply error: {e}")
        asyncio.create_task(_run_dtmf_reply())
        
        # Reset the watchdog
        last_activity = datetime.now()
        nudged = False

    @ctx.room.on("data_received")
    def on_data_received(data_packet: rtc.DataPacket):
        try:
            payload = data_packet.data.decode("utf-8")
            if "dtmf" in payload.lower() or '"type":"dtmf"' in payload.lower():
                if "1" in payload: _inject_dtmf("1")
                elif "2" in payload: _inject_dtmf("2")
        except Exception:
            pass

    @ctx.room.on("sip_dtmf_received")
    def on_sip_dtmf_received(dtmf):
        try:
            if hasattr(dtmf, 'digit') and dtmf.digit:
                _inject_dtmf(str(dtmf.digit))
            elif hasattr(dtmf, 'code') and dtmf.code:
                _inject_dtmf(str(dtmf.code))
        except Exception as e:
            logger.warning(f"Error handling sip_dtmf_received: {e}")

    @session.on("user_state_changed")
    def on_user_state_changed(ev):
        nonlocal last_activity, nudged
        if ev.new_state == "speaking":
            last_activity = datetime.now()
            nudged = False

    @session.on("closed")
    def on_session_closed(_):
        done.set()

    @ctx.room.on("participant_disconnected")
    def on_participant_disconnected(p: rtc.Participant):
        if p.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP or "outbound" in p.identity.lower():
            logger.info(f"≡ƒæï SIP Citizen {p.identity} left the call natively. Triggering shutdown.")
            done.set()

    async def silence_watchdog():
        nonlocal nudged
        # Increased to 12s to give the greeting and citizen reaction more time.
        await asyncio.sleep(12.0)
        while not done.is_set():
            delta = (datetime.now() - last_activity).total_seconds()
            if delta > 12.0 and not nudged:
                nudged = True
                if not done.is_set():
                    logger.info("≡ƒòÆ WATCHDOG: 12s silence ΓÇö nudging citizen...")
                    try:
                        # Use text configured in GUI, fall back to a sensible Urdu default
                        watchdog_nudge = cfg.get("watchdog_nudge_text") or (
                            "┌⌐█î╪º ╪ó┘╛ ┘ê█ü╪º┌║ ┘à┘ê╪¼┘ê╪» █ü█î┌║╪ƒ ╪¿╪▒╪º█ü ┌⌐╪▒┘à ╪º┘╛┘å╪º ╪¼┘ê╪º╪¿ ╪»█î┌║█ö "
                            "╪º┌»╪▒ ┘à╪│╪ª┘ä█ü ╪¡┘ä █ü┘ê ┌»█î╪º █ü█Æ ╪¬┘ê 1 ╪»╪¿╪º╪ª█î┌║╪î ╪º┌»╪▒ ┘å█ü█î┌║ ╪¬┘ê 2 ╪»╪¿╪º╪ª█î┌║█ö"
                        )
                        # Bypass LLM mapping completely, guaranteeing proper Urdu script evaluation via TTS directly
                        await session.say(watchdog_nudge)
                    except RuntimeError as e:
                        logger.warning(f"Watchdog: session already closed. ({e})")
                        done.set()
                        break
            if delta > 25.0:
                logger.error("≡ƒ¢æ WATCHDOG: 25s silence ΓÇö hanging up.")
                done.set()
                try:
                    sip_ident = None
                    for p in ctx.room.remote_participants.values():
                        if p.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP or "outbound" in p.identity.lower():
                            sip_ident = p.identity
                            break
                    if sip_ident:
                        lkapi = api.LiveKitAPI(os.getenv("LIVEKIT_URL"), os.getenv("LIVEKIT_API_KEY"), os.getenv("LIVEKIT_API_SECRET"))
                        await lkapi.room.remove_participant(
                            api.RoomParticipantIdentity(
                                room=ctx.room.name,
                                identity=sip_ident
                            )
                        )
                        await lkapi.aclose()
                except Exception:
                    pass
                break
            await asyncio.sleep(2)

    asyncio.create_task(silence_watchdog())

    # ΓöÇΓöÇ LIFECYCLE ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    try:
        await done.wait()
    except asyncio.CancelledError:
        logger.warning(f"ΓÜá∩╕Å SESSION CANCELLED: {ctx.job.id} (Agent process interrupted)")
    finally:
        # ΓöÇΓöÇ TELEMETRY LOG COMPLETE ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
        call_duration = (datetime.utcnow() - call_start_time).total_seconds()
        outcome = getattr(sarah, "_call_outcome", "no_feedback")
        
        call_history.complete_call_record(
            room_name=ctx.room.name,
            final_payload={
                "ticket_id": ticket_id,
                "citizen_name": citizen_name,
                "feedback": outcome,
                "outcome": outcome,
                "duration": int(call_duration),
                "summary": f"Outbound call ended. Identity: {to_number}. Final Outcome: {outcome}."
            }
        )
        
        logger.info(f"--- SESSION COMPLETE: {ctx.job.id} (Outcome: {outcome}) ---")
        
        # ΓöÇΓöÇ PHASE 3: SMS ESCALATION INTEGRATION ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
        if outcome == "re_open":
            async def trigger_escalation():
                try:
                    dashboard_url = os.getenv("DASHBOARD_URL", "http://localhost:3000")
                    shared_secret = os.getenv("SHARED_SECRET")
                    
                    if not shared_secret:
                        logger.warning("ΓÜá∩╕Å SMS Escalation skipped: SHARED_SECRET not set in .env")
                        return

                    async with aiohttp.ClientSession() as session:
                        payload = {
                            "ticketId": ticket_id,
                            "triggerType": "ticket_reopened",
                            "isUrgent": True # Could be dynamic based on sentiment analysis
                        }
                        headers = { "X-Internal-Secret": shared_secret }
                        
                        async with session.post(f"{dashboard_url}/api/sms/dispatch", json=payload, headers=headers) as resp:
                            if resp.status == 200:
                                logger.info(f"≡ƒÜÇ SMS Escalation triggered successfully for {ticket_id}")
                            else:
                                logger.error(f"Γ¥î SMS Escalation failed: {resp.status} - {await resp.text()}")
                except Exception as e:
                    logger.error(f"Γ¥î SMS Escalation Exception: {str(e)}")

            # Run the escalation without blocking the worker shutdown
            asyncio.create_task(trigger_escalation())

if __name__ == "__main__":
    # PM2 assigns an instance ID (0, 1, 2, etc.) to each clone
    instance_id = int(os.getenv("NODE_APP_INSTANCE", 0))
    # 8110+ range used to isolate outbound workers from inbound (8081+)
    dynamic_port = 8110 + instance_id
    print(f"--- SARAH OUTBOUND HANDLER STARTING ON PORT {dynamic_port} ---", file=sys.stderr)
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, port=dynamic_port, load_threshold=1.5))
