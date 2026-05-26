#!/usr/bin/env python3
"""
LiveKit Agents Worker Script

This script runs LiveKit AI agents based on configurations stored in Redis.
"""

import asyncio
import json
import logging
import os
import sys
import time
from datetime import datetime
from pathlib import Path
import uuid
from dotenv import load_dotenv
import hashlib
import aiohttp
import wave
import io
import av
from livekit.plugins import silero, turn_detector

# V11 DIAGNOSTIC: Module Inspection for FunctionContext AttributeError (Global Scope)
try:
    import livekit.agents
    from livekit.agents import llm
except Exception:
    pass

# Pre-warm function for instant answering
# Pre-warm function for instant answering (Legacy placeholder - V23 uses main process pre_ignite)
def legacy_prewarm(proc):
    pass

# Global High-Speed Cache for Telephony Greetings (0ms Latency)
_GREETING_CACHE = {}

# Load environment variables
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(env_path, override=True)

import logging
boot_logger = logging.getLogger("SarahAgentBoot")
boot_logger.info(f"[ENV] ai-worker .env loaded path={env_path} exists={env_path.exists()}")
boot_logger.info(f"[ENV] DEEPGRAM_API_KEY present={bool(os.getenv('DEEPGRAM_API_KEY'))}")
boot_logger.info(f"[ENV] DEEPGRAM_API_KEY length={len(os.getenv('DEEPGRAM_API_KEY') or '')}")
boot_logger.info(f"[ENV] OUTBOUND_GREETING_MODE={os.getenv('OUTBOUND_GREETING_MODE')}")

worker_dir = Path(__file__).resolve().parent
project_root = worker_dir.parent
# Add current directory and project root to path
# Force current directory (local mocks) to the very top
sys.path.insert(0, str(Path(__file__).parent))
sys.path.append(str(project_root))

# Import config
from app.config import RECORDING_PATH


# Import Redis agent storage
try:
    from app.services import agent_storage
except ImportError as e:
    print(f"Warning: Redis agent storage not available: {e}")
    agent_storage = None

# Import call history service
try:
    from app.services import call_history
    from app.services import campaign_service
except ImportError as e:
    print(f"Warning: Call history service not available: {e}")
    call_history = None
    campaign_service = None

# Import call summary service for auto-generation
try:
    from app.services import call_summary_service
except ImportError as e:
    print(f"Warning: Call summary service not available: {e}")
    call_summary_service = None

# Import tool manager and webhook tools
try:
    from app.services import tool_manager, webhook_tools
    from tools.webhook import WebhookTool
except ImportError as e:
    print(f"Warning: Tool services not available: {e}")
    tool_manager = None
    webhook_tools = None
    WebhookTool = None

# Import MCP server service and tool adapter
try:
    from app.services import mcp_servers as mcp_service
    from tools.mcp_tool import MCPTool
except ImportError as e:
    print(f"Warning: MCP services not available: {e}")
    mcp_service = None
    MCPTool = None

# Import Sovereign Agentic Tool Suite
try:
    from tools.agentic_suite import SovereignToolProvider
except ImportError as e:
    print(f"Warning: Sovereign Agentic Suite not available: {e}")
    SovereignToolProvider = None

# Import handoff manager
try:
    from app.services import handoff_manager
except ImportError as e:
    print(f"Warning: Handoff manager not available: {e}")
    handoff_manager = None

# Import real-time metrics service
try:
    from app.services import realtime_metrics
except ImportError as e:
    print(f"Warning: Real-time metrics service not available: {e}")
    realtime_metrics = None

# Import Core SaaS Brain modules
try:
    from app.utils.prompt_parser import parse_context_variables
    from app.services.tools import tool_registry
    from app.services.analytics import process_post_call_analytics
    from app.services.mcp_client import MCPClientManager
    from app.services.config_service import config_service
    from app.services.memory import get_memory_prompt
    from app.services.outbound_dialer import OutboundDialer
    from app.services.agent_storage import get_agent_config_by_id_or_slug
except ImportError as e:
    print(f"Warning: Core SaaS Brain modules not available: {e}")
    parse_context_variables = lambda x, y: x # No-op fallback
    process_post_call_analytics = None
    tool_registry = None
    dynamic_tool_registry = None
    MCPClientManager = None
# --- MASTER REDIS BYPASS (ULTIMATE VERSION) ---

# --- CLOUD TURN DETECTOR BYPASS ---
# Global flag to ensure dialer only starts once per worker process
_dialer_started = False

# Forces native VAD detection completely in agent configuration.
import os
original_get_api_key = config_service.get_api_key

# --- LOG SCRUBBER (IPC STABILITY) ---
import logging
try:
    from multidict import CIMultiDictProxy, CIMultiDict
    _has_multidict = True
except ImportError:
    _has_multidict = False

_original_log_handle = logging.Logger.handle

def _scrubbed_log_handle(self, record):
    """
    Monkey-patch for logging.Logger.handle to sanitize 'extra' and 'args' 
    before they are pickled/sent via IPC queue.
    """
    if _has_multidict:
        # 1. Sanitize 'extra'
        if hasattr(record, "extra") and isinstance(record.extra, dict):
            new_extra = {}
            for k, v in record.extra.items():
                if isinstance(v, (CIMultiDictProxy, CIMultiDict)):
                    new_extra[k] = dict(v)
                else:
                    new_extra[k] = v
            record.extra = new_extra
        
        # 2. Sanitize 'msg' and 'args'
        if isinstance(record.msg, (CIMultiDictProxy, CIMultiDict)):
            record.msg = dict(record.msg)
        
        if record.args:
            new_args = []
            for x in record.args:
                if isinstance(x, (CIMultiDictProxy, CIMultiDict)):
                    new_args.append(dict(x))
                else:
                    new_args.append(x)
            record.args = tuple(new_args)
        
    return _original_log_handle(self, record)

logging.Logger.handle = _scrubbed_log_handle
# ------------------------------------------

def fallback_get_api_key(provider_name):
    # Explicit mapping for providers with unique naming conventions
    env_map = {
        "deepgram": "DEEPGRAM_API_KEY",
        "openai": "OPENAI_API_KEY",
        "upliftai": "UPLIFT_API_KEY",
        "cartesia": "CARTESIA_API_KEY",
        "anthropic": "ANTHROPIC_API_KEY",
        "groq": "GROQ_API_KEY",
        "cerebras": "CEREBRAS_API_KEY",
        "google": "GOOGLE_API_KEY",
        "elevenlabs": "ELEVENLABS_API_KEY",
        "deepseek": "DEEPSEEK_API_KEY",
        "azure": "AZURE_OPENAI_API_KEY",
        "aws": "AWS_SECRET_ACCESS_KEY"
    }
    
    # Standardize the name to lowercase for looking up in our map
    provider_key = provider_name.lower() if provider_name else ""
    
    # 1. Get the variable name from our map, or create a generic one (e.g. "mistral" -> "MISTRAL_API_KEY")
    env_var = env_map.get(provider_key, f"{provider_name.upper()}_API_KEY" if provider_name else "")
    
    # 2. Try the Dashboard/Redis FIRST (Standard behavior)
    api_key = original_get_api_key(provider_name)
    
    # 3. Fallback to .env if Dashboard returned nothing and we have an env_var
    if not api_key and env_var:
        api_key = os.environ.get(env_var)
        if api_key:
            logger.info(f"🔑 Redis bypass: Loaded {provider_name} key from .env ({env_var})")
            
    return api_key

# Overwrite the engine's config service
config_service.get_api_key = fallback_get_api_key
# ----------------------------------------------
# Import threading for event listener
import threading
from concurrent.futures import ThreadPoolExecutor
from typing import Callable, Dict, Any, Optional

# Bounded pool for background summary generation — prevents thread explosion on busy servers
_summary_executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="summary")

_shared_http_session: Optional[aiohttp.ClientSession] = None

async def get_http_session() -> aiohttp.ClientSession:
    global _shared_http_session
    if _shared_http_session is None or _shared_http_session.closed:
        _shared_http_session = aiohttp.ClientSession()
    return _shared_http_session

from app.services.personalization import render_template, build_lead_context, normalize_lead_data

# Import LiveKit components
try:
    from livekit import agents, rtc
    from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli, function_tool, RunContext, JobRequest, ConversationItemAddedEvent
    from livekit.agents import voice, llm
    from livekit.agents.llm import ChatContext, ChatMessage
except ImportError as e:
    print(f"Error: Missing required LiveKit package: {e}")
    print("\nPlease install required packages:")
    print("  pip install livekit-agents livekit-plugins-openai livekit-plugins-deepgram livekit-plugins-cartesia livekit-plugins-silero livekit-plugins-google")
    sys.exit(1)

# Enhance Vertex AI WebSocket error logging — monkey-patch InvalidStatus.__str__
# to include the HTTP response body, which reveals the actual reason for 400 errors
try:
    import websockets.exceptions
    _original_invalidstatus_str = websockets.exceptions.InvalidStatus.__str__
    def _enhanced_invalidstatus_str(self):
        base = _original_invalidstatus_str(self)
        try:
            if hasattr(self, 'response') and self.response:
                body = getattr(self.response, 'body', None)
                if body:
                    body_text = body.decode('utf-8', errors='replace') if isinstance(body, bytes) else str(body)
                    return f"{base} | Response body: {body_text[:500]}"
                headers = getattr(self.response, 'headers', None)
                if headers:
                    return f"{base} | Response headers: {dict(headers)}"
        except Exception:
            pass
        return base
    websockets.exceptions.InvalidStatus.__str__ = _enhanced_invalidstatus_str
except ImportError:
    pass  # websockets not installed; skip enhancement

# Configuration
logger = logging.getLogger("voice-agent")


# =============================================================================
# CALL SESSION REGISTRY (for External Event Injection)
# =============================================================================

def register_call_session(
    room_name: str,
    agent_id: str,
    phone_number: str = None,
    session_id: str = None
) -> None:
    """
    Register an active call session for external event routing.

    This allows external systems (n8n, Make.com, etc.) to inject events
    into active calls via the /api/calls/inject endpoint.

    Args:
        room_name: The LiveKit room name (required for event routing)
        agent_id: The agent ID handling this call
        phone_number: Caller phone number (for lookup)
        session_id: SIP session ID (for lookup)
    """
    if not agent_storage:
        return

    try:
        r = agent_storage.get_redis_client()
        if not r:
            return

        from datetime import datetime

        session_data = {
            "room_name": room_name,
            "agent_id": agent_id,
            "phone_number": phone_number or "",
            "session_id": session_id or "",
            "started_at": datetime.utcnow().isoformat(),
            "status": "active",
        }

        # Store by room name (primary key for event injection)
        r.set(
            f"active_call:{room_name}",
            json.dumps(session_data),
            ex=7200  # 2 hour expiry
        )

        # Also index by phone number for lookup
        if phone_number:
            r.set(
                f"active_call_phone:{phone_number}",
                room_name,
                ex=7200
            )

        logger.info(f"Registered call session: room={room_name}, phone={phone_number}")

    except Exception as e:
        logger.error(f"Failed to register call session: {e}")


def unregister_call_session(room_name: str, phone_number: str = None) -> None:
    """
    Unregister a call session when the call ends.

    Args:
        room_name: The LiveKit room name
        phone_number: Caller phone number (for cleanup)
    """
    if not agent_storage:
        return

    try:
        r = agent_storage.get_redis_client()
        if not r:
            return

        # Remove room key
        r.delete(f"active_call:{room_name}")

        # Remove phone index
        if phone_number:
            r.delete(f"active_call_phone:{phone_number}")

        # Also clean up event queue
        r.delete(f"call_events_queue:{room_name}")

        logger.info(f"Unregistered call session: room={room_name}")

    except Exception as e:
        logger.error(f"Failed to unregister call session: {e}")


class AgentEventListener:
    """
    Listens for external events injected via the /api/calls/inject endpoint
    and routes them to the appropriate agent session.

    Uses Redis PubSub to receive real-time event notifications.
    """

    def __init__(self, room_name: str, session, loop: asyncio.AbstractEventLoop):
        """
        Initialize the event listener.

        Args:
            room_name: The room to listen for events on
            session: The AgentSession instance to route events to
            loop: The asyncio event loop for async operations
        """
        self.room_name = room_name
        self.session = session
        self.loop = loop
        self._running = False
        self._pubsub = None
        self._thread = None

    def start(self) -> None:
        """Start listening for events in a background thread."""
        if self._running:
            return

        if not agent_storage:
            logger.warning("Agent storage not available, event listener disabled")
            return

        try:
            r = agent_storage.get_redis_client()
            if not r:
                return

            self._pubsub = r.pubsub()
            self._pubsub.subscribe(f"call_events:{self.room_name}")

            self._running = True
            self._thread = threading.Thread(target=self._listen_loop, daemon=True)
            self._thread.start()

            logger.info(f"Event listener started for room: {self.room_name}")

        except Exception as e:
            logger.error(f"Failed to start event listener: {e}")

    def stop(self) -> None:
        """Stop listening for events."""
        self._running = False

        if self._pubsub:
            try:
                self._pubsub.unsubscribe()
                self._pubsub.close()
            except Exception:
                pass
            self._pubsub = None

        logger.info(f"Event listener stopped for room: {self.room_name}")

    def _listen_loop(self) -> None:
        """Background thread that listens for PubSub messages."""
        while self._running:
            try:
                message = self._pubsub.get_message(timeout=1.0)
                if message and message.get("type") == "message":
                    data = message.get("data")
                    if isinstance(data, bytes):
                        data = data.decode("utf-8")

                    try:
                        event_info = json.loads(data)
                        event_id = event_info.get("event_id")
                        event_type = event_info.get("type")

                        if event_id:
                            # Fetch full event data and process
                            self._process_event(event_id, event_type)
                    except json.JSONDecodeError:
                        pass

            except (ValueError, AttributeError) as e:
                # Suppress "I/O operation on closed file" which manifests as ValueError/AttributeError during shutdown
                if "closed file" in str(e) or not self._running:
                    continue
                logger.error(f"Event listener error: {e}")
                time.sleep(1)
            except Exception as e:
                if self._running:
                    logger.error(f"Event listener error: {e}")
                    import time
                    time.sleep(1)  # Brief pause before retry

    def _process_event(self, event_id: str, event_type: str) -> None:
        """Process an event by fetching its data and executing it."""
        if not agent_storage:
            return

        try:
            r = agent_storage.get_redis_client()
            if not r:
                return

            # Fetch the full event
            event_key = f"call_event:{self.room_name}:{event_id}"
            event_data = r.get(event_key)

            if not event_data:
                logger.warning(f"Event not found or expired: {event_id}")
                return

            if isinstance(event_data, bytes):
                event_data = event_data.decode("utf-8")

            event = json.loads(event_data)
            payload = event.get("payload", {})

            logger.info(f"Processing event: {event_id} type={event_type}")

            # Update event status
            event["status"] = "processing"
            r.set(event_key, json.dumps(event), ex=60)

            # Schedule the async handler on the event loop
            asyncio.run_coroutine_threadsafe(
                self._handle_event(event_type, payload, event_id),
                self.loop
            )

        except Exception as e:
            logger.error(f"Failed to process event {event_id}: {e}")

    async def _handle_event(self, event_type: str, payload: dict, event_id: str) -> None:
        """Handle an event asynchronously."""
        try:
            if event_type == "speak":
                await self._handle_speak(payload)
            elif event_type == "end_call":
                await self._handle_end_call(payload)
            elif event_type == "transfer":
                await self._handle_transfer(payload)
            elif event_type == "send_dtmf":
                await self._handle_dtmf(payload)
            elif event_type == "mute":
                await self._handle_mute(True)
            elif event_type == "unmute":
                await self._handle_mute(False)
            elif event_type == "set_context":
                await self._handle_set_context(payload)
            else:
                logger.warning(f"Unknown event type: {event_type}")

            # Update event status to completed
            self._update_event_status(event_id, "completed")

        except Exception as e:
            logger.error(f"Error handling event {event_type}: {e}")
            self._update_event_status(event_id, "failed", str(e))

    def _update_event_status(self, event_id: str, status: str, error: str = None) -> None:
        """Update the status of an event in Redis."""
        try:
            r = agent_storage.get_redis_client()
            if not r:
                return

            event_key = f"call_event:{self.room_name}:{event_id}"
            event_data = r.get(event_key)

            if event_data:
                if isinstance(event_data, bytes):
                    event_data = event_data.decode("utf-8")
                event = json.loads(event_data)
                event["status"] = status
                if error:
                    event["error"] = error
                r.set(event_key, json.dumps(event), ex=60)

        except Exception as e:
            logger.debug(f"Failed to update event status: {e}")

    async def _handle_speak(self, payload: dict) -> None:
        """Make the agent speak a message."""
        message = payload.get("message", "")
        interrupt = payload.get("interrupt", False)

        if not message:
            return

        logger.info(f"External speak event: '{message[:50]}...' interrupt={interrupt}")

        try:
            if hasattr(self.session, 'say'):
                await self.session.say(message)
            else:
                logger.warning("Session does not have 'say' method")
        except Exception as e:
            logger.error(f"Failed to execute speak: {e}")

    async def _handle_end_call(self, payload: dict) -> None:
        """End the current call."""
        reason = payload.get("reason", "external_request")
        speak_before_end = payload.get("speak_before_end")

        logger.info(f"External end_call event: reason={reason}")

        try:
            # Speak message before ending if provided
            if speak_before_end and hasattr(self.session, 'say'):
                await self.session.say(speak_before_end)
                # Brief pause to let TTS complete
                await asyncio.sleep(2)

            # End the session
            if hasattr(self.session, 'aclose'):
                await self.session.aclose()
            elif hasattr(self.session, 'close'):
                self.session.close()

        except Exception as e:
            logger.error(f"Failed to execute end_call: {e}")

    async def _handle_transfer(self, payload: dict) -> None:
        """Transfer the call to another destination."""
        destination = payload.get("destination", "")
        announce = payload.get("announce_message")

        logger.info(f"External transfer event: destination={destination}")

        # TODO: Implement transfer via LiveKit SIP
        # This requires access to the SIP participant to initiate a transfer
        logger.warning("Transfer functionality not yet implemented in agent")

    async def _handle_dtmf(self, payload: dict) -> None:
        """Send DTMF tones."""
        digits = payload.get("digits", "")

        logger.info(f"External DTMF event: digits={digits}")

        # TODO: Implement DTMF sending via LiveKit SIP
        logger.warning("DTMF functionality not yet implemented in agent")

    async def _handle_mute(self, mute: bool) -> None:
        """Mute or unmute the agent."""
        logger.info(f"External mute event: mute={mute}")

        # TODO: Implement mute/unmute
        logger.warning("Mute functionality not yet implemented in agent")

    async def _handle_set_context(self, payload: dict) -> None:
        """Update agent context with new data."""
        context = payload.get("context", {})
        replace = payload.get("replace", False)

        logger.info(f"External set_context event: keys={list(context.keys())}, replace={replace}")

        # TODO: Implement context updates
        # This would require modifying the agent's system prompt or storing context
        logger.warning("Set context functionality not yet implemented in agent")


class TextModeContext:
    """
    Limited context for tools in text chat mode.

    Provides a context object that tools can use, but with limited capabilities
    compared to voice mode (no room access, no session, no SIP participant).

    Tools should check `context.is_text_mode` or `context.room is None` to
    handle gracefully when they require voice/SIP features.
    """

    def __init__(self, room_name: str = None, agent_config: dict = None):
        """
        Initialize text mode context.

        Args:
            room_name: The room name (for logging/reference only)
            agent_config: The agent configuration dict
        """
        self.room = None  # No room access in text mode
        self.session = None  # No session in text mode
        self.room_name = room_name
        self.is_text_mode = True
        self.agent_config = agent_config or {}


class CallTracker:
    """
    Tracks call events and stores them in call history.

    Captures:
    - Call start/end times
    - SIP metadata (from/to numbers, direction)
    - Transcriptions (user and agent speech)
    - Response latency (TTFB) with component breakdown (STT/LLM/TTS)
    """

    def __init__(self, agent_config: dict, room_name: str, job_metadata: dict = None):
        self.agent_config = agent_config
        self.room_name = room_name
        self.job_metadata = job_metadata or {}
        self.call_id = None
        self.call_start_time = None  # Track when the call started for duration filtering
        self.transcription_segments = []
        self.last_user_speech_time = None
        self.ttfb_samples = []

        # Component-level latency tracking
        self.stt_latency_samples = []    # Speech-to-text latency (ms)
        self.llm_latency_samples = []    # LLM time to first token (ms)
        self.tts_latency_samples = []    # Text-to-speech latency (ms)

        # Per-turn metrics for detailed analysis
        self.turn_metrics = []  # List of {turn_id, stt_ms, llm_ms, tts_ms, total_ms, timestamp}
        self.turn_counter = 0

        # Network jitter tracking (sampled periodically during call)
        self.jitter_samples = []  # Network jitter measurements (ms)

        # Cross-provider STT latency tracking
        # Measures time from user stops speaking to transcript received
        self._last_user_speech_end_time = None

    @staticmethod
    def calculate_percentile(samples: list, percentile: int) -> float:
        """Calculate percentile from a list of samples."""
        if not samples:
            return None
        sorted_samples = sorted(samples)
        index = int(len(sorted_samples) * percentile / 100)
        index = min(index, len(sorted_samples) - 1)
        return sorted_samples[index]

    def record_turn_metrics(self, stt_ms: float = None, llm_ms: float = None, tts_ms: float = None):
        """Record metrics for a single conversation turn."""
        from datetime import datetime

        self.turn_counter += 1
        total_ms = sum(filter(None, [stt_ms, llm_ms, tts_ms])) or None

        turn_data = {
            "turn_id": self.turn_counter,
            "stt_ms": round(stt_ms, 1) if stt_ms else None,
            "llm_ms": round(llm_ms, 1) if llm_ms else None,
            "tts_ms": round(tts_ms, 1) if tts_ms else None,
            "total_ms": round(total_ms, 1) if total_ms else None,
            "timestamp": datetime.utcnow().isoformat(),
        }
        self.turn_metrics.append(turn_data)

        logger.debug(f"Turn {self.turn_counter} metrics: STT={stt_ms}ms, LLM={llm_ms}ms, TTS={tts_ms}ms, Total={total_ms}ms")

    async def sample_jitter(self, room):
        """Sample jitter from remote participants' audio tracks."""
        try:
            for participant in room.remote_participants.values():
                for pub in participant.track_publications.values():
                    if pub.track is None or pub.kind != rtc.TrackKind.KIND_AUDIO:
                        continue
                    try:
                        stats_list = await pub.track.get_stats()
                        for stat in stats_list:
                            stat_type = stat.WhichOneof("stats")
                            if stat_type == "inbound_rtp" and stat.HasField("inbound_rtp"):
                                rtp = stat.inbound_rtp
                                if hasattr(rtp, "received") and rtp.HasField("received"):
                                    jitter_sec = getattr(rtp.received, "jitter", 0)
                                    if jitter_sec and jitter_sec > 0:
                                        jitter_ms = jitter_sec * 1000.0
                                        if len(self.jitter_samples) < 200:
                                            self.jitter_samples.append(jitter_ms)
                    except Exception as track_err:
                        logger.debug(f"Error getting track stats: {track_err}")
        except Exception as e:
            logger.debug(f"Error sampling jitter: {e}")

    def start_call(self, sip_metadata: dict = None, metadata: dict = None):
        """Create a call record when the call starts."""
        import time
        self.call_start_time = time.time()  # Record start time for duration filtering

        if not call_history:
            logger.warning("Call history service not available, skipping call tracking")
            return None

        try:
            # Extract SIP metadata
            sip_meta = sip_metadata or {}

            # Determine direction from SIP call ID format or metadata
            direction = sip_meta.get("direction", "inbound")

            # If enqueued campaign metadata exists, force outbound and extract tracking keys
            is_campaign_call = False
            campaign_id = self.job_metadata.get("campaign_id")
            lead_id = self.job_metadata.get("lead_id") or self.job_metadata.get("external_record_id")
            
            if campaign_id or lead_id or self.job_metadata.get("type") == "outbound_campaign_call":
                is_campaign_call = True
                direction = "outbound"

            # Merge enqueued campaign metadata tunnels defensively
            merged_metadata = {
                "campaign_id": campaign_id,
                "lead_id": lead_id,
                "external_record_id": self.job_metadata.get("external_record_id") or lead_id,
                "phone": self.job_metadata.get("phone"),
                "caller_id": self.job_metadata.get("caller_id"),
                "agent_id": self.job_metadata.get("agent_id") or self.agent_config.get("id"),
                "agent_slug": self.job_metadata.get("agent_slug") or self.agent_config.get("slug"),
                "room_name": self.room_name,
                "call_goal": self.job_metadata.get("call_goal"),
                "opening_message": self.job_metadata.get("opening_message"),
                "type": self.job_metadata.get("type", "outbound_campaign_call"),
                "source": self.job_metadata.get("source", "campaign"),
                "direction": direction,
                "attempt_count": self.job_metadata.get("attempt_count")
            }

            # Ensure ViciDial metadata fields are preserved
            v_keys = [
                "vicidial_campaign_id", "vicidial_list_id", "vicidial_lead_id",
                "vicidial_ingroup", "vicidial_call_uniqueid", "mapping_id",
                "vendor_lead_code", "custom_fields"
            ]
            for vk in v_keys:
                if vk in self.job_metadata and self.job_metadata[vk] is not None and self.job_metadata[vk] != "":
                    merged_metadata[vk] = self.job_metadata[vk]

            # Filter out empty/None keys
            merged_metadata = {k: v for k, v in merged_metadata.items() if v is not None and v != ""}

            if metadata:
                merged_metadata.update(metadata)

            sip_call_id = sip_meta.get("call_id")
            if sip_call_id:
                merged_metadata["sip_call_id"] = sip_call_id

            logger.info(f"[CALL_LOG_PERSIST] start_call merging campaign metadata: campaign_id={campaign_id} lead_id={lead_id} direction={direction}")

            # Create call record (will perform deduplicating create-or-update by room name)
            record = call_history.create_call_record(
                call_id=sip_meta.get("call_id", self.room_name), # fallback to room name
                agent_id=self.agent_config.get("id", ""),
                room_name=self.room_name,
                direction=direction,
                from_number=sip_meta.get("from_number", sip_meta.get("caller_id", "")),
                to_number=sip_meta.get("to_number", sip_meta.get("called_number", "")),
                metadata=merged_metadata
            )

            # Store just the call ID, not the entire record
            if record:
                self.call_id = record
                logger.info(f"Call tracking started: call_id={self.call_id}")
            return self.call_id

        except Exception as e:
            logger.error(f"Failed to start call tracking: {e}")
            return None

    def end_call(self, end_reason: str = "hangup", recording_id: str = None):
        """Complete the call record when the call ends."""
        import time
        from pathlib import Path

        if not call_history or not self.call_id:
            return

        # Check if call meets minimum duration requirements
        skip_call_history = False
        delete_recording = False
        call_duration = 0

        if self.call_start_time and agent_storage:
            call_duration = time.time() - self.call_start_time
            try:
                min_duration_settings = agent_storage.get_min_duration_settings()

                # Check call history minimum duration
                if min_duration_settings.get("call_history_enabled", False):
                    min_seconds = min_duration_settings.get("call_history_seconds", 10)
                    if call_duration < min_seconds:
                        skip_call_history = True
                        logger.info(f"Call {self.call_id} filtered from history: duration {call_duration:.1f}s < minimum {min_seconds}s")

                # Check recording minimum duration
                if min_duration_settings.get("recording_enabled", False):
                    rec_min_seconds = min_duration_settings.get("recording_seconds", 10)
                    if call_duration < rec_min_seconds:
                        delete_recording = True
                        logger.info(f"Recording for call {self.call_id} will be deleted: duration {call_duration:.1f}s < minimum {rec_min_seconds}s")

            except Exception as e:
                logger.warning(f"Error checking min duration settings: {e}")

        # Delete recording if call is too short
        if delete_recording and self.room_name:
            try:
                storage_provider = get_current_storage_provider()

                if storage_provider == "s3":
                    # Delete from S3
                    try:
                        from app.services.cloud_storage import CloudStorageService
                        s3_bucket = os.environ.get("AWS_S3_BUCKET")
                        if s3_bucket:
                            recordings = CloudStorageService.list_s3_recordings()
                            for rec in recordings:
                                if self.room_name in rec.get("object_key", ""):
                                    CloudStorageService.delete_from_s3(rec["object_key"])
                                    logger.info(f"Deleted short recording from S3: {rec['object_key']}")
                    except Exception as s3_err:
                        logger.warning(f"Failed to delete short recording from S3: {s3_err}")

                elif storage_provider == "gcs":
                    # Delete from GCS
                    try:
                        from app.services.cloud_storage import CloudStorageService
                        gcs_bucket = os.environ.get("GCS_BUCKET")
                        if gcs_bucket:
                            recordings = CloudStorageService.list_gcs_recordings()
                            for rec in recordings:
                                if self.room_name in rec.get("object_key", ""):
                                    CloudStorageService.delete_from_gcs(rec["object_key"])
                                    logger.info(f"Deleted short recording from GCS: {rec['object_key']}")
                    except Exception as gcs_err:
                        logger.warning(f"Failed to delete short recording from GCS: {gcs_err}")

                else:
                    # Delete from local filesystem
                    egress_dir = RECORDING_PATH
                    if egress_dir.exists():
                        for ext in ["*.mp4", "*.ogg", "*.mkv"]:
                            for recording_file in egress_dir.glob(f"*{self.room_name}*"):
                                if recording_file.suffix in [".mp4", ".ogg", ".mkv"]:
                                    try:
                                        recording_file.unlink()
                                        logger.info(f"Deleted short recording: {recording_file.name}")
                                    except Exception as del_error:
                                        logger.warning(f"Failed to delete recording {recording_file.name}: {del_error}")

            except Exception as e:
                logger.warning(f"Error deleting short recording: {e}")

        # If call history should be skipped, delete the record and return
        if skip_call_history:
            call_history.delete_call(self.call_id)
            return

        try:
            # Calculate overall TTFB stats
            avg_ttfb = None
            p50_ttfb = None
            p90_ttfb = None
            p99_ttfb = None

            if self.ttfb_samples:
                avg_ttfb = sum(self.ttfb_samples) / len(self.ttfb_samples)
                p50_ttfb = self.calculate_percentile(self.ttfb_samples, 50)
                p90_ttfb = self.calculate_percentile(self.ttfb_samples, 90)
                p99_ttfb = self.calculate_percentile(self.ttfb_samples, 99)
                logger.info(f"Call TTFB stats: samples={len(self.ttfb_samples)}, avg={avg_ttfb:.0f}ms, p50={p50_ttfb:.0f}ms, p90={p90_ttfb:.0f}ms")

            # Calculate component averages
            avg_stt = sum(self.stt_latency_samples) / len(self.stt_latency_samples) if self.stt_latency_samples else None
            avg_llm = sum(self.llm_latency_samples) / len(self.llm_latency_samples) if self.llm_latency_samples else None
            avg_tts = sum(self.tts_latency_samples) / len(self.tts_latency_samples) if self.tts_latency_samples else None

            if avg_stt or avg_llm or avg_tts:
                logger.info(f"Component latency: STT={avg_stt:.0f}ms, LLM={avg_llm:.0f}ms, TTS={avg_tts:.0f}ms" if all([avg_stt, avg_llm, avg_tts]) else f"Component latency: STT={avg_stt}, LLM={avg_llm}, TTS={avg_tts}")

            # Calculate jitter stats
            avg_jitter = sum(self.jitter_samples) / len(self.jitter_samples) if self.jitter_samples else None
            max_jitter = max(self.jitter_samples) if self.jitter_samples else None
            if avg_jitter is not None:
                logger.info(f"Jitter stats: samples={len(self.jitter_samples)}, avg={avg_jitter:.1f}ms, max={max_jitter:.1f}ms")

            # Complete the call record with extended metrics wrapped in a payload
            final_payload = {
                "end_reason": end_reason,
                "response_latency_ttfb_ms": avg_ttfb,
                "recording_id": recording_id,
                "stt_latency_avg_ms": avg_stt,
                "llm_latency_avg_ms": avg_llm,
                "tts_latency_avg_ms": avg_tts,
                "latency_p50_ms": p50_ttfb,
                "latency_p90_ms": p90_ttfb,
                "latency_p99_ms": p99_ttfb,
                "turn_count": self.turn_counter,
                "turn_metrics": self.turn_metrics if self.turn_metrics else None,
                "jitter_avg_ms": avg_jitter,
                "jitter_max_ms": max_jitter,
                "duration": call_duration
            }

            call_history.complete_call_record(
                call_id=self.call_id,
                room_name=self.room_name,
                final_payload=final_payload
            )

            # Save transcription if we have segments
            if self.transcription_segments:
                call_history.save_transcription(self.call_id, self.transcription_segments)
                logger.info(f"Saved {len(self.transcription_segments)} transcription segments")

                # Check if auto-generate summary is enabled
                self._trigger_auto_summary()

            # Clear real-time metrics for this call
            if realtime_metrics and self.room_name:
                try:
                    realtime_metrics.clear_call_metrics(self.room_name)
                except Exception as rt_error:
                    logger.debug(f"Error clearing real-time metrics: {rt_error}")

            logger.info(f"Call tracking completed: call_id={self.call_id}, reason={end_reason}")

            # Push post_call report event — the report engine handles post_analysis
            # separately by waiting for the call summary to complete first
            try:
                self._push_report_event("post_call")
            except Exception:
                pass
                
        except Exception as e:
            logger.error(f"Failed to end call tracking: {e}")

    def _trigger_auto_summary(self):
        """Trigger auto-generation of call summary if enabled."""
        if not call_summary_service or not agent_storage:
            return

        try:
            # Get AI summary settings
            settings = agent_storage.get_ai_summary_settings()

            if not settings.get("auto_generate"):
                logger.debug("Auto-generate summary is disabled")
                return

            provider = settings.get("provider", "google")
            model = settings.get("model", "gemini-3.1-pro-preview")

            logger.info(f"Auto-generating summary for call {self.call_id} using {provider}/{model}")

            # Run async summary generation in background thread
            def generate_in_background():
                import asyncio
                try:
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    result = loop.run_until_complete(
                        call_summary_service.generate_summary(self.call_id, provider, model)
                    )
                    loop.close()

                    if result.get("success"):
                        logger.info(f"Auto-generated summary for call {self.call_id}")
                        # Push post-analysis report event
                        try:
                            self._push_report_event("post_analysis")
                        except Exception as re:
                            logger.warning(f"Failed to push post_analysis event for {self.call_id}: {re}")
                    else:
                        logger.warning(f"Failed to auto-generate summary: {result.get('error')}")
                except Exception as e:
                    logger.error(f"Error in auto-summary generation: {e}")

            # Submit to bounded pool — caps concurrent summary work to 4 threads
            _summary_executor.submit(generate_in_background)

        except Exception as e:
            logger.error(f"Failed to trigger auto-summary: {e}")

    def _push_report_event(self, event_type: str):
        """Push report trigger event to Redis queue for the report engine."""
        try:
            client = agent_storage.get_redis_client()
            if client is None:
                logger.warning(f"Cannot push {event_type} report event: Redis client unavailable")
                return
            # Get direction from the call record if available
            direction = ""
            if call_history and self.call_id:
                try:
                    record = call_history.get_call(self.call_id)
                    if record:
                        direction = record.get("direction", "")
                except Exception:
                    pass
            from datetime import datetime
            event = json.dumps({
                "type": event_type,
                "call_id": self.call_id,
                "agent_name": self.agent_config.get("name", ""),
                "agent_id": self.agent_config.get("id", ""),
                "direction": direction,
                "room_name": self.room_name,
                "timestamp": datetime.utcnow().isoformat() + "Z",
            })
            client.lpush("livekit:report_events", event)
            logger.info(f"Pushed {event_type} report event for call {self.call_id}")
        except Exception as e:
            logger.warning(f"Failed to push {event_type} report event: {e}")

    def on_user_speech(self, text: str, is_final: bool = True):
        """Record user speech and track timing for TTFB."""
        if not is_final:
            return

        from datetime import datetime

        # Record the time for TTFB calculation
        self.last_user_speech_time = datetime.utcnow()

        # Add to transcription
        self.transcription_segments.append({
            "speaker": "caller",
            "text": text,
            "timestamp": self.last_user_speech_time.isoformat(),
        })

        logger.debug(f"User speech recorded: {text[:50]}...")

    def on_agent_speech_started(self):
        """Calculate TTFB when agent starts responding."""
        from datetime import datetime

        if self.last_user_speech_time:
            now = datetime.utcnow()
            ttfb_ms = (now - self.last_user_speech_time).total_seconds() * 1000
            self.ttfb_samples.append(ttfb_ms)
            logger.debug(f"TTFB sample: {ttfb_ms:.0f}ms")
            self.last_user_speech_time = None

    def on_agent_speech(self, text: str):
        """Record agent speech."""
        from datetime import datetime

        self.transcription_segments.append({
            "speaker": "agent",
            "text": text,
            "timestamp": datetime.utcnow().isoformat(),
        })

        logger.debug(f"Agent speech recorded: {text[:50]}...")

    def on_tool_call(self, tool_name: str, args: dict, result: dict):
        """Record a tool call in the transcription."""
        from datetime import datetime

        # Format args for display (exclude None values)
        args_display = {k: v for k, v in args.items() if v is not None}

        self.transcription_segments.append({
            "speaker": "tool",
            "tool_name": tool_name,
            "args": args_display,
            "result": result,
            "text": f"Tool: {tool_name}",
            "timestamp": datetime.utcnow().isoformat(),
        })

        logger.debug(f"Tool call recorded: {tool_name}")

    def on_handoff(self, from_agent: str, to_agent: str, reason: str = "", silent: bool = False):
        """Record a handoff between agents in the transcription."""
        from datetime import datetime

        self.transcription_segments.append({
            "speaker": "handoff",
            "from_agent": from_agent,
            "to_agent": to_agent,
            "reason": reason,
            "silent": silent,
            "text": f"Handoff: {from_agent} → {to_agent}",
            "timestamp": datetime.utcnow().isoformat(),
        })

        logger.info(f"Handoff recorded: {from_agent} → {to_agent} (silent={silent})")

    def on_user_stopped_speaking(self):
        """
        Record when user stops speaking (from VAD or turn detection).
        This is the start time for measuring STT latency.
        """
        from datetime import datetime
        self._last_user_speech_end_time = datetime.utcnow()
        logger.debug("User stopped speaking - timestamp recorded for STT latency")

    def on_stt_transcript_received(self, is_final: bool = False):
        """
        Calculate STT latency when final transcript is received.
        STT Latency = Time(transcript received) - Time(user stopped speaking)

        This is a cross-provider approach that works with any STT (Deepgram, Google, OpenAI, etc.)
        """
        if not is_final:
            return  # Only measure on final transcripts

        from datetime import datetime

        if self._last_user_speech_end_time:
            now = datetime.utcnow()
            stt_latency_ms = (now - self._last_user_speech_end_time).total_seconds() * 1000

            # Only record reasonable values (< 10 seconds)
            if 0 < stt_latency_ms < 10000:
                self.stt_latency_samples.append(stt_latency_ms)
                logger.info(f"STT latency: {stt_latency_ms:.0f}ms (cross-provider measurement)")
            else:
                logger.debug(f"STT latency discarded (out of range): {stt_latency_ms:.0f}ms")

            self._last_user_speech_end_time = None


async def load_agent_config(required_slug=None):
    """
    Load agent configuration from Redis storage.

    Agents are stored persistently in Redis, not in a JSON file.
    This ensures agent configs survive git operations and updates.

    If required_slug is provided, we ensure that specific agent is loaded
    even if its status is not 'running' (essential for Sandbox/Simulation).
    """
    try:
        # Load agents from Redis storage
        if agent_storage is None:
            print("Error: Redis agent storage not available")
            sys.exit(1)

        if not agent_storage.is_redis_available():
            print("Error: Redis is not available for agent storage")
            sys.exit(1)

        agents_list = await agent_storage.get_all_agents()

        # Status Flag Enforcement & UI Synchronization
        # Stopped agents are safely kept in DB/Redis but completely bypassed from dispatch pool
        running_agents = []
        for agent in agents_list:
            status = str(agent.get("status", "")).lower()
            if status != "running":
                continue
            running_agents.append(agent)

        # If a specific slug is required (e.g. from Sandbox/Simulation), make sure it's included
        if required_slug:
            # Check if it's already in the running list
            if not any(a.get("slug") == required_slug for a in running_agents):
                # Try to find it in the full list
                specific_agent = next((a for a in agents_list if a.get("slug") == required_slug), None)
                if specific_agent:
                    logger.info(f"Injecting non-running agent '{required_slug}' for specific request (Sandbox/Simulation)")
                    running_agents.append(specific_agent)

        if not running_agents:
            return []

        logger.info(f"Loaded {len(running_agents)} agent(s) (priority/running) from Redis")
        return running_agents
    except Exception as e:
        print(f"Error loading agent config: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


def load_agent_tools(agent_id: str):
    """
    [DEPRECATED] Legacy tool loader. 
    Dynamic tools are now handled in the entrypoint via ToolRegistry.
    """
    return []


def create_text_mode_tools(tools: list, context: 'TextModeContext') -> list:
    """
    Convert tool instances to LLM-callable functions for text mode.

    Args:
        tools: List of tool instances (BaseTool subclasses)
        context: TextModeContext for tool execution

    Returns:
        List of function_tool decorated callables
    """
    from livekit.agents import function_tool, RunContext
    from typing import Optional

    if not tools:
        return []

    llm_tools = []

    for tool in tools:
        try:
            schema = tool.get_parameters_schema()
            properties = schema.get("properties", {})
            required = schema.get("required", [])

            # Create handler based on parameters
            if not properties:
                # No parameters - simple handler
                async def no_param_handler(t=tool, ctx=context):
                    logger.info(f"Text mode tool called: {t.name} (no params)")
                    try:
                        result = await t.execute(ctx)
                        return json.dumps(result) if isinstance(result, dict) else str(result)
                    except Exception as e:
                        logger.error(f"Tool {t.name} error: {e}")
                        return json.dumps({"error": str(e)})

                decorated = function_tool(no_param_handler, name=tool.name, description=tool.description)
                llm_tools.append(decorated)
            else:
                # Has parameters - create typed handler dynamically
                param_names = list(properties.keys())
                param_defs = []

                for name in param_names:
                    prop = properties[name]
                    prop_type = prop.get("type", "string")
                    default = prop.get("default")
                    type_map = {"string": "str", "integer": "int", "number": "float", "boolean": "bool"}
                    py_type = type_map.get(prop_type, "str")

                    if name in required:
                        param_defs.append(f"{name}: {py_type}")
                    elif default is not None:
                        param_defs.append(f"{name}: {py_type} = {repr(default)}")
                    else:
                        param_defs.append(f"{name}: Optional[{py_type}] = None")

                params_str = ", ".join(param_defs)
                kwargs_build = ", ".join([f'"{n}": {n}' for n in param_names])

                func_code = f'''
async def typed_handler({params_str}):
    kwargs = {{{kwargs_build}}}
    kwargs = {{k: v for k, v in kwargs.items() if v is not None}}
    logger.info(f"Text mode tool called: {tool.name} with args: {{kwargs}}")
    try:
        result = await tool_ref.execute(ctx_ref, **kwargs)
        return json.dumps(result) if isinstance(result, dict) else str(result)
    except Exception as e:
        logger.error(f"Tool {tool.name} error: {{e}}")
        return json.dumps({{"error": str(e)}})
'''
                local_vars = {"tool_ref": tool, "ctx_ref": context, "logger": logger, "json": json, "Optional": Optional}
                exec(func_code, local_vars)
                handler = local_vars["typed_handler"]

                decorated = function_tool(handler, name=tool.name, description=tool.description)
                llm_tools.append(decorated)

            logger.info(f"Created text mode tool: {tool.name}")

        except Exception as e:
            logger.error(f"Error creating text mode tool {tool.name}: {e}")
            continue

    logger.info(f"Created {len(llm_tools)} text mode tools")
    return llm_tools


def check_required_env_vars(agent_config):
    """Check if required environment variables are set"""
    missing_vars = []

    # Check LLM provider
    llm_provider = agent_config.get("llm_config", {}).get("provider")
    if llm_provider == "openai":
        if not config_service.get_api_key("openai"):
            missing_vars.append("OpenAI API Key - Not configured in Settings > Integrations")
    elif llm_provider == "anthropic":
        if not config_service.get_api_key("anthropic"):
            missing_vars.append("Anthropic API Key - Not configured in Settings > Integrations")
    elif llm_provider == "google":
        if not config_service.get_api_key("google"):
            missing_vars.append("Google API Key - Not configured in Settings > Integrations")
    elif llm_provider == "google_cloud":
        gcp_config = config_service.get_integration("gcp")
        if not gcp_config.get("config_json") and not os.getenv("GOOGLE_CLOUD_CREDENTIALS_FILE"):
            missing_vars.append("Google Cloud Credentials - Not configured in Settings > Integrations")
    elif llm_provider == "bedrock":
        aws_config = config_service.get_integration("aws")
        if not aws_config.get("api_key") and not os.getenv("AWS_SECRET_ACCESS_KEY"):
            missing_vars.append("AWS Secret Key - Not configured in Settings > Integrations")
        if not aws_config.get("config_json", {}).get("accessKeyId") and not os.getenv("AWS_ACCESS_KEY_ID"):
            missing_vars.append("AWS Access Key ID - Not configured in Settings > Integrations")
    elif llm_provider == "xai":
        if not config_service.get_api_key("xai"):
            missing_vars.append("xAI API Key - Not configured in Settings > Integrations")
    elif llm_provider == "groq":
        if not config_service.get_api_key("groq"):
            missing_vars.append("Groq API Key - Not configured in Settings > Integrations")

    # Check STT provider
    stt_provider = agent_config.get("stt_config", {}).get("provider")
    if stt_provider == "deepgram":
        if not config_service.get_api_key("deepgram") and not os.getenv("DEEPGRAM_API_KEY"):
            missing_vars.append("Deepgram API Key - Not configured in Settings > Integrations or .env")
    elif stt_provider == "openai":
        if not config_service.get_api_key("openai"):
            missing_vars.append("OpenAI API Key - Not configured in Settings > Integrations")
    elif stt_provider == "google_cloud":
        gcp_config = config_service.get_integration("gcp")
        if not gcp_config.get("config_json") and not os.getenv("GOOGLE_CLOUD_CREDENTIALS_FILE"):
            missing_vars.append("Google Cloud Credentials - Not configured in Settings > Integrations")
    elif stt_provider == "aws_transcribe":
        aws_config = config_service.get_integration("aws")
        if not aws_config.get("api_key") and not os.getenv("AWS_SECRET_ACCESS_KEY"):
            missing_vars.append("AWS Secret Key - Not configured in Settings > Integrations")
    elif stt_provider == "groq":
        if not config_service.get_api_key("groq"):
            missing_vars.append("Groq API Key - Not configured in Settings > Integrations")

    # Check TTS provider
    tts_provider = agent_config.get("tts_config", {}).get("provider")
    if tts_provider == "cartesia":
        if not config_service.get_api_key("cartesia"):
            missing_vars.append("Cartesia API Key - Not configured in Settings > Integrations")
    elif tts_provider == "elevenlabs":
        if not config_service.get_api_key("elevenlabs"):
            missing_vars.append("ElevenLabs API Key - Not configured in Settings > Integrations")
    elif tts_provider == "openai":
        if not config_service.get_api_key("openai"):
            missing_vars.append("OpenAI API Key - Not configured in Settings > Integrations")
    elif tts_provider == "google_cloud" or tts_provider == "google_gemini":
        gcp_config = config_service.get_integration("gcp")
        if not gcp_config.get("config_json") and not os.getenv("GOOGLE_CLOUD_CREDENTIALS_FILE"):
            missing_vars.append("Google Cloud Credentials - Not configured in Settings > Integrations")
    elif tts_provider == "aws_polly":
        aws_config = config_service.get_integration("aws")
        if not aws_config.get("api_key") and not os.getenv("AWS_SECRET_ACCESS_KEY"):
            missing_vars.append("AWS Secret Key - Not configured in Settings > Integrations")
    elif tts_provider == "groq":
        if not config_service.get_api_key("groq"):
            missing_vars.append("Groq API Key - Not configured in Settings > Integrations")

    # Check LiveKit credentials
    if not os.getenv("LIVEKIT_URL"):
        missing_vars.append("LIVEKIT_URL - LiveKit server URL not configured")
    if not os.getenv("LIVEKIT_API_KEY"):
        missing_vars.append("LIVEKIT_API_KEY - LiveKit API key not configured")
    if not os.getenv("LIVEKIT_API_SECRET"):
        missing_vars.append("LIVEKIT_API_SECRET - LiveKit API secret not configured")

    return missing_vars


def get_region_prefix(region: str) -> str:
    """Map AWS region to Bedrock inference profile prefix for Claude 4.5 models."""
    region_mapping = {
        # Australia
        "ap-southeast-2": "au",
        "ap-southeast-4": "au",
        # Japan
        "ap-northeast-1": "jp",
        "ap-northeast-3": "jp",
        # US
        "us-east-1": "us",
        "us-east-2": "us",
        "us-west-2": "us",
        # EU
        "eu-central-1": "eu",
        "eu-west-1": "eu",
        "eu-west-2": "eu",
        "eu-west-3": "eu",
    }
    return region_mapping.get(region, "global")


def has_enabled_tools(tools):
    if tools is None:
        return False
    if isinstance(tools, (list, tuple, set)):
        return len(tools) > 0
    if isinstance(tools, dict):
        return len(tools.keys()) > 0
    return False


def get_llm(config):
    """Initialize LLM based on configuration"""
    from livekit.plugins import openai
    try:
        from livekit.plugins import google, aws
    except ImportError:
        google, aws = None, None
    llm_config = config.get("llm_config", {})
    provider = llm_config.get("provider", "openai")
    model = llm_config.get("model", "gpt-4o")
    temperature = llm_config.get("temperature", 0.7)

    _tc = config.get("tools_config", [])
    if isinstance(_tc, str):
        import json
        try:
            _tc = json.loads(_tc)
        except Exception:
            _tc = []
    tools_enabled = has_enabled_tools(_tc)
    
    openai_kwargs = {"temperature": temperature}
    if tools_enabled:
        openai_kwargs["parallel_tool_calls"] = False

    logger.info(f"OpenAI LLM initialized: tools_enabled={tools_enabled}, parallel_tool_calls={'parallel_tool_calls' in openai_kwargs}")

    if provider == "openai":
        # Handle "instant" models - strip suffix and set reasoning_effort to none
        actual_model = model
        extra_params = {}

        if model.endswith("-instant"):
            # e.g., "gpt-5.2-instant" -> "gpt-5.2" with reasoning_effort="none"
            actual_model = model.replace("-instant", "")
            extra_params["extra_body"] = {"reasoning_effort": "none"}
            logger.info(f"Using instant mode for {actual_model} (reasoning_effort=none)")

        api_key = config_service.get_api_key("openai")
        return openai.LLM(model=actual_model, api_key=api_key, **openai_kwargs, **extra_params)
    elif provider == "google" or provider == "google_gemini":
        # Google Gemini models via consumer API (uses GOOGLE_API_KEY)
        api_key = config_service.get_api_key("google") or config_service.get_api_key("google_gemini")
        logger.info(f"Initializing Google LLM (Consumer API): model={model}")
        return google.LLM(model=model, api_key=api_key, temperature=temperature)
    elif provider == "deepseek":
        # DeepSeek via OpenAI-compatible API
        api_key = config_service.get_api_key("deepseek")
        logger.info(f"Initializing DeepSeek LLM: model={model}, temperature={temperature}")
        return openai.LLM(
            model=model,
            api_key=api_key,
            base_url="https://api.deepseek.com/v1",
            **openai_kwargs
        )
    elif provider == "mistral":
        # Mistral via OpenAI-compatible API
        api_key = config_service.get_api_key("mistral")
        logger.info(f"Initializing Mistral LLM: model={model}, temperature={temperature}")
        return openai.LLM(
            model=model,
            api_key=api_key,
            base_url="https://api.mistral.ai/v1",
            **openai_kwargs
        )
    elif provider == "together_ai":
        # Together AI via OpenAI-compatible API
        api_key = config_service.get_api_key("together_ai")
        logger.info(f"Initializing Together AI LLM: model={model}, temperature={temperature}")
        return openai.LLM(
            model=model,
            api_key=api_key,
            base_url="https://api.together.xyz/v1",
            **openai_kwargs
        )
    elif provider == "google_cloud":
        # Google Gemini models via Vertex AI (Google Cloud, uses Google Cloud credentials)
        gcp_config = config_service.get_integration("gcp")
        credentials_info = gcp_config.get("config_json")
        
        if not credentials_info or not isinstance(credentials_info, dict):
            # Fallback to file if specified in env
            credentials_file = os.getenv("GOOGLE_CLOUD_CREDENTIALS_FILE")
            if not credentials_file or not os.path.exists(credentials_file):
                raise ValueError("Google Cloud credentials not configured. Please set them in Settings > Integrations.")
            import json
            with open(credentials_file, 'r') as f:
                credentials_info = json.load(f)

        project_id = credentials_info.get("project_id")
        if not project_id:
            raise ValueError("Could not extract project_id from Google Cloud credentials.")

        google_llm_region = gcp_config.get("region") or os.getenv("GOOGLE_CLOUD_LLM_REGION", "us-central1")
        
        # Try configured region first, fall back to global if it fails
        try:
            logger.info(f"Initializing Google Cloud LLM: model={model}, location={google_llm_region}, project={project_id}")
            return google.LLM(model=model, vertexai=True, project=project_id, location=google_llm_region, credentials_info=credentials_info, temperature=temperature)
        except Exception as e:
            if google_llm_region != "global":
                logger.warning(f"Google Cloud LLM: region '{google_llm_region}' failed for model={model}. "
                               f"Falling back to global endpoint. Error: {e}")
                return google.LLM(model=model, vertexai=True, project=project_id, location="global", credentials_info=credentials_info, temperature=temperature)
            raise
    elif provider == "anthropic":
        # Anthropic Claude models via livekit-plugins-anthropic
        from livekit.plugins import anthropic

        # Map friendly model names to Anthropic model IDs
        anthropic_models = {
            # Claude 4.6 family (current)
            "claude-sonnet-4-6": "claude-sonnet-4-6",
            # Claude 4.5 family
            "claude-sonnet-4-5": "claude-sonnet-4-5-20250929",
            "claude-haiku-4-5": "claude-haiku-4-5-20251001",
            # Backward compatibility for old config values
            "claude-sonnet-4-5-latest": "claude-sonnet-4-5-20250929",
            "claude-haiku-4-5-latest": "claude-haiku-4-5-20251001",
            # Claude 4 family (legacy)
            "claude-sonnet-4": "claude-sonnet-4-20250514",
            # Claude 3.x family (legacy)
            "claude-3-5-sonnet": "claude-3-5-sonnet-20241022",
            "claude-3-haiku": "claude-3-haiku-20240307",
        }

        anthropic_api_key = config_service.get_api_key("anthropic")
        anthropic_model_id = anthropic_models.get(model, model)
        # Anthropic only accepts temperature 0-1 (OpenAI accepts 0-2)
        anthropic_temp = min(temperature, 1.0)
        logger.info(f"Initializing Anthropic LLM: model={anthropic_model_id}, temperature={anthropic_temp}")
        return anthropic.LLM(model=anthropic_model_id, api_key=anthropic_api_key, temperature=anthropic_temp)
    elif provider == "bedrock":
        # AWS Bedrock via native livekit-plugins-aws
        # Uses APAC cross-region inference profiles for geo-located requests

        # APAC cross-region inference profiles - called from any APAC region
        bedrock_models = {
            # Claude models (APAC cross-region inference profiles)
            "claude-sonnet-4.6": "apac.anthropic.claude-sonnet-4-6",
            "claude-sonnet-4": "apac.anthropic.claude-sonnet-4-20250514-v1:0",
            "claude-sonnet-4.5": "apac.anthropic.claude-3-5-sonnet-20241022-v2:0",
            # Amazon Nova models (APAC)
            "amazon-nova-micro": "apac.amazon.nova-micro-v1:0",
            "amazon-nova-pro": "apac.amazon.nova-pro-v1:0",
        }

        # AU models - Australia CRIS, data stays in AU, called from ap-southeast-2
        au_models = {
            "claude-sonnet-4.6-au": "au.anthropic.claude-sonnet-4-6",
            "claude-haiku-4.5": "au.anthropic.claude-haiku-4-5-20251001-v1:0",
            "claude-sonnet-4.5-au": "au.anthropic.claude-sonnet-4-5-20250929-v1:0",
        }

        # Global models - global routing, can be called from any region
        global_models = {
            "claude-sonnet-4.6-global": "global.anthropic.claude-sonnet-4-6",
            "claude-haiku-4.5-global": "global.anthropic.claude-haiku-4-5-20251001-v1:0",
            "claude-sonnet-4.5-global": "global.anthropic.claude-sonnet-4-5-20250929-v1:0",
        }

        # Regional models - dynamically select prefix based on AWS_REGION
        regional_models = {
            "claude-sonnet-4.6-regional": "anthropic.claude-sonnet-4-6",
            "claude-haiku-4.5-regional": "anthropic.claude-haiku-4-5-20251001-v1:0",
            "claude-sonnet-4.5-regional": "anthropic.claude-sonnet-4-5-20250929-v1:0",
        }

        region = os.getenv("AWS_REGION", "ap-southeast-2")

        # Check if this is a regional model (uses dynamic prefix based on region)
        if model in regional_models:
            prefix = get_region_prefix(region)
            bedrock_model_id = f"{prefix}.{regional_models[model]}"
            api_region = region
        elif model in au_models:
            # AU models (au. prefix) must be called from ap-southeast-2 (Sydney)
            bedrock_model_id = au_models[model]
            api_region = "ap-southeast-2"
        elif model in global_models:
            # Global models (global. prefix) can be called from any region
            bedrock_model_id = global_models[model]
            api_region = region  # Use configured region
        elif model in bedrock_models:
            bedrock_model_id = bedrock_models[model]
            # APAC cross-region profiles called from an APAC region
            api_region = "ap-southeast-2"
        else:
            all_models = list(bedrock_models.keys()) + list(au_models.keys()) + list(global_models.keys()) + list(regional_models.keys())
            available = ", ".join(all_models)
            raise ValueError(f"Unknown Bedrock model: {model}. Available: {available}")

        aws_config = config_service.get_integration("aws")
        aws_access_key = aws_config.get("config_json", {}).get("accessKeyId")
        aws_secret_key = aws_config.get("api_key")
        aws_region = aws_config.get("region") or region

        # AWS Bedrock requires temperature <= 1.0
        bedrock_temp = min(temperature, 1.0)
        logger.info(f"Initializing AWS Bedrock model: {bedrock_model_id} in region {api_region}, temperature={bedrock_temp}")

        return aws.LLM(
            model=bedrock_model_id,
            region=aws_region or api_region,
            access_key=aws_access_key,
            secret_key=aws_secret_key,
            temperature=bedrock_temp
        )
    elif provider == "xai":
        # xAI Grok models via OpenAI-compatible API
        xai_api_key = config_service.get_api_key("xai")
        logger.info(f"Initializing xAI Grok LLM: model={model}, temperature={temperature}")
        return openai.LLM.with_x_ai(
            model=model,
            api_key=xai_api_key,
            temperature=temperature
        )
    elif provider == "groq":
        groq_api_key = config_service.get_api_key("groq")
        if groq_plugin is None:
            raise ValueError("Groq plugin not installed. Run: poetry add livekit-plugins-groq")
        logger.info(f"Initializing Groq LLM: model={model}, temperature={temperature}")
        return groq_plugin.LLM(model=model, api_key=groq_api_key, temperature=temperature)
    elif provider == "azure_openai":
        # Azure OpenAI LLM via .with_azure() method
        azure_deployment = llm_config.get("azure_deployment", "") or model
        
        azure_config = config_service.get_integration("azure_openai")
        azure_endpoint = azure_config.get("config_json", {}).get("endpoint") or os.getenv("AZURE_OPENAI_ENDPOINT")
        azure_api_key = azure_config.get("api_key") or os.getenv("AZURE_OPENAI_API_KEY")
        azure_api_version = azure_config.get("config_json", {}).get("apiVersion") or os.getenv("AZURE_OPENAI_API_VERSION", "2025-04-01-preview")

        if not azure_deployment:
            raise ValueError("Azure OpenAI LLM deployment name is required. Configure it in the agent editor.")
        if not azure_endpoint:
            raise ValueError("Azure OpenAI endpoint is required. Configure it in Settings > Integrations.")

        logger.info(f"Initializing Azure OpenAI LLM: deployment={azure_deployment}, endpoint={azure_endpoint}, model={model}")
        return openai.LLM.with_azure(
            azure_deployment=azure_deployment,
            azure_endpoint=azure_endpoint,
            api_key=azure_api_key,
            api_version=azure_api_version,
            temperature=temperature,
        )
    else:
        supported = "openai, google, google_gemini, bedrock, anthropic, xai, groq, azure_openai, deepseek, mistral, together_ai"
        raise ValueError(f"Unsupported LLM provider: {provider}. Supported: {supported}")


# Map legacy simplified language codes to BCP-47 codes required by Google Cloud STT
LEGACY_TO_BCP47_MAP = {
    "de": "de-DE", "de-CH": "de-CH",
    "fr": "fr-FR",
    "it": "it-IT",
    "nl": "nl-NL",
    "ja": "ja-JP",
    "ko": "ko-KR",
    "zh": "cmn-Hans-CN", "zh-TW": "cmn-Hant-TW", "yue-HK": "yue-Hant-HK",
    "es": "es-ES", "es-419": "es-US",
    "pt": "pt-PT",
    "pl": "pl-PL",
    "ru": "ru-RU",
    "uk": "uk-UA",
    "sv": "sv-SE",
    "da": "da-DK",
    "no": "no-NO",
    "fi": "fi-FI",
    "ar": "ar-XA", "ar-AE": "ar-AE",
    "tr": "tr-TR",
    "he": "iw-IL",
    "hi": "hi-IN",
    "th": "th-TH",
    "vi": "vi-VN",
    "id": "id-ID",
    "ms": "ms-MY",
    "fil": "fil-PH",
    "fa": "fa-IR",
    "el": "el-GR",
    "ca": "ca-ES",
    "hr": "hr-HR",
    "sr": "sr-RS",
    "ro": "ro-RO",
    "lv": "lv-LV",
    "cs": "cs-CZ",
    "sk": "sk-SK",
}


def _normalize_openai_language(language):
    """Normalize BCP-47 language codes to ISO 639-1 for OpenAI STT.

    OpenAI expects simple two-letter codes (e.g. 'en', 'de', 'zh').
    Handles special cases like cmn→zh, yue→zh, iw→he, fil→tl.
    """
    # Handle Google-specific BCP-47 codes
    if language.startswith("cmn-"):
        return "zh"
    if language.startswith("yue-"):
        return "zh"
    if language.startswith("iw-"):
        return "he"
    if language.startswith("fil"):
        return "tl"
    if language.startswith("pa-"):
        return "pa"
    # Standard BCP-47: take the primary language subtag
    return language.split("-")[0] if language else "en"


def get_stt(config, is_outbound_call=False):
    """Initialize STT based on configuration with hybrid Flux/Nova support and advanced settings"""
    from livekit.plugins import deepgram, google, openai
    try:
        from livekit.plugins import elevenlabs, aws, azure
    except ImportError:
        elevenlabs, aws, azure = None, None, None
    stt_config = config.get("stt_config", {})
    logger.info(f"=== FULL AGENT CONFIG DUMP ===: {config}")
    logger.info(f"=== STT CONFIG DUMP ===: {stt_config}")
    provider = stt_config.get("provider", "deepgram")
    model = stt_config.get("model", "nova-3-general") # Force nova-3-general for Fast-Human mode
    responsiveness = stt_config.get("responsiveness", 0.8) # Snappy default for Human Latency

    # Advanced STT settings
    language = stt_config.get("language", "en-US")
    custom_vocab = stt_config.get("custom_vocab") or stt_config.get("customVocabulary") or config.get("custom_vocabulary") or config.get("customVocabulary") or ""
    smart_formatting = stt_config.get("smart_formatting", True)
    remove_fillers = stt_config.get("remove_fillers", True)
    detect_language = stt_config.get("detect_language", False)

    # dg_filler_words = the exact bool passed to Deepgram's filler_words option.
    # Initialized from remove_fillers (DB/default). May be overridden in the outbound block below.
    dg_filler_words = remove_fillers

    # --- Outbound STT overrides (only applied when is_outbound_call=True) ---
    # These env vars tune Deepgram for low-latency outbound/preview phone calls.
    # They are NEVER applied to inbound calls (is_outbound_call=False).
    if is_outbound_call:
        # Smart-format override: OUTBOUND_STT_SMART_FORMAT=false disables punctuation post-processing.
        _env_sf = os.getenv("OUTBOUND_STT_SMART_FORMAT")
        if _env_sf is not None:
            smart_formatting = _env_sf.strip().lower() not in ("false", "0", "no")
            logger.info(f"[STT_TUNE] OUTBOUND_STT_SMART_FORMAT env override: smart_format={smart_formatting}")

        # Filler-words override.
        # OUTBOUND_STT_FILLER_WORDS=false → Deepgram filler_words=False (fillers omitted from transcript).
        # dg_filler_words is the DIRECT value sent to Deepgram (no inversion).
        # remove_fillers is kept as the logical inverse for legacy code that may read it.
        # Both are logged explicitly so there is no confusion.
        _env_fw = os.getenv("OUTBOUND_STT_FILLER_WORDS")
        if _env_fw is not None:
            dg_filler_words = _env_fw.strip().lower() not in ("false", "0", "no")
            remove_fillers = not dg_filler_words   # legacy inverse: kept for reference only
            logger.info(
                f"[STT_TUNE] OUTBOUND_STT_FILLER_WORDS env override: "
                f"filler_words(->Deepgram)={dg_filler_words} remove_fillers(legacy)={remove_fillers}"
            )

    # Parse custom vocabulary and strictly filter out Urdu to prevent Deepgram 400 URL Crash
    import re
    raw_vocab_list = [v.strip() for v in custom_vocab.split(",") if v.strip()] if custom_vocab else []
    vocab_list = []
    for word in raw_vocab_list:
        # Keep only English phonetic spellings (strips Urdu script)
        english_only = re.sub(r'[^\x00-\x7F]+', '', word).strip()
        if english_only and english_only not in vocab_list:
            vocab_list.append(english_only)
            
    # Safety cap: Max 50 English words so the Deepgram URL never exceeds the length limit
    vocab_list = vocab_list[:50]

    if provider == "deepgram":
        # Determine if this is a Flux or Nova model
        is_flux = model and "flux" in model.lower()

        # Build common Deepgram options
        deepgram_options = {
            "language": language,
            "smart_format": smart_formatting,
            "filler_words": dg_filler_words,  # authoritative value: env override or remove_fillers passthrough
        }

        # Add language detection if enabled (not supported by Flux/STTv2)
        if detect_language and not is_flux:
            deepgram_options["detect_language"] = True

        # Add vocabulary if provided
        # Nova-3 uses keyterm, Nova-2 and earlier use keywords
        # Add vocabulary if provided
        # Nova-3 uses keyterm, Nova-2 and earlier use keywords
        is_nova3 = model and "nova-3" in model.lower()
        if vocab_list:
            if is_nova3:
                # CRITICAL FIX: Nova-3 keyterms DO NOT support :10 weights. It causes a 400 crash!
                deepgram_options["keyterm"] = vocab_list
            else:
                # Older Nova-2 models still require the :10 weight format
                weighted_vocab = [f"{word.strip()}:10" for word in vocab_list]
                deepgram_options["keywords"] = weighted_vocab
                
        

        deepgram_api_key = config_service.get_api_key("deepgram")
        if is_flux:
            # Use STTv2 for Flux models (V2 WebSocket API)
            from livekit.plugins.deepgram import STTv2

            sttv2_options = {}
            if vocab_list:
                sttv2_options["keyterms"] = vocab_list

            # Add Flux turn detection parameters if enabled
            dynamics = config.get("conversation_dynamics", {})
            flux_turn_detection = dynamics.get("flux_turn_detection", False)

            if flux_turn_detection:
                # EOT Threshold (0.5-0.9, default 0.7)
                eot_threshold = dynamics.get("flux_eot_threshold", 0.7)
                if eot_threshold is not None and 0.5 <= eot_threshold <= 0.9:
                    sttv2_options["eot_threshold"] = eot_threshold

                # Eager EOT Threshold (0.3-0.9, optional)
                eager_eot = dynamics.get("flux_eager_eot_threshold")
                if eager_eot is not None and 0.3 <= eager_eot <= 0.9:
                    sttv2_options["eager_eot_threshold"] = eager_eot

                # EOT Timeout (500-10000ms, default 3000)
                eot_timeout = dynamics.get("flux_eot_timeout_ms", 3000)
                if eot_timeout is not None and 500 <= eot_timeout <= 10000:
                    sttv2_options["eot_timeout_ms"] = eot_timeout

                logger.info(f"Initializing Deepgram Flux STT with turn detection: model={model}, eot_threshold={eot_threshold}, eot_timeout_ms={eot_timeout}, eager_eot={eager_eot}, vocab_count={len(vocab_list)}")
            else:
                logger.info(f"Initializing Deepgram Flux STT (no turn detection): model={model}, vocab_count={len(vocab_list)}")

            if language and language not in ("en-US", "en"):
                logger.warning(f"Deepgram Flux models are English-only. Language '{language}' will be ignored.")

            return STTv2(
                model=model,
                api_key=deepgram_api_key,
                **sttv2_options
            )
        else:
            # Use STT for Nova models (V1 API)
            # Calculate endpointing_ms: 500ms at responsiveness=0.0, 10ms at responsiveness=1.0
            endpointing_ms = max(10, int(500 - (responsiveness * 490)))

            # Outbound env override: OUTBOUND_STT_ENDPOINTING_MS fully replaces the formula.
            # If the env var is absent or invalid, the formula value above is kept unchanged.
            if is_outbound_call:
                _env_ep = os.getenv("OUTBOUND_STT_ENDPOINTING_MS")
                if _env_ep is not None:
                    try:
                        endpointing_ms = max(10, int(_env_ep))
                        logger.info(f"[STT_TUNE] OUTBOUND_STT_ENDPOINTING_MS env override: endpointing_ms={endpointing_ms}ms")
                    except ValueError:
                        logger.warning(
                            f"[STT_TUNE] Invalid OUTBOUND_STT_ENDPOINTING_MS={_env_ep!r}; "
                            f"falling back to formula value endpointing_ms={endpointing_ms}ms"
                        )

            logger.info(
                f"Initializing Deepgram Nova STT: model={model}, responsiveness={responsiveness}, "
                f"endpointing_ms={endpointing_ms}ms, language={language}, "
                f"detect_language={detect_language}, vocab_count={len(vocab_list)}, "
                f"smart_format={smart_formatting}, filler_words={dg_filler_words} "
                f"(is_outbound_call={is_outbound_call})"
            )
            logger.info(
                f"[STT_TUNE] final effective settings: "
                f"endpointing_ms={endpointing_ms} smart_format={smart_formatting} filler_words={dg_filler_words}"
            )

            return deepgram.STT(
                model=model,
                api_key=deepgram_api_key,
                endpointing_ms=endpointing_ms,
                **deepgram_options
            )
    elif provider == "openai":
        # OpenAI STT configuration (Realtime API for streaming transcription)
        # Supported parameters: language, detect_language, model, prompt (whisper-1 only), noise_reduction_type
        # Note: use_realtime=True is REQUIRED for streaming transcription with live audio
        # Note: smart_format, filler_words, and custom vocabulary are not supported by OpenAI

        openai_api_key = config_service.get_api_key("openai")
        openai_options = {
            "model": model,
            "api_key": openai_api_key,
            "language": _normalize_openai_language(language),
            "use_realtime": True,  # Required for streaming STT with live audio
        }

        # Add prompt for whisper-1 only (custom vocabulary as guidance)
        if model == "whisper-1" and vocab_list:
            # Use vocabulary as a prompt to guide transcription
            vocab_prompt = "Vocabulary: " + ", ".join(vocab_list[:50])  # Limit to 50 words
            openai_options["prompt"] = vocab_prompt

        logger.info(f"Initializing OpenAI Realtime STT: model={model}, language={language}, vocab_count={len(vocab_list)}")
        if model == "whisper-1" and vocab_list:
            logger.info(f"  Using prompt for vocabulary guidance (whisper-1 only)")
        logger.info(f"  Note: Using OpenAI Realtime API for streaming transcription")

        return openai.STT(**openai_options)
    elif provider == "google_cloud":
        # Google Cloud STT requires credentials
        gcp_config = config_service.get_integration("gcp")
        credentials_info = gcp_config.get("config_json")
        
        if not credentials_info or not isinstance(credentials_info, dict):
            # Fallback to file if specified in env
            credentials_file = os.getenv("GOOGLE_CLOUD_CREDENTIALS_FILE")
            if not credentials_file or not os.path.exists(credentials_file):
                raise ValueError("Google Cloud credentials not configured. Please set them in Settings > Integrations.")
            import json
            with open(credentials_file, 'r') as f:
                credentials_info = json.load(f)

        # Normalize legacy language codes to BCP-47 for Google STT
        if language in LEGACY_TO_BCP47_MAP:
            language = LEGACY_TO_BCP47_MAP[language]

        # Model-aware location routing for Google STT
        google_cloud_stt_region = gcp_config.get("region") or os.getenv("GOOGLE_CLOUD_STT_REGION", "")

        # Chirp 2 v1 API models (latest_long, latest_short) only work with global endpoint
        if model in ("latest_long", "latest_short"):
            location = "global"
        elif model == "chirp_3":
            # Chirp 3 v2 API requires a regional location (not global)
            location = google_cloud_stt_region if google_cloud_stt_region else "us"
            if location == "global":
                logger.warning("Chirp 3 requires a regional location (not 'global'). Falling back to 'us'.")
                location = "us"
        else:
            location = google_cloud_stt_region if google_cloud_stt_region else "global"

        logger.info(f"Initializing Google STT: model={model}, location={location}, language={language}")
        return google.STT(model=model, location=location, languages=language, credentials_info=credentials_info) if model else google.STT(location=location, languages=language, credentials_info=credentials_info)
    elif provider == "elevenlabs":
        api_key = config_service.get_api_key("elevenlabs")
        if not api_key:
            raise ValueError("ElevenLabs API key not configured. Please set it in Settings > Integrations.")

        # ElevenLabs uses ISO 639-1 language codes (e.g. "de"), not BCP-47 (e.g. "de-DE")
        el_language = language.split("-")[0] if language else None

        stt_kwargs = {"api_key": api_key}
        if model:
            stt_kwargs["model_id"] = model
        if el_language:
            stt_kwargs["language_code"] = el_language

        logger.info(f"Initializing ElevenLabs STT: model_id={model}, language={el_language}")
        return elevenlabs.STT(**stt_kwargs)
    elif provider == "aws_transcribe":
        # Amazon Transcribe Streaming STT
        # Uses same AWS credentials as Bedrock (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
        # No CRIS - Transcribe runs directly in the selected region
        # IAM permissions required: transcribe:StartStreamTranscription, transcribe:StartStreamTranscriptionWebSocket

        # Language mapping: STT language codes to Transcribe streaming language codes
        # Includes both legacy simplified codes and new BCP-47 codes
        TRANSCRIBE_STREAMING_LANGUAGES = {
            # English variants
            "en-US": "en-US", "en-AU": "en-AU", "en-GB": "en-GB",
            "en-IN": "en-IN", "en-NZ": "en-NZ", "en-IE": "en-IE",
            "en-AB": "en-AB", "en-ZA": "en-ZA", "en-WL": "en-WL",
            "en-PH": "en-US",
            # Chinese (legacy + BCP-47)
            "zh": "zh-CN", "zh-CN": "zh-CN", "zh-TW": "zh-TW", "yue-HK": "yue-HK",
            "cmn-Hans-CN": "zh-CN", "cmn-Hant-TW": "zh-TW", "yue-Hant-HK": "yue-HK",
            # Japanese/Korean (legacy + BCP-47)
            "ja": "ja-JP", "ja-JP": "ja-JP", "ko": "ko-KR", "ko-KR": "ko-KR",
            # Spanish (legacy + BCP-47)
            "es": "es-ES", "es-ES": "es-ES", "es-419": "es-US", "es-US": "es-US", "es-MX": "es-US",
            # French (legacy + BCP-47)
            "fr": "fr-FR", "fr-FR": "fr-FR", "fr-CA": "fr-CA",
            # German (legacy + BCP-47)
            "de": "de-DE", "de-DE": "de-DE", "de-CH": "de-CH",
            # Other Western European (legacy + BCP-47)
            "it": "it-IT", "it-IT": "it-IT",
            "pt": "pt-PT", "pt-PT": "pt-PT", "pt-BR": "pt-BR",
            "nl": "nl-NL", "nl-NL": "nl-NL",
            # Eastern European (legacy + BCP-47)
            "pl": "pl-PL", "pl-PL": "pl-PL",
            "ru": "ru-RU", "ru-RU": "ru-RU",
            "uk": "uk-UA", "uk-UA": "uk-UA",
            "cs": "cs-CZ", "cs-CZ": "cs-CZ",
            "sk": "sk-SK", "sk-SK": "sk-SK",
            "hr": "hr-HR", "hr-HR": "hr-HR",
            "sr": "sr-RS", "sr-RS": "sr-RS",
            "ro": "ro-RO", "ro-RO": "ro-RO",
            "el": "el-GR", "el-GR": "el-GR",
            "bg-BG": "bg-BG",
            "hu-HU": "hu-HU",
            "lv": "lv-LV", "lv-LV": "lv-LV",
            "lt-LT": "lt-LT",
            "sl-SI": "sl-SI",
            # Nordic (legacy + BCP-47)
            "sv": "sv-SE", "sv-SE": "sv-SE",
            "no": "no-NO", "no-NO": "no-NO",
            "da": "da-DK", "da-DK": "da-DK",
            "fi": "fi-FI", "fi-FI": "fi-FI",
            "et-EE": "et-EE",
            # Middle Eastern (legacy + BCP-47)
            "ar": "ar-SA", "ar-AE": "ar-AE", "ar-SA": "ar-SA",
            "ar-XA": "ar-SA", "ar-EG": "ar-SA", "ar-MA": "ar-SA",
            "tr": "tr-TR", "tr-TR": "tr-TR",
            "he": "he-IL", "iw-IL": "he-IL", "fa": "fa-IR", "fa-IR": "fa-IR",
            # South/Southeast Asian (legacy + BCP-47)
            "hi": "hi-IN", "hi-IN": "hi-IN",
            "th": "th-TH", "th-TH": "th-TH",
            "vi": "vi-VN", "vi-VN": "vi-VN",
            "id": "id-ID", "id-ID": "id-ID",
            "ms": "ms-MY", "ms-MY": "ms-MY",
            "fil": "tl-PH", "fil-PH": "tl-PH",
            "bn-IN": "bn-IN", "ta-IN": "ta-IN", "te-IN": "te-IN",
            "gu-IN": "gu-IN", "mr-IN": "mr-IN", "kn-IN": "kn-IN", "ml-IN": "ml-IN",
            # Other (legacy + BCP-47)
            "ca": "ca-ES", "ca-ES": "ca-ES",
            "eu": "eu-ES", "gl": "gl-ES",
            "af": "af-ZA", "zu": "zu-ZA", "so": "so-SO",
            "hy-AM": "en-US", "my-MM": "en-US", "km-KH": "en-US", "lo-LA": "en-US",
            "ne-NP": "en-US", "pa-Guru-IN": "pa-IN", "uz-UZ": "en-US", "sw": "sw-KE",
        }

        aws_config = config_service.get_integration("aws")
        aws_region = aws_config.get("region") or os.getenv("AWS_REGION", "ap-southeast-2")

        # Map language code to Transcribe format, default to en-US if not found
        transcribe_language = TRANSCRIBE_STREAMING_LANGUAGES.get(language, "en-US")

        # LiveKit uses 48000 Hz for audio (Opus codec default)
        # For SIP telephony, audio is converted from 8000 Hz to 48000 Hz by LiveKit
        sample_rate = 48000

        # Get AWS credentials
        aws_access_key = aws_config.get("config_json", {}).get("accessKeyId")
        aws_secret_key = aws_config.get("api_key")

        logger.info(f"Initializing AWS Transcribe STT: region={aws_region}, language={transcribe_language}, sample_rate={sample_rate}, has_credentials={bool(aws_access_key and aws_secret_key)}")

        # Pass explicit credentials if available
        stt_kwargs = {
            "region": aws_region,
            "language": transcribe_language,
            "sample_rate": sample_rate,
        }

        if aws_access_key and aws_secret_key:
            from livekit.plugins.aws.stt import Credentials
            stt_kwargs["credentials"] = Credentials(
                access_key_id=aws_access_key,
                secret_access_key=aws_secret_key,
            )

        return aws.STT(**stt_kwargs)
    elif provider == "azure_speech":
        # Azure Speech STT via livekit-plugins-azure
        if azure_plugin is None:
            raise ValueError("Azure Speech plugin not installed. Run: poetry add livekit-plugins-azure")

        azure_config = config_service.get_integration("azure")
        speech_key = azure_config.get("api_key") or os.getenv("AZURE_SPEECH_KEY")
        speech_region = azure_config.get("config_json", {}).get("region") or os.getenv("AZURE_SPEECH_REGION")

        if not speech_key or not speech_region:
            raise ValueError("Azure Speech credentials not configured. Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in Settings > Integrations.")

        stt_kwargs = {
            "speech_key": speech_key,
            "speech_region": speech_region,
        }
        if language:
            stt_kwargs["language"] = language

        logger.info(f"Initializing Azure Speech STT: region={speech_region}, language={language}")
        return azure_plugin.STT(**stt_kwargs)
    elif provider == "azure_openai":
        # Azure OpenAI STT (Whisper) via .with_azure() method
        azure_deployment = stt_config.get("azure_deployment", "") or model
        azure_config = config_service.get_integration("azure")
        azure_endpoint = azure_config.get("config_json", {}).get("endpoint") or os.getenv("AZURE_OPENAI_ENDPOINT")
        azure_api_key = azure_config.get("api_key") or os.getenv("AZURE_OPENAI_API_KEY")
        azure_api_version = azure_config.get("config_json", {}).get("apiVersion") or os.getenv("AZURE_OPENAI_API_VERSION", "2025-04-01-preview")

        if not azure_deployment:
            raise ValueError("Azure OpenAI STT deployment name is required. Configure it in the agent editor.")
        if not azure_endpoint:
            raise ValueError("Azure OpenAI endpoint is required. Configure it in Settings > Integrations.")

        stt_kwargs = {
            "azure_deployment": azure_deployment,
            "azure_endpoint": azure_endpoint,
            "api_key": azure_api_key,
            "api_version": azure_api_version,
            "model": model,
        }
        if language:
            stt_kwargs["language"] = _normalize_openai_language(language)

        logger.info(f"Initializing Azure OpenAI STT: deployment={azure_deployment}, model={model}, language={language}")
        return openai.STT.with_azure(**stt_kwargs)
    elif provider == "groq":
        if groq_plugin is None:
            raise ValueError("Groq plugin not installed. Run: poetry add livekit-plugins-groq")
        groq_language = _normalize_openai_language(language)
        logger.info(f"Initializing Groq STT: model={model}, language={groq_language}")
        return groq_plugin.STT(model=model, language=groq_language)
    else:
        raise ValueError(f"Unsupported STT provider: {provider}")


def get_language_name(lang_code: str) -> str:
    """Map a language code (e.g. 'es-ES') to a human-readable language name for TTS instructions."""
    LANGUAGE_NAMES = {
        "en-US": "English", "en-AU": "Australian English", "en-GB": "British English", "en-IN": "Indian English",
        "es-ES": "Spanish", "es-US": "Spanish", "fr-FR": "French", "fr-CA": "Canadian French",
        "de-DE": "German", "it-IT": "Italian", "nl-NL": "Dutch", "nl-BE": "Belgian Dutch",
        "pt-BR": "Brazilian Portuguese", "pt-PT": "Portuguese",
        "ja-JP": "Japanese", "ko-KR": "Korean", "zh-CN": "Mandarin Chinese", "zh-TW": "Taiwanese Mandarin",
        "cmn-CN": "Mandarin Chinese", "yue-HK": "Cantonese",
        "hi-IN": "Hindi", "bn-IN": "Bengali", "ta-IN": "Tamil", "te-IN": "Telugu",
        "gu-IN": "Gujarati", "kn-IN": "Kannada", "ml-IN": "Malayalam", "mr-IN": "Marathi",
        "pa-IN": "Punjabi", "ur-IN": "Urdu",
        "id-ID": "Indonesian", "ms-MY": "Malay", "th-TH": "Thai", "vi-VN": "Vietnamese",
        "fil-PH": "Filipino",
        "tr-TR": "Turkish", "pl-PL": "Polish", "uk-UA": "Ukrainian", "ru-RU": "Russian",
        "sv-SE": "Swedish", "da-DK": "Danish", "nb-NO": "Norwegian", "fi-FI": "Finnish",
        "el-GR": "Greek", "cs-CZ": "Czech", "ro-RO": "Romanian", "hu-HU": "Hungarian",
        "sk-SK": "Slovak", "bg-BG": "Bulgarian", "hr-HR": "Croatian", "sr-RS": "Serbian",
        "sl-SI": "Slovenian", "et-EE": "Estonian", "lv-LV": "Latvian", "lt-LT": "Lithuanian",
        "he-IL": "Hebrew", "ar-XA": "Arabic", "sw-KE": "Swahili",
    }
    if lang_code in LANGUAGE_NAMES:
        return LANGUAGE_NAMES[lang_code]
    # Fallback: use the code prefix as a rough language name
    prefix = lang_code.split("-")[0] if "-" in lang_code else lang_code
    return prefix.capitalize()


def get_tts(config):
    """Initialize TTS based on configuration"""
    from livekit.plugins import openai, upliftai
    
    try:
        from livekit.plugins import deepgram
    except ImportError:
        deepgram = None

    try:
        from livekit.plugins import cartesia
    except ImportError:
        cartesia = None

    try:
        from livekit.plugins import elevenlabs
    except ImportError:
        elevenlabs = None

    try:
        from livekit.plugins import google
    except ImportError:
        google = None
    tts_config = config.get("tts_config", {})
    provider = str(tts_config.get("provider", "cartesia")).lower()
    
    # --- UPLIFTAI TTS ENFORCEMENT ---
    # Strictly initialize UpliftAI for Pioneer. Strip legacy ElevenLabs calls immediately.
    agent_name = str(config.get("name", "")).lower()
    if "pioneer" in agent_name:
        if "elevenlabs" in provider:
            logger.warning("Stripping legacy ElevenLabs API call from Pioneer agent. Forcing UpliftAI TTS to prevent unpushed audio frame errors.")
        provider = "upliftai"
        
    model = tts_config.get("model", None)
    voice_id = tts_config.get("voice_id", None)
    speed = tts_config.get("speed")

    if provider == "cartesia":
        # Cartesia voice ID (default: British Lady)
        api_key = config_service.get_api_key("cartesia")
        voice = voice_id if voice_id else "79a125e8-cd45-4c13-8a67-188112f4dd22"
        tts_kwargs = {"voice": voice, "api_key": api_key}
        if model:
            tts_kwargs["model"] = model
        if speed is not None:
            tts_kwargs["speed"] = speed
        return cartesia.TTS(**tts_kwargs)
    elif provider == "deepgram":
        if deepgram is None:
            raise ValueError("Deepgram TTS selected in GUI but livekit-plugins-deepgram is not installed/importable.")
        # Deepgram Aura TTS (default: Asteria)
        # Model format: aura-[voicename]-[language]
        api_key = config_service.get_api_key("deepgram")
        dg_model = model if model else "aura-asteria-en"
        if speed is not None:
            # Deepgram REST API supports ?speed=X but the LiveKit plugin (v1.4.4)
            # doesn't expose it. Monkey-patch the URL builder to inject speed.
            try:
                from livekit.plugins.deepgram import tts as _dg_tts_mod
                _orig_url_fn = _dg_tts_mod._to_deepgram_url
                _dg_speed = float(speed)

                def _url_with_speed(opts, base_url, *, websocket):
                    opts = opts.copy()
                    opts["speed"] = _dg_speed
                    return _orig_url_fn(opts, base_url, websocket=websocket)

                _dg_tts_mod._to_deepgram_url = _url_with_speed
            except Exception as e:
                logger.warning(f"Could not patch Deepgram TTS for speed: {e}")
        return deepgram.TTS(model=dg_model, api_key=api_key)
    elif provider == "elevenlabs":
        from livekit.plugins.elevenlabs import VoiceSettings
        # ElevenLabs voice ID (default: Sarah)
        voice = voice_id if voice_id else "EXAVITQu4vr4xnSDxMaL"
        # Dashboard uses ELEVENLABS_API_KEY, plugin expects ELEVEN_API_KEY
        api_key = config_service.get_api_key("elevenlabs")
        if not api_key:
            raise ValueError("ElevenLabs API key not configured. Please set it in Settings > Integrations.")

        tts_kwargs = {"voice_id": voice, "api_key": api_key}
        if model:
            tts_kwargs["model"] = model
            
        # Build VoiceSettings if any voice control params are set
        stability = tts_config.get("elevenlabs_stability")
        similarity = tts_config.get("elevenlabs_similarity")
        if speed is not None or stability is not None or similarity is not None:
            voice_settings = VoiceSettings(
                stability=float(stability) if stability is not None else 0.5,
                similarity_boost=float(similarity) if similarity is not None else 0.75,
            )
            if speed is not None:
                voice_settings.speed = float(speed)
            tts_kwargs["voice_settings"] = voice_settings

        return elevenlabs.TTS(**tts_kwargs)

    elif provider == "upliftai":
        api_key = config_service.get_api_key("upliftai")
        voice = voice_id if voice_id else "v_meklc281"
        master_config_id = "09167623-bfb3-4dcf-8941-25a8d66d3bb0"
        
        tts_kwargs = {
            "voice_id": voice,
            "output_format": "PCM_22050_16",
            "api_key": api_key,
        }
        
        # Initialize TTS cleanly
        tts = upliftai.TTS(**tts_kwargs)
        
        # In newer SDKs, dictionaries are often passed as an attribute 
        # to the instance rather than in the constructor. 
        # We try to set it safely here:
        try:
            tts.phrase_replacement_id = master_config_id
        except AttributeError:
            pass 
            
        return tts        
                
    elif provider == "openai":
        # ... (rest of your OpenAI code)
        # OpenAI TTS requires both model and voice parameters
        api_key = config_service.get_api_key("openai")
        voice = voice_id if voice_id else "alloy"
        tts_kwargs = {"model": model if model else "tts-1", "voice": voice, "api_key": api_key}
        if speed is not None:
            tts_kwargs["speed"] = speed
        return openai.TTS(**tts_kwargs)
        # Google Cloud TTS - uses Cloud TTS API
        gcp_config = config_service.get_integration("gcp")
        credentials_info = gcp_config.get("config_json")
        
        if not credentials_info or not isinstance(credentials_info, dict):
            # Fallback to file if specified in env
            credentials_file = os.getenv("GOOGLE_CLOUD_CREDENTIALS_FILE")
            if not credentials_file or not os.path.exists(credentials_file):
                raise ValueError("Google Cloud credentials not configured. Please set them in Settings > Integrations.")
            import json
            with open(credentials_file, 'r') as f:
                credentials_info = json.load(f)

        # Google TTS uses voice_name parameter (not model)
        # Default to Studio voices if no voice specified
        voice = model if model else "en-US-Studio-O"

        # Extract language code from voice name
        voice_parts = voice.split('-')
        if len(voice_parts) >= 2:
            language = f"{voice_parts[0]}-{voice_parts[1]}"
        else:
            language = "en-US"

        # Chirp3-HD voices require "chirp_3" model and respect TTS region setting
        if "Chirp3-HD" in voice:
            model_name = "chirp_3"
            google_cloud_tts_region = gcp_config.get("region") or os.getenv("GOOGLE_CLOUD_TTS_REGION", "")
            CHIRP3_HD_REGIONS = {"global", "us", "eu", "asia-southeast1", "asia-northeast1", "europe-west2"}
            if google_cloud_tts_region in CHIRP3_HD_REGIONS:
                location = google_cloud_tts_region
            elif google_cloud_tts_region == "":
                location = "global"  # default
            else:
                location = "global"  # fallback for unsupported regions
                logger.warning(f"Chirp 3 HD not available in region '{google_cloud_tts_region}'. Falling back to 'global'.")
            logger.info(f"Using Google Global TTS voice: {voice}, language: {language}, model: {model_name}, location: {location}")
            tts_kwargs = {
                "voice_name": voice,
                "language": language,
                "model_name": model_name,
                "credentials_info": credentials_info,
                "location": location,
            }
            if speed is not None:
                tts_kwargs["speaking_rate"] = speed
            return google.TTS(**tts_kwargs)
        else:
            # Neural2, Wavenet, Studio, Standard voices - always use global
            logger.info(f"Using Google Global TTS voice: {voice}, language: {language}")
            tts_kwargs = {
                "voice_name": voice,
                "language": language,
                "model_name": "",
                "credentials_info": credentials_info,
                "location": "global",
            }
            if speed is not None:
                tts_kwargs["speaking_rate"] = speed
            return google.TTS(**tts_kwargs)
    elif provider == "google_gemini":
        # Google Cloud Gemini TTS - uses Vertex AI (Gemini TTS)
        gcp_config = config_service.get_integration("gcp")
        credentials_info = gcp_config.get("config_json")
        location = gcp_config.get("region") or os.getenv("GOOGLE_CLOUD_TTS_REGION", "us-central1")

        if not credentials_info or not isinstance(credentials_info, dict):
            credentials_file = os.getenv("GOOGLE_CLOUD_CREDENTIALS_FILE")
            if not credentials_file or not os.path.exists(credentials_file):
                raise ValueError("Google Cloud credentials not configured. Please set them in Settings > Integrations.")
            import json
            with open(credentials_file, 'r') as f:
                credentials_info = json.load(f)

        project_id = credentials_info.get("project_id")
        if project_id:
            os.environ["GOOGLE_CLOUD_PROJECT"] = project_id

        # voice comes from voice_id (new) or model (backward compat)
        GEMINI_VOICES = {"Kore", "Puck", "Charon", "Zephyr", "Fenrir", "Leda", "Orus",
                         "Aoede", "Callirrhoe", "Autonoe", "Enceladus", "Iapetus",
                         "Umbriel", "Algieba", "Despina", "Erinome", "Algenib",
                         "Rasalgethi", "Laomedeia", "Achernar", "Alnilam", "Schedar",
                         "Gacrux", "Pulcherrima", "Achird", "Zubenelgenubi",
                         "Vindemiatrix", "Sadachbia", "Sadaltager", "Sulafat"}

        if model in GEMINI_VOICES:
            voice = model
            gemini_model = "gemini-2.5-flash-tts"
        else:
            voice = voice_id if voice_id else "Kore"
            gemini_model = model if model else "gemini-2.5-flash-tts"

        tts_language = tts_config.get("language", "")
        instructions = None
        if tts_language and tts_language != "en-US":
            lang_name = get_language_name(tts_language)
            instructions = f"Speak in {lang_name}. Use natural pronunciation and intonation."

        logger.info(f"Using Google Geo-Located TTS (Vertex AI): voice={voice}, model={gemini_model}, location={location}")
        return google_beta.GeminiTTS(
            model=gemini_model,
            voice_name=voice,
            vertexai=True,
            project=project_id,
            location=location,
            instructions=instructions,
            credentials_info=credentials_info,
        )
    elif provider == "azure_speech":
        # Azure Speech TTS via livekit-plugins-azure
        if azure_plugin is None:
            raise ValueError("Azure Speech plugin not installed. Run: poetry add livekit-plugins-azure")

        azure_config = config_service.get_integration("azure")
        speech_key = azure_config.get("api_key") or os.getenv("AZURE_SPEECH_KEY")
        speech_region = azure_config.get("config_json", {}).get("region") or os.getenv("AZURE_SPEECH_REGION")

        if not speech_key or not speech_region:
            raise ValueError("Azure Speech credentials not configured. Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in Settings > Integrations.")

        voice = voice_id if voice_id else "en-US-JennyMultilingualNeural"

        tts_kwargs = {
            "speech_key": speech_key,
            "speech_region": speech_region,
            "voice": voice,
        }

        if speed is not None:
            try:
                from livekit.plugins.azure import ProsodyConfig
                tts_kwargs["prosody"] = ProsodyConfig(rate=speed)
            except ImportError:
                logger.warning("ProsodyConfig not available in azure plugin — ignoring TTS speed setting")

        logger.info(f"Initializing Azure Speech TTS: region={speech_region}, voice={voice}")
        return azure_plugin.TTS(**tts_kwargs)
    elif provider == "azure_openai":
        # Azure OpenAI TTS via .with_azure() method
        azure_deployment = tts_config.get("azure_deployment", "") or model or "tts-1"
        azure_config = config_service.get_integration("azure")
        azure_endpoint = azure_config.get("config_json", {}).get("endpoint") or os.getenv("AZURE_OPENAI_ENDPOINT")
        azure_api_key = azure_config.get("api_key") or os.getenv("AZURE_OPENAI_API_KEY")
        azure_api_version = azure_config.get("config_json", {}).get("apiVersion") or os.getenv("AZURE_OPENAI_API_VERSION", "2025-04-01-preview")

        if not azure_deployment:
            raise ValueError("Azure OpenAI TTS deployment name is required. Configure it in the agent editor.")
        if not azure_endpoint:
            raise ValueError("Azure OpenAI endpoint is required. Configure it in Settings > Integrations.")

        voice = voice_id if voice_id else "alloy"

        logger.info(f"Initializing Azure OpenAI TTS: deployment={azure_deployment}, model={model}, voice={voice}")
        azure_tts_kwargs = {
            "azure_deployment": azure_deployment,
            "azure_endpoint": azure_endpoint,
            "api_key": azure_api_key,
            "api_version": azure_api_version,
            "model": model or "tts-1",
            "voice": voice,
        }
        if speed is not None:
            azure_tts_kwargs["speed"] = speed
        return openai.TTS.with_azure(**azure_tts_kwargs)
    elif provider == "aws_polly":
        # Amazon Polly TTS via livekit-plugins-aws
        voice = voice_id if voice_id else "Ruth"
        speech_engine = model if model else "generative"

        tts_kwargs = {
            "voice": voice,
            "speech_engine": speech_engine,
        }

        aws_config = config_service.get_integration("aws")
        aws_region = aws_config.get("region") or os.getenv("AWS_POLLY_REGION") or os.getenv("AWS_REGION")
        if aws_region:
            tts_kwargs["region"] = aws_region

        aws_access_key = aws_config.get("config_json", {}).get("accessKeyId")
        aws_secret_key = aws_config.get("api_key")
        if aws_access_key and aws_secret_key:
            tts_kwargs["api_key"] = aws_access_key
            tts_kwargs["api_secret"] = aws_secret_key
        
        return aws.PollyTTS(**tts_kwargs)

        logger.info(f"Initializing Amazon Polly TTS: voice={voice}, engine={speech_engine}, region={aws_region}")
        return aws.TTS(**tts_kwargs)
    elif provider == "groq":
        if groq_plugin is None:
            raise ValueError("Groq plugin not installed. Run: poetry add livekit-plugins-groq")
        voice = voice_id if voice_id else "autumn"
        tts_kwargs = {"voice": voice}
        if model:
            tts_kwargs["model"] = model
        logger.info(f"Initializing Groq TTS: model={model or 'canopylabs/orpheus-v1-english'}, voice={voice}")
        return groq_plugin.TTS(**tts_kwargs)
    else:
        raise ValueError(f"Unsupported TTS provider: {provider}")


def get_realtime_model(config):
    """Create a RealtimeModel for audio-to-audio mode.

    Supports multiple providers: Google (Gemini Live), OpenAI, Azure OpenAI, xAI (Grok), and AWS (Nova Sonic).
    Returns the appropriate LiveKit plugin RealtimeModel based on the provider in realtime_config.
    """
    realtime_config = config.get("realtime_config", {})
    provider = realtime_config.get("provider", "google")
    model = realtime_config.get("model", "")
    voice_name = realtime_config.get("voice", "")
    temperature = realtime_config.get("temperature")
    if temperature is None:
        temperature = config.get("llm_config", {}).get("temperature", 0.7)

    # --- OpenAI Realtime ---
    if provider == "openai":
        kwargs = {
            "model": model or "gpt-realtime",
            "voice": voice_name or "marin",
            "temperature": temperature,
        }
        api_key = config_service.get_api_key("openai")
        if api_key:
            kwargs["api_key"] = api_key

        speed = realtime_config.get("speed")
        if speed is not None and speed != "":
            kwargs["speed"] = float(speed)

        if realtime_config.get("noise_reduction"):
            from livekit.plugins.openai.realtime import NoiseReduction
            kwargs["input_audio_noise_reduction"] = NoiseReduction(type="near_field")

        # Turn detection eagerness (SemanticVad is the default mode for OpenAI)
        eagerness = realtime_config.get("turn_detection_eagerness")
        if eagerness and eagerness in ("auto", "low", "medium", "high"):
            from openai.types.realtime.realtime_audio_input_turn_detection import SemanticVad
            kwargs["turn_detection"] = SemanticVad(
                type="semantic_vad",
                eagerness=eagerness,
                create_response=True,
                interrupt_response=True,
            )

        # Modalities
        modalities = realtime_config.get("modalities")
        if modalities == "text":
            kwargs["modalities"] = ["text"]

        return openai.realtime.RealtimeModel(**kwargs)

    # --- Azure OpenAI Realtime ---
    if provider == "azure":
        azure_deployment = realtime_config.get("azure_deployment", "")
        azure_config = config_service.get_integration("azure")
        azure_endpoint = azure_config.get("config_json", {}).get("endpoint") or os.environ.get("AZURE_OPENAI_ENDPOINT")
        azure_api_version = azure_config.get("config_json", {}).get("apiVersion") or os.environ.get("AZURE_OPENAI_API_VERSION", "2025-04-01-preview")
        azure_api_key = azure_config.get("api_key") or os.environ.get("AZURE_OPENAI_API_KEY")

        if not azure_deployment:
            raise ValueError("Azure OpenAI deployment name is required. Configure it in the agent editor.")
        if not azure_endpoint:
            raise ValueError("Azure OpenAI endpoint is required. Configure it in Settings > Integrations.")

        kwargs = {
            "azure_deployment": azure_deployment,
            "azure_endpoint": azure_endpoint,
            "api_version": azure_api_version,
            "voice": voice_name or "alloy",
            "temperature": temperature,
        }
        if azure_api_key:
            kwargs["api_key"] = azure_api_key

        # Speed
        speed = realtime_config.get("speed")
        if speed is not None and speed != "":
            kwargs["speed"] = float(speed)

        # Noise reduction (same as OpenAI)
        if realtime_config.get("noise_reduction"):
            from livekit.plugins.openai.realtime import NoiseReduction
            kwargs["input_audio_noise_reduction"] = NoiseReduction(type="near_field")

        # Turn detection (SemanticVad, same as OpenAI)
        eagerness = realtime_config.get("turn_detection_eagerness")
        if eagerness and eagerness in ("auto", "low", "medium", "high"):
            from openai.types.realtime.realtime_audio_input_turn_detection import SemanticVad
            kwargs["turn_detection"] = SemanticVad(
                type="semantic_vad",
                eagerness=eagerness,
                create_response=True,
                interrupt_response=True,
            )

        # Modalities
        modalities = realtime_config.get("modalities")
        if modalities == "text":
            kwargs["modalities"] = ["text"]

        logger.info(f"Azure OpenAI Realtime: deployment={azure_deployment}, endpoint={azure_endpoint}, api_version={azure_api_version}, voice={kwargs['voice']}")
        return openai.realtime.RealtimeModel.with_azure(**kwargs)

    # --- xAI (Grok) Realtime ---
    # Note: xAI plugin hardcodes model to grok-4-1-fast-non-reasoning internally.
    # Only accepts: voice, api_key, turn_detection, base_url, max_session_duration.
    if provider == "xai":
        if xai_plugin is None:
            raise ImportError(
                "livekit-plugins-xai is not installed. "
                "Install it with: pip install livekit-plugins-xai"
            )
        api_key = config_service.get_api_key("xai")
        if not api_key:
            raise ValueError("XAI API key is required for xAI Realtime. Please configure it in Settings > Integrations.")
        kwargs = {
            "voice": voice_name or "Ara",
            "api_key": api_key,
        }

        # xAI uses ServerVad for turn detection (not SemanticVad)
        turn_detection = realtime_config.get("turn_detection")
        if turn_detection and turn_detection == "disabled":
            kwargs["turn_detection"] = None

        return xai_plugin.realtime.RealtimeModel(**kwargs)

    # --- AWS Nova Sonic Realtime ---
    if provider == "aws":
        try:
            aws_realtime = aws.realtime
        except ImportError:
            raise ImportError(
                "AWS Realtime dependencies are not installed. "
                "Install them with: pip install 'livekit-plugins-aws[realtime]'"
            )
        aws_config = config_service.get_integration("aws")
        aws_access_key = aws_config.get("config_json", {}).get("accessKeyId")
        aws_secret_key = aws_config.get("api_key")
        aws_region = aws_config.get("region") or os.getenv("AWS_REALTIME_REGION") or os.getenv("AWS_REGION", "")

        kwargs = {
            "model": model or "amazon.nova-2-sonic-v1:0",
            "voice": voice_name or "tiffany",
            "temperature": temperature,
            "access_key": aws_access_key,
            "secret_key": aws_secret_key,
        }
        if aws_region:
            kwargs["region"] = aws_region

        # AWS supports top_p and max_tokens
        top_p = realtime_config.get("top_p")
        if top_p is not None and top_p != "":
            kwargs["top_p"] = float(top_p)

        max_tokens = realtime_config.get("max_output_tokens")
        if max_tokens:
            kwargs["max_tokens"] = int(max_tokens)

        turn_detection = realtime_config.get("turn_detection_aws") or realtime_config.get("turn_detection")
        if turn_detection and turn_detection in ("HIGH", "MEDIUM", "LOW"):
            kwargs["turn_detection"] = turn_detection

        return aws_realtime.RealtimeModel(**kwargs)

    # --- Google / Google Cloud (Gemini Live) Realtime ---
    # Vertex AI Live API uses "gemini-live-*" model names; consumer API uses "gemini-*-native-audio-preview" names
    if provider == "google_cloud":
        default_model = "gemini-live-2.5-flash-native-audio"
    else:
        default_model = "gemini-2.5-flash-native-audio-preview-12-2025"

    kwargs = {
        "model": model or default_model,
        "voice": voice_name or "Puck",
        "temperature": temperature,
    }

    # Low-latency turn detection tuning
    # Note: RealtimeModel uses server-side turn detection by default or
    # can be configured with specialized turn_detection parameters.
    # We remove local VAD injection here as it is handled by the MultimodalAgent.

    if provider == "google_cloud":
        kwargs["vertexai"] = True

        # Set up credentials
        gcp_config = config_service.get_integration("gcp")
        credentials_info = gcp_config.get("config_json")
        
        if not credentials_info or not isinstance(credentials_info, dict):
            # Fallback to file if specified in env
            credentials_file = os.getenv("GOOGLE_CLOUD_CREDENTIALS_FILE")
            if not credentials_file or not os.path.exists(credentials_file):
                raise ValueError("Google Cloud credentials not configured. Please set them in Settings > Integrations.")
            import json
            with open(credentials_file, 'r') as f:
                credentials_info = json.load(f)

        project_id = credentials_info.get("project_id")
        if not project_id:
            raise ValueError("Could not extract project_id from Google Cloud credentials.")

        kwargs["project"] = project_id
        kwargs["credentials_info"] = credentials_info

        location = gcp_config.get("region") or os.environ.get("GOOGLE_CLOUD_REALTIME_REGION") or os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")
        if location == "global":
            location = "us-central1"
        logger.info(f"Vertex AI Realtime: using location={location}")

        # Warn if using a region not known to support Gemini Live
        KNOWN_REALTIME_REGIONS = {
            "us-central1", "us-east1", "us-east4", "us-east5", "us-south1", "us-west1", "us-west4",
            "europe-west1", "europe-west4", "europe-west8", "europe-central2", "europe-north1", "europe-southwest1",
            "asia-southeast1", "asia-northeast1", "asia-northeast3", "asia-south1", "asia-east1",
        }
        if location not in KNOWN_REALTIME_REGIONS:
            logger.warning(f"Vertex AI Realtime: location '{location}' may not support Gemini Live.")

        if location:
            kwargs["location"] = location

        # Pre-flight: verify Vertex AI credentials and Live API access
        try:
            import google.auth
            import google.auth.transport.requests
            creds_check, _ = google.auth.default(
                scopes=['https://www.googleapis.com/auth/cloud-platform']
            )
            auth_req = google.auth.transport.requests.Request()
            creds_check.refresh(auth_req)
            logger.info(f"Vertex AI Realtime pre-flight: credentials OK, "
                        f"project={project_id}, location={location}, "
                        f"model={kwargs['model']}, token_expiry={creds_check.expiry}")
        except Exception as e:
            logger.error(f"Vertex AI Realtime pre-flight FAILED: {e}")
            # Don't block — still attempt the connection so the existing error path runs
    else:
        api_key = config_service.get_api_key("google")
        if api_key:
            kwargs["api_key"] = api_key

    # Google-specific advanced options
    language = realtime_config.get("language", "")
    if language:
        language = LEGACY_TO_BCP47_MAP.get(language, language)
        kwargs["language"] = language

    if realtime_config.get("proactivity"):
        kwargs["proactivity"] = True

    if realtime_config.get("affective_dialog"):
        kwargs["enable_affective_dialog"] = True

    thinking_budget = realtime_config.get("thinking_budget", "auto")
    if thinking_budget != "auto":
        from google.genai import types
        budget = int(thinking_budget)
        kwargs["thinking_config"] = types.ThinkingConfig(thinking_budget=budget)

    max_tokens = realtime_config.get("max_output_tokens")
    if max_tokens:
        kwargs["max_output_tokens"] = int(max_tokens)

    top_p = realtime_config.get("top_p")
    if top_p is not None:
        kwargs["top_p"] = float(top_p)

    ctx_comp = realtime_config.get("context_compression", {})
    if ctx_comp.get("enabled"):
        from google.genai import types
        trigger = ctx_comp.get("trigger_tokens")
        target = ctx_comp.get("target_tokens")
        if trigger and target:
            kwargs["context_window_compression"] = types.ContextWindowCompressionConfig(
                sliding_window=types.SlidingWindow(target_tokens=int(target)),
                trigger_tokens=int(trigger),
            )

    # Log full connection parameters for debugging (redact api_key)
    safe_kwargs = {k: v for k, v in kwargs.items() if k not in ('api_key',)}
    logger.info(f"Google Realtime kwargs: {safe_kwargs}")

    return google_realtime.RealtimeModel(**kwargs)


def get_current_storage_provider() -> str:
    """Read storage provider from .env file to get the current setting.

    This is needed because the agent process may have been started before
    the user changed storage settings in the dashboard. Reading from the
    file ensures we use the current setting, not what was set at startup.
    """
    env_file = project_root / ".env"
    if env_file.exists():
        try:
            with open(env_file, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("STORAGE_PROVIDER="):
                        value = line.split("=", 1)[1].strip().strip('"').strip("'")
                        if value in ("local", "s3", "gcs"):
                            return value
        except Exception as e:
            logger.warning(f"Error reading STORAGE_PROVIDER from .env: {e}")
    # Fall back to environment variable or default
    return os.environ.get("STORAGE_PROVIDER", "local")


def get_current_recording_format() -> tuple:
    """Read recording format from .env file to get the current setting.

    Returns a (EncodedFileType, ext) tuple so callers don't need to import api.
    Reading from the file ensures we use the current setting, not what was set
    at startup (same pattern as get_current_storage_provider).
    """
    from livekit import api as _api

    format_map = {
        "ogg":  (_api.EncodedFileType.OGG,  "ogg"),
        "mp4":  (_api.EncodedFileType.MP4,  "mp4"),
    }

    raw = "mp4"
    env_file = project_root / ".env"
    if env_file.exists():
        try:
            with open(env_file, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("RECORDING_FORMAT="):
                        raw = line.split("=", 1)[1].strip().strip('"').strip("'").lower()
                        break
        except Exception as e:
            logger.warning(f"Error reading RECORDING_FORMAT from .env: {e}")
    else:
        raw = os.environ.get("RECORDING_FORMAT", "mp4").lower()

    return format_map.get(raw, (_api.EncodedFileType.MP4, "mp4"))


async def start_auto_recording(ctx: JobContext):
    """Start automatic audio recording for the room with cloud storage support"""
    from datetime import datetime
    from livekit import api
    from pathlib import Path

    try:
        # Get storage provider and recording format from .env (not just os.environ)
        # to pick up settings changed after the agent process started
        storage_provider = get_current_storage_provider()
        file_type, ext = get_current_recording_format()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        logger.info(f"Starting auto-recording for room: {ctx.room.name} (storage: {storage_provider}, format: {ext})")

        # Build file output based on storage provider
        if storage_provider == "s3":
            filename = f"recordings/{ctx.room.name}_{timestamp}.{ext}"
            
            aws_config = config_service.get_integration("aws")
            s3_bucket = aws_config.get("config_json", {}).get("s3Bucket") or os.environ.get("AWS_S3_BUCKET")
            s3_region = aws_config.get("region") or os.environ.get("AWS_S3_REGION") or "us-east-1"
            s3_access_key = aws_config.get("config_json", {}).get("accessKeyId") or os.environ.get("AWS_S3_ACCESS_KEY_ID")
            s3_secret_key = aws_config.get("api_key") or os.environ.get("AWS_S3_SECRET_ACCESS_KEY")

            if not all([s3_bucket, s3_access_key, s3_secret_key]):
                logger.warning("AWS S3 credentials not configured, falling back to local storage")
                storage_provider = "local"
            else:
                file_output = api.EncodedFileOutput(
                    file_type=file_type,
                    filepath=filename,
                    s3=api.S3Upload(
                        bucket=s3_bucket,
                        region=s3_region,
                        access_key=s3_access_key,
                        secret=s3_secret_key,
                    ),
                )
                logger.info(f"Recording to S3: s3://{s3_bucket}/{filename}")

        if storage_provider == "gcs":
            filename = f"recordings/{ctx.room.name}_{timestamp}.{ext}"
            gcp_config = config_service.get_integration("gcp")
            gcs_bucket = gcp_config.get("config_json", {}).get("bucket") or os.environ.get("GCS_BUCKET")
            gcs_credentials = gcp_config.get("config_json")

            if not gcs_bucket or (not gcs_credentials and not os.environ.get("GCS_STORAGE_CREDENTIALS_FILE")):
                logger.warning("GCS credentials not configured, falling back to local storage")
                storage_provider = "local"
            else:
                if not gcs_credentials:
                    # Fallback to file
                    gcs_credentials_file = os.environ.get("GCS_STORAGE_CREDENTIALS_FILE")
                    creds_path = Path(gcs_credentials_file)
                    if creds_path.exists():
                        with open(creds_path, 'r') as f:
                            gcs_credentials = f.read()
                    else:
                        gcs_credentials = None

                if not gcs_credentials:
                    logger.warning("GCS credentials not found, falling back to local storage")
                    storage_provider = "local"
                else:
                    # If gcs_credentials is a dict, convert to JSON string for GCPUpload
                    if isinstance(gcs_credentials, dict):
                        import json
                        gcs_credentials = json.dumps(gcs_credentials)

                    file_output = api.EncodedFileOutput(
                        file_type=file_type,
                        filepath=filename,
                        gcp=api.GCPUpload(
                            bucket=gcs_bucket,
                            credentials=gcs_credentials,
                        ),
                    )
                    logger.info(f"Recording to GCS: gs://{gcs_bucket}/{filename}")

        if storage_provider == "local":
            # Local storage: use /out/ prefix for Docker mount
            filename = f"/out/{ctx.room.name}_{timestamp}.{ext}"
            file_output = api.EncodedFileOutput(
                file_type=file_type,
                filepath=filename,
            )
            logger.info(f"Recording to local: {filename}")

        # Create API client using environment variables
        lk_api = api.LiveKitAPI()

        request = api.RoomCompositeEgressRequest(
            room_name=ctx.room.name,
            audio_only=True,  # Audio-only for 2 vCPU instances
            file_outputs=[file_output],
        )

        result = await lk_api.egress.start_room_composite_egress(request)
        logger.info(f"Auto-recording started successfully: egress_id={result.egress_id}")

        await lk_api.aclose()
        return result.egress_id

    except Exception as e:
        logger.error(f"Failed to start auto-recording: {e}")
        import traceback
        logger.error(traceback.format_exc())
        # Don't raise - recording failure shouldn't stop the call
        return None


# ============================================================================
# AGENT HANDOFF SUPPORT
# ============================================================================

# Global registry of all agent configurations (populated at runtime)
_agent_registry = {}


def build_agent_from_config(agent_config: dict, chat_ctx=None, is_handoff: bool = False):
    """
    Build a voice.Agent instance from an agent config dictionary.

    Args:
        agent_config: Agent configuration from Redis
        chat_ctx: Optional chat context to preserve conversation history
        is_handoff: Whether this agent is being created for a handoff (triggers greeting)

    Returns:
        Configured voice.Agent instance
    """
    from livekit.agents import function_tool, RunContext

    system_prompt = agent_config.get("system_prompt", "You are a helpful AI assistant.")
    knowledge_base = agent_config.get("knowledge_base", "")
    tool_instructions = agent_config.get("tool_instructions", "")

    # Debug: Log what we got from agent_config
    logger.info(f"Agent config keys: {list(agent_config.keys())}")
    logger.info(f"Knowledge base present: {bool(knowledge_base)}, length: {len(knowledge_base) if knowledge_base else 0}")
    if knowledge_base:
        logger.info(f"Knowledge base content preview: {knowledge_base[:200]}...")

    # Load tools for this agent (do this early to determine if tool_instructions should be appended)
    agent_id = agent_config.get("id", "")
    agent_tools = load_agent_tools(agent_id) if agent_id else []

    # Build final instructions with knowledge base and tool instructions
    final_instructions = system_prompt

    # Add knowledge base if provided
    if knowledge_base:
        final_instructions = f"{final_instructions}\n\n## Knowledge Base\nThe following information should be used to answer questions:\n{knowledge_base}"
        logger.info(f"Added knowledge base to system prompt ({len(knowledge_base)} chars)")
        logger.info(f"Final instructions now {len(final_instructions)} chars total")

    # Append tool usage instructions if tools are configured
    if agent_tools and tool_instructions:
        final_instructions = f"{final_instructions}\n\n## Tool Usage Instructions\n{tool_instructions}"
        logger.info(f"Appended tool instructions to system prompt ({len(tool_instructions)} chars)")

    # Check if realtime mode is enabled (audio-to-audio: Google, OpenAI, xAI, AWS)
    realtime_config = agent_config.get("realtime_config", {})
    is_realtime = realtime_config.get("enabled", False)

    if is_realtime:
        # Realtime mode: single stream replaces STT→LLM→TTS pipeline
        realtime_model = get_realtime_model(agent_config)
        agent_params = {
            "instructions": final_instructions,
            "llm": realtime_model,
        }
        # Text-only realtime: model outputs text, use separate TTS for speech
        if realtime_config.get("modalities") == "text":
            tts_instance = get_tts(agent_config)
            agent_params["tts"] = tts_instance
        logger.info(f"build_agent_from_config: realtime mode (provider={realtime_config.get('provider', 'unknown')})")
    else:
        # Standard pipeline: STT → LLM → TTS
        llm_instance = get_llm(agent_config)
        stt = get_stt(agent_config)
        tts_instance = get_tts(agent_config)

        # Get conversation dynamics
        dynamics = agent_config.get("conversation_dynamics", {})
        agent_response_delay = dynamics.get("agent_response_delay", 0.4)

        # Force local VAD
        vad_instance = silero.VAD.load(
            activation_threshold=0.5,
            min_silence_duration=0.6,
        )

        agent_params = {
            "instructions": final_instructions,
            "stt": stt,
            "llm": llm_instance,
            "tts": tts_instance,
            "vad": vad_instance,
            "turn_handling": {
                "endpointing": {
                    "min_delay": agent_response_delay,
                    "max_delay": 5.0,
                },
                "interruption": {
                    "enabled": True,
                    "mode": "vad",
                }
            }
        }

        # Use aggressive 3-turn truncation (6 messages) to minimize TTFT
        full_ctx = ChatContext()
        agent_params["chat_ctx"] = full_ctx

    # Add chat context if provided (for handoff continuity)
    if chat_ctx is not None:
        agent_params["chat_ctx"] = chat_ctx

    # Store initial greeting for handoff use (agent speaks on_enter)
    handoff_greeting = None
    if is_handoff:
        initial_greeting = agent_config.get("initial_greeting", "").strip()
        if initial_greeting:
            handoff_greeting = initial_greeting
            logger.info(f"Agent will greet after handoff: {initial_greeting[:50]}...")

    if agent_tools:
        from typing import Optional
        tools_list = []

        def create_handoff_tool_handler(t):
            """Create a typed handler for handoff tools (same approach as main tools)."""
            schema = t.get_parameters_schema()
            properties = schema.get("properties", {})
            required = schema.get("required", [])

            if not properties:
                async def no_param_handler():
                    logger.info(f"Handoff tool called: {t.name} (no params)")
                    try:
                        result = await t.execute(None)
                        return json.dumps(result) if isinstance(result, dict) else str(result)
                    except Exception as e:
                        logger.error(f"Tool {t.name} error: {e}")
                        return json.dumps({"error": str(e)})
                return no_param_handler

            param_names = list(properties.keys())
            param_defs = []
            for name in param_names:
                prop = properties[name]
                prop_type = prop.get("type", "string")
                default = prop.get("default")
                type_map = {"string": "str", "integer": "int", "number": "float", "boolean": "bool"}
                py_type = type_map.get(prop_type, "str")

                if name in required:
                    param_defs.append(f"{name}: {py_type}")
                elif default is not None:
                    param_defs.append(f"{name}: {py_type} = {repr(default)}")
                else:
                    param_defs.append(f"{name}: Optional[{py_type}] = None")

            params_str = ", ".join(param_defs)
            kwargs_build = ", ".join([f'"{n}": {n}' for n in param_names])

            func_code = f'''
async def typed_handler({params_str}):
    kwargs = {{{kwargs_build}}}
    kwargs = {{k: v for k, v in kwargs.items() if v is not None}}
    logger.info(f"Handoff tool called: {t.name} with args: {{kwargs}}")
    try:
        result = await tool_ref.execute(None, **kwargs)
        return json.dumps(result) if isinstance(result, dict) else str(result)
    except Exception as e:
        logger.error(f"Tool {t.name} error: {{e}}")
        return json.dumps({{"error": str(e)}})
'''
            local_vars = {"tool_ref": t, "logger": logger, "json": json, "Optional": Optional}
            exec(func_code, local_vars)
            return local_vars["typed_handler"]

        for tool in agent_tools:
            handler = create_handoff_tool_handler(tool)
            decorated_tool = function_tool(handler, name=tool.name, description=tool.description)
            tools_list.append(decorated_tool)

        agent_params["tools"] = tools_list

    # If this is a handoff with a greeting, create a custom agent with on_enter hook
    if handoff_greeting:
        # Create a custom Agent class that speaks the greeting on enter
        class HandoffAgent(voice.Agent):
            def __init__(self, greeting, **kwargs):
                super().__init__(**kwargs)
                self._handoff_greeting = greeting

            async def on_enter(self) -> None:
                """Speak the greeting when this agent takes control after a handoff."""
                if self._handoff_greeting and hasattr(self, 'session') and self.session:
                    logger.info(f"Handoff agent on_enter: generating greeting reply")
                    try:
                        await self.session.generate_reply(
                            instructions=f"Introduce yourself by saying: {self._handoff_greeting}"
                        )
                    except Exception as e:
                        logger.error(f"Error generating handoff greeting: {e}")

        return HandoffAgent(greeting=handoff_greeting, **agent_params)

    _attached_tools = agent_params.get("tools", [])
    logger.info(f"Runtime tools attached: {len(_attached_tools)}")
    return voice.Agent(**agent_params)


def create_handoff_tools_with_session_ref(agent_id: str, session_ref: dict, call_tracker_ref: dict, current_agent_name: str = "Agent"):
    """
    Create handoff tools for an agent based on its handoff configuration.

    Args:
        agent_id: The current agent's ID
        session_ref: Mutable dict containing {"session": AgentSession} - updated after session starts
        call_tracker_ref: Mutable dict containing {"tracker": CallTracker} - for logging handoffs
        current_agent_name: Name of the current agent (for logging)

    Returns:
        List of function_tool decorated handoff functions, or empty list if no handoffs configured
    """
    if not handoff_manager:
        return []

    from livekit.agents import function_tool, RunContext

    # Get handoff config for this agent
    handoff_config = handoff_manager.get_agent_handoffs(agent_id)

    if not handoff_config.get("enabled"):
        return []

    allowed_targets = handoff_config.get("allowed_targets", [])
    if not allowed_targets:
        return []

    handoff_tools = []

    for target in allowed_targets:
        target_agent_id = target.get("agent_id")
        target_name = target.get("agent_name", "Unknown Agent")
        description = target.get("description", f"Transfer to {target_name}")
        context_mode = target.get("context_mode", "full")
        announce_transfer = target.get("announce_transfer", True)
        sign_off_prompt = target.get("sign_off_prompt", "")
        handoff_type = target.get("handoff_type", "transfer")  # backward compatible

        # Skip if target agent not in registry
        if target_agent_id not in _agent_registry:
            logger.warning(f"Handoff target {target_agent_id} not found in agent registry")
            continue

        # Modify description based on handoff_type, sign_off_prompt, and announce_transfer settings
        if handoff_type == "transition":
            # Transition: silent workflow phase change
            if sign_off_prompt:
                # Transition with bridge phrase
                description = f"{description}. Before calling this tool, naturally say: \"{sign_off_prompt}\" - then immediately call the tool."
            if not announce_transfer:
                # Silent transition (default for transitions)
                description = f"[SEAMLESS TRANSITION] {description}. CRITICAL: This is a seamless workflow transition - the caller must NOT notice any change. Do NOT say 'let me transfer you', 'I'll connect you', or anything that implies a different agent or department. Continue the conversation naturally as if you are the same person moving to the next topic. Just call this tool seamlessly."
            else:
                # Announced transition (unusual but allowed)
                if not sign_off_prompt:
                    description = f"{description}. Continue the conversation naturally as you transition to this next phase."
        else:
            # Transfer: explicit department handoff (existing behavior)
            if sign_off_prompt:
                description = f"{description}. IMPORTANT: Before calling this tool, you MUST say the following to the caller: \"{sign_off_prompt}\" - say this exact message, then immediately call the tool."

            if not announce_transfer:
                if sign_off_prompt:
                    description = f"{description} Do NOT add any additional transfer announcement after saying the sign-off message."
                else:
                    description = f"[SILENT TRANSFER] {description}. CRITICAL: This is a SILENT transfer - you must NOT say anything about transferring. Do NOT say 'let me transfer you' or 'I'll connect you' or anything similar. Just call this tool with no spoken response. The caller should not know a transfer is happening."

        # Create the handoff function
        def make_handoff_handler(tid, tname, cmode, sref, tracker_ref, announce, from_agent, htype):
            async def handoff_to_agent(ctx: RunContext, reason: str = ""):
                """
                Transfer the call to another agent.

                Args:
                    reason: Reason for the transfer (for logging)
                """
                logger.info(f"Handoff requested to {tname} (id={tid}), type={htype}, reason: {reason}, announce={announce}")

                # Log the handoff to call tracker
                tracker = tracker_ref.get("tracker")
                if tracker:
                    tracker.on_handoff(
                        from_agent=from_agent,
                        to_agent=tname,
                        reason=reason,
                        silent=not announce
                    )

                target_config = _agent_registry.get(tid)
                if not target_config:
                    logger.error(f"Target agent {tid} not found")
                    return {"error": f"Agent {tname} not available"}

                # Get session from reference
                session = sref.get("session")

                # Get chat context based on mode
                chat_ctx = None
                if cmode == "full":
                    # Pass full conversation history
                    if session and hasattr(session, 'history'):
                        chat_ctx = session.history.copy()
                        logger.info(f"Handoff with full context ({len(list(chat_ctx.items))} messages)")
                    else:
                        logger.warning("Session has no history, using fresh context")
                elif cmode == "summary":
                    # Generate AI summary of the conversation
                    if session and hasattr(session, 'history'):
                        try:
                            history = session.history
                            messages = list(history.items)
                            if messages:
                                # Build conversation text for summary
                                conv_text = "\n".join([
                                    f"{msg.role}: {msg.text_content if hasattr(msg, 'text_content') else str(msg.content)}"
                                    for msg in messages if hasattr(msg, 'role')
                                ])
                                # Create a new ChatContext with summary as system message
                                from livekit.agents import llm
                                chat_ctx = llm.ChatContext()
                                summary_msg = f"[CONVERSATION SUMMARY FROM PREVIOUS AGENT]\nThe caller was speaking with another agent. Here's a summary of the conversation:\n{conv_text[:2000]}\n[END SUMMARY - Continue helping the caller from here]"
                                chat_ctx.add_message(role="system", content=summary_msg)
                                logger.info(f"Handoff with summary context (summarized {len(messages)} messages)")
                            else:
                                logger.info("Handoff with summary context (no messages to summarize)")
                        except Exception as e:
                            logger.error(f"Error creating summary context: {e}")
                            # Fall back to full context
                            chat_ctx = session.history.copy() if hasattr(session, 'history') else None
                    else:
                        logger.warning("Session has no history for summary, using fresh context")
                else:
                    # Fresh mode - start with no context
                    logger.info(f"Handoff with fresh context (no history passed)")

                # Build and return the new agent (triggers LiveKit handoff)
                # Pass is_handoff=True so we can trigger the greeting
                new_agent = build_agent_from_config(target_config, chat_ctx=chat_ctx, is_handoff=True)
                logger.info(f"Created new agent for handoff: {tname}")

                # Return the new agent - LiveKit handles the handoff
                return new_agent

            return handoff_to_agent

        handler = make_handoff_handler(target_agent_id, target_name, context_mode, session_ref, call_tracker_ref, announce_transfer, current_agent_name, handoff_type)

        # Create the tool with dynamic name and description
        prefix = "transfer_to" if handoff_type == "transfer" else "transition_to"
        tool_name = f"{prefix}_{target_name.lower().replace(' ', '_')}"
        decorated = function_tool(handler, name=tool_name)
        handoff_tools.append(decorated)

        logger.info(f"Created handoff tool: {tool_name} -> {target_name} (type={handoff_type}, announce={announce_transfer}, sign_off={bool(sign_off_prompt)})")

    return handoff_tools


async def generate_text_response(
    user_text: str,
    agent_config: dict,
    chat_history: list = None,
    text_llm: str = None,
    tools: list = None,
    text_context: 'TextModeContext' = None
) -> str:
    """
    Generate a text response using the selected LLM, with optional tool support.

    Args:
        user_text: The user's text input
        agent_config: The agent configuration
        chat_history: Optional list of {"role": str, "content": str} messages for context
        text_llm: Optional LLM selection in format "provider:model" (e.g., "openai:gpt-4o-mini")
        tools: Optional list of tool instances to make available to the LLM
        text_context: Optional TextModeContext for tool execution

    Returns:
        The generated response text
    """
    try:
        # Get system prompt from agent config
        system_prompt = agent_config.get("system_prompt", "You are a helpful assistant.")

        # Parse LLM selection or use default
        if text_llm and ":" in text_llm:
            llm_provider, llm_model = text_llm.split(":", 1)
        else:
            # Default to OpenAI GPT-4o Mini
            llm_provider = "openai"
            llm_model = "gpt-4o-mini"

        logger.info(f"Text chat using: {llm_provider}/{llm_model}")

        # Build messages for the LLM
        messages = [{"role": "system", "content": system_prompt}]

        # Add conversation history if available (last 20 messages for context)
        if chat_history:
            messages.extend(chat_history[-20:])

        # Add the current user message
        messages.append({"role": "user", "content": user_text})

        # Create LLM instance based on selected provider
        llm_instance = None
        if llm_provider == "openai":
            llm_instance = openai.LLM(model=llm_model)
        elif llm_provider == "anthropic":
            from livekit.plugins import anthropic
            # Map friendly model names to Anthropic model IDs
            anthropic_models = {
                # Claude 4.6 family (current)
                "claude-sonnet-4-6": "claude-sonnet-4-6",
                # Claude 4.5 family
                "claude-sonnet-4-5": "claude-sonnet-4-5-20250929",
                "claude-haiku-4-5": "claude-haiku-4-5-20251001",
                # Backward compatibility for old config values
                "claude-sonnet-4-5-latest": "claude-sonnet-4-5-20250929",
                "claude-haiku-4-5-latest": "claude-haiku-4-5-20251001",
                # Claude 4 family (legacy)
                "claude-sonnet-4": "claude-sonnet-4-20250514",
                # Claude 3.x family (legacy)
                "claude-3-5-sonnet": "claude-3-5-sonnet-20241022",
                "claude-3-haiku": "claude-3-haiku-20240307",
            }
            model_id = anthropic_models.get(llm_model, llm_model)
            llm_instance = anthropic.LLM(model=model_id)
        elif llm_provider == "google":
            llm_instance = google.LLM(model=llm_model)
        elif llm_provider == "google_cloud":
            # Google Gemini via Vertex AI — mirrors voice mode init
            import json as _json
            credentials_file = os.getenv("GOOGLE_CLOUD_CREDENTIALS_FILE")
            if not credentials_file or not os.path.exists(credentials_file):
                raise ValueError("Google Cloud credentials file not configured. Please set it in Settings > Integrations.")
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = credentials_file
            with open(credentials_file, 'r') as f:
                credentials_info = _json.load(f)
            project_id = credentials_info.get("project_id")
            if not project_id:
                raise ValueError("Could not extract project_id from Google Cloud credentials file.")
            google_llm_region = os.getenv("GOOGLE_CLOUD_LLM_REGION", "") or "global"
            llm_instance = google.LLM(model=llm_model, vertexai=True, project=project_id, location=google_llm_region)
        elif llm_provider == "xai":
            llm_instance = openai.LLM.with_x_ai(model=llm_model)
        elif llm_provider == "groq":
            if groq_plugin is None:
                raise ValueError("Groq plugin not installed. Run: poetry add livekit-plugins-groq")
            llm_instance = groq_plugin.LLM(model=llm_model)
        elif llm_provider == "bedrock":
            from livekit.plugins import aws
            # Map friendly names to cross-region inference profile IDs
            bedrock_models = {
                "claude-sonnet-4.6": "apac.anthropic.claude-sonnet-4-6",
                "claude-sonnet-4.5": "apac.anthropic.claude-3-5-sonnet-20241022-v2:0",
                "claude-haiku-4.5": "au.anthropic.claude-haiku-4-5-20251001-v1:0",
            }
            model_id = bedrock_models.get(llm_model, llm_model)
            region = os.getenv("AWS_REGION", "ap-southeast-2")
            llm_instance = aws.LLM(model=model_id, region=region)
        else:
            raise ValueError(f"LLM provider '{llm_provider}' is not supported in text mode. Supported: openai, anthropic, google, google_cloud, xai, groq, bedrock.")

        # Generate response using chat API
        chat_ctx = ChatContext()
        for msg in messages:
            chat_ctx.add_message(role=msg["role"], content=msg["content"])

        # Create tool list for LLM if provided
        llm_tools = None
        if tools and text_context:
            llm_tools = create_text_mode_tools(tools, text_context)
            if llm_tools:
                logger.info(f"Text mode: {len(llm_tools)} tools available")

        # Stream the response with optional tool support
        response_text = ""
        logger.info(f"Starting LLM chat stream (tools={'yes' if llm_tools else 'no'})...")

        # Tool call handling loop - may need multiple iterations if tools are called
        max_tool_iterations = 5  # Prevent infinite loops
        iteration = 0

        while iteration < max_tool_iterations:
            iteration += 1

            # Call LLM with or without tools
            if llm_tools:
                stream = llm_instance.chat(chat_ctx=chat_ctx, tools=llm_tools)
            else:
                stream = llm_instance.chat(chat_ctx=chat_ctx)

            chunk_count = 0
            tool_calls_pending = []
            current_response = ""

            async with stream:
                async for chunk in stream:
                    chunk_count += 1

                    # Log first chunk for debugging
                    if chunk_count == 1:
                        logger.info(f"Chunk type: {type(chunk).__name__}, attrs: {[a for a in dir(chunk) if not a.startswith('_')][:15]}")

                    # Handle ChatChunk: delta contains content and tool_calls
                    if hasattr(chunk, 'delta') and chunk.delta:
                        delta = chunk.delta
                        if hasattr(delta, 'content') and delta.content:
                            current_response += delta.content
                        if hasattr(delta, 'tool_calls') and delta.tool_calls:
                            for tc in delta.tool_calls:
                                logger.info(f"Tool call detected: {tc}")
                                tool_calls_pending.append(tc)
                    elif hasattr(chunk, 'choices') and chunk.choices:
                        delta = chunk.choices[0].delta
                        if hasattr(delta, 'content') and delta.content:
                            current_response += delta.content
                    elif hasattr(chunk, 'content') and chunk.content:
                        current_response += chunk.content
                    elif isinstance(chunk, str):
                        current_response += chunk

            logger.info(f"Iteration {iteration}: {chunk_count} chunks, response={len(current_response)} chars, tool_calls={len(tool_calls_pending)}")

            # If no tool calls, we're done
            if not tool_calls_pending:
                response_text = current_response
                break

            # Execute tool calls and add results to context
            for tc in tool_calls_pending:
                try:
                    tool_name = tc.name if hasattr(tc, 'name') else str(tc)
                    tool_args = tc.arguments if hasattr(tc, 'arguments') else {}
                    logger.info(f"Executing tool: {tool_name} with args: {tool_args}")

                    # Find and execute the tool
                    tool_result = {"error": f"Tool {tool_name} not found"}
                    for tool in tools:
                        if tool.name == tool_name:
                            tool_result = await tool.execute(text_context, **tool_args)
                            break

                    result_str = json.dumps(tool_result) if isinstance(tool_result, dict) else str(tool_result)
                    logger.info(f"Tool result: {result_str[:200]}")

                    # Add tool result to chat context for next iteration
                    chat_ctx.add_message(role="tool", content=result_str)

                except Exception as e:
                    logger.error(f"Tool execution error: {e}")
                    chat_ctx.add_message(role="tool", content=json.dumps({"error": str(e)}))

        logger.info(f"LLM chat complete: {iteration} iterations, response length: {len(response_text)}")
        return response_text.strip()

    except Exception as e:
        logger.error(f"Error generating text response: {e}")
        import traceback
        traceback.print_exc()
        return f"I apologize, but I encountered an error processing your message. Please try again."


import asyncpg

async def check_agent_running_status_db(agent_id_or_slug: str) -> bool:
    """Verifies if an agent is marked as 'running' in PostgreSQL."""
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        logger.error("GATEKEEPER ERROR: DATABASE_URL missing. Rejection by default.")
        return False

    try:
        conn = await asyncpg.connect(db_url)
        try:
            # Special logic for catch-all SIP jobs (telephony-agent)
            # If the name is telephony-agent/empty, we allow the job if AT LEAST ONE agent is running.
            if agent_id_or_slug in ["telephony-agent", ""]:
                row = await conn.fetchrow("SELECT COUNT(*) as active_count FROM agents WHERE status = 'running'")
                if row and row['active_count'] > 0:
                    logger.info(f"GATEKEEPER: '{agent_id_or_slug}' (Catch-all) accepted as {row['active_count']} agent(s) are active in GUI.")
                    return True
                return False

            # Specific lookup by ID or Slug for direct dispatch or transfer routing
            row = await conn.fetchrow(
                "SELECT status FROM agents WHERE id = $1 OR slug = $1",
                agent_id_or_slug
            )
            
            if row and row['status'].lower() == 'running':
                return True
            
            # Sub-match logic for prefixed IDs
            if not row:
                row = await conn.fetchrow(
                    "SELECT status FROM agents WHERE $1 LIKE '%' || id || '%' OR $1 LIKE '%' || slug || '%'",
                    agent_id_or_slug
                )
                if row and row['status'].lower() == 'running':
                    return True

            return False
        finally:
            await conn.close()
    except Exception as e:
        logger.error(f"GATEKEEPER DB-CHECK FAILED: {e}")
        return False

def prewarm(proc):
    """Hot-load AI models before the phone even rings."""
    from livekit.plugins import silero
    import logging
    logger = logging.getLogger("voice-agent")
    
    logger.info("--- HOT BOOT: Pre-warming AI Models ---")
    
    # Pre-load the heavy ONNX VAD model into CPU memory instantly
    try:
        silero.VAD.load()
        logger.info("--- HOT BOOT: VAD Model Loaded into Memory Successfully ---")
    except Exception as e:
        logger.error(f"--- HOT BOOT FAILED: {e} ---")

async def request_fnc(req: JobRequest) -> None:
    """
    The Gatekeeper: Intercepts the call before the agent picks up.
    Ensures 'Stopped' agents don't answer calls and splits traffic by WORKER_MODE.
    """
    worker_mode = os.getenv("WORKER_MODE", "any").lower()
    agent_name = req.job.agent_name
    job_metadata = req.job.metadata or "{}"
    agent_id_or_slug = ""
    
    try:
        meta_obj = json.loads(job_metadata)
        agent_id_or_slug = meta_obj.get("agentId") or meta_obj.get("agent_slug") or ""
        is_dialer_job = meta_obj.get("is_campaign_dispatch") or meta_obj.get("is_dialer")
    except json.JSONDecodeError:
        is_dialer_job = False
        
    # Phase 1: Pipeline Specialization (Inbound vs Outbound isolation)
    if worker_mode == "inbound" and (is_dialer_job or agent_name == "outbound-agent"):
        logger.warning(f"Inbound worker ignoring Outbound job for agent '{agent_id_or_slug}'")
        await req.reject()
        return
        
    if worker_mode == "outbound" and not is_dialer_job and agent_name == "telephony-agent":
        logger.warning(f"Outbound worker ignoring Inbound job for agent '{agent_id_or_slug}'")
        await req.reject()
        return

    # Phase 2: GUI Status Check (Universal gatekeeper)
    if not agent_id_or_slug or agent_id_or_slug == "telephony-agent":
        logger.info("Universal 'telephony-agent' detected. Granting bypass access.")
        await req.accept()
        return

    logger.info(f"Incoming call gatekeeping for agent: '{agent_id_or_slug}' (WorkMode={worker_mode})")
    
    is_active = await check_agent_running_status_db(agent_id_or_slug)
    
    if is_active:
        logger.info(f"Agent '{agent_id_or_slug}' is RUNNING. Job Accepted.")
        await req.accept()
    else:
        logger.warning(f"Agent '{agent_id_or_slug}' is STOPPED in the GUI. Job Rejected.")
        await req.reject()


def normalize_dict(value):
    import json
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value) if value.strip() else {}
            return parsed if isinstance(parsed, dict) else {}
        except Exception:
            return {}
    return {}


def normalize_tools_config(value):
    import json
    if isinstance(value, list):
        return value
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value) if value.strip() else []
            return parsed if isinstance(parsed, (dict, list)) else []
        except Exception:
            return []
    return []


async def get_active_ticket_from_db(caller_phone: str):
    """HARD STATE LOCK: Queries PostgreSQL directly for an active, unresolved ticket.
    
    Uses psycopg2 + asyncio.to_thread for non-blocking execution.
    Returns a dict with ticket_id and name if found, or None.
    """
    db_url = os.getenv("DATABASE_URL")
    if not db_url or not caller_phone:
        return None

    def _sync_query():
        import psycopg2
        from psycopg2.extras import RealDictCursor
        
        # Phone Normalization: Support +92..., 92..., and 0... formats
        phone_no_plus = caller_phone.replace("+", "")
        # If it starts with 92, also check the local 0-prefix version
        phone_local = "0" + phone_no_plus[2:] if phone_no_plus.startswith("92") else None
        
        conn = psycopg2.connect(db_url, cursor_factory=RealDictCursor)
        try:
            with conn.cursor() as cur:
                # Query for ticket ID and the caller's name
                # Multi-Column Search: Check both the collected 'phone' and the verified 'asterisk_number'
                # This ensures we find the latest ticket even if the phone column is masked/redacted.
                cur.execute("""
                    SELECT ticket_id, name FROM complaints
                    WHERE (phone = %s OR phone = %s OR phone = %s OR asterisk_number = %s OR asterisk_number = %s OR asterisk_number = %s)
                    AND LOWER(status) NOT IN ('resolved', 'closed')
                    ORDER BY created_at DESC LIMIT 1
                """, (caller_phone, phone_no_plus, phone_local or phone_no_plus, caller_phone, phone_no_plus, phone_local or phone_no_plus))
                row = cur.fetchone()
                return row if row else None
        finally:
            conn.close()

    try:
        return await asyncio.to_thread(_sync_query)
    except Exception as e:
        logger.warning(f"Hard State DB Check failed (Fallback to LLM memory): {e}")
        return None


async def entrypoint(ctx: JobContext):
    """Voice assistant entrypoint"""
    # --- Global Scope Audit: Guaranteed Variable Initialization ---
    is_telephony_agent = getattr(ctx.job, 'agent_name', None) in ("telephony-agent", "outbound-agent")
    is_inbound_worker = os.getenv("WORKER_MODE") == "inbound"
    auto_record_enabled = False # Default policy
    agent_slug = ""
    agent_config = None
    # --- End Global Scope Audit ---

    # SARAH V11 HEARTBEAT: Standardized Boot Sequence
    logger.info({
        "message": "SARAH_V11_BOOT_SEQUENCE_ACTIVE",
        "file": __file__,
        "version": "1.11.0-DEFIANCE",
        "rtc_check": "awaitable"
    })
    
    # V11 Discovery - Logic moved to top level for global scope safety

    global _agent_registry
    
    # --- Phase 1: Dynamic Agent Resolution ---
    # Initialize routing variables
    agent_slug = ""
    initial_slug_guess = ""
    auto_record = False
    test_mode = "voice"
    is_agent_tester_call = False
    text_llm = None
    agent_type = "voice"
    input_mode = "voice"
    is_simulation_test = False
    simulation_id = ""
    simulation_role = ""
    test_variables = {}
    inline_config = None

    # Step A: Parse Job Metadata (Primary for Dispatcher/Unified Jobs)
    job_metadata = getattr(ctx.job, 'metadata', None) or ""
    if job_metadata:
        try:
            meta_obj = json.loads(job_metadata)
            agent_slug = meta_obj.get("agent_slug", "")
            auto_record = meta_obj.get("auto_record", False)
            test_mode = meta_obj.get("test_mode", "voice")
            text_llm = meta_obj.get("text_llm")
            is_agent_tester_call = meta_obj.get("is_agent_tester", False)
            agent_type = meta_obj.get("agent_type", "voice")
            input_mode = meta_obj.get("input_mode", "voice")
            is_simulation_test = meta_obj.get("is_simulation_test", False)
            simulation_id = meta_obj.get("simulation_id", "")
            simulation_role = meta_obj.get("simulation_role", "")
            test_variables = meta_obj.get("test_variables", {})
            inline_config = meta_obj.get("inline_config")
            logger.info(f"Job metadata resolved: agent_slug='{agent_slug}', auto_record={auto_record}, test_mode='{test_mode}'")
        except json.JSONDecodeError:
            logger.warning(f"Failed to parse job metadata: {job_metadata}")

    # Step B: Parse Room Metadata (Fallback for SIP Routing)
    room_metadata = getattr(ctx.room, 'metadata', None) or ""
    if room_metadata:
        try:
            rmeta = json.loads(room_metadata)
            if rmeta.get("agentId") and not agent_slug:
                agent_slug = rmeta.get("agentId")
                logger.info(f"Room metadata routing detected agentId: {agent_slug}")
            if rmeta.get("agent_name") and not agent_slug:
                agent_slug = rmeta.get("agent_name")
                logger.info(f"Room metadata routing detected agent_name: {agent_slug}")
        except json.JSONDecodeError:
            pass

    # Step C: Special Worker Logic (Dynamic Fallback & SIP Attributes)
    # Inbound Workers: Attempt to resolve identity via SIP before fetching config
    if is_inbound_worker and (not agent_slug or is_telephony_agent):
        for p in ctx.room.remote_participants.values():
            attrs = getattr(p, 'attributes', {}) or {}
            to_number = attrs.get("sip.calledNumber")
            if to_number:
                try:
                    r = agent_storage.get_redis_client()
                    resolved_id = r.get(f"dispatch_rule:{to_number}")
                    if resolved_id:
                        agent_slug = resolved_id
                        logger.info(f"SIP Redis routing resolved: {to_number} -> {agent_slug}")
                        break
                except: pass

        # --- Mandatory safety correction: Feature Flag Guarded ViciDial Integration ---
        is_vicidial_enabled = os.getenv("VICIDIAL_INTEGRATION_ENABLED", "false").lower() == "true"
        logger.info(f"[VICIDIAL_CONTEXT] lookup_enabled={is_vicidial_enabled}")
        
        if is_vicidial_enabled:
            caller_phone = ""
            call_id = ""
            for p in ctx.room.remote_participants.values():
                attrs = getattr(p, 'attributes', {}) or {}
                caller_phone = attrs.get("sip.phoneNumber") or attrs.get("sip.callerNumber") or ""
                call_id = attrs.get("sip.callID") or ""
                if caller_phone or call_id:
                    break
            
            # Fallback to room name pattern for phone number
            if not caller_phone and ctx.room.name:
                import re
                phone_match = re.search(r'_?(\+?\d{10,15})_', ctx.room.name)
                if phone_match:
                    caller_phone = phone_match.group(1)
            
            clean_phone = ""
            if caller_phone:
                import re
                clean_phone = re.sub(r'[\+\s\-\(\)]', '', caller_phone)
                
            # Perform multi-key Redis lookups in strict priority: uniqueid -> lead_id -> phone
            vicidial_ctx_raw = None
            matched_key = None
            
            try:
                r = agent_storage.get_redis_client()
                
                # Priority 1: uniqueid
                if call_id and not vicidial_ctx_raw:
                    uniqueid_key = f"vicidial_context:uniqueid:{call_id}"
                    vicidial_ctx_raw = r.get(uniqueid_key)
                    if vicidial_ctx_raw:
                        matched_key = uniqueid_key
                
                # Priority 2: phone
                if clean_phone and not vicidial_ctx_raw:
                    phone_key = f"vicidial_context:phone:{clean_phone}"
                    vicidial_ctx_raw = r.get(phone_key)
                    if vicidial_ctx_raw:
                        matched_key = phone_key
                        
                # Priority 3: phone with leading zero/country prefix stripped
                if clean_phone and not vicidial_ctx_raw:
                    stripped_phone = clean_phone.lstrip("0").lstrip("1")
                    # Try matching keys with patterns
                    for key in r.keys("vicidial_context:phone:*"):
                        if key.endswith(stripped_phone):
                            vicidial_ctx_raw = r.get(key)
                            if vicidial_ctx_raw:
                                matched_key = key
                                break
            except Exception as redis_err:
                logger.error(f"[VICIDIAL_CONTEXT] Redis connection/lookup failed: {redis_err}")
                
            if vicidial_ctx_raw:
                try:
                    vicidial_ctx = json.loads(vicidial_ctx_raw)
                    logger.info(f"[VICIDIAL_CONTEXT] lookup_hit=true key={matched_key}")
                    
                    v_camp = vicidial_ctx.get("vicidial_campaign_id")
                    v_list = vicidial_ctx.get("vicidial_list_id")
                    v_ingroup = vicidial_ctx.get("vicidial_ingroup")
                    v_lead_id = vicidial_ctx.get("vicidial_lead_id")
                    
                    # Mapping priority resolution
                    resolved_mapping = await agent_storage.resolve_vicidial_agent_mapping(v_camp, v_list, v_ingroup)
                    
                    if resolved_mapping:
                        mapped_slug = resolved_mapping.get("agent_slug") or resolved_mapping.get("agent_id")
                        if mapped_slug:
                            # Verify mapped agent exists and is active
                            target_config = await agent_storage.get_agent_config_by_id_or_slug(mapped_slug)
                            if target_config and target_config.get("status") == "running":
                                agent_slug = mapped_slug
                                
                                # Enrich job metadata with normalized parameters
                                try:
                                    meta_obj = json.loads(job_metadata) if job_metadata else {}
                                except:
                                    meta_obj = {}
                                
                                meta_obj["source"] = "vicidial"
                                meta_obj["type"] = "vicidial"
                                meta_obj["campaign_id"] = resolved_mapping.get("id") # Unique mapping ID
                                meta_obj["lead_id"] = v_lead_id
                                meta_obj["external_record_id"] = v_lead_id
                                meta_obj["phone"] = clean_phone
                                meta_obj["contact_name"] = vicidial_ctx.get("contact_name") or "Customer"
                                meta_obj["dynamic_vars"] = vicidial_ctx.get("lead_data", {})
                                meta_obj["lead_data"] = vicidial_ctx.get("lead_data", {})
                                meta_obj["opening_message"] = resolved_mapping.get("opening_message")
                                meta_obj["call_goal"] = resolved_mapping.get("call_goal") or f"ViciDial Mapping - {resolved_mapping.get('name')}"
                                meta_obj["script"] = resolved_mapping.get("script")
                                
                                # Store all identifiers in root
                                meta_obj["vicidial_campaign_id"] = v_camp
                                meta_obj["vicidial_list_id"] = v_list
                                meta_obj["vicidial_lead_id"] = v_lead_id
                                meta_obj["vicidial_ingroup"] = v_ingroup
                                meta_obj["vicidial_call_uniqueid"] = vicidial_ctx.get("vicidial_call_uniqueid") or call_id
                                meta_obj["mapping_id"] = resolved_mapping.get("id")
                                meta_obj["agent_id"] = target_config.get("id")
                                meta_obj["agent_slug"] = mapped_slug
                                
                                job_metadata = json.dumps(meta_obj)
                                logger.info(f"[VICIDIAL_AGENT] override_applied=true agent_slug={mapped_slug}")
                            else:
                                logger.warning(f"[VICIDIAL_AGENT] fallback reason=mapped_agent_inactive agent_slug={mapped_slug}")
                        else:
                            logger.warning(f"[VICIDIAL_AGENT] fallback reason=missing_agent_reference mapping_id={resolved_mapping.get('id')}")
                    else:
                        logger.info(f"[VICIDIAL_AGENT] fallback reason=mapping_not_found campaign={v_camp} list={v_list} ingroup={v_ingroup}")
                except Exception as parse_err:
                    logger.error(f"[VICIDIAL_CONTEXT] Failed to parse cached payload: {parse_err}")
            else:
                logger.info(f"[VICIDIAL_CONTEXT] lookup_miss phone={clean_phone} uniqueid={call_id}")
                logger.warning("[VICIDIAL_AGENT] fallback reason=context_not_found")

    # If this is an outbound call missing a slug, check the environment fallback or use generic default
    is_outbound_call = getattr(ctx.job, 'agent_name', None) == "outbound-agent" or not is_inbound_worker
    if not agent_slug and is_outbound_call:
        agent_slug = os.environ.get("DEFAULT_OUTBOUND_AGENT_SLUG", "outbound-agent")
        logger.info(f"Using default outbound agent slug fallback: {agent_slug}")

    # Step D: Configuration Fetch & Active Fallback
    agent_config = None
    
    if inline_config:
        agent_config = inline_config
        agent_config.setdefault("id", f"sim-tester-{simulation_id[:8]}")
        agent_config.setdefault("slug", "__simulation_tester__")
    elif agent_slug:
        agent_config = await agent_storage.get_agent_config_by_id_or_slug(agent_slug)

    # FINAL INBOUND FALLBACK: If an inbound worker still has no config, 
    # fetch the FIRST active agent from the DB to answer the call.
    if not agent_config and is_inbound_worker:
        logger.info("No specific routing identified. Querying DB for first active agent...")
        agent_config = await agent_storage.get_first_running_agent()
        if agent_config:
            logger.info(f"Dynamic Fallback: Using active agent '{agent_config.get('name')}' (slug='{agent_config.get('slug')}')")
    
    # Rejection Logic: If still no config, we must reject the job
    if not agent_config:
        logger.error(f"Job REJECTED: No running configuration found for slug '{agent_slug or 'UNKNOWN'}'")
        return

    extra_config = normalize_dict(agent_config.get("extra_config", {}))

    # Strict Legacy Suthra/Complaint Detector
    _meta_obj_local = normalize_dict(locals().get("meta_obj", {}))
    _legacy_cfg = str(extra_config.get("legacy_complaint_mode", "")).lower() == "true"
    _legacy_meta = str(_meta_obj_local.get("legacy_complaint_mode", "")).lower() == "true"
    _legacy_slugs = ["suthra-sarah", "sarah-pioneer-urdu-punjabi", "outbound-sarah-robocall"]
    _is_legacy_slug = str(agent_config.get("slug", "")).lower() in _legacy_slugs or str(agent_config.get("name", "")).lower() in _legacy_slugs
    is_legacy_complaint_agent = _legacy_cfg or _legacy_meta or _is_legacy_slug

    # Phase 2: Configuration Mapping (Chat-to-Voice)
    if agent_config and agent_type == "chat":
        try:
            from app.services.chat_agent_service import get_chat_agent
            chat_config = get_chat_agent(agent_slug)
            if chat_config:
                agent_config = {
                    "id": chat_config.get("id"),
                    "name": chat_config.get("name", "Chat Agent"),
                    "slug": chat_config.get("id"),
                    "system_prompt": chat_config.get("system_prompt", "You are a helpful assistant."),
                    "knowledge_base": chat_config.get("knowledge_base", ""),
                    "tool_instructions": chat_config.get("tool_instructions", ""),
                    "assigned_tools": chat_config.get("assigned_tools", []),
                    "llm_config": {
                        "provider": chat_config.get("llm_provider", "openai"),
                        "model": chat_config.get("llm_model", "gpt-4o-mini"),
                        "temperature": chat_config.get("temperature", 0.7),
                    },
                    "_chat_config": chat_config,
                }
                test_mode = "text"
                text_llm = f"{chat_config.get('llm_provider', 'openai')}:{chat_config.get('llm_model', 'gpt-4o-mini')}"
        except Exception as e:
            logger.warning(f"Failed to map chat agent config: {e}")

    # Success: Configuration Loaded - Update the slug to match reality
    agent_slug = agent_config.get("slug")
    logger.info(f"Configuration resolved successfully: '{agent_config.get('name')}' (slug='{agent_slug}')")

    active_agents = [] 
    _agent_registry = {} 

    # --- Global Outbound Dialer Initialization ---
    global _dialer_started
    if not _dialer_started:
        try:
            from app.services.outbound_dialer import OutboundDialer
            dialer = OutboundDialer()
            asyncio.create_task(dialer.start())
            _dialer_started = True
            logger.info("Outbound Dialer engine started.")
        except Exception as e:
            logger.error(f"Failed to start Outbound Dialer: {e}")

    # Guard: campaign rooms must only run agents dispatched by the campaign executor.
    # If the room name starts with "campaign-" but the dispatch metadata doesn't carry
    # is_campaign_dispatch=True, this job was triggered by an inbound SIP dispatch rule
    # firing on the same trunk — reject it to prevent two agents talking at once.
    if ctx.room.name.startswith("campaign-") and not meta_obj.get("is_campaign_dispatch"):
        logger.warning(
            f"Rejecting dispatch for campaign room '{ctx.room.name}' "
            f"(agent_slug='{agent_slug}'): missing is_campaign_dispatch flag. "
            "This dispatch likely came from an inbound SIP rule firing on the outbound trunk."
        )
        return

    # If this is a sandbox room, ensure simulation flags are off to avoid 30s waits
    if ctx.room.name.startswith("simulation-sandbox"):
        is_simulation_test = False
        logger.info(f"Sandbox room detected: '{ctx.room.name}' - disabling simulation waits for instant response.")

    # Guard: simulation rooms must only run agents dispatched by the simulation service.
    # Creating a room triggers an automatic default agent dispatch — reject it so only
    # the tester and agent_under_test (which carry is_simulation_test=True) join.
    # NOTE: Explicitly allowing 'simulation-sandbox' prefix for manual proving ground.
    if ctx.room.name.startswith("sim-") and not is_simulation_test and not ctx.room.name.startswith("simulation-sandbox"):
        logger.warning(
            f"Rejecting dispatch for simulation room '{ctx.room.name}' "
            f"(agent_slug='{agent_slug}'): missing is_simulation_test flag. "
            "This dispatch was auto-triggered by room creation, not by the simulation service."
        )
        return

    logger.info(f"Job dispatched for agent slug: '{agent_slug}'")

    # Language Lock: Force Urdu and UpliftAI explicitly to override any UI misalignment 
    if agent_config and 'ag_u5q4ujfji' in str(agent_config.get('id', '')):
        logger.info("Language Lock: Forcing STT(language='ur') and TTS(UpliftAI) on Pioneer Agent.")
        if "stt_config" not in agent_config:
            agent_config["stt_config"] = {}
        agent_config["stt_config"]["language"] = "ur"
        agent_config["stt_config"]["model"] = "nova-3-general" # Reverted to Nova-3 for Urdu support
        
        if "tts_config" not in agent_config:
            agent_config["tts_config"] = {}
        agent_config["tts_config"]["provider"] = "upliftai"

    # --- Phase 3: Eligibility Gating Injection (Dynamic Prompt Suffixing) ---
    rules = agent_config.get("eligibility_rules", {})
    if isinstance(rules, str):
        try:
            rules = json.loads(rules)
        except Exception as e:
            logger.error(f"Failed to parse eligibility_rules JSON string: {e}")
            rules = {}

    if rules:
        gating_suffix = ""
        
        allowed_cities = rules.get("allowedCities", [])
        if allowed_cities:
            cities_str = ", ".join(allowed_cities)
            gating_suffix += f"\nCRITICAL ELIGIBILITY RULE: You ONLY provide services in these cities: {cities_str}. If the caller's city is NOT in this list, you MUST instantly call the reject_service tool with reason='city' and output NO conversational text."
            
        excluded_areas = rules.get("excludedAreas", [])
        if excluded_areas:
            areas_str = ", ".join(excluded_areas)
            gating_suffix += f"\nCRITICAL ELIGIBILITY RULE: You DO NOT provide services in these areas: {areas_str}. If the caller's address includes any of these areas, instantly call reject_service with reason='area' and output NO text."
            
        if rules.get("excludeCommercial"):
            custom_commercial_rule = rules.get("commercialEligibilityInstruction")
            if custom_commercial_rule:
                gating_suffix += f"\nCRITICAL ELIGIBILITY RULE: {custom_commercial_rule}"
            else:
                gating_suffix += f"\nCRITICAL ELIGIBILITY RULE: You DO NOT serve Commercial properties. If the user states it is a commercial property (shop, office, mall, hospital, etc.), instantly call reject_service with reason='commercial' and output NO text. \nIMPORTANT (STRICT LANDMARK EXCEPTION): Only reject if the complaint itself is FOR a commercial property (e.g., 'Kachra in front of my shop'). If the user mentions a shop, hospital, or office as a landmark or nearby reference (e.g., 'Behind the General Hospital', 'Near the tailor shop'), you MUST NOT reject. Landmarks are valid residential address references."
            
        if gating_suffix:
            original_prompt = agent_config.get("system_prompt", "")
            agent_config["system_prompt"] = f"{original_prompt}\n\n{gating_suffix.strip()}"
            logger.info(f"Eligibility Gating rules injected into system prompt for agent '{agent_config.get('name')}'")

    # --- Global Scope Audit: Guaranteed Variable Initialization ---
    agent_id = agent_config.get("id", "default_id")
    agent_name = agent_config.get("name", "Voice Agent")
    agent_slug = agent_config.get("slug", "")
    
    # Session-level tracking containers (Phase 3)
    session_ref = {"session": None}
    call_tracker_ref = {"tracker": None}
    sip_metadata_ref = {"metadata": {}}

    # --- ARCHITECTURE FIX: EARLY METADATA & MEMORY FETCH ---
    sip_metadata = {}
    try:
        # 1. Extract SIP metadata from room participants
        for participant in ctx.room.remote_participants.values():
            participant_attrs = getattr(participant, 'attributes', {}) or {}
            if participant_attrs:
                sip_metadata = {
                    "call_id": participant_attrs.get("sip.callID", ""),
                    "from_number": participant_attrs.get("sip.phoneNumber", participant_attrs.get("sip.callerNumber", "")),
                    "to_number": participant_attrs.get("sip.calledNumber", participant_attrs.get("sip.trunkPhoneNumber", "")),
                    "direction": "inbound",
                }
                if sip_metadata.get("from_number") or sip_metadata.get("to_number"):
                    break

            participant_meta = getattr(participant, 'metadata', None)
            if participant_meta:
                try:
                    meta = json.loads(participant_meta)
                    if meta.get("sip_call_id") or meta.get("caller_id"):
                        sip_metadata = {
                            "call_id": meta.get("sip_call_id", ""),
                            "from_number": meta.get("caller_id", meta.get("from_uri", "")),
                            "to_number": meta.get("called_id", meta.get("to_uri", "")),
                            "direction": "inbound" if meta.get("caller_id") else "outbound",
                        }
                        break
                except: pass

        # Fallback to room name pattern
        if not sip_metadata.get("from_number") and ctx.room.name:
            import re
            phone_match = re.search(r'_?(\+?\d{10,15})_', ctx.room.name)
            if phone_match:
                sip_metadata["from_number"] = phone_match.group(1)

        logger.info(f"Extracted SIP metadata: {sip_metadata}")
        sip_metadata_ref["metadata"] = sip_metadata

    except Exception as e:
        logger.debug(f"Error extracting SIP metadata early: {e}")

    # 2. Early Memory Retrieval & HARD STATE LOCK
    memory_summary = None
    _meta_obj_local = locals().get("meta_obj", {})
    if is_legacy_complaint_agent:
        caller_name = "Citizen"
    else:
        caller_name = _meta_obj_local.get("contact_name") or _meta_obj_local.get("lead_name") or "User"
    caller_phone = sip_metadata.get("from_number", "")

    active_ticket_id = None
    db_name = None

    if is_legacy_complaint_agent:
        # --- ENTERPRISE FIX: The Hard State Database Lock ---
        # Ask PostgreSQL directly - 0.01s, 100% accurate, no LLM guessing.
        try:
            if caller_phone:
                db_result = await get_active_ticket_from_db(caller_phone)
                if db_result:
                    active_ticket_id = db_result.get("ticket_id")
                    db_name = db_result.get("name")
        except Exception as e:
            logger.error(f"DB Lock Check Error: {e}")

        # Standard memory lookup (still runs for caller name resolution)
        try:
            if caller_phone:
                async with asyncio.timeout(1.5):
                    memory_summary = await asyncio.to_thread(get_memory_prompt, caller_phone)
                    if memory_summary:
                        import re
                        name_match = re.search(r"The caller, ([^,]+),", memory_summary)
                        if name_match:
                            caller_name = name_match.group(1).strip()
        except Exception as e:
            logger.error(f"Early memory retrieval timeout/error: {e}")

        # FORCE INJECT HARD STATE INTO LLM PROMPT - overwrites all soft memory
        if active_ticket_id:
            logger.info(f"🔒 HARD STATE LOCK: Found pending ticket {active_ticket_id} for {caller_phone}")

            # Priority: Use name from DB if found, else use name from soft memory
            final_caller_name = db_name or caller_name

            # Format ticket ID for Urdu TTS phonetic pronunciation
            _bare = active_ticket_id.replace("SP-", "S P ")
            phonetic_id = " ".join(_bare)

            # Read the template from the GUI (agent tools_config) - zero hardcoding
            _tc = normalize_tools_config(agent_config.get("tools_config", {}))
            _tools_cfg = _tc if isinstance(_tc, dict) else {}
            _default_template = (
                "[CRITICAL DATABASE OVERRIDE]: The system database confirms that this caller, "
                "{caller_name}, has an active, unresolved complaint with Ticket ID: {ticket_id}. "
                "You MUST immediately execute the RETURNING CALLER PROTOCOL: "
                "1. Greet them warmly as {caller_name} Sahib/Sahiba. "
                "2. Tell them their ticket number slowly, pronouncing each character: {phonetic_id}. "
                "3. Do NOT ask for their issue, district, or address again."
            )
            _template = _tools_cfg.get("returning_caller_prompt", _default_template)
            memory_summary = _template.format(
                caller_name=final_caller_name,
                ticket_id=active_ticket_id,
                phonetic_id=phonetic_id,
            )
            
            # Update caller_name for logging/DB registration
            caller_name = final_caller_name
        elif memory_summary:
            logger.info(f"Memory resolved early for {caller_phone}: {caller_name}")
    
    # [FIX] Early Database Registration: Pass the resolved name to the DB immediately
    if not is_agent_tester_call and call_history:
        try:
            early_direction = sip_metadata.get("direction", "inbound")
            early_meta = {
                "caller_name": caller_name,
                "caller_phone": caller_phone,
                "room_name": ctx.room.name
            }
            # Extract campaign fields early if available in job metadata
            _m_obj = locals().get("meta_obj", {})
            if _m_obj:
                c_id = _m_obj.get("campaign_id")
                l_id = _m_obj.get("lead_id") or _m_obj.get("external_record_id")
                if c_id or l_id:
                    early_direction = "outbound"
                    early_meta.update({
                        "campaign_id": c_id,
                        "lead_id": l_id,
                        "external_record_id": _m_obj.get("external_record_id") or l_id,
                        "phone": _m_obj.get("phone"),
                        "caller_id": _m_obj.get("caller_id"),
                        "agent_slug": _m_obj.get("agent_slug") or agent_slug,
                        "type": _m_obj.get("type", "outbound_campaign_call"),
                        "source": _m_obj.get("source", "campaign"),
                        "direction": "outbound",
                        "attempt_count": _m_obj.get("attempt_count")
                    })
            
            # Clean none/empty values from early_meta
            early_meta = {k: v for k, v in early_meta.items() if v is not None and v != ""}
            
            call_history.create_call_record(
                call_id=ctx.job.id,
                agent_id=agent_config.get("id"),
                room_name=ctx.room.name,
                direction=early_direction,
                from_number=caller_phone,
                metadata=early_meta
            )
            logger.info(f"Early DB Mapping: Created/Updated call record for {caller_name} ({caller_phone}), direction={early_direction}")
        except Exception as e:
            logger.error(f"Failed to create early call record: {e}")
    # -------------------------------------------------------
    
    # Tool and pipeline components
    agent_tools = [] # Raw tools from registry
    tools_list = []  # Decorated tools for LLM
    handoff_tools = []
    active_tools_list = [] # Legacy name fixup
    # Look for toolsConfig (Postgres sync) before assigned_tools (Legacy Redis)
    enabled_tool_names = agent_config.get("toolsConfig", agent_config.get("assigned_tools", []))
    
    llm_instance = None
    stt = None
    tts_instance = None
    vad_instance = None
    turn_detector = None
    
    # Initialize agent_params with defaults to prevent NameError
    agent_params = {
        "instructions": "",
        "tools": tools_list
    }
    # --- End Global Scope Audit ---

    system_prompt_raw = agent_config.get("system_prompt", "You are a helpful AI assistant.")
    knowledge_base = agent_config.get("knowledge_base", "")
    tool_instructions = agent_config.get("tool_instructions", "")
    initial_greeting_raw = agent_config.get("initial_greeting", "").strip()

    # Fancy Suthra Punjab prompt & greeting injection (Legacy Complaint Agents Only)
    if is_legacy_complaint_agent:
        # 1. SCRUBBING: Remove any stale instructions from the database prompt to prevent conflicts
        import re
        # This matches # or ## ESCALATION PROTOCOL (and HANGUP) and everything until the next header or end of string
        system_prompt_raw = re.sub(r'(?i)#+\s*ESCALATION PROTOCOL.*?(?=#+\s|\Z)', '', system_prompt_raw, flags=re.DOTALL)
        system_prompt_raw = re.sub(r'(?i)#+\s*HANGUP PROTOCOL.*?(?=#+\s|\Z)', '', system_prompt_raw, flags=re.DOTALL)

        # 2. ENHANCED INJECTION: Atomic Parallel Execution Protocol
        suthra_prompt_injection = """
<STRICT_REALTIME_RULES>
## ESCALATION PROTOCOL (SILENT - TOOL ONLY)
If the user mentions "Billing", "Bills", "Electricity Bill", complains about excessive charges, or becomes highly frustrated/abusive:
- You MUST NOT generate speech. Say NOTHING.
- You MUST IMMEDIATELY execute the `transfer_to_human` tool with the `reason` parameter. 
- [!] CRITICAL: This is a SILENT tool call. The system will handle the acknowledgment phrase for you. Just call the tool.

## HANGUP PROTOCOL (URGENT - PARALLEL EXECUTION)
If the user says "Goodbye", "Allah Hafiz", "Thank you, bye", or if the complaint collection is finished:
1. Say exactly: "پنجاب ہیلپ لائن پر رابطہ کرنے کا شکریہ۔ اللہ حافظ!"
2. IMMEDIATELY execute the `hangup` tool in the SAME TURN.
</STRICT_REALTIME_RULES>

## Unified Suthra Punjab Identity (MANDATORY)
- **ROLE**: You are Sarah, representing the Office of Chief Minister Maryam Nawaz Sharif. You are a REAL FEMALE operator.
- **FEMALE GRAMMAR**: You MUST use female verb conjugations in Urdu. ALWAYS say "کر رہی ہوں", "سمجھتی ہوں". NEVER use male forms like "کر رہا ہوں".
- **HONORIFICS**: ALWAYS address the caller as "Sahib" (صاحب) for males or "Sahiba" (صاحبہ) for females. Use "Aap" (آپ) to show respect.
- **TERMINOLOGY**: ALWAYS use 'Kachra/Gand' (کچرا/گند) instead of 'Kora'.
- **GREETING**: If conversation is already in progress, jump straight to assisting.

## Data Collection Checklist
Your goal is to collect: **Issue, District, Address, Landmark, and Name/Phone**. Read conversation history first to avoid repeats.
"""
        # Prepend to the top to ensure character level priority
        system_prompt_raw = suthra_prompt_injection + "\n\n" + system_prompt_raw
        
        if "Kora" in initial_greeting_raw or "kora" in initial_greeting_raw.lower():
            initial_greeting_raw = initial_greeting_raw.replace("Kora", "Kachra/Gand").replace("kora", "kachra/gand")

    # Extract caller data for variable parsing
    caller_data = {}

    # 1. Merge Job Metadata
    if job_metadata:
        try:
            caller_data.update(json.loads(job_metadata))
        except json.JSONDecodeError:
            pass

    # 2. Merge Room metadata (for outbound calls initiated via API)
    if room_metadata:
        try:
            rmeta = json.loads(room_metadata)
            if rmeta.get("contactData"):
                caller_data.update(rmeta.get("contactData"))
        except: pass

    # 2. Update with participant data (for inbound calls)
    if ctx.room.remote_participants:
        # Take the first remote participant as the caller
        caller = list(ctx.room.remote_participants.values())[0]
        caller_data.setdefault("Name", caller.identity or "Customer")
        
        # Extract SIP attributes if available
        attrs = getattr(caller, 'attributes', {}) or {}
        if attrs:
            caller_data.update({
                "SIP_CallID": attrs.get("sip.callID", ""),
                "From": attrs.get("sip.phoneNumber", attrs.get("sip.callerNumber", "")),
                "To": attrs.get("sip.calledNumber", ""),
            })

        # Extract from metadata if it's JSON
        if caller.metadata:
            try:
                cmeta = json.loads(caller.metadata)
                caller_data.update(cmeta)
            except: pass
    
    # Use SIP metadata if available
    if "sip_metadata_ref" in locals() and sip_metadata_ref.get("metadata"):
        caller_data.update(sip_metadata_ref.get("metadata"))

    # Parse variables in prompt and greeting
    system_prompt = parse_context_variables(system_prompt_raw, caller_data)
    initial_greeting = parse_context_variables(initial_greeting_raw, caller_data)
    
    if system_prompt != system_prompt_raw:
        logger.info("System prompt variables parsed and replaced")

    # Build unified system instructions
    final_instructions_parts = [system_prompt]

    # Phase 6: Outbound Lead Context Injection
    # Injects metadata passed from dispatcher.py (api.CreateSIPParticipant)
    if caller_data.get("outbound") or "lead_name" in caller_data or "lead_data" in caller_data:
        lead_name = caller_data.get("lead_name") or caller_data.get("contact_name") or "the customer"
        lead_context_prompt = f"\n\n## Outbound Lead Context\n- You are calling: {lead_name}\n- Conversation Goal: Initiate the outbound campaign message and handle the response naturally."
        final_instructions_parts.append(lead_context_prompt)
        
        # Inject dynamic lead_data
        lead_data_payload = caller_data.get("lead_data") or caller_data
        if lead_data_payload:
            injected_lead_context = build_lead_context(lead_data_payload)
            if injected_lead_context:
                final_instructions_parts.append(injected_lead_context)
                logger.info(f"Injected dynamic Lead Context for {lead_name}")
                
    # Appointment Hallucination Guard
    final_instructions_parts.append("## Scheduling Limitations\nIf scheduling tools are not enabled, collect the user's preferred date/time and say the team will confirm it. Do not claim the appointment is booked.")
    
    # Add knowledge base if provided
    if knowledge_base:
        final_instructions_parts.append(f"## Knowledge Base\nThe following information should be used to answer questions:\n{knowledge_base}")
    
    # Add tool instructions if provided (moved here to ensure it's in final_instructions early)
    if tool_instructions:
        final_instructions_parts.append(f"## Tool Usage Instructions\n{tool_instructions}")
        
    final_instructions = "\n\n".join(final_instructions_parts)
    logger.info(f"Unified system instructions built (total length: {len(final_instructions)} chars)")

    # (Note: Standard call record creation block removed; moved to early memory resolution phase)

    logger.info(f"Starting agent: {agent_name}")

    # Check realtime mode early to skip unnecessary STT/TTS/VAD initialization
    realtime_config = agent_config.get("realtime_config", {})
    is_realtime = realtime_config.get("enabled", False)

    # Initialize components (Safe initialization handled at top of entrypoint)
    try:
        if is_realtime:
            realtime_modalities = realtime_config.get("modalities", "text_audio")
            if realtime_modalities == "text":
                # Text-only realtime: model outputs text, needs separate TTS
                logger.info("Realtime mode (text-only) — initializing TTS, skipping STT and VAD")
                tts_instance = get_tts(agent_config)
            else:
                logger.info("Realtime mode enabled — skipping STT, TTS, VAD, and turn detector initialization")
        else:
            llm_instance = get_llm(agent_config)
            stt = get_stt(agent_config, is_outbound_call=is_outbound_call)
            tts_instance = get_tts(agent_config)

            # Log active STT configuration
            stt_config = agent_config.get("stt_config", {})
            stt_model = stt_config.get("model", "unknown")
            stt_responsiveness = stt_config.get("responsiveness", 0.5)
            stt_language = stt_config.get("language", "en-US")
            stt_custom_vocab = stt_config.get("custom_vocab", "")
            stt_smart_formatting = stt_config.get("smart_formatting", True)
            stt_remove_fillers = stt_config.get("remove_fillers", True)

            is_flux = "flux" in stt_model.lower() if stt_model else False
            vocab_count = len(vocab_list) if 'vocab_list' in locals() else 0

            logger.info("=" * 70)
            logger.info("Active STT Configuration:")
            logger.info(f"  Model: {stt_model}")
            logger.info(f"  API: {'V2 (Flux)' if is_flux else 'V1 (Nova)'}")
            logger.info(f"  STT Class: {'STTv2' if is_flux else 'STT'}")
            logger.info(f"  Responsiveness: {stt_responsiveness}")

            if is_flux:
                logger.info(f"  Note: Flux handles endpointing internally (responsiveness setting not applied)")
            else:
                endpointing_ms = max(10, int(500 - (stt_responsiveness * 490)))
                logger.info(f"  Endpointing: {endpointing_ms}ms")

            # Advanced settings
            logger.info("  Advanced Settings:")
            logger.info(f"    Language: {stt_language}")

            # Get provider to customize logging
            stt_provider = stt_config.get("provider", "deepgram")

            # Provider-specific settings display
            if stt_provider == "deepgram":
                logger.info(f"    Custom Vocabulary: {vocab_count} words")
                if vocab_count > 0:
                    vocab_preview = stt_custom_vocab[:100] + "..." if len(stt_custom_vocab) > 100 else stt_custom_vocab
                    logger.info(f"      Preview: {vocab_preview}")
                logger.info(f"    Smart Formatting: {stt_smart_formatting}")
                logger.info(f"    Remove Fillers: {stt_remove_fillers}")
            elif stt_provider == "openai":
                if stt_model == "whisper-1" and vocab_count > 0:
                    logger.info(f"    Vocabulary Prompt: {vocab_count} words (whisper-1 guidance)")
                    vocab_preview = stt_custom_vocab[:100] + "..." if len(stt_custom_vocab) > 100 else stt_custom_vocab
                    logger.info(f"      Preview: {vocab_preview}")
                else:
                    logger.info(f"    Custom Vocabulary: Not supported for {stt_model}")
                logger.info(f"    Smart Formatting: Automatic (built into Whisper)")
                logger.info(f"    Filler Removal: Automatic (built into Whisper)")
                logger.info(f"    Endpointing: Controlled by VAD settings, not model")
            else:
                logger.info(f"    Custom Vocabulary: {vocab_count} words")
                if vocab_count > 0:
                    vocab_preview = stt_custom_vocab[:100] + "..." if len(stt_custom_vocab) > 100 else stt_custom_vocab
                    logger.info(f"      Preview: {vocab_preview}")
                logger.info(f"    Smart Formatting: {stt_smart_formatting}")
                logger.info(f"    Remove Fillers: {stt_remove_fillers}")

            logger.info("=" * 70)

    except Exception as e:
        logger.error(f"Failed to initialize agent components: {e}")
        raise

    # Connect to room - in text mode, don't subscribe to audio
    if test_mode == "text":
        await ctx.connect(auto_subscribe=AutoSubscribe.SUBSCRIBE_NONE)
        logger.info("Connected in text mode (no audio subscription)")
    else:
        await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
        logger.info("Connected in voice mode (audio subscription)")

    # Forced Auto-record for Sarah (Agent under development)
    auto_record_enabled = True
    try:
        # Check job metadata first (from dispatch rule's agent_metadata)
        job_metadata = getattr(ctx.job, 'metadata', None)
        logger.info(f"DEBUG: Job metadata raw: '{job_metadata}'")
        logger.info(f"DEBUG: Room metadata raw: '{ctx.room.metadata if hasattr(ctx.room, 'metadata') else 'N/A'}'")

        if job_metadata:
            logger.info(f"Job metadata found: {job_metadata}")
            job_meta = json.loads(job_metadata)
            auto_record_enabled = job_meta.get("auto_record", False)
            if auto_record_enabled:
                logger.info(f"[OK] Auto-record ENABLED via dispatch rule agent_metadata")
            else:
                logger.info(f"[SKIP] Auto-record flag not found in job metadata")

        # Fallback: check room metadata
        if not auto_record_enabled and hasattr(ctx.room, 'metadata') and ctx.room.metadata:
            logger.info(f"Checking room metadata as fallback...")
            room_meta = json.loads(ctx.room.metadata)
            auto_record_enabled = room_meta.get("auto_record", False)
            if auto_record_enabled:
                logger.info(f"[OK] Auto-record ENABLED via room metadata")

        if not auto_record_enabled:
            logger.info(f"[INFO] Auto-record is disabled for this call")
    except (json.JSONDecodeError, Exception) as e:
        logger.warning(f"Error parsing auto-record metadata: {e}")

    # POLICY SYNC: Respect GUI-level Recording Toggle (Object)
    _tc2 = normalize_tools_config(agent_config.get("tools_config", {}))
    tools_settings = _tc2 if isinstance(_tc2, dict) else {}
    auto_record_enabled = tools_settings.get("auto_record", False)
    if auto_record_enabled:
        logger.info(f"[POLICY] Call Recording is ENABLED for agent {agent_config.get('slug')}")
    else:
        logger.info(f"[POLICY] Call Recording is DISABLED for agent {agent_config.get('slug')}")

    # --- Phase 3: SIP Metadata & Cleaning ---
    def clean_phone_number(num: str) -> str:
        if not num: return ""
        # Strip all non-digit except leading +
        cleaned = "".join([c for c in num if c.isdigit() or c == "+"])
        # Handle the +9292 redundant prefix issue
        if cleaned.startswith("+9292"):
            cleaned = "+92" + cleaned[5:]
        elif cleaned.startswith("9292"):
            cleaned = "+92" + cleaned[4:]
        # Standardize other formats
        elif cleaned.startswith("0"):
            cleaned = "+92" + cleaned[1:]
        elif cleaned.startswith("92") and not cleaned.startswith("+"):
            cleaned = "+" + cleaned
        return cleaned

    from_number = ""
    to_number = ""
    # Extract SIP numbers from participants for recording filename
    if ctx.room.remote_participants:
        for p in ctx.room.remote_participants.values():
            attrs = getattr(p, 'attributes', {}) or {}
            if attrs.get("sip.phoneNumber"):
                from_number = clean_phone_number(attrs.get("sip.phoneNumber"))
            if attrs.get("sip.calledNumber"):
                to_number = clean_phone_number(attrs.get("sip.calledNumber"))

    # Track extracted numbers for later use in DB creation
    caller_data["from_number"] = from_number
    caller_data["to_number"] = to_number
    caller_data["phone"] = from_number

    # Start auto-recording if enabled
    auto_record_egress_id = None
    if auto_record_enabled:
        if is_telephony_agent:
            # INTEGRATION: Use Asterisk recording filename convention
            # Filename: YYYYMMDD-HHMMSS-CALLER-CALLED.wav
            timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
            # Include caller phone for precise file matching
            caller_phone = from_number or "unknown"
            auto_record_egress_id = f"asterisk-{timestamp}-{caller_phone}"
            logger.info(f"[PBX] Using Asterisk Recording Link: {auto_record_egress_id}")
        else:
            # Web users still use LiveKit Egress (slower but necessary for web)
            try:
                auto_record_egress_id = await start_auto_recording(ctx)
            except Exception as e:
                logger.error(f"Failed to start Egress recording: {e}")

    # initial_greeting was parsed above with context variables

    # Get conversation dynamics settings
    dynamics = agent_config.get("conversation_dynamics", {})
    vad_threshold = dynamics.get("vad_threshold", 0.5)
    vad_min_speech = dynamics.get("vad_min_speech", 0.1)
    
    # VAD TIGHTENING (Urdu/Punjabi Optimized - Fast Human Mode)
    # 0.35s is the sweet spot for natural turn-taking without clipping
    vad_min_silence = dynamics.get("vad_min_silence", 0.35) 
    
    # Sarah V23.16: FULL DYNAMIC CONTROL
    # GUI MAPPING:
    # 1. 'tools_settings' = GUI Sliders & Policy (JSONB Object)
    # 2. 'gui_tools_array' = Assigned Tools List (JSON Array)
    _tc3 = normalize_tools_config(agent_config.get("tools_config", {}))
    tools_settings = _tc3 if isinstance(_tc3, dict) else {}
    gui_tools_array = agent_config.get("toolsConfig") if isinstance(agent_config.get("toolsConfig"), list) else []
    
    # GUI MAPPING:
    # 'ENDPOINTING DELAY' Slider -> agent_response_delay (Sarah's Reaction Speed)
    stt_config = agent_config.get("stt_config", {})
    agent_response_delay = stt_config.get("responsiveness", 0.6)
    
    # 'BARGE-IN' Slider -> agent_interrupt_duration (Sensitivity to being interrupted)
    agent_interrupt_duration = tools_settings.get("barge_in_threshold", 0.5)
    
    # 'SILERO AGGRESSION' Slider -> vad_threshold (Noise rejection)
    # 0.55 is the new baseline for Suthra Punjab (Balanced mode)
    vad_threshold = tools_settings.get("vad_threshold", 0.55)
    
    # 'VAD MEMORY WINDOW' Slider -> vad_padding (Pre-speech buffer)
    vad_padding = tools_settings.get("vad_padding", 0.3)

    # --- Outbound VAD + response-delay overrides ---
    # Applied AFTER DB reads so env vars win over GUI sliders for outbound/preview calls.
    # Inbound calls (is_outbound_call=False) are completely unaffected.
    if is_outbound_call:
        try:
            _env_sil = os.getenv("OUTBOUND_MIN_SILENCE_MS")
            if _env_sil:
                vad_min_silence = max(0.05, float(_env_sil) / 1000.0)
        except ValueError:
            logger.warning(f"[VAD_TUNE] Invalid OUTBOUND_MIN_SILENCE_MS; using DB value {int(vad_min_silence*1000)}ms")
        try:
            _env_pad = os.getenv("OUTBOUND_VAD_PADDING_MS")
            if _env_pad:
                vad_padding = max(0.05, float(_env_pad) / 1000.0)
        except ValueError:
            logger.warning(f"[VAD_TUNE] Invalid OUTBOUND_VAD_PADDING_MS; using DB value {int(vad_padding*1000)}ms")
        try:
            _env_delay = os.getenv("OUTBOUND_RESPONSE_DELAY_SEC")
            if _env_delay:
                agent_response_delay = max(0.05, float(_env_delay))
        except ValueError:
            logger.warning(f"[VAD_TUNE] Invalid OUTBOUND_RESPONSE_DELAY_SEC; using DB value {agent_response_delay}s")
        logger.info(
            f"[VAD_TUNE] final effective settings (outbound): "
            f"min_silence_ms={int(vad_min_silence*1000)} "
            f"vad_padding_ms={int(vad_padding*1000)} "
            f"response_delay_sec={agent_response_delay}"
        )

    # Log the dynamic tuning values
    logger.info(f"Dynamic Tuning (V23.20): ResponseDelay={agent_response_delay}s | BargeIn={agent_interrupt_duration}s | VAD_Threshold={vad_threshold} | VAD_Padding={vad_padding}s")

    
    turn_detector_threshold = dynamics.get("turn_detector_threshold", 0.008)
    enable_vad = dynamics.get("enable_vad", True)  # Default to True if not set
    enable_turn_detector = False # Force-disabled for Ultra-Stable Silero VAD
    enable_noise_cancellation = dynamics.get("enable_noise_cancellation", False)
    noise_cancellation_model = dynamics.get("noise_cancellation_model", "nc")  # nc, bvc, bvc_telephony

    # Pipeline-only: Flux turn detection, VAD, and turn detector setup
    # These are not needed in realtime mode (single model handles everything)
    flux_turn_detection = False

    if not is_realtime:
        # Check if Flux turn detection is enabled (bypasses Silero VAD)
        stt_config = agent_config.get("stt_config", {})
        stt_model = stt_config.get("model", "")
        is_flux = stt_model.startswith("flux-")
        flux_turn_detection = is_flux and dynamics.get("flux_turn_detection", False)

        # Log loaded dynamics for verification
        logger.info(f"Dynamics Loaded: Sensitivity={vad_threshold} | MinSpeech={vad_min_speech}s | MinSilence={int(vad_min_silence*1000)}ms | Delay={agent_response_delay}s | BargeIn={agent_interrupt_duration}s | TurnDetector={turn_detector_threshold}")
        logger.info(f"VAD Enabled: {enable_vad} | Turn Detector Enabled: {enable_turn_detector} | Flux Turn Detection: {flux_turn_detection} | Noise Cancellation: {enable_noise_cancellation}")

        # Initialize VAD with conversation dynamics settings
        # When Flux turn detection is enabled, we skip Silero VAD - Flux handles everything server-side
        if flux_turn_detection:
            # Flux STT handles both speech detection AND turn detection via EndOfTurn events
            # No need for Silero VAD - it would conflict with Flux's internal detection
            logger.info(f"Flux Turn Detection enabled - Silero VAD disabled (Flux handles speech + turn detection)")
        elif enable_vad:
            vad_instance = silero.VAD.load(
                min_speech_duration=vad_min_speech,  # Mapped from 'Min Speech Duration'
                min_silence_duration=vad_min_silence,  # Mapped from 'Min Silence Duration' (default 200ms)
                activation_threshold=vad_threshold,  # Mapped from 'Microphone Sensitivity'
                prefix_padding_duration=vad_padding,  # Mapped from 'VAD Memory Window'
            )
            logger.info(f"VAD initialized with Silero (threshold={vad_threshold}, padding={int(vad_padding*1000)}ms, min_silence={int(vad_min_silence*1000)}ms)")
        else:
            logger.warning(f"VAD DISABLED - Voice activity detection is OFF. Agent may not detect user speech properly.")

        # Initialize Turn Detector (end-of-utterance model for turn detection)
        # Uses MultilingualModel v0.4.1-intl with 14 language support
        # Provides 39% reduction in false-positive interruptions vs v0.3.0
        # When Flux turn detection is enabled, skip MultilingualModel - Flux sends EndOfTurn events
        if flux_turn_detection:
            logger.info(f"Turn Detector disabled - Flux STT sends EndOfTurn events")
        else:
            # --- ULTRA-STABLE MODE: Silero VAD Only ---
            # Disabling heavy Natural Turn Detector to prevent PM2 startup timeouts.
            # Sarah will now be lightning-fast and answer calls instantly.
            logger.info(f"Turn Detector: Disabled (Ultra-Stable Silero VAD Mode)")
            turn_detector = None

    # Append tool usage instructions (will be added after tools are loaded below)
    # Store for later use
    pending_tool_instructions = tool_instructions

    # Create voice agent with all components

    if is_realtime:
        # Realtime mode: single stream replaces STT→LLM→TTS pipeline
        realtime_model = get_realtime_model(agent_config)
        agent_params = {
            "instructions": final_instructions,
            "llm": realtime_model,
        }
        
        # POPULATE MUTABLE CONTEXT BEFORE AGENT START
        full_ctx = ChatContext()
        full_ctx.add_message(role="system", content=final_instructions)
        if memory_summary:
            full_ctx.add_message(role="system", content=memory_summary)
        
        agent_params["chat_ctx"] = full_ctx
        
        # Text-only realtime: model outputs text, use separate TTS for speech
        if realtime_config.get("modalities") == "text" and tts_instance:
            agent_params["tts"] = tts_instance
        rt_provider = realtime_config.get("provider", "google")
        rt_model = realtime_config.get("model", "N/A")
        rt_voice = realtime_config.get("voice", "N/A")
        logger.info(f"Realtime mode: provider={rt_provider} model={rt_model} voice={rt_voice}")
    else:
        # Standard pipeline: STT → LLM → TTS

        agent_params = {
            "instructions": final_instructions,
            "stt": stt,
            "llm": llm_instance,
            "tts": tts_instance,
            "turn_handling": {
                "endpointing": {
                    "min_delay": agent_response_delay,
                    "max_delay": 5.0,
                },
                "interruption": {
                    "enabled": True,
                    "mode": "vad",
                }
            }
        }

        # POPULATE MUTABLE CONTEXT BEFORE AGENT START
        full_ctx = ChatContext()
        full_ctx.add_message(role="system", content=final_instructions)
        if memory_summary:
            full_ctx.add_message(role="system", content=memory_summary)
            
        agent_params["chat_ctx"] = full_ctx

        # Faster endpointing for simulation agents
        if is_simulation_test:
            agent_params["turn_handling"]["endpointing"]["min_delay"] = min(agent_response_delay, 0.1)
            agent_params["turn_handling"]["endpointing"]["max_delay"] = 2.0

        # Add VAD (Ultra-Stable Silero Only)
        if vad_instance is not None:
            agent_params["vad"] = vad_instance

    # Define ToolContext wrapper for direct room/session interaction
    class ToolContext:
        """Context object passed to tools, providing access to session and job context."""
        def __init__(self, job_ctx, session_ref, call_tracker_ref, agent_config, sip_metadata_ref=None):
            self._job_ctx = job_ctx
            self._session_ref = session_ref
            self._call_tracker_ref = call_tracker_ref
            self._agent_config = agent_config
            self._sip_metadata_ref = sip_metadata_ref or {"metadata": {}}

        @property
        def session(self):
            return self._session_ref.get("session")

        @property
        def room(self):
            return self._job_ctx.room if self._job_ctx else None

        @property
        def ctx(self):
            return self._job_ctx

        @property
        def agent_config(self):
            return self._agent_config

        @property
        def call_tracker(self):
            return self._call_tracker_ref.get("tracker")

        @property
        def sip_metadata(self):
            return self._sip_metadata_ref.get("metadata", {})

        @property
        def caller_phone(self):
            return self.sip_metadata.get("from_number", "")

        @property
        def called_number(self):
            return self.sip_metadata.get("to_number", "")

        @property
        def call_id(self):
            return self.sip_metadata.get("call_id", "")

    tool_context = ToolContext(ctx, session_ref, call_tracker_ref, agent_config, sip_metadata_ref)
    
    # Get enabled tools from agent config (Array)
    enabled_tool_names = gui_tools_array
    if not enabled_tool_names:
        enabled_tool_names = agent_config.get("tools", [])

    # --- Phase 4: Dynamic Tool Loading (Webhooks & MCP) ---
    mcp_manager = None
    if MCPClientManager is not None:
        mcp_manager = MCPClientManager()
        
        # Check if we need to connect to any MCP servers
        mcp_configs = agent_config.get("mcp_servers", []) # List of {id, type, url, etc.}
        if mcp_configs:
            for mcp_cfg in mcp_configs:
                await mcp_manager.connect_to_server(mcp_cfg["id"], mcp_cfg)

    # Load all tools (Static, Telephony, Webhook, MCP) via ToolRegistry
    if enabled_tool_names:
        # Pass tool_context and mcp_manager to registry
        agent_tools = tool_registry.get_tools_for_agent(
            enabled_tool_names, 
            context=tool_context,
            mcp_manager=mcp_manager
        )
        logger.info(f"Loaded {len(agent_tools)} tools (P1-4).")
    else:
        logger.info("No tools enabled for this agent.")

    # (Note: tools_list will be populated below with decorated handlers)
    
    # Store mcp_manager in session state for cleanup later
    session_ref["mcp_manager"] = mcp_manager

    # Specialized Stabilization Detection: Sarah Inbound vs Robocall Outbound
    is_outbound_call = caller_data.get("outbound") == True or "lead_name" in caller_data
    is_sarah_inbound_mode = not is_outbound_call and ("sarah" in agent_name.lower())
    logger.info(f"STABILIZATION MODE: {'SARAH_INBOUND' if is_sarah_inbound_mode else 'STANDARD'} (IsOutbound={is_outbound_call})")

    def create_tool_handler(t, context, is_sarah=False):
        """
        Create a properly typed handler function for a tool.
        """
        schema = t.get_parameters_schema()
        properties = schema.get("properties", {})
        required = schema.get("required", [])

        # For tools with no parameters, create a simple handler
        if not properties:
            async def no_param_handler(ctx: RunContext):
                logger.info(f"Tool called: {t.name} (no params)")

                # For call-ending/audio tools, log BEFORE execution
                ending_tools = ["hangup", "transfer", "end_call", "reject_service", "transfer_to_human"]
                if is_sarah:
                    ending_tools.extend(["mark_resolved", "mark_unresolved", "submit_ticket"])
                
                is_call_ending = t.name in ending_tools

                try:
                    if is_call_ending:
                        if context.call_tracker:
                            context.call_tracker.on_tool_call(t.name, {}, {"status": "executing", "message": "Ending call..."})
                        
                        # 🔇 ATOMIC SILENCE: Force mute Sarah's TTS instantly
                        if context.session:
                            try:
                                context.session.mute()
                                logger.info(f"🔇 [ATOMIC SILENCE] Sarah's TTS muted for {t.name}")
                            except: pass

                    result = await t.execute(context)
                    logger.info(f"Tool {t.name} completed with result: {str(result)[:200]}")
                    
                    if context.call_tracker and not is_call_ending:
                        context.call_tracker.on_tool_call(t.name, {}, result if isinstance(result, dict) else {"result": str(result)})
                    return json.dumps(result) if isinstance(result, dict) else str(result)
                except Exception as e:
                    logger.error(f"Tool {t.name} error: {e}")
                    if context.call_tracker:
                        context.call_tracker.on_tool_call(t.name, {}, {"error": str(e)})
                    return json.dumps({"error": str(e)})
            return no_param_handler

        # Build typed parameter list based on schema
        param_names = list(properties.keys())
        param_defs = []
        for name in param_names:
            prop = properties[name]
            prop_type = prop.get("type", "string")
            default = prop.get("default")

            type_map = {"string": "str", "integer": "int", "number": "float", "boolean": "bool"}
            py_type = type_map.get(prop_type, "str")

            if name in required:
                param_defs.append(f"{name}: {py_type}")
            elif default is not None:
                param_defs.append(f"{name}: {py_type} = {repr(default)}")
            else:
                param_defs.append(f"{name}: Optional[{py_type}] = None")

        params_str = ", ".join(param_defs)
        kwargs_build = ", ".join([f'"{n}": {n}' for n in param_names])

        # Create the handler function dynamically
        func_code = f'''
async def typed_handler(ctx: RunContext, {params_str}):
    kwargs = {{{kwargs_build}}}
    # Remove None values for optional params
    kwargs = {{k: v for k, v in kwargs.items() if v is not None}}
    logger.info(f"Tool called: {t.name} with args: {{kwargs}}")

    # Atomic Silence: Sarah Inbound only for specialized tools
    ending_tools_list = ["hangup", "transfer", "end_call", "reject_service", "transfer_to_human"]
    if is_sarah:
        ending_tools_list.extend(["mark_resolved", "mark_unresolved", "submit_ticket"])
    
    is_call_ending_tool = "{t.name}" in ending_tools_list

    try:
        if is_call_ending_tool:
            if ctx_ref.call_tracker:
                ctx_ref.call_tracker.on_tool_call("{t.name}", kwargs, {{"status": "executing", "message": "Ending call..."}})
            
            # 🔇 ATOMIC SILENCE: Force mute Sarah's TTS instantly so she doesn't talk over the tool's injected audio!
            if ctx_ref.session:
                try:
                    ctx_ref.session.mute()
                    logger.info(f"🔇 [ATOMIC SILENCE] Sarah's TTS muted for {t.name}")
                except Exception as e:
                    pass

        result = await tool_ref.execute(ctx_ref, **kwargs)
        logger.info(f"Tool {t.name} completed with result: {{str(result)[:200]}}")

        if ctx_ref.call_tracker and not is_call_ending_tool:
            ctx_ref.call_tracker.on_tool_call("{t.name}", kwargs, result if isinstance(result, dict) else {{"result": str(result)}})
        return json.dumps(result) if isinstance(result, dict) else str(result)
    except Exception as e:
        logger.error(f"Tool {t.name} error: {{e}}")
        if ctx_ref.call_tracker:
            ctx_ref.call_tracker.on_tool_call("{t.name}", kwargs, {{"error": str(e)}})
        return json.dumps({{"error": str(e)}})
'''
        local_vars = {"tool_ref": t, "ctx_ref": context, "logger": logger, "json": json, "Optional": Optional}
        exec(func_code, local_vars)
        return local_vars["typed_handler"]

    # Separate non-callable tools (like background_audio) from LLM-callable tools
    background_audio_tool = None
    callable_agent_tools = []
    for tool in agent_tools:
        if getattr(tool, 'is_function_tool', True) is False:
            if tool.name == "background_audio":
                background_audio_tool = tool
        else:
            callable_agent_tools.append(tool)

    # Register each callable tool as a FunctionTool
    for tool in callable_agent_tools:
        handler = create_tool_handler(tool, tool_context, is_sarah=is_sarah_inbound_mode)
        decorated_tool = function_tool(handler, name=tool.name)
        tools_list.append(decorated_tool)

    if callable_agent_tools:
        logger.info(f"Registered {len(callable_agent_tools)} tools: {', '.join([t.name for t in callable_agent_tools])}")
    if background_audio_tool:
        logger.info(f"Background audio tool configured (will start with session)")

    # Create handoff tools if configured
    handoff_tools = create_handoff_tools_with_session_ref(agent_id, session_ref, call_tracker_ref, agent_name)
    if handoff_tools:
        tools_list.extend(handoff_tools)
        logger.info(f"Registered {len(handoff_tools)} handoff tools")

    # Dynamic Tool Registry: Load tools assigned to this agent (Native, Webhook, Static)
    raw_tools_config = agent_config.get("toolsConfig", [])
    if raw_tools_config:
        from app.services.tools import tool_registry
        
        # Create a tiny context object for the registry to bind telephony actions
        class ToolContext:
            def __init__(self, session, room, ctx, agent_config):
                self.session = session
                self.room = room
                self.ctx = ctx
                self.agent_config = agent_config

        t_ctx = ToolContext(session_ref.get("session"), ctx.room, ctx, agent_config)
        
        try:
            dynamic_tools = tool_registry.get_tools_for_agent(raw_tools_config, context=t_ctx, mcp_manager=mcp_manager)
            tools_list.extend(dynamic_tools)
            logger.info(f"Injected {len(dynamic_tools)} dynamic tools from Registry")
        except Exception as e:
            logger.error(f"Failed to load tools from Registry: {e}")

    # Fetch and wrap all MCP tools from connected servers
    if mcp_manager:
        try:
            mcp_tools = await mcp_manager.get_wrapped_tools()
            if mcp_tools:
                tools_list.extend(mcp_tools)
                logger.info(f"Injected {len(mcp_tools)} dynamic MCP tools.")
        except Exception as e:
            logger.error(f"Failed to inject MCP tools: {e}")

    # Check if any silent handoffs are configured and add instructions to prompt
    if handoff_manager:
        handoff_config = handoff_manager.get_agent_handoffs(agent_id)
        if handoff_config.get("enabled"):
            targets = handoff_config.get("allowed_targets", [])
            # Silent transfers: explicit department handoffs that should be invisible
            silent_transfers = [t for t in targets if t.get("handoff_type", "transfer") == "transfer" and not t.get("announce_transfer", True)]
            if silent_transfers:
                silent_instruction = "\n\n## Silent Transfer Instructions\nIMPORTANT: Some transfer tools are marked as [SILENT TRANSFER]. When using these tools, you must NOT say anything about transferring to the caller. Do not say 'let me transfer you', 'I'll connect you', 'one moment while I transfer', or anything similar. Simply call the tool without any verbal response. The transfer should be seamless and invisible to the caller."
                final_instructions = final_instructions + silent_instruction
                logger.info(f"Added silent transfer instructions for {len(silent_transfers)} silent transfer target(s)")

            # Silent transitions: seamless workflow phase changes
            silent_transitions = [t for t in targets if t.get("handoff_type", "transfer") == "transition" and not t.get("announce_transfer", True)]
            if silent_transitions:
                transition_instruction = "\n\n## Seamless Transition Instructions\nIMPORTANT: Some tools are marked as [SEAMLESS TRANSITION]. These represent invisible workflow phase changes - the caller must never know a different agent is taking over. Do NOT mention transferring, connecting, or handing off. Continue the conversation as if you are the same person naturally moving to a new topic. The transition must be completely invisible to the caller."
                final_instructions = final_instructions + transition_instruction
                logger.info(f"Added seamless transition instructions for {len(silent_transitions)} silent transition target(s)")

            if silent_transfers or silent_transitions:
                agent_params["instructions"] = final_instructions

    # --- SOVEREIGN AGENTIC EVOLUTION: DYNAMIC JSONB PROMPT INJECTION ---
    # Fetch triggers and speech from JSONB tools_settings (Object)
    escalation_triggers = tools_settings.get("escalation_triggers", "Billing, Bills, Electricity Bill, excessive charges, frustrated, abusive")
    hangup_triggers = tools_settings.get("hangup_triggers", "Goodbye, Allah Hafiz, Thank you, bye")
    
    resolution_protocol_injection = """
## RESOLUTION PROTOCOL (SILENT - TOOL ONLY)
If the user confirms their issue is resolved or NOT resolved:
1. CALL 'mark_resolved' or 'mark_unresolved' IMMEDIATELY.
2. YOU MUST BE COMPLETELY SILENT. Do not speak the farewell/apology script. The tool will handle all speech.
3. OUTPUT NO TEXT. This is a critical atomic transition.
""" if is_sarah_inbound_mode else ""

    suthra_prompt_injection = ""
    if is_legacy_complaint_agent:
        suthra_prompt_injection = f"""
<STRICT_REALTIME_RULES>
## ESCALATION PROTOCOL (SILENT - TOOL ONLY)
If the user mentions "{escalation_triggers}":
1. CALL the 'transfer_to_human' tool IMMEDIATELY.
2. DO NOT say any Urdu text. The tool will handle the verbal apology.
3. YOU MUST NOT generated ANY accompanying conversational text. NO exceptions.
4. This is an atomic action. Execute once and stop completely.

## HANGUP PROTOCOL (SILENT - TOOL ONLY)
If the user says "{hangup_triggers}" or indicates they want to end the call:
1. CALL the 'hangup' tool IMMEDIATELY.
2. YOU MUST BE COMPLETELY SILENT. Do not emit any text natively.

{resolution_protocol_injection}
## LLM-TO-TTS STREAMING STRATEGY (PHASE 3)
- Always begin your responses with a short, natural filler phrase followed by a comma.
- Examples in Urdu: "جی،", "جی بالکل،", "آپ کا مطلب ہے کہ،", "جی سمجھی،", "ٹھیک ہے،".
- This ensures the TTS can synthesize and play that first phrase immediately, cutting TTFB to under 1.5s.
</STRICT_REALTIME_RULES>
"""

    # Generic AI Dialer Instructions
    dialer_instructions = """
<SYSTEM_STATE>
The opening message has already been delivered to the user automatically by the runtime. Do NOT repeat the opening greeting. Await the user's response and continue the conversation naturally.
</SYSTEM_STATE>
"""

    # Prepend dynamic rules to the system prompt
    current_prompt = agent_config.get("system_prompt", "")
    agent_config["system_prompt"] = dialer_instructions + "\n\n" + suthra_prompt_injection + "\n\n" + current_prompt
    if is_legacy_complaint_agent:
        logger.info(f"Sovereign Prompt Injected with dynamic JSONB triggers and dialer instructions.")
    else:
        logger.info(f"Generic dialer instructions injected.")

    # Initialize 10-Tool Agentic Matrix via ToolProvider (Restored V9 Order)
    provider = None
    _tools_config = normalize_tools_config(agent_config.get("tools_config", []))
    _has_explicit_tools = isinstance(_tools_config, list) and len(_tools_config) > 0
    
    if SovereignToolProvider and (is_legacy_complaint_agent or _has_explicit_tools):
        try:
            # Use the already extracted SIP from_number (from Phase 3)
            # Normalization Policy: Local Pakistani Format (03XXXXXXXXX)
            # Clean sip:, @, and + as per user request
            clean_num = (from_number or "").replace("sip:", "").split("@")[0].replace("+", "")
            
            # Strip ALL leading 92s and 0s (Recursive Normalization)
            while clean_num.startswith('92') or clean_num.startswith('0'):
                if clean_num.startswith('92'):
                    clean_num = clean_num[2:]
                elif clean_num.startswith('0'):
                    clean_num = clean_num[1:]
            
            asterisk_from = '0' + clean_num
            
            # Note: SovereignToolProvider uses session_ref/room for late binding
            provider = SovereignToolProvider(session_ref, ctx.room, agent_config, from_number=asterisk_from)
            tools_list.extend(provider.get_tools())
            if is_legacy_complaint_agent:
                logger.info("Successfully registered Sovereign Tool Suite (Matrix V9).")
        except Exception as e:
            logger.error(f"Failed to initialize SovereignToolProvider: {e}")
    elif not is_legacy_complaint_agent:
        logger.info("No tools enabled for generic agent.")

    # Sarah's Brain: Tool Matrix Initialization (Restored Working Pattern)
    if tools_list:
        agent_params["tools"] = tools_list
        if is_legacy_complaint_agent:
            logger.info(f"Sarah's Brain: Tool Matrix Activated ({len(tools_list)} tools) via direct list.")
        else:
            logger.info(f"Generic Voice Agent: Tool Matrix Activated ({len(tools_list)} tools) via direct list.")

    # Optimized for Suthra Punjab Telephony: Use RoomOptions instead of Agent param
    # Sarah V23.15 Phase 3 Bypass: Explicitly disabling FFI filters to save 200ms and stop crashes.
    enable_noise_cancellation = False 
    noise_cancellation_model = "nc"
    
    # Sarah V23.16: SDK 1.5.1 Alignment
    # Move min_endpointing_delay to the top-level for maximum reaction speed (50ms).
    # Removed unsupported min_sentences_to_stream to resolve Agent constructor crash.
    _attached_tools = agent_params.get("tools", [])
    logger.info(f"Runtime tools attached: {len(_attached_tools)}")
    agent = voice.Agent(
        min_endpointing_delay=agent_response_delay,
        **agent_params
    )


    # Start the agent session - only in voice mode
    # In text mode, we skip the voice session entirely to prevent audio responses
    session = None
    if test_mode != "text":
        session = voice.AgentSession(use_tts_aligned_transcript=True)
        
        # Call Lifecycle Flags
        setattr(session, "sip_participant_connected", False)
        setattr(session, "sip_participant_disconnected", False)
        setattr(session, "greeting_started", False)
        setattr(session, "greeting_first_audio_started", False)
        setattr(session, "greeting_completed", False)
        setattr(session, "user_transcript_count", 0)
        setattr(session, "agent_speech_count", 0)
        setattr(session, "disconnected_before_greeting", False)
        setattr(session, "disconnected_during_greeting", False)
        setattr(session, "no_conversation", False)
        setattr(session, "_turn_index", 0)
        setattr(session, "_turns_data", [])
        setattr(session, "_diagnostic_logged", False)
        setattr(session, "_current_turn_logged", False)
        setattr(session, "_latency_logged_turn_index", 0)

        # Build room options
        room_options = None
        sim_participant_kinds = None

        # Simulation: agents must accept AGENT participant kind so they can
        # see each other (default RoomIO only accepts STANDARD + SIP)
        if is_simulation_test:
            sim_participant_kinds = [
                rtc.ParticipantKind.PARTICIPANT_KIND_STANDARD,
                rtc.ParticipantKind.PARTICIPANT_KIND_SIP,
                rtc.ParticipantKind.PARTICIPANT_KIND_AGENT,
            ]
            room_options = voice.room_io.RoomOptions(
                participant_kinds=sim_participant_kinds,
            )
            logger.info("Simulation: RoomIO configured to accept AGENT participant kind")

        if enable_noise_cancellation:
            try:
                from livekit.plugins import noise_cancellation
                nc_models = {
                    "nc": noise_cancellation.NC,
                    "bvc": noise_cancellation.BVC,
                    "bvc_telephony": noise_cancellation.BVCTelephony,
                }
                nc_factory = nc_models.get(noise_cancellation_model, noise_cancellation.NC)
                nc_instance = nc_factory()
                nc_opts = {
                    "audio_input": voice.room_io.AudioInputOptions(
                        noise_cancellation=nc_instance,
                    ),
                }
                if sim_participant_kinds:
                    nc_opts["participant_kinds"] = sim_participant_kinds
                room_options = voice.room_io.RoomOptions(**nc_opts)
                model_labels = {"nc": "Standard NC", "bvc": "Background Voice Cancellation", "bvc_telephony": "BVC Telephony"}
                logger.info(f"Noise Cancellation initialized: {model_labels.get(noise_cancellation_model, 'Standard NC')}")
            except ImportError:
                logger.warning("Noise Cancellation: package not installed (livekit-plugins-noise-cancellation) - skipping")
            except Exception as e:
                logger.error(f"Noise Cancellation init failed: {e}")

        # V23.19: FIXED - Dynamic Participant Mapping
        # Sarah was 'deaf' because participant_identity in RoomOptions acts as a filter.
        # We must bind it to the CITIZEN (SIP Caller), not the Agent's own identity.
        target_participant = None
        for p in ctx.room.remote_participants.values():
            if str(p.identity).startswith("sip_") or p.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP:
                target_participant = p
                break
        
        if room_options is None:
            room_options = voice.room_io.RoomOptions(text_output=True)

        if target_participant:
            room_options.participant_identity = target_participant.identity
            if is_legacy_complaint_agent:
                logger.info(f"🏂🏻 SYNC: Sarah is now listening to SIP Caller: {target_participant.identity}")
            else:
                logger.info(f"🏂🏻 SYNC: Generic voice agent listening to SIP Caller: {target_participant.identity}")
        else:
            # Fallback: Default to auto-subscribe all (Safety Mode)
            room_options.participant_identity = ""
            logger.info("≡ƒÅé≡ƒÅ╗ SYNC: No SIP participant found yet. Defaulting to Open Ears mode.")

        # --- DUAL-LANGUAGE ENGINE: English Translation Injection (V23.25) ---
        # We register these hooks BEFORE session.start() to avoid race conditions.
        
        async def handle_translation(text: str, participant: rtc.Participant, source_type: str):
            if getattr(session, "_call_ending", False):
                logger.info("[CALL_END] suppressing agent speech after disconnect")
                return
            if not text or not session: 
                return
            
            logger.info(f"≡ƒöì SYNC_START: Translating {source_type} speech: {text[:50]}...")
            try:
                # 1. Build the list manually with list-wrapped content for Pydantic
                messages_list = [
                    llm.ChatMessage(role="system", content=["You are a professional translator. Output ONLY the English translation."]),
                    llm.ChatMessage(role="user", content=[f"Translate the following Urdu/Punjabi text from a call center to concise English: {text}"])
                ]

                # 2. Constructor Injection using 'items' (NOT messages)
                translation_ctx = llm.ChatContext(items=messages_list)
                
                # V23.30: Use a clean, tool-free LLM instance to avoid parallel_tool_calls 400 errors
                from livekit.plugins import openai
                translator_llm = openai.LLM(model="gpt-4o-mini")
                
                # 3. Synchronous fetch, asynchronous stream collection
                stream = translator_llm.chat(chat_ctx=translation_ctx)
                english_text = ""
                async for chunk in stream:
                    # 1. Handle if LiveKit yields a raw string
                    if isinstance(chunk, str):
                        english_text += chunk
                        continue
                        
                    # 2. Handle if it is a structured ChatChunk
                    content = None
                    if hasattr(chunk, 'choices') and chunk.choices: # Native OpenAI fallback
                        content = chunk.choices[0].delta.content
                    elif hasattr(chunk, 'delta') and hasattr(chunk.delta, 'content'): # LiveKit ChatChunk delta
                        content = chunk.delta.content
                    elif hasattr(chunk, 'content'): # Direct content fallback
                        content = chunk.content
                    elif hasattr(chunk, 'text'): # Direct text fallback
                        content = chunk.text
                        
                    if content:
                        english_text += content
                
                english_text = english_text.strip()
                t_end = time.time()
                
                if not english_text:
                    logger.warning("≡ƒÜ¿ SYNC_EMPTY: LLM returned empty translation.")
                    return

                if getattr(session, "_call_ending", False):
                    logger.info("[CALL_END] suppressing datachannel broadcast after disconnect")
                    return
                
                # 4. DataChannel Broadcast Pivot (V23.34)
                # This bypasses the WebRTC race condition with Deepgram STT
                payload = json.dumps({
                    "type": "bilingual_sync",
                    "identity": participant.identity,
                    "urdu_text": text,
                    "english_text": english_text.strip()
                }).encode('utf-8')
                
                await ctx.room.local_participant.publish_data(payload, topic="bilingual_sync", reliable=True)
                logger.info(f"≡ƒÅé≡ƒÅ╗ SYNC_COMPLETE: DataChannel Broadcast sent for {participant.identity}")
            except Exception as e:
                logger.error(f"≡ƒÜ¿ SYNC_ERROR: {e}")

        # Bind to Granular Session Events (V23.25 Official SDK Pattern)
        @session.on("conversation_item_added")
        def on_conversation_item_added(event: ConversationItemAddedEvent):
            # Guard against non-text items (audio/multimodal)
            if not isinstance(event.item, llm.ChatMessage):
                return
            if not event.item.text_content:
                return
                
            text = event.item.text_content
            role = event.item.role

            if role == "user":
                # Resolve Citizen (SIP Participant) dynamically
                citizen = None
                for p in ctx.room.remote_participants.values():
                    if str(p.identity).startswith("sip_") or p.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP:
                        citizen = p
                        break
                target = citizen or (next(iter(ctx.room.remote_participants.values())) if ctx.room.remote_participants else None)
                
                # Increment user transcript count
                count = getattr(session, "user_transcript_count", 0)
                setattr(session, "user_transcript_count", count + 1)
                
                # Check for Barge-In overlap fallback
                try:
                    import time
                    ts_now = time.time()
                    ts_agent_stopped = getattr(session, "_ts_agent_stopped_speaking", 0)
                    is_speaking = getattr(session, "_agent_speaking", False)
                    delta_ms = int((ts_now - ts_agent_stopped) * 1000)
                    
                    if is_speaking or delta_ms < 1500:
                        logger.info(f"[BARGE_IN] transcript_overlap_detected delta_ms={delta_ms} agent_speaking={is_speaking}")
                except Exception as e:
                    logger.debug(f"Error checking transcript overlap: {e}")
                    
                if target:
                    asyncio.create_task(handle_translation(text, target, "user"))
            elif role in ["assistant", "agent"]:
                asyncio.create_task(handle_translation(text, ctx.room.local_participant, "agent"))

        # V23.36: Authoritative Disconnect Handlers (Ghost Room Fix)
        @ctx.room.on("disconnected")
        def on_disconnected(reason):
            logger.info(f"🏁 SYNC: Room disconnected ({reason}). Finalizing database record.")
            setattr(session, "room_disconnected_flag", True)
            setattr(session, "_call_ending", True)
            try:
                from app.services.call_history import complete_call_record
                complete_call_record(room_name=ctx.room.name, final_payload={"status": "completed", "reason": str(reason), "duration": 0})
            except Exception as e:
                logger.error(f"🚨 SYNC: Database cleanup failed: {e}")

        @ctx.room.on("participant_disconnected")
        def on_p_disconnected(participant):
            if participant.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP or str(participant.identity).startswith("sip_"):
                logger.info(f"🏁 SYNC: SIP Participant {participant.identity} disconnected. Finalizing.")
                setattr(session, "_call_ending", True)
                setattr(session, "sip_participant_disconnected", True)
                logger.info("[CALL_END] SIP participant disconnected; cancelling active speech")
                try:
                    from app.services.call_history import complete_call_record
                    complete_call_record(room_name=ctx.room.name, final_payload={"status": "completed", "reason": "Participant left", "duration": 0})
                except Exception as e:
                    logger.error(f"🚨 SYNC: Database cleanup failed: {e}")

        logger.info("≡ƒöì SYNC_HOOKS_ACTIVE: Session Translation engine armed.")

        # Finally, START the session
        await session.start(agent, room=ctx.room, room_options=room_options)
        session_ref["session"] = session
        logger.info(f"Agent '{agent_name}' started (voice mode)")


        # --- ZERO-LATENCY ENGINE: INSTANT WAV GREETING (EVENT DRIVEN) ---
        greeting_audio_url = tools_settings.get("greeting_audio_url")
        if is_telephony_agent and greeting_audio_url:
            @ctx.room.on("participant_joined")
            def on_p_joined(participant):
                if participant.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP or str(participant.identity).startswith("sip_"):
                    logger.info(f"PBX INSTANT: SIP Participant detected. Scheduling Greeting with 0.7s STABILIZATION.")
                    async def delayed_greeting():
                        await asyncio.sleep(0.7) # Reduced from 1.5s as approved for "Instant Sarah"
                        await play_wav_greeting(session, greeting_audio_url, initial_greeting)
                    asyncio.create_task(delayed_greeting())

        # TELEPHONY OPTIMIZATION: Instant Greeting (Recording or Text-to-Speech)
        greeting_audio_url = tools_settings.get("greeting_audio_url")
        
        # --- NEW GREETING RESOLUTION PRECEDENCE ---
        is_outbound_call_context = is_outbound_call or sip_metadata.get("direction") == "outbound" or ctx.room.name.startswith("outbound_")
        
        resolved_greeting = None
        resolved_source = None
        
        if is_outbound_call_context:
            try:
                jm = {}
                if "job_metadata" in locals() and job_metadata:
                    jm = normalize_dict(job_metadata)
                elif call_tracker and call_tracker.job_metadata:
                    jm = normalize_dict(call_tracker.job_metadata)
    
                jm_config = jm.get("config", {}) if isinstance(jm.get("config"), dict) else {}
                
                logger.info(f"[GREETING] metadata_type job_metadata={type(jm).__name__} normalized_keys={list(jm.keys())}")
    
                metadata_source = jm.get("source") or jm.get("type")
                
                if metadata_source == "vicidial":
                    src = "vicidial_mapping.opening_message"
                    val = jm.get("vicidial_mapping", {}).get("opening_message")
                elif metadata_source == "inbound":
                    src = "inbound_route.greeting"
                    val = jm.get("inbound_route", {}).get("greeting")
                elif metadata_source in ["ai_native_campaign", "outbound_campaign_call", "preview", "manual"]:
                    src = f"{metadata_source}.opening_message"
                    val = jm.get("opening_message") or jm_config.get("opening_message")
                else:
                    src = "job_metadata.opening_message"
                    val = jm.get("opening_message") or jm_config.get("opening_message")
                
                if val and isinstance(val, str) and val.strip():
                    resolved_greeting = val.strip()
                    resolved_source = src
                    
                if resolved_greeting:
                    # Merge template data in priority order
                    template_data = {}
                    # Base: caller_data (already has participant metadata, room metadata)
                    template_data.update(caller_data)
                    # Next: job metadata root
                    template_data.update(jm)
                    # Highest priority for explicitly injected lead_data
                    lead_data_payload = jm.get("lead_data") or caller_data.get("lead_data") or {}
                    for k, v in lead_data_payload.items():
                        if v is not None and str(v).strip():
                            existing = template_data.get(k)
                            if existing is None or not str(existing).strip():
                                template_data[k] = v
                            
                    logger.info(f"[PERSONALIZATION] lead_data_keys={list(lead_data_payload.keys())}")
                    logger.info(f"[PERSONALIZATION] template_keys={list(template_data.keys())}")
                    
                    # Replace variables safely
                    initial_greeting = render_template(resolved_greeting, template_data)
                    trunc_text = initial_greeting[:220] + "..." if len(initial_greeting) > 220 else initial_greeting
                    logger.info(f"[GREETING] resolved_source={resolved_source}")
                    logger.info(f"[GREETING] resolved_text={trunc_text}")
            except Exception as e:
                logger.exception("[GREETING] failed to resolve greeting; using fallback")
                resolved_greeting = None

        if not resolved_greeting and is_outbound_call_context:
            initial_greeting = agent_config.get("fallback_greeting") or agent_config.get("initial_greeting")
            resolved_source = "agent.fallback_greeting"
            if not initial_greeting:
                initial_greeting = "Hello, this is your AI assistant."
                resolved_source = "generic_fallback"
            logger.info(f"[GREETING] fallback resolved_source={resolved_source}")

        if is_telephony_agent and (initial_greeting or greeting_audio_url):
            # Extract basic SIP metadata for greeting variables ({{user_number}})
            temp_from = ""
            if ctx.room.remote_participants:
                for p in ctx.room.remote_participants.values():
                    a = getattr(p, 'attributes', {}) or {}
                    temp_from = a.get("sip.phoneNumber", "")
                    if temp_from: break
            
            if True:
                async def play_wav_greeting(session, url, fallback_text):
                    try:
                        # --- Pure-PCM Extraction for Absolute WebRTC Alignment ---
                        wav_bytes = None
                        if url.startswith("http://") or url.startswith("https://"):
                            http_sess = await get_http_session()
                            async with http_sess.get(url, timeout=5) as resp:
                                if resp.status != 200:
                                    raise Exception(f"HTTP_{resp.status}")
                                wav_bytes = await resp.read()
                        else:
                            with open(url, "rb") as f:
                                wav_bytes = f.read()
                        
                        # Binary-perfect PCM reading from pre-formatted WAV
                        with wave.open(io.BytesIO(wav_bytes), 'rb') as wav:
                            sample_rate = wav.getframerate()
                            num_channels = wav.getnchannels()
                            sampwidth = wav.getsampwidth()
                            if sample_rate != 16000 or num_channels != 1:
                                logger.warning(f"[PBX] Unaligned WAV detected: {sample_rate}Hz {num_channels}ch")
                            raw_pcm = wav.readframes(wav.getnframes())

                        source = rtc.AudioSource(sample_rate, num_channels)
                        track = rtc.LocalAudioTrack.create_audio_track("greeting", source)
                        publication = await ctx.room.local_participant.publish_track(track)
                        
                        interrupted = False
                        def on_speech_started(*args):
                            nonlocal interrupted
                            interrupted = True
                            logger.info("[BARGE_IN] stopped greeting playback")
                        session.on("user_speech_started", on_speech_started)
                        
                        # 20ms chunks (LiveKit Safe)
                        chunk_samples = sample_rate // 50
                        bytes_per_sample = sampwidth * num_channels
                        chunk_size = chunk_samples * bytes_per_sample
                        
                        logger.info(f"[GREETING] playback_sample_rate={sample_rate} playback_channels={num_channels} chunk_ms=20")
                        
                        start_time = asyncio.get_event_loop().time()
                        first_frame = True
                        
                        setattr(session, "greeting_started", True)

                        for i in range(0, len(raw_pcm), chunk_size):
                            if interrupted: break
                            chunk = raw_pcm[i:i+chunk_size]
                            if len(chunk) < chunk_size:
                                chunk = chunk.ljust(chunk_size, b'\x00')
                            
                            if first_frame:
                                ts_now = time.time()
                                answer_to_first_audio_ms = int((ts_now - ts_delay_end) * 1000) if "ts_delay_end" in locals() else 0
                                logger.info(f"[GREETING] source=cached_audio")
                                logger.info(f"[GREETING] answer_to_first_audio_ms={answer_to_first_audio_ms}")
                                first_frame = False
                                setattr(session, "greeting_first_audio_started", True)
                                
                            await source.capture_frame(rtc.AudioFrame(chunk, sample_rate, num_channels, chunk_samples))
                            
                            # Mathematical pacing with drift correction
                            expected_time = start_time + ((i + chunk_size) / bytes_per_sample) / sample_rate
                            sleep_duration = expected_time - asyncio.get_event_loop().time()
                            if sleep_duration > 0:
                                await asyncio.sleep(sleep_duration)

                        if interrupted or getattr(session, "sip_participant_disconnected", False):
                            await ctx.room.local_participant.unpublish_track(publication.sid)
                        else:
                            await ctx.room.local_participant.unpublish_track(publication.sid)
                            setattr(session, "greeting_completed", True)
                        
                    except Exception as e:
                        logger.error(f"[PBX] Greeting V23.9 Error: {e}")
                        if fallback_text:
                            session.say(fallback_text, allow_interruptions=True)

            if greeting_audio_url:
                asyncio.create_task(play_wav_greeting(session, greeting_audio_url, initial_greeting))
                
            elif initial_greeting:
                # Text-Based Greeting
                fast_greeting = initial_greeting.replace("{{user_number}}", temp_from)
                
                # Outbound SIP Stabilization Delay
                is_outbound = is_outbound_call or sip_metadata.get("direction") == "outbound" or ctx.room.name.startswith("outbound_")
                
                if is_outbound:
                    # SIP Answer Readiness Gate
                    logger.info("[SIP_ANSWER_WAIT] Starting SIP answer readiness check")
                    ts_wait_start = time.time()
                    answer_confirmed = False
                    
                    last_log_time = 0.0
                    last_logged_attrs = None
                    first_obs_logged = False
                    
                    try:
                        max_wait = float(os.getenv("OUTBOUND_SIP_ANSWER_TIMEOUT_SEC", "30"))
                    except (ValueError, TypeError):
                        max_wait = 30.0
                    max_wait = max(5.0, min(max_wait, 120.0))
                    logger.info(f"[SIP_ANSWER_WAIT] timeout_sec={max_wait}")
                    status_keys = [
                        "sip.callStatus", "sip.call_status", "callStatus", 
                        "call_status", "status", "sipCallStatus"
                    ]
                    ready_values = {
                        "active", "answered", "established", 
                        "in-progress", "in_progress", "connected"
                    }
                    
                    saw_sip_participant = False
                    last_join_log_time = 0.0
                    last_known_sip_status = None
                    
                    while time.time() - ts_wait_start < max_wait:
                        is_call_ending = getattr(session, "_call_ending", False) or getattr(session, "room_disconnected_flag", False)
                        is_disconnected = (
                            getattr(session, "sip_participant_disconnected", False) or
                            getattr(session, "room_disconnected_flag", False) or
                            (ctx.room and (
                                str(getattr(ctx.room, "connection_state", "")).lower() == "disconnected" or
                                "disconnected" in str(getattr(ctx.room, "connection_state", "")).lower()
                            ))
                        )
                        
                        if is_call_ending:
                            logger.info("[SIP_ANSWER_WAIT] break reason=call_ending")
                            break
                        if is_disconnected:
                            logger.info("[SIP_ANSWER_WAIT] break reason=room_disconnected")
                            break
                            
                        remote_parts = list(ctx.room.remote_participants.values())
                        if not remote_parts:
                            if saw_sip_participant:
                                logger.info("[SIP_ANSWER_WAIT] SIP participant disappeared before answer")
                                break
                            else:
                                now = time.time()
                                if now - last_join_log_time >= 1.0:
                                    logger.info("[SIP_ANSWER_WAIT] waiting for SIP participant to join")
                                    last_join_log_time = now
                                await asyncio.sleep(0.1)
                                continue
                                
                        if not saw_sip_participant:
                            logger.info("[SIP_ANSWER_WAIT] sip participant observed")
                            saw_sip_participant = True
                            
                        participant = remote_parts[0]
                        attrs = getattr(participant, 'attributes', {}) or {}
                        
                        now = time.time()
                        attrs_changed = (attrs != last_logged_attrs)
                        time_elapsed_1s = (now - last_log_time >= 1.0)
                        
                        if not first_obs_logged or attrs_changed or time_elapsed_1s:
                            logger.info(f"[SIP_ANSWER_WAIT] Current attributes: {attrs}")
                            first_obs_logged = True
                            last_log_time = now
                            last_logged_attrs = attrs.copy() if hasattr(attrs, 'copy') else attrs
                            
                        status_found = None
                        for key in status_keys:
                            val = attrs.get(key)
                            if val is not None:
                                last_known_sip_status = str(val).strip().lower()
                                if last_known_sip_status in ready_values:
                                    status_found = (key, val)
                                    break
                                    
                        if status_found:
                            logger.info(f"[SIP_ANSWER_WAIT] answer_confirmed=true (matched attribute key={status_found[0]} value={status_found[1]})")
                            answer_confirmed = True
                            break
                            
                        await asyncio.sleep(0.1)
                        
                    skip_greeting_playback = False
                    if answer_confirmed:
                        media_settle_ms = int(os.getenv("OUTBOUND_MEDIA_SETTLE_MS", "400"))
                        logger.info(f"[OUTBOUND] media_settle_ms={media_settle_ms}; starting greeting")
                        await asyncio.sleep(media_settle_ms / 1000.0)
                        ts_delay_end = time.time()
                    else:
                        ringing_statuses = {"ringing", "early", "dialing", "trying", "proceeding"}
                        is_ringing = saw_sip_participant and (last_known_sip_status in ringing_statuses)
                        
                        if is_ringing:
                            logger.info(f"[SIP_ANSWER_WAIT] timeout_unanswered status={last_known_sip_status}; skipping greeting")
                            setattr(session, "disconnected_before_greeting", True)
                            setattr(session, "_disconnected_before_greeting", True)
                            skip_greeting_playback = True
                            ts_delay_end = time.time()
                        else:
                            # Fallback delay only allowed if:
                            # no SIP status was ever available but the participant is connected and there is no evidence of ringing
                            if saw_sip_participant and last_known_sip_status is None and list(ctx.room.remote_participants.values()) and not getattr(session, "_call_ending", False) and not getattr(session, "sip_participant_disconnected", False):
                                delay_sec = float(os.getenv("OUTBOUND_GREETING_DELAY_SEC", "2.5"))
                                logger.info(f"[SIP_ANSWER_WAIT] Timeout waiting for active status. No SIP status was available but participant is connected. Falling back to OUTBOUND_GREETING_DELAY_SEC={delay_sec}s")
                                await asyncio.sleep(delay_sec)
                                ts_delay_end = time.time()
                            else:
                                logger.info(f"[SIP_ANSWER_WAIT] Timeout or disconnected. status={last_known_sip_status}. Skipping fallback delay.")
                                setattr(session, "disconnected_before_greeting", True)
                                setattr(session, "_disconnected_before_greeting", True)
                                skip_greeting_playback = True
                                ts_delay_end = time.time()
                    
                    if skip_greeting_playback or not list(ctx.room.remote_participants.values()):
                        logger.warning("[OUTBOUND] SIP participant disconnected or timeout unanswered; skipping initial greeting.")
                        setattr(session, "_disconnected_before_greeting", True)
                        setattr(session, "disconnected_before_greeting", True)
                    else:
                        greeting_mode = os.getenv("OUTBOUND_GREETING_MODE", "session_say").strip().lower()
                        use_fast_tts = greeting_mode == "cached_pcm"
                        logger.info(f"[GREETING] env OUTBOUND_GREETING_MODE={greeting_mode} parsed_cached_pcm={use_fast_tts}")
                        
                        if use_fast_tts:
                            greeting_tts = None
                            tts_provider = agent_config.get('tts_config', {}).get('provider', 'N/A')
                            tts_model = agent_config.get('tts_config', {}).get('model', 'N/A')
                            tts_voice = agent_config.get('tts_config', {}).get('voice_id', 'N/A')
                            
                            try:
                                greeting_tts = get_tts(agent_config)
                                if greeting_tts:
                                    logger.info(f"[GREETING] greeting_tts_ready provider={tts_provider} model={tts_model}")
                                else:
                                    raise ValueError("get_tts returned None")
                            except Exception as e:
                                logger.error(f"[GREETING] greeting_tts_init_failed provider={tts_provider} model={tts_model} reason={str(e)}")

                            if not greeting_tts:
                                logger.info("[GREETING] direct_pcm_unavailable reason=greeting_tts_missing")
                                logger.info("[GREETING] source=session_say_fallback reason=greeting_tts_missing")
                                setattr(session, "_ts_greeting_say", time.time())
                                session.say(fast_greeting, allow_interruptions=True)
                            else:
                                logger.info(f"[GREETING] direct_pcm_attempt=true")
                                async def play_fast_tts_greeting():
                                    try:
                                        # CACHE FALLBACK LOGIC
                                        from app.services.greeting_cache import resolve_effective_tts_config, get_greeting_cache_key
                                        
                                        cache_dir = Path("/tmp/ai_greetings")
                                        cache_dir.mkdir(parents=True, exist_ok=True)
                                        
                                        # Ensure jm is available for resolve
                                        _jm = {}
                                        if "job_metadata" in locals() and job_metadata:
                                            _jm = normalize_dict(job_metadata)
                                            
                                        eff_prov, eff_mod, eff_voice = resolve_effective_tts_config(_jm, agent_config)
                                        cache_key = get_greeting_cache_key(fast_greeting, eff_prov, eff_mod, eff_voice)
                                        cache_file = cache_dir / f"{cache_key}.wav"
                                        
                                        logger.info(f"[GREETING_CACHE] provider={eff_prov} model={eff_mod} voice_id={eff_voice} key={cache_key}")
                                        logger.info(f"[GREETING] cache_key={cache_key}")
                                        
                                        if not cache_file.exists():
                                            logger.info("[GREETING] cache_hit=false; synthesizing in background, playing fallback immediately...")
                                            logger.info("[GREETING] source=session_say_fallback reason=cache_miss")
                                            setattr(session, "_ts_greeting_say", time.time())
                                            setattr(session, "greeting_started", True)
                                            session.say(fast_greeting, allow_interruptions=True)
                                            
                                            async def build_cache():
                                                try:
                                                    ts_cache_start = time.time()
                                                    raw_pcm = bytearray()
                                                    sample_rate = 16000
                                                    num_channels = 1
                                                    async for audio_event in greeting_tts.synthesize(fast_greeting):
                                                        if audio_event.frame:
                                                            sample_rate = audio_event.frame.sample_rate
                                                            num_channels = audio_event.frame.num_channels
                                                            raw_pcm.extend(audio_event.frame.data)
                                                    
                                                    duration_ms = int((len(raw_pcm) / (sample_rate * num_channels * 2)) * 1000)
                                                    logger.info(f"[GREETING] cached_wav sample_rate={sample_rate} channels={num_channels} sample_width=2 duration_ms={duration_ms}")
                                                    
                                                    with wave.open(str(cache_file), 'wb') as wav:
                                                        wav.setnchannels(num_channels)
                                                        wav.setsampwidth(2)
                                                        wav.setframerate(sample_rate)
                                                        wav.writeframes(raw_pcm)
                                                    
                                                    cache_synthesis_ms = int((time.time() - ts_cache_start) * 1000)
                                                    logger.info(f"[GREETING] cache_synthesis_ms={cache_synthesis_ms}")
                                                except Exception as be:
                                                    logger.debug(f"Background cache build failed: {be}")
                                            
                                            asyncio.create_task(build_cache())
                                        else:
                                            logger.info("[GREETING] cache_hit=true")
                                            # Play from cache using mathematical pacing
                                            await play_wav_greeting(session, str(cache_file), fast_greeting)
                                        
                                    except Exception as e:
                                        logger.error(f"[PBX] Fast TTS Greeting Error: {e}", exc_info=True)
                                        try:
                                            logger.info(f"[GREETING] direct_pcm_unavailable reason={str(e)}")
                                            logger.info(f"[GREETING] source=session_say_fallback reason={str(e)}")
                                            setattr(session, "_ts_greeting_say", time.time())
                                            setattr(session, "greeting_started", True)
                                            session.say(fast_greeting, allow_interruptions=True)
                                        except Exception as fallback_e:
                                            logger.error(f"[PBX] session.say fallback failed: {fallback_e}")
                                asyncio.create_task(play_fast_tts_greeting())
                        else:
                            # Outbound deterministic greeting must always use session.say() to guarantee it is spoken exactly
                            try:
                                logger.info("[GREETING] source=session_say_fallback reason=fast_tts_disabled")
                                setattr(session, "_ts_greeting_say", time.time())
                                setattr(session, "greeting_started", True)
                                session.say(fast_greeting, allow_interruptions=True)
                            except RuntimeError as e:
                                if "AgentSession is closing" in str(e):
                                    logger.warning(f"[OUTBOUND] AgentSession is closing while greeting: {e}")
                                else:
                                    raise
                elif is_realtime:
                    session.generate_reply(instructions=f"Greet the user with exactly this message: {fast_greeting}")
                else:
                    try:
                        setattr(session, "greeting_started", True)
                        session.say(fast_greeting)
                    except RuntimeError as e:
                        if "AgentSession is closing" in str(e):
                            logger.warning(f"[PBX] AgentSession is closing while greeting: {e}")
                        else:
                            raise
                    
                if not getattr(session, "_disconnected_before_greeting", False):
                    logger.info(f"[PBX] Initial text-to-speech greeting triggered: '{fast_greeting[:30]}...'")
                    setattr(session, "_greeting_triggered", True)
        
        # PREEMPTIVE WARMUP for Realtime (Gemini Live)
        # REMOVED: Causing potential interference and clipping. 
        # Optimized wait cycles in the greeting logic are a better solution.

        # Start background audio player if configured
        if background_audio_tool:
            try:
                from livekit.agents import BackgroundAudioPlayer, AudioConfig

                bg_config = background_audio_tool.config
                bg_audio_file = bg_config.get("audio_file", "")
                bg_volume = float(bg_config.get("audio_volume", 80)) / 100.0
                bg_probability = float(bg_config.get("audio_probability", 100)) / 100.0

                if bg_audio_file:
                    audio_source = None

                    # Check if it's a built-in clip (prefixed with "builtin:")
                    if bg_audio_file.startswith("builtin:"):
                        try:
                            from livekit.agents import BuiltinAudioClip
                            clip_name = bg_audio_file.split(":", 1)[1]
                            audio_source = BuiltinAudioClip[clip_name]
                            logger.info(f"Using built-in audio clip: {clip_name}")
                        except (KeyError, ImportError) as e:
                            logger.warning(f"Built-in audio clip not found: {bg_audio_file} - {e}")
                    else:
                        # Resolve uploaded file path from display name
                        bg_audio_dir = project_root / "app" / "static" / "background_audio"
                        metadata_file = bg_audio_dir / "_metadata.json"
                        audio_path = None

                        if metadata_file.exists():
                            import json as json_mod
                            with open(metadata_file) as f:
                                metadata = json_mod.load(f)
                            for fname, data in metadata.items():
                                if data.get("display_name", "").lower() == bg_audio_file.lower():
                                    audio_path = bg_audio_dir / fname
                                    break

                        # Fallback: try direct filename match
                        if not audio_path or not audio_path.exists():
                            candidate = bg_audio_dir / bg_audio_file
                            if candidate.exists():
                                audio_path = candidate

                        if audio_path and audio_path.exists():
                            audio_source = str(audio_path)
                        else:
                            logger.warning(f"Background audio file not found: {bg_audio_file}")

                    if audio_source is not None:
                        bg_player = BackgroundAudioPlayer(
                            ambient_sound=AudioConfig(
                                audio_source,
                                volume=bg_volume,
                                probability=bg_probability
                            )
                        )
                        await bg_player.start(room=ctx.room, agent_session=session)
                        logger.info(f"Background audio started: {bg_audio_file} (volume={bg_volume}, probability={bg_probability})")
            except ImportError:
                logger.warning("BackgroundAudioPlayer not available in this livekit-agents version")
            except Exception as e:
                logger.error(f"Failed to start background audio: {e}")
    else:
        # In text mode, we handle chat via data channel only
        # No voice session means no audio output
        logger.info(f"Agent '{agent_name}' started (text mode - no voice session)")

    # --- PHASE 2: PREDICTIVE PRE-WARM (UPLIFTAI IGNITION) ---
    if session:
        # Shared barge-in interruption helper
        def _attempt_barge_in(ts_user_speech):
            """Call all supported interruption methods and log results."""
            try:
                ts_agent_speaking = getattr(session, "_ts_agent_speaking", ts_user_speech)
                latency_ms = int((ts_user_speech - ts_agent_speaking) * 1000)
                interrupted = False

                if hasattr(session, "cancel_response"):
                    try:
                        logger.info("[BARGE_IN] interrupt_attempt method=cancel_response")
                        session.cancel_response()
                        interrupted = True
                        logger.info(f"[BARGE_IN] interrupt_success method=cancel_response elapsed_ms={latency_ms}")
                    except Exception as e:
                        logger.debug(f"[BARGE_IN] cancel_response failed: {e}")

                if not interrupted and hasattr(session, "interrupt"):
                    try:
                        logger.info("[BARGE_IN] interrupt_attempt method=interrupt")
                        session.interrupt()
                        interrupted = True
                        logger.info(f"[BARGE_IN] interrupt_success method=interrupt elapsed_ms={latency_ms}")
                    except Exception as e:
                        logger.debug(f"[BARGE_IN] interrupt failed: {e}")

                if not interrupted:
                    logger.info("[BARGE_IN] interrupt_failed no_supported_method")
            except Exception as e:
                logger.debug(f"[BARGE_IN] _attempt_barge_in error: {e}")

        @session.on("user_speech_started")
        def on_user_speech(*args):
            """
            Triggered the instant VAD detects human speech.
            We use this to 'ignite' the TTS session in the background
            so it's ready before the LLM even finishes generating.
            """
            # BARGE_IN_DEBUG probe — confirms whether this event fires at all in current SDK
            logger.info(f"[BARGE_IN_DEBUG] event=user_speech_started args_count={len(args)}")
            try:
                is_speaking = getattr(session, "_agent_speaking", False)
                call_ending = getattr(session, "_call_ending", False)
                state_raw = getattr(session, "state", None)
                state = str(getattr(state_raw, "value", state_raw)).lower()
                ts_user_speech = time.time()
                setattr(session, "_ts_current_user_speech_started", ts_user_speech)
                ts_agent_stopped = getattr(session, "_ts_agent_stopped_speaking", 0)
                recently_spoke = not is_speaking and (ts_user_speech - ts_agent_stopped < 0.8)

                logger.info(f"[BARGE_IN] user_speech_started agent_speaking={is_speaking} state={state} call_ending={call_ending} ts={ts_user_speech}")

                if is_speaking or "speak" in state or "think" in state or "generat" in state or recently_spoke:
                    logger.info("[BARGE_IN] user speech detected while agent speaking; interrupting")
                    _attempt_barge_in(ts_user_speech)
            except Exception as e:
                logger.debug(f"[BARGE_IN] user_speech_started handler error: {e}")

            agent_tts = agent_params.get("tts")
            if agent_tts and "upliftai" in str(type(agent_tts)).lower():
                # Launch async 'touch' synthesis to open the socket early.
                # Use a single character to prime the model / connection.
                logger.info("Predictive Pre-warm: Igniting UpliftAI session (User speech detected)...")
                try:
                    asyncio.create_task(agent_tts.synthesize(" "))
                except Exception as e:
                    logger.debug(f"Pre-warm ignition failed (non-fatal): {e}")
    # --- PHASE 2.5: LATENCY MASKING (FIRST TURN FILLER) ---
        latency_audio_url = rules.get("latencyMaskingAudio")
        logger.info(f"==== LATENCY MASKING CHECK: URL is {latency_audio_url} ====")
        _latency_mask_played = False

        if latency_audio_url:
            async def play_latency_filler(url):
                try:
                    logger.info(f"[PBX] Latency Masking: Downloading filler audio from {url}")
                    http_sess = await get_http_session()
                    async with http_sess.get(url, timeout=5) as resp:
                        if resp.status != 200:
                            raise Exception(f"HTTP_{resp.status}")
                        wav_bytes = await resp.read()
                    
                    # DYNAMIC PCM EXTRACTION: Read exact Hz from the uploaded file
                    with wave.open(io.BytesIO(wav_bytes), 'rb') as wav:
                        sample_rate = wav.getframerate()
                        num_channels = wav.getnchannels()
                        sample_width = wav.getsampwidth() # bytes per sample
                        raw_pcm = wav.readframes(wav.getnframes())

                    logger.info(f"[PBX] Latency Masking: Detected Audio at {sample_rate}Hz, {num_channels} channels")

                    source = rtc.AudioSource(sample_rate, num_channels)
                    track = rtc.LocalAudioTrack.create_audio_track("latency_filler", source)
                    publication = await ctx.room.local_participant.publish_track(track)
                    
                    # Mathematically Bulletproof 100ms extraction loop for ANY sample rate
                    bytes_per_sec = sample_rate * num_channels * sample_width
                    chunk_size = bytes_per_sec // 10  # 100ms chunks
                    
                    start_time = asyncio.get_event_loop().time()

                    for i in range(0, len(raw_pcm), chunk_size):
                        chunk = raw_pcm[i:i+chunk_size]
                        if len(chunk) < chunk_size:
                            chunk = chunk.ljust(chunk_size, b'\x00')
                        
                        samples_per_channel = len(chunk) // (sample_width * num_channels)
                        await source.capture_frame(rtc.AudioFrame(chunk, sample_rate, num_channels, samples_per_channel))
                        
                        expected_time = start_time + (i + chunk_size) / bytes_per_sec
                        sleep_duration = expected_time - asyncio.get_event_loop().time()
                        if sleep_duration > 0:
                            await asyncio.sleep(sleep_duration)

                    await ctx.room.local_participant.unpublish_track(publication.sid)
                    logger.info("[PBX] Latency Masking: Filler audio completed perfectly at correct speed.")
                except Exception as e:
                    logger.error(f"[PBX] Latency Masking Error: {e}")

            # Hook into the STT Final Transcript
            @session.on("user_input_transcribed")
            def on_first_turn_committed(event):
                nonlocal _latency_mask_played
                is_final = getattr(event, 'is_final', False)
                if is_final and not _latency_mask_played:
                    _latency_mask_played = True
                    logger.info("🎙️ FIRST TURN COMPLETE: Triggering Latency Masking Filler Audio.")
                    asyncio.create_task(play_latency_filler(latency_audio_url))

    # Initialize call tracking (skip for test calls from Agent Tester)
    call_tracker = None
    if not is_agent_tester_call and not is_simulation_test:  # Only track real calls
        call_tracker = CallTracker(
            agent_config=agent_config,
            room_name=ctx.room.name,
            job_metadata=normalize_dict(job_metadata) if job_metadata else None,
        )
        # Update call tracker reference so tools can log their usage
        call_tracker_ref["tracker"] = call_tracker
    else:
        logger.info(f"Skipping call history for Agent Tester call")

    # Update call tracking reference so tool metadata is enriched correctly
    if call_tracker:
        call_tracker.start_call(sip_metadata, metadata={"caller_name": caller_name})
    
    # Generic dynamic variable substitution in agent instructions and initial greeting
    dynamic_vars = {}

    # Source 1: per-contact campaign data passed in job metadata
    if job_metadata:
        _jm = normalize_dict(job_metadata)
        dynamic_vars.update(_jm.get("dynamic_vars", {}))

    # Source 2: built-in {{user_number}} from SIP metadata
    direction = sip_metadata.get("direction", "inbound")
    dynamic_vars["user_number"] = sip_metadata.get(
        "to_number" if direction == "outbound" else "from_number", ""
    )

    # Source 3: Simulation test variables override dynamic vars
    if is_simulation_test and test_variables:
        dynamic_vars.update(test_variables)
        logger.info(f"Applied simulation test variables: {list(test_variables.keys())}")

    if dynamic_vars:
        # Apply to system prompt
        if agent and hasattr(agent, 'instructions') and agent.instructions:
            for var_key, var_value in dynamic_vars.items():
                placeholder = "{{" + var_key + "}}"
                if placeholder in agent.instructions:
                    agent.instructions = agent.instructions.replace(
                        placeholder, str(var_value) if var_value else ""
                    )
                    logger.info(f"Replaced {placeholder} dynamic variable with '{var_value}'")

        # Apply to initial greeting
        if initial_greeting:
            for var_key, var_value in dynamic_vars.items():
                placeholder = "{{" + var_key + "}}"
                if placeholder in initial_greeting:
                    initial_greeting = initial_greeting.replace(
                        placeholder, str(var_value) if var_value else ""
                    )
                    logger.info(f"Replaced {placeholder} dynamic variable in greeting with '{var_value}'")

    # Register call session for external event injection (n8n, Make.com, etc.)
    caller_phone = sip_metadata.get("from_number", "")
    call_session_id = sip_metadata.get("call_id", "")

    # Start call tracking has been handled early to pass identity
    
    register_call_session(
        room_name=ctx.room.name,
        agent_id=agent_id,
        phone_number=caller_phone,
        session_id=call_session_id,
    )

    # Start event listener for external events
    event_listener = AgentEventListener(
        room_name=ctx.room.name,
        session=session,
        loop=asyncio.get_event_loop(),
    )
    event_listener.start()

    # Simulation transcript capture helper
    def push_sim_transcript(role: str, text: str):
        """Push a transcript entry to Redis for live simulation monitoring."""
        if not is_simulation_test or not simulation_id:
            return
        # Only the agent_under_test instance captures transcripts to avoid duplicates
        if simulation_role != "agent_under_test":
            return
        try:
            sim_redis = agent_storage.get_redis_client() if agent_storage else None
            if sim_redis:
                entry = json.dumps({
                    "role": role,
                    "text": text,
                    "timestamp": time.time()
                })
                sim_redis.rpush(f"livekit:sim_transcript:{simulation_id}", entry)
                # Set TTL on the list (refresh each time)
                sim_redis.expire(f"livekit:sim_transcript:{simulation_id}", 86400)
        except Exception as e:
            logger.debug(f"Failed to push sim transcript: {e}")

    # Set up event handlers for transcription, TTFB, and STT latency tracking
    # Only register voice session handlers if session exists (not in text mode)
    if session:
        @session.on("agent_state_changed")
        def on_agent_state(event):
            """Handle agent state changes (for TTFB tracking fallback)."""
            try:
                state = getattr(event, 'new_state', None) or getattr(event, 'state', None) or str(event)
                logger.debug(f"Agent state changed: {state}")
                if state == "speaking" or "speaking" in str(state).lower():
                    setattr(session, "_agent_speaking", True)
                    
                    if not getattr(session, "greeting_first_audio_started", False):
                        setattr(session, "greeting_first_audio_started", True)
                    
                    speech_count = getattr(session, "agent_speech_count", 0)
                    setattr(session, "agent_speech_count", speech_count + 1)
                    
                    logger.info(f"[BARGE_IN] agent_speaking=true state={state}")
                    ts_now = time.time()
                    if hasattr(session, "_ts_greeting_say"):
                        diff = int((ts_now - session._ts_greeting_say) * 1000)
                        logger.info(f"[LATENCY] greeting_tts_to_first_audio_ms={diff}")
                        delattr(session, "_ts_greeting_say")
                    elif hasattr(session, "_ts_stt_final"):
                        diff = int((ts_now - session._ts_stt_final) * 1000)
                        logger.info(f"[LATENCY] total_response_ms={diff}")
                        # Full per-turn gap: user-stopped-speaking → first agent audio
                        _ts_user_stopped = getattr(session, "_ts_user_stopped_speaking", None)
                        if _ts_user_stopped:
                            total_gap_ms = int((ts_now - _ts_user_stopped) * 1000)
                            logger.info(
                                f"[TURN_LATENCY] llm_tts_to_first_audio_ms={diff} "
                                f"total_user_done_to_agent_audio_ms={total_gap_ms}"
                            )

                        # TURN_LATENCY_DETAIL Instrumentation Patch
                        try:
                            turn_idx = getattr(session, "_turn_index", 0)
                            current_logged_turn = getattr(session, "_latency_logged_turn_index", 0)

                            if turn_idx > 0 and turn_idx != current_logged_turn and not getattr(session, "_current_turn_logged", False):
                                setattr(session, "_latency_logged_turn_index", turn_idx)
                                setattr(session, "_current_turn_logged", True)

                                # Safe mathematical calculations
                                stt_final_ts = session._ts_stt_final
                                user_speech_ended_ts = _ts_user_stopped
                                user_speech_started_ts = getattr(session, "_ts_current_user_speech_started", None)
                                agent_first_audio_ts = ts_now

                                # Check and prevent negative stt_wait_ms
                                stt_wait_invalid = False
                                stt_wait_ms = None
                                if stt_final_ts is not None and user_speech_ended_ts is not None:
                                    if stt_final_ts >= user_speech_ended_ts:
                                        stt_wait_ms = int((stt_final_ts - user_speech_ended_ts) * 1000)
                                    else:
                                        stt_wait_invalid = True

                                llm_tts_to_first_audio_ms = None
                                if stt_final_ts is not None:
                                    llm_tts_to_first_audio_ms = int((agent_first_audio_ts - stt_final_ts) * 1000)

                                total_user_done_to_agent_audio_ms = None
                                if user_speech_ended_ts is not None:
                                    total_user_done_to_agent_audio_ms = int((agent_first_audio_ts - user_speech_ended_ts) * 1000)

                                first_user_turn = (turn_idx == 1)
                                total_first_turn_ms = total_user_done_to_agent_audio_ms if first_user_turn else None

                                # Try to extract metrics from LiveKit objects
                                lk_metrics = getattr(session, "_last_chat_message_metrics", None)
                                
                                # Fallback: search in chat context messages
                                if lk_metrics is None and agent and hasattr(agent, "chat_ctx") and agent.chat_ctx:
                                    try:
                                        msgs = agent.chat_ctx.messages
                                        if callable(msgs):
                                            msgs = msgs()
                                        for msg in reversed(msgs):
                                            if getattr(msg, "role", "") in ("assistant", "agent") and hasattr(msg, "metrics") and msg.metrics:
                                                lk_metrics = msg.metrics
                                                break
                                    except Exception:
                                        pass

                                # Retrieve the desired metrics from lk_metrics safely
                                metrics_source = "manual"
                                llm_start_ts = None
                                llm_first_token_ms = None
                                tts_start_ts = None
                                tts_first_audio_ms = None
                                eou_delay_ms = None
                                model_latency_ms = None
                                tts_latency_ms = None
                                llm_first_token_ts = None
                                tts_first_audio_ts = None

                                if lk_metrics is not None:
                                    metrics_source = "chat_message_metrics"
                                    try:
                                        # LLM first token
                                        if hasattr(lk_metrics, "llm_ttfb"):
                                            llm_first_token_ms = int(getattr(lk_metrics, "llm_ttfb") * 1000)
                                        elif hasattr(lk_metrics, "llm_ttfb_ms"):
                                            llm_first_token_ms = int(getattr(lk_metrics, "llm_ttfb_ms"))
                                        elif hasattr(lk_metrics, "llm") and hasattr(lk_metrics.llm, "ttfb"):
                                            llm_first_token_ms = int(lk_metrics.llm.ttfb * 1000)

                                        # TTS first audio
                                        if hasattr(lk_metrics, "tts_ttfb"):
                                            tts_first_audio_ms = int(getattr(lk_metrics, "tts_ttfb") * 1000)
                                        elif hasattr(lk_metrics, "tts_ttfb_ms"):
                                            tts_first_audio_ms = int(getattr(lk_metrics, "tts_ttfb_ms"))
                                        elif hasattr(lk_metrics, "tts") and hasattr(lk_metrics.tts, "ttfb"):
                                            tts_first_audio_ms = int(lk_metrics.tts.ttfb * 1000)

                                        # Model latency
                                        if hasattr(lk_metrics, "llm_duration"):
                                            model_latency_ms = int(getattr(lk_metrics, "llm_duration") * 1000)
                                        elif hasattr(lk_metrics, "llm") and hasattr(lk_metrics.llm, "duration"):
                                            model_latency_ms = int(lk_metrics.llm.duration * 1000)
                                        elif hasattr(lk_metrics, "llm_latency_ms"):
                                            model_latency_ms = int(getattr(lk_metrics, "llm_latency_ms"))

                                        # TTS latency
                                        if hasattr(lk_metrics, "tts_duration"):
                                            tts_latency_ms = int(getattr(lk_metrics, "tts_duration") * 1000)
                                        elif hasattr(lk_metrics, "tts") and hasattr(lk_metrics.tts, "duration"):
                                            tts_latency_ms = int(lk_metrics.tts.duration * 1000)
                                        elif hasattr(lk_metrics, "tts_latency_ms"):
                                            tts_latency_ms = int(getattr(lk_metrics, "tts_latency_ms"))

                                        # eou_delay_ms / end of utterance
                                        if hasattr(lk_metrics, "eou_delay"):
                                            eou_delay_ms = int(getattr(lk_metrics, "eou_delay") * 1000)
                                        elif hasattr(lk_metrics, "eou_delay_ms"):
                                            eou_delay_ms = int(getattr(lk_metrics, "eou_delay_ms"))
                                            
                                        # Start timestamps
                                        if hasattr(lk_metrics, "llm_start_time"):
                                            llm_start_ts = getattr(lk_metrics, "llm_start_time")
                                        elif hasattr(lk_metrics, "llm") and hasattr(lk_metrics.llm, "start_time"):
                                            llm_start_ts = lk_metrics.llm.start_time
                                            
                                        if hasattr(lk_metrics, "tts_start_time"):
                                            tts_start_ts = getattr(lk_metrics, "tts_start_time")
                                        elif hasattr(lk_metrics, "tts") and hasattr(lk_metrics.tts, "start_time"):
                                            tts_start_ts = lk_metrics.tts.start_time
                                            
                                        # First token/audio timestamps
                                        if hasattr(lk_metrics, "llm_first_token_time"):
                                            llm_first_token_ts = getattr(lk_metrics, "llm_first_token_time")
                                        elif hasattr(lk_metrics, "llm") and hasattr(lk_metrics.llm, "first_token_time"):
                                            llm_first_token_ts = lk_metrics.llm.first_token_time
                                            
                                        if llm_first_token_ts is None and llm_start_ts is not None and llm_first_token_ms is not None:
                                            llm_first_token_ts = llm_start_ts + (llm_first_token_ms / 1000.0)
                                            
                                        if hasattr(lk_metrics, "tts_first_audio_time"):
                                            tts_first_audio_ts = getattr(lk_metrics, "tts_first_audio_time")
                                        elif hasattr(lk_metrics, "tts") and hasattr(lk_metrics.tts, "first_audio_time"):
                                            tts_first_audio_ts = lk_metrics.tts.first_audio_time
                                            
                                        if tts_first_audio_ts is None and tts_start_ts is not None and tts_first_audio_ms is not None:
                                            tts_first_audio_ts = tts_start_ts + (tts_first_audio_ms / 1000.0)
                                    except Exception:
                                        pass

                                if lk_metrics is None and getattr(session, "_last_session_usage", None) is not None:
                                    metrics_source = "session_usage_updated"

                                # Append to session list for CALL_LATENCY_SUMMARY
                                # If invalid, stt_wait_ms is excluded from summary averages
                                if hasattr(session, "_turns_data"):
                                    session._turns_data.append({
                                        "total_gap_ms": total_user_done_to_agent_audio_ms,
                                        "stt_wait_ms": stt_wait_ms if not stt_wait_invalid else None,
                                        "llm_tts_to_first_audio_ms": llm_tts_to_first_audio_ms,
                                        "first_user_turn": first_user_turn
                                    })

                                # Format output values helper
                                def fmt_val(v, is_bool=False):
                                    if v is None:
                                        return "none"
                                    if is_bool:
                                        return "true" if v else "false"
                                    if isinstance(v, float):
                                        return f"{v:.3f}"
                                    return str(v)

                                # One-time diagnostics per call (once per session)
                                if not getattr(session, "_diagnostic_logged", False):
                                    setattr(session, "_diagnostic_logged", True)
                                    llm_avail = "true" if llm_first_token_ms is not None else "false"
                                    tts_avail = "true" if tts_first_audio_ms is not None else "false"
                                    logger.info(f"[TURN_LATENCY_DETAIL] llm_first_token_hook_available={llm_avail}")
                                    logger.info(f"[TURN_LATENCY_DETAIL] tts_first_audio_hook_available={tts_avail}")
                                    if llm_first_token_ms is None:
                                        logger.info("[TURN_LATENCY_DETAIL] llm_first_token_unavailable=true")

                                # Incorporate useful metadata/identifiers if available
                                campaign_id = "none"
                                lead_id = "none"
                                room_name = ctx.room.name if ctx.room else "none"
                                call_id = "none"

                                if call_tracker and call_tracker.job_metadata:
                                    ct_jm = normalize_dict(call_tracker.job_metadata)
                                    campaign_id = ct_jm.get("campaign_id") or campaign_id
                                    lead_id = ct_jm.get("lead_id") or ct_jm.get("leadId") or ct_jm.get("campaign_number_id") or ct_jm.get("campaignNumberId") or lead_id
                                    call_id = ct_jm.get("sip_call_to") or ct_jm.get("call_id") or call_id
                                if "job_metadata" in locals() and job_metadata:
                                    jm = normalize_dict(job_metadata)
                                    campaign_id = jm.get("campaign_id") or campaign_id
                                    lead_id = jm.get("lead_id") or jm.get("leadId") or jm.get("campaign_number_id") or jm.get("campaignNumberId") or lead_id
                                    call_id = jm.get("sip_call_to") or jm.get("call_id") or call_id
                                if ctx.room and ctx.room.metadata:
                                    rmeta = normalize_dict(ctx.room.metadata)
                                    campaign_id = rmeta.get("campaign_id") or campaign_id
                                    lead_id = rmeta.get("lead_id") or rmeta.get("leadId") or rmeta.get("campaign_number_id") or rmeta.get("campaignNumberId") or lead_id

                                if not campaign_id or str(campaign_id).lower() in ("none", "null", ""):
                                    campaign_id = "none"
                                if not lead_id or str(lead_id).lower() in ("none", "null", ""):
                                    lead_id = "none"
                                if not call_id or str(call_id).lower() in ("none", "null", ""):
                                    call_id = "none"

                                logger.info(
                                    f"[TURN_LATENCY_DETAIL] "
                                    f"first_user_turn={fmt_val(first_user_turn, is_bool=True)} "
                                    f"turn_index={fmt_val(turn_idx)} "
                                    f"user_speech_started_ts={fmt_val(user_speech_started_ts)} "
                                    f"user_speech_ended_ts={fmt_val(user_speech_ended_ts)} "
                                    f"stt_final_ts={fmt_val(stt_final_ts)} "
                                    f"llm_start_ts={fmt_val(llm_start_ts)} "
                                    f"llm_first_token_ts={fmt_val(llm_first_token_ts)} "
                                    f"tts_start_ts={fmt_val(tts_start_ts)} "
                                    f"tts_first_audio_ts={fmt_val(tts_first_audio_ts)} "
                                    f"agent_first_audio_ts={fmt_val(agent_first_audio_ts)} "
                                    f"stt_wait_ms={fmt_val(stt_wait_ms)} "
                                    f"llm_first_token_ms={fmt_val(llm_first_token_ms)} "
                                    f"tts_first_audio_ms={fmt_val(tts_first_audio_ms)} "
                                    f"llm_tts_to_first_audio_ms={fmt_val(llm_tts_to_first_audio_ms)} "
                                    f"total_first_turn_ms={fmt_val(total_first_turn_ms)} "
                                    f"total_user_done_to_agent_audio_ms={fmt_val(total_user_done_to_agent_audio_ms)} "
                                    f"campaign_id={fmt_val(campaign_id)} "
                                    f"lead_id={fmt_val(lead_id)} "
                                    f"room_name={fmt_val(room_name)} "
                                    f"call_id={fmt_val(call_id)} "
                                    f"stt_wait_invalid={fmt_val(stt_wait_invalid, is_bool=True)} "
                                    f"metrics_source={fmt_val(metrics_source)} "
                                    f"eou_delay_ms={fmt_val(eou_delay_ms)} "
                                    f"model_latency_ms={fmt_val(model_latency_ms)} "
                                    f"tts_latency_ms={fmt_val(tts_latency_ms)}"
                                )
                        except Exception as detail_err:
                            logger.debug(f"Error logging TURN_LATENCY_DETAIL: {detail_err}")

                        try:
                            delattr(session, "_ts_stt_final")
                        except AttributeError:
                            pass
                        if hasattr(session, "_ts_user_stopped_speaking"):
                            try:
                                delattr(session, "_ts_user_stopped_speaking")
                            except AttributeError:
                                pass
                        if hasattr(session, "_ts_current_user_speech_started"):
                            try:
                                delattr(session, "_ts_current_user_speech_started")
                            except AttributeError:
                                pass

                    if call_tracker:
                        call_tracker.on_agent_speech_started()
                else:
                    setattr(session, "_agent_speaking", False)
                    setattr(session, "_ts_agent_stopped_speaking", time.time())
                    logger.info(f"[BARGE_IN] agent_speaking=false state={state}")
                    
                    if getattr(session, "greeting_first_audio_started", False) and not getattr(session, "greeting_completed", False):
                        setattr(session, "greeting_completed", True)
            except Exception as e:
                logger.debug(f"Error handling agent state change: {e}")

        @session.on("user_state_changed")
        def on_user_state(event):
            """Track user state transitions. Also fires barge-in when user starts speaking."""
            try:
                old_state = getattr(event, 'old_state', None)
                new_state = getattr(event, 'new_state', None)
                
                # Defensive normalization: handles strings, enums, and SDK state objects
                old_str = str(getattr(old_state, "value", old_state)).lower() if old_state else ""
                new_str = str(getattr(new_state, "value", new_state)).lower() if new_state else ""
                
                logger.debug(f"User state changed: {old_str} -> {new_str}")

                # User just started speaking — primary barge-in trigger
                if "speaking" in new_str and "speaking" not in old_str:
                    ts_user_speech = time.time()
                    setattr(session, "_ts_current_user_speech_started", ts_user_speech)
                    is_speaking = getattr(session, "_agent_speaking", False)
                    ts_agent_stopped = getattr(session, "_ts_agent_stopped_speaking", 0)
                    recently_spoke = not is_speaking and (ts_user_speech - ts_agent_stopped < 0.8)

                    logger.info(f"[BARGE_IN] user_speech_started agent_speaking={is_speaking} state={new_str} ts={ts_user_speech}")

                    if is_speaking or recently_spoke:
                        logger.info("[BARGE_IN] user_state_changed speaking detected while agent active; interrupting")
                        _attempt_barge_in(ts_user_speech)

                # User stopped speaking — STT latency measurement + TURN_LATENCY anchor
                if "speaking" in old_str and "speaking" not in new_str:
                    _ts_user_stopped = time.time()
                    setattr(session, "_ts_user_stopped_speaking", _ts_user_stopped)
                    logger.info(f"[TURN_LATENCY] user_speech_ended_ts={_ts_user_stopped:.3f}")
                    if call_tracker:
                        call_tracker.on_user_stopped_speaking()
            except Exception as e:
                logger.debug(f"Error handling user state change: {e}")

        @session.on("user_input_transcribed")
        def on_user_transcribed(event):
            """Calculate STT latency when final transcript arrives.
            In realtime mode, this is also the primary source for user transcript capture
            (the realtime model's own ASR, not a separate STT engine)."""
            try:
                is_final = getattr(event, 'is_final', False)
                transcript = getattr(event, 'transcript', '')
                
                # Check optional role if exists
                item = getattr(event, 'item', None)
                role = getattr(item, 'role', None) if item else getattr(event, 'role', None)
                role_str = str(role).lower() if role else "user"

                if is_final and transcript and transcript.strip() and ("user" in role_str or ("assistant" not in role_str and "agent" not in role_str)):
                    _ts_stt_final = time.time()
                    setattr(session, "_ts_stt_final", _ts_stt_final)
                    
                    # Increment turn index and reset current turn logged status
                    turn_idx = getattr(session, "_turn_index", 0) + 1
                    setattr(session, "_turn_index", turn_idx)
                    setattr(session, "_current_turn_logged", False)
                    
                    # Compute STT finalization gap: time from user-stopped-speaking → final transcript
                    _ts_user_stopped = getattr(session, "_ts_user_stopped_speaking", None)
                    if _ts_user_stopped:
                        stt_wait_ms = int((_ts_stt_final - _ts_user_stopped) * 1000)
                        logger.info(
                            f"[TURN_LATENCY] stt_wait_ms={stt_wait_ms} "
                            f"user_stopped_ts={_ts_user_stopped:.3f} stt_final_ts={_ts_stt_final:.3f}"
                        )
                    logger.debug(f"Final transcript received: {transcript[:50]}...")
                    
                    # 4. Add transcript fallback for Barge-in proof
                    is_speaking = getattr(session, "_agent_speaking", False)
                    ts_agent_stopped = getattr(session, "_ts_agent_stopped_speaking", 0)
                    delta_ms = int((time.time() - ts_agent_stopped) * 1000)
                    if is_speaking or delta_ms < 1500:
                        logger.info(f"[BARGE_IN] transcript_overlap_detected delta_ms={delta_ms}")
                    
                    if call_tracker:
                        call_tracker.on_stt_transcript_received(is_final=True)
                    # In realtime mode, capture user speech from the realtime model's ASR
                    # (no separate STT engine, so conversation_item_added is skipped for user role)
                    if is_realtime:
                        if call_tracker:
                            call_tracker.on_user_speech(transcript, is_final=True)
                        # Capture for simulation transcript
                        if is_simulation_test:
                            push_sim_transcript("tester", transcript)
                        
                        # --- EXECUTIVE DASHBOARD SYNC ---
                        # Broadcast user transcription to the LiveKit room
                        try:
                            # Get the first remote participant if available, otherwise fallback to "user"
                            remote_p = next(iter(ctx.room.remote_participants.values()), None)
                            participant_id = remote_p.identity if remote_p else "user"
                            
                            seg = rtc.TranscriptionSegment(
                                id=f"user-{time.time()}",
                                text=transcript,
                                final=True,
                                timestamp=int(time.time() * 1000)
                            )
                            # Schedule the async call (event handlers are 100% synchronous in this version of the SDK/loop)
                            asyncio.create_task(ctx.room.local_participant.publish_transcription(
                                rtc.Transcription(participant_identity=participant_id, segments=[seg])
                            ))
                        except Exception as dash_e:
                            logger.debug(f"Dashboard User Sync Error: {dash_e}")
            except Exception as e:
                logger.debug(f"Error handling user input transcribed: {e}")

        @session.on("metrics_collected")
        def on_metrics_collected(metrics):
            """Log detailed component latencies from LiveKit metrics."""
            try:
                if hasattr(metrics, "llm_ttfb") and metrics.llm_ttfb:
                    logger.info(f"[LATENCY] llm_duration_ms={int(metrics.llm_ttfb * 1000)}")
                
                if hasattr(metrics, "tts_ttfb") and metrics.tts_ttfb:
                    logger.info(f"[LATENCY] tts_first_audio_ms={int(metrics.tts_ttfb * 1000)}")
                
                if hasattr(metrics, "ttfb") and hasattr(metrics, "llm_ttfb") and hasattr(metrics, "tts_ttfb"):
                    # Approximate STT->LLM gap by subtracting LLM and TTS TTFB from Total TTFB
                    if metrics.ttfb and metrics.llm_ttfb and metrics.tts_ttfb:
                        stt_to_llm = metrics.ttfb - metrics.llm_ttfb - metrics.tts_ttfb
                        if stt_to_llm > 0:
                            logger.info(f"[LATENCY] stt_final_to_llm_start_ms={int(stt_to_llm * 1000)}")
            except Exception as e:
                logger.debug(f"Error handling metrics: {e}")

        @session.on("session_usage_updated")
        def on_session_usage(event):
            """Handle session usage updates (cumulative telemetry)."""
            try:
                usage = getattr(event, "usage", None)
                if usage:
                    logger.debug(f"[METRICS] session_usage_updated received: {usage}")
                    setattr(session, "_last_session_usage", usage)
            except Exception as e:
                logger.debug(f"Error handling session_usage_updated: {e}")



        @session.on("conversation_item_added")
        def on_conversation_item(event):
            """Handle conversation items (final user and agent messages only)."""
            try:
                # Capture ChatMessage.metrics if available
                item = getattr(event, 'item', None) or event
                if item and hasattr(item, "metrics") and item.metrics:
                    setattr(session, "_last_chat_message_metrics", item.metrics)
            except Exception as metrics_err:
                logger.debug(f"Error capturing ChatMessage metrics: {metrics_err}")

            try:
                # --- SOVEREIGN CONTEXT TRUNCATION (Zero TTFT Fix) ---
                # This keeps only the last 3-4 turns (1 system + 11 messages) to maintain 
                # near-zero Time to First Token (TTFT) as the conversation grows.
                if agent and hasattr(agent, 'chat_ctx') and agent.chat_ctx:
                    try:
                        messages = agent.chat_ctx.messages
                        if callable(messages):
                            actual_messages = messages()
                        else:
                            actual_messages = messages

                        if len(actual_messages) > 12:
                            while len(actual_messages) > 12:
                                actual_messages.pop(1) # Preserve system prompt at [0]
                    except Exception as e:
                        logger.debug(f"Context truncation handled: {e}")
                # -----------------------------------------------------------
                # --- LLM Context Truncation (Ultra-Low Latency TTFT Fix) ---
                if agent and hasattr(agent, 'chat_ctx') and agent.chat_ctx:
                    try:
                        messages = agent.chat_ctx.messages
                        # In this SDK version, messages is a method that must be called
                        if callable(messages):
                            actual_messages = messages()
                        else:
                            actual_messages = messages

                        if len(actual_messages) > 12:
                            # Performance tuning: Truncate to keep the last 3-4 turns (1 system + 11 messages)
                            # This ensures TTFT (Time to First Token) remains near-zero as conversation length grows.
                            while len(actual_messages) > 12:
                                actual_messages.pop(1)
                    except Exception as e:
                        logger.debug(f"Context truncation handled: {e}")
                # -----------------------------------------------------------

                item = getattr(event, 'item', event)
                role = getattr(item, 'role', None)
                content = getattr(item, 'content', None)
                text = ""

                if content:
                    if hasattr(content, '__iter__') and not isinstance(content, str):
                        text_parts = []
                        for part in content:
                            if hasattr(part, 'text'):
                                text_parts.append(part.text)
                            elif isinstance(part, str):
                                text_parts.append(part)
                        text = ' '.join(text_parts)
                    else:
                        text = str(content)

                if not text:
                    text = getattr(item, 'text', '') or ''

                if not text or text in ['None', 'null', '']:
                    return

                if role:
                    role_str = str(role).lower()
                    logger.debug(f"Conversation item ({role_str}): {text[:50]}...")
                    if 'assistant' in role_str:
                        # In realtime mode, this event may fire with incomplete text
                        # as the model generates tokens. Use update-or-append strategy:
                        # if the last segment is also an agent segment, update it with
                        # the longer text (the model re-sends the full accumulated text).
                        if is_realtime and call_tracker and call_tracker.transcription_segments:
                            last_seg = call_tracker.transcription_segments[-1]
                            if last_seg["speaker"] == "agent" and len(text) >= len(last_seg["text"]):
                                from datetime import datetime
                                last_seg["text"] = text
                                last_seg["timestamp"] = datetime.utcnow().isoformat()
                                logger.debug(f"Updated agent segment in-place: {text[:50]}...")
                                return
                        if call_tracker:
                            call_tracker.on_agent_speech(text)
                        # Capture for simulation transcript
                        if is_simulation_test:
                            push_sim_transcript("agent", text)
                        
                        # --- EXECUTIVE DASHBOARD SYNC ---
                        # Broadcast agent transcription to the LiveKit room
                        try:
                            seg = rtc.TranscriptionSegment(
                                id=f"agent-{time.time()}",
                                text=text,
                                final=True,
                                timestamp=int(time.time() * 1000)
                            )
                            # Schedule the async call
                            asyncio.create_task(ctx.room.local_participant.publish_transcription(
                                rtc.Transcription(participant_identity=ctx.room.local_participant.identity, segments=[seg])
                            ))
                        except Exception as dash_e:
                            logger.debug(f"Dashboard Agent Sync Error: {dash_e}")
                    elif 'user' in role_str:
                        # In realtime mode, user transcripts come from user_input_transcribed
                        # (the realtime model's own ASR) — skip here to prevent duplicates
                        if not is_realtime:
                            if call_tracker:
                                call_tracker.on_user_speech(text, is_final=True)
                            # Capture for simulation transcript
                            if is_simulation_test:
                                push_sim_transcript("tester", text)
            except Exception as e:
                logger.debug(f"Error handling conversation item: {e}")

    # Set up data channel handler for text chat mode
    # Conversation history for text mode (maintains context across messages)
    text_chat_history = []

    @ctx.room.on("data_received")
    def on_data_received(data_packet):
        """Handle incoming data channel messages (text chat and admin control)."""
        nonlocal text_chat_history

        try:
            # Extract data from the packet
            data = data_packet.data if hasattr(data_packet, 'data') else data_packet
            participant = getattr(data_packet, 'participant', None)
            participant_id = participant.identity if participant else (
                getattr(data_packet, 'participant_identity', 'unknown')
            )

            message = data.decode('utf-8') if isinstance(data, bytes) else str(data)
            logger.info(f"Data received from {participant_id}: {message[:100]}")

            # Try to parse as JSON
            try:
                payload = json.loads(message)
            except json.JSONDecodeError:
                payload = {"text": message}

            # Phase 6: Admin Barge-In / Control logic for Voice/Multimodal modes
            if test_mode != "text":
                action = payload.get("action")
                if action == "pause_ai":
                    logger.info("ADMIN COMMAND: PAUSE AI")
                    if session:
                        session.mute()
                        if is_realtime:
                            session.generate_reply(instructions="STOP SPEAKING IMMEDIATELY. An admin has taken over. Do not generate any more audio until told otherwise.")
                    return
                elif action == "resume_ai":
                    logger.info("ADMIN COMMAND: RESUME AI")
                    if session:
                        session.unmute()
                        if is_realtime:
                            session.generate_reply(instructions="The admin has handed back control. You may resume the conversation naturally.")
                    return

            # Text mode chat logic
            if test_mode == "text":
                text = payload.get('text') or payload.get('message') or payload.get('content', '')
                if text:
                    # Create async task to handle the text input
                    async def handle_text_input():
                        nonlocal text_chat_history
                        try:
                            logger.info(f"Processing text input (text mode): {text[:50]}...")
                            text_chat_history.append({"role": "user", "content": text})
                            text_context = TextModeContext(
                                room_name=ctx.room.name if ctx.room else None,
                                agent_config=agent_config
                            )
                            response = await generate_text_response(
                                text, agent_config, text_chat_history, text_llm,
                                tools=agent_tools,
                                text_context=text_context
                            )
                            if response:
                                text_chat_history.append({"role": "assistant", "content": response})
                                response_data = json.dumps({
                                    "type": "chat",
                                    "text": response,
                                    "sender": agent_name
                                }).encode('utf-8')
                                await ctx.room.local_participant.publish_data(response_data, reliable=True)
                                logger.info(f"Sent text response: {response[:50]}...")
                                room_name = ctx.room.name if ctx.room else ""
                                if room_name.startswith("webchat-"):
                                    try:
                                        from app.services.chat_agent_service import save_widget_message, update_widget_activity
                                        save_widget_message(room_name, "user", text)
                                        save_widget_message(room_name, "agent", response)
                                        chat_cfg = agent_config.get("_chat_config", {})
                                        update_widget_activity(room_name, chat_cfg.get("inactivity_timeout", 10))
                                    except Exception as persist_err:
                                        logger.debug(f"Failed to persist widget message: {persist_err}")
                            else:
                                logger.warning("No response generated for text input")
                        except Exception as e:
                            logger.error(f"Error handling text input: {e}")
                    asyncio.create_task(handle_text_input())

        except Exception as e:
            logger.error(f"Error processing data message: {e}")

    # Set up room disconnect handler for proper call tracking cleanup
    session_ended = asyncio.Event()

    @ctx.room.on("disconnected")
    def on_room_disconnected():
        """Handle room disconnect to properly end call tracking.
        Note: RuntimeError from aclose() race condition is a known upstream LiveKit SDK issue
        (livekit-agents ^1.3.11) — cosmetic only, does not affect call quality."""
        logger.info("Room disconnected event received")
        try:
            session_ended.set()
        except RuntimeError as e:
            logger.debug(f"Cleanup race condition (harmless): {e}")

    # Also listen for session close (only if voice session exists)
    if session:
        @session.on("close")
        def on_session_close():
            """Handle session close event."""
            logger.info("Session close event received")
            try:
                session_ended.set()
            except RuntimeError as e:
                logger.debug(f"Cleanup race condition (harmless): {e}")

    # Start inactivity monitor for webchat rooms
    inactivity_task = None
    room_name_str = ctx.room.name if ctx.room else ""
    if room_name_str.startswith("webchat-") and agent_type == "chat":
        chat_cfg = agent_config.get("_chat_config", {})
        if chat_cfg.get("auto_close_inactive", True):
            timeout_min = chat_cfg.get("inactivity_timeout", 10)
            inactivity_msg = chat_cfg.get("inactivity_message", "This chat has been closed due to inactivity.")

            async def webchat_inactivity_monitor():
                """Auto-close webchat session after inactivity timeout."""
                try:
                    from app.services.chat_agent_service import get_widget_activity
                    from datetime import datetime
                    while True:
                        await asyncio.sleep(30)  # Check every 30 seconds
                        last_activity = get_widget_activity(room_name_str)
                        if last_activity:
                            try:
                                last_dt = datetime.fromisoformat(last_activity.replace("Z", "+00:00"))
                                elapsed = (datetime.now(last_dt.tzinfo) - last_dt).total_seconds()
                                if elapsed > timeout_min * 60:
                                    # Send inactivity message
                                    close_data = json.dumps({
                                        "type": "chat",
                                        "text": inactivity_msg,
                                        "sender": agent_name
                                    }).encode('utf-8')
                                    await ctx.room.local_participant.publish_data(close_data, reliable=True)
                                    logger.info(f"Webchat session {room_name_str} timed out after {timeout_min}m")
                                    await asyncio.sleep(5)
                                    session_ended.set()
                                    break
                            except Exception:
                                pass
                except asyncio.CancelledError:
                    pass
                except Exception as e:
                    logger.debug(f"Inactivity monitor error: {e}")

            inactivity_task = asyncio.create_task(webchat_inactivity_monitor())
            logger.info(f"Started webchat inactivity monitor ({timeout_min}m timeout)")

    # Start max call duration monitor
    max_duration_task = None
    max_duration_min = agent_config.get("resource_limits", {}).get("max_call_duration", 0)
    if max_duration_min and max_duration_min > 0:
        async def max_duration_monitor():
            """Auto-disconnect call after max duration limit."""
            nonlocal end_reason
            try:
                await asyncio.sleep(max_duration_min * 60)
                logger.info(f"Max call duration ({max_duration_min}m) reached for room {ctx.room.name}")
                try:
                    if session:
                        if is_realtime:
                            session.generate_reply(instructions="The call time limit has been reached. Politely tell the caller that the maximum call duration has been reached and say goodbye.")
                            await asyncio.sleep(8)
                        else:
                            await session.say("I'm sorry, but we've reached the maximum call duration. Thank you for calling. Goodbye.")
                            await asyncio.sleep(5)
                except Exception as say_err:
                    logger.debug(f"Could not speak max duration message: {say_err}")
                # Record in transcription
                if call_tracker:
                    from datetime import datetime
                    call_tracker.transcription_segments.append({
                        "speaker": "system",
                        "text": f"Max call duration reached ({max_duration_min} min limit). Call ended automatically.",
                        "timestamp": datetime.utcnow().isoformat(),
                    })
                end_reason = "max_duration"
                session_ended.set()
            except asyncio.CancelledError:
                pass
            except Exception as e:
                logger.debug(f"Max duration monitor error: {e}")

        max_duration_task = asyncio.create_task(max_duration_monitor())
        logger.info(f"Started max call duration monitor ({max_duration_min}m limit)")

    # Simulation: wait for tester agent to join before greeting
    # FORCED BYPASS: Sandbox rooms should NEVER wait 30s
    if is_simulation_test and simulation_role == "agent_under_test" and not ctx.room.name.startswith("simulation-sandbox"):
        logger.info(f"Simulation wait loop triggered - room: {ctx.room.name}, participants: {len(ctx.room.remote_participants)}")
        logger.info("Simulation: waiting for tester agent to join...")
        wait_start = time.time()
        while not ctx.room.remote_participants and (time.time() - wait_start) < 30:
            await asyncio.sleep(0.5)
        if ctx.room.remote_participants:
            await asyncio.sleep(1.5)  # Let tester fully initialize audio
            logger.info("Simulation: tester agent joined, proceeding with greeting")
        else:
            logger.warning("Simulation: tester agent did not join within 30s")

    # Initial greeting logic for non-telephony agents (web/sim)
    try:
        if initial_greeting and not is_telephony_agent:
            if not ctx.room.name.startswith("simulation-sandbox"):
                logger.info("Waiting for WebRTC stabilization before greeting...")
                await asyncio.sleep(1.0)
            else:
                # Sandbox waits (existing logic preserved for sandbox)
                s_wait = time.time()
                while not ctx.room.remote_participants and (time.time() - s_wait) < 3:
                    await asyncio.sleep(0.1)
                if ctx.room.remote_participants:
                    await asyncio.sleep(2.0)
            
            if test_mode == "text":
                greeting_data = json.dumps({"type": "chat", "text": initial_greeting, "sender": agent_name}).encode('utf-8')
                await ctx.room.local_participant.publish_data(greeting_data, reliable=True)
            elif is_realtime:
                session.generate_reply(instructions=f"Greet the user with exactly this message: {initial_greeting}")
            else:
                session.say(initial_greeting)
    except Exception as greeting_error:
        logger.error(f"Failed to send initial greeting: {greeting_error}")

    # Start jitter sampling background task
    jitter_task = None
    if call_tracker:
        async def _jitter_sampler():
            """Periodically sample network jitter from remote audio tracks."""
            try:
                await asyncio.sleep(5)  # First sample after 5s
                await call_tracker.sample_jitter(ctx.room)
                while True:
                    await asyncio.sleep(30)
                    await call_tracker.sample_jitter(ctx.room)
            except asyncio.CancelledError:
                pass
            except Exception as e:
                logger.debug(f"Jitter sampler error: {e}")

        jitter_task = asyncio.create_task(_jitter_sampler())

    # Wait for the session to end
    end_reason = "hangup"
    try:
        # Wait for room disconnect event or cancellation
        await session_ended.wait()
        logger.info("Session ended normally via room disconnect event")
    except asyncio.CancelledError:
        # Task was cancelled externally
        logger.info("Session cancelled externally")
        end_reason = "hangup"
    except Exception as e:
        logger.error(f"Session error: {e}")
        end_reason = "error"
    finally:
        # Always ensure cleanup happens
        logger.info(f"Cleaning up session, end_reason={end_reason}")

        # CALL_LATENCY_SUMMARY logger (diagnostics only)
        if session and hasattr(session, "_turns_data"):
            try:
                turns_data = getattr(session, "_turns_data", [])
                n_turns = len(turns_data)
                
                first_turn_total = None
                total_gaps = []
                stt_waits = []
                llm_tts_to_first_audios = []
                
                for t in turns_data:
                    if t.get("first_user_turn") and t.get("total_gap_ms") is not None:
                        first_turn_total = t.get("total_gap_ms")
                    if t.get("total_gap_ms") is not None:
                        total_gaps.append(t.get("total_gap_ms"))
                    if t.get("stt_wait_ms") is not None:
                        stt_waits.append(t.get("stt_wait_ms"))
                    if t.get("llm_tts_to_first_audio_ms") is not None:
                        llm_tts_to_first_audios.append(t.get("llm_tts_to_first_audio_ms"))
                        
                def compute_p50(lst):
                    if not lst:
                        return None
                    sorted_lst = sorted(lst)
                    n_lst = len(sorted_lst)
                    if n_lst % 2 == 1:
                        return sorted_lst[n_lst // 2]
                    else:
                        return int(round((sorted_lst[n_lst // 2 - 1] + sorted_lst[n_lst // 2]) / 2.0))

                def compute_avg(lst):
                    if not lst:
                        return None
                    return int(round(sum(lst) / len(lst)))

                def compute_max(lst):
                    if not lst:
                        return None
                    return max(lst)
                    
                def fmt_sum_val(v):
                    return str(v) if v is not None else "none"

                avg_turn_total = compute_avg(total_gaps)
                p50_turn_total = compute_p50(total_gaps)
                max_turn_total = compute_max(total_gaps)
                avg_stt_wait = compute_avg(stt_waits)
                avg_llm_tts = compute_avg(llm_tts_to_first_audios)
                
                logger.info(
                    f"[CALL_LATENCY_SUMMARY] "
                    f"turns={n_turns} "
                    f"first_turn_total_ms={fmt_sum_val(first_turn_total)} "
                    f"avg_turn_total_ms={fmt_sum_val(avg_turn_total)} "
                    f"p50_turn_total_ms={fmt_sum_val(p50_turn_total)} "
                    f"max_turn_total_ms={fmt_sum_val(max_turn_total)} "
                    f"avg_stt_wait_ms={fmt_sum_val(avg_stt_wait)} "
                    f"avg_llm_tts_to_first_audio_ms={fmt_sum_val(avg_llm_tts)}"
                )
            except Exception as summary_err:
                logger.debug(f"Failed to generate CALL_LATENCY_SUMMARY: {summary_err}")

        # Close MCP connections (Phase 4)
        mcp_manager = session_ref.get("mcp_manager")
        if mcp_manager:
            try:
                await mcp_manager.cleanup()
                logger.info("MCP connections closed via manager")
            except Exception as mcp_cleanup_error:
                logger.error(f"Error closing MCP connections: {mcp_cleanup_error}")

        # Cancel inactivity monitor if running
        if inactivity_task and not inactivity_task.done():
            inactivity_task.cancel()

        # Cancel max duration monitor if running
        if max_duration_task and not max_duration_task.done():
            max_duration_task.cancel()

        # Cancel jitter sampler and take a final sample
        if jitter_task and not jitter_task.done():
            jitter_task.cancel()
        if call_tracker:
            try:
                await call_tracker.sample_jitter(ctx.room)
            except Exception:
                pass

        try:
            event_listener.stop()
            unregister_call_session(ctx.room.name, caller_phone)
            
            # --- Campaign Tracking Lifecycle Hook ---
            try:
                # Extract from all possible sources
                c_id = None
                l_id = None
                ext_id = None
                phone = caller_phone
                sip_call = None
                
                # Check call_tracker metadata
                if call_tracker and call_tracker.job_metadata:
                    ct_jm = normalize_dict(call_tracker.job_metadata)
                    c_id = c_id or ct_jm.get("campaign_id")
                    l_id = l_id or ct_jm.get("lead_id") or ct_jm.get("leadId") or ct_jm.get("campaign_number_id") or ct_jm.get("campaignNumberId")
                    ext_id = ext_id or ct_jm.get("external_record_id") or ct_jm.get("externalRecordId") or ct_jm.get("record_id") or ct_jm.get("recordId")
                    sip_call = sip_call or ct_jm.get("sip_call_to")
                
                # Check sip_metadata / job_metadata
                if not c_id and "job_metadata" in locals() and job_metadata:
                    jm = normalize_dict(job_metadata)
                    c_id = c_id or jm.get("campaign_id")
                    l_id = l_id or jm.get("lead_id") or jm.get("leadId") or jm.get("campaign_number_id") or jm.get("campaignNumberId")
                    ext_id = ext_id or jm.get("external_record_id") or jm.get("externalRecordId") or jm.get("record_id") or jm.get("recordId")
                    sip_call = sip_call or jm.get("sip_call_to")
                
                # Check room metadata
                if not c_id and ctx.room.metadata:
                    rmeta = normalize_dict(ctx.room.metadata)
                    c_id = c_id or rmeta.get("campaign_id")
                    l_id = l_id or rmeta.get("lead_id") or rmeta.get("leadId") or rmeta.get("campaign_number_id") or rmeta.get("campaignNumberId")
                    ext_id = ext_id or rmeta.get("external_record_id") or rmeta.get("externalRecordId") or rmeta.get("record_id") or rmeta.get("recordId")
                
                logger.info(f"[CampaignLifecycle] cleanup reached is_outbound={is_outbound_call} campaign_id={c_id} lead_id={l_id} external_record_id={ext_id} end_reason={end_reason}")
                
                if c_id and not l_id and ext_id:
                    l_id = ext_id
                    logger.info(f"[CampaignLifecycle] using external_record_id as lead_id fallback: {l_id}")
                
                # --- Preview call detection ---
                # A call is a preview if ANY of the following is true:
                #   1. source/type fields in room metadata say "preview"
                #   2. campaign_id is null/None/"default_campaign" (preview sends null)
                #   3. lead_id or external_record_id starts with "preview_"
                # Check local variables FIRST (most reliable) so detection doesn't
                # depend on room metadata being present or populated.
                is_preview = False

                # Check 1: direct variable inspection (works even if metadata is absent)
                if (
                    not c_id
                    or str(c_id).lower() in ("none", "null", "", "default_campaign")
                    or str(l_id).lower().startswith("preview_")
                    or str(ext_id).lower().startswith("preview_")
                ):
                    is_preview = True

                # Check 2: room metadata signals (belt-and-suspenders)
                if not is_preview and ctx.room.metadata:
                    rmeta = normalize_dict(ctx.room.metadata)
                    if (
                        rmeta.get("type") == "preview"
                        or rmeta.get("source") == "preview"
                        or str(rmeta.get("campaign_id", "")).lower() in ("none", "null", "", "default_campaign")
                        or str(rmeta.get("lead_id", "")).lower().startswith("preview_")
                        or str(rmeta.get("external_record_id", "")).lower().startswith("preview_")
                    ):
                        is_preview = True

                if is_preview:
                    logger.info("[CampaignLifecycle] preview call; skipping campaign update")
                elif c_id and l_id:
                    if campaign_service:
                        dur = time.time() - call_tracker.call_start_time if call_tracker and call_tracker.call_start_time else 0
                        tc = len(call_tracker.transcription_segments) if call_tracker else 0
                        
                        agent_speech_count = getattr(session, "agent_speech_count", 0) if "session" in locals() and session else 0
                        user_transcript_count = getattr(session, "user_transcript_count", 0) if "session" in locals() and session else tc
                        
                        disconnected_before_greeting = "session" in locals() and session and getattr(session, "disconnected_before_greeting", False)
                        disconnected_during_greeting = "session" in locals() and session and getattr(session, "disconnected_during_greeting", False)
                        
                        if disconnected_before_greeting:
                            logger.info("[CampaignLifecycle] outcome disconnected_before_greeting; marking failed")
                            campaign_service.mark_campaign_call_failed(c_id, l_id, "disconnected_before_greeting")
                        elif disconnected_during_greeting:
                            logger.info("[CampaignLifecycle] outcome disconnected_during_greeting; marking failed")
                            campaign_service.mark_campaign_call_failed(c_id, l_id, "disconnected_during_greeting")
                        elif user_transcript_count == 0:
                            logger.info("[CampaignLifecycle] outcome no_conversation; marking failed")
                            campaign_service.mark_campaign_call_failed(c_id, l_id, "no_conversation")
                        else:
                            campaign_service.mark_campaign_call_completed(c_id, l_id, dur, tc)
                            logger.info(f"[CampaignLifecycle] outcome completed; marking completed for {c_id}/{l_id}")
                    else:
                        logger.warning("[CampaignLifecycle] campaign_service is not loaded")
                else:
                    logger.warning("[CampaignLifecycle] missing campaign_id/lead_id; skipping campaign update")
            except Exception as cl_error:
                logger.exception(f"[CampaignLifecycle] failed to update campaign lifecycle: {cl_error}")

            if call_tracker:
                call_tracker.end_call(end_reason=end_reason, recording_id=locals().get('auto_record_egress_id'))
                
                # Trigger Post-Call Analytics
                if process_post_call_analytics:
                    logger.info(f"Triggering background analytics for room {ctx.room.name}")
                    asyncio.create_task(process_post_call_analytics(
                        room_name=ctx.room.name,
                        transcript=call_tracker.transcription_segments,
                        metadata={
                            "agent_id": agent_config.get("id"),
                            "agent_slug": agent_config.get("slug"),
                            "caller_id": caller_phone,
                            "end_reason": end_reason,
                            "recording_id": auto_record_egress_id,
                            "sentiment_analysis": (normalize_tools_config(agent_config.get("tools_config", {})) if isinstance(normalize_tools_config(agent_config.get("tools_config", {})), dict) else {}).get("sentiment_analysis", False),
                            "duration": time.time() - call_tracker.call_start_time if call_tracker.call_start_time else 0
                        }
                    ))
            logger.info("Session cleanup completed successfully")
        except Exception as cleanup_error:
            logger.error(f"Error during session cleanup: {cleanup_error}")


def main(port: int = None):
    """Main entrypoint"""

    print("=" * 60)
    print("LiveKit Voice Agents Worker")
    print("=" * 60)
    print()

    # Sovereign Bypass: Force direct configuration load
    logger.info("Igniting Sovereign Engine (Bypass Mode active)")
    from app.services import agent_storage
    try:
        raw_agents = asyncio.run(agent_storage.get_all_agents())
        agents_configs = []
        seen_ids = set()
        for a in raw_agents:
            # Strict Database Status Filtering exactly as requested
            if str(a.get("status", "")).lower() != "running":
                continue
                
            a_id = a.get("id")
            # Duplicate prevention Fix
            if a_id and a_id in seen_ids:
                continue
                
            agents_configs.append(a)
            if a_id:
                seen_ids.add(a_id)
        if not agents_configs:
            logger.error("No running agents found in Redis management database.")
            print("ERROR: No running agents available. Please start an agent via the Dashboard.")
            sys.exit(1)
    except Exception as e:
        logger.error(f"Sovereign Bridge Error: {e}")
        sys.exit(1)

    print(f"Found {len(agents_configs)} running agent(s):")
    for agent in agents_configs:
        llm = agent.get('llm_config', {}).get('provider', 'N/A')
        stt = f"{agent.get('stt_config', {}).get('provider')}:{agent.get('stt_config', {}).get('model')}" if agent.get('stt_config') else 'N/A'
        tts = agent.get('tts_config', {}).get('provider', 'N/A')
        print(f"  - {agent.get('name')} (LLM: {llm}, STT: {stt}, TTS: {tts})")
    print()

    # Check environment variables for first agent
    missing_vars = check_required_env_vars(agents_configs[0])

    if missing_vars:
        print("ERROR: The following environment variables are missing or not configured:")
        print()
        for var in missing_vars:
            print(f"  [FAIL] {var}")
        print()
        print("Please configure these variables in your .env file")
        sys.exit(1)

    print("[OK] All required environment variables are set")
    print()

    # Check development mode setting
    devmode = os.getenv("AGENT_DEVMODE", "false").lower() == "true"
    mode_name = "Development" if devmode else "Production"
    mode_desc = "Ignores CPU load, enables auto-reload" if devmode else "Monitors CPU load (70% threshold), stable mode"
    print(f"Agent Mode: {mode_name} ({mode_desc})")
    print()

    print("Starting agent worker...")
    print("=" * 60)
    print()

    # V6.5: Ultimate definition lock
    agent_name = os.getenv("AGENT_NAME", "telephony-agent")
    
    # V6.2: Prioritize explicit port argument from wrapper scripts
    if port is None:
        instance_id = os.getenv("INSTANCE_ID", "default")
        base_port = int(os.getenv("AGENT_PORT", "8081"))
        try:
            offset = int(instance_id) - 1 if instance_id.isdigit() else 0
            port = base_port + offset
        except Exception:
            port = base_port

    print(f"--- SARAH AGENT BOOT: {agent_name} on Port {port} ---")
    
    # Sanitize sys.argv for LiveKit CLI
    sys.argv[:] = [sys.argv[0], "start"]

    try:
        cli.run_app(
            WorkerOptions(
                request_fnc=request_fnc,
                prewarm_fnc=prewarm,
                entrypoint_fnc=entrypoint,
                agent_name=agent_name,
                load_threshold=float('inf'),
                port=port,
                num_idle_processes=2,
                initialize_process_timeout=60.0
            ),
        )
    except KeyboardInterrupt:
        print("\nGracefully shutting down Sovereign Worker...")
    finally:
        # Cleanup global HTTP session on process exit
        if _shared_http_session and not _shared_http_session.closed:
            print("Cleaning up global HTTP session...")
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    loop.create_task(_shared_http_session.close())
                else:
                    loop.run_until_complete(_shared_http_session.close())
            except Exception:
                pass
