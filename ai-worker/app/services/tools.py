import json
import logging
import asyncio
import aiohttp
import datetime
import os
from livekit import api, rtc
from livekit.agents import llm, function_tool, RunContext
from typing import Any, Dict, List, Optional, Callable, Annotated

logger = logging.getLogger("ai_worker.services.tools")

from app.services.webhooks import execute_webhook
from app.services.knowledge import query_knowledge_base
from app.services.handoff import transfer_to_specialist
from app.services.egress import start_call_recording
import asyncpg

# --- PHASE 1 TOOLS ---

@function_tool
def get_datetime(ctx: RunContext, timezone: str = "UTC"):
    """Returns the current date and time in ISO format."""
    now = datetime.datetime.now(datetime.timezone.utc)
    # Simple timezone offset logic for testing
    if timezone != "UTC":
        logger.info(f"Timezone conversion requested for {timezone} (falling back to UTC for Phase 1)")
    return now.isoformat()

@function_tool
def lookup_caller(ctx: RunContext, phone_number: str):
    """Look up customer details and CRM data by phone number. Returns a CRM record string."""
    logger.info(f"Looking up caller: {phone_number}")
    # Mock CRM logic
    crm_data = {
        "+15551234567": "VIP Customer: Jane Doe. Last order: 2 days ago (Order #9982). Preferred language: English.",
        "+15559876543": "Standard Customer: John Smith. Account balance: $12.50. Notes: Likes prompt service.",
    }
    return crm_data.get(phone_number, "No record found. New Lead detected.")

@function_tool
def record_note(ctx: RunContext, note_content: str):
    """Record a note or action item into the CRM. Returns a success message."""
    logger.info(f"Saving CRM Note: {note_content}")
    # In a real app, this would be a database insert or API call
    return f"Successfully recorded note: '{note_content}'"

# --- PHASE 2 TOOLS (COMMUNICATION) ---

@function_tool
def send_sms(ctx: RunContext, phone_number: str, message: str):
    """Send an SMS text message to a phone number. Returns a JSON success/error string."""
    try:
        logger.info(f"Sending SMS to {phone_number}: {message}")
        # In a real production environment, integrate with Twilio, Plivo, etc.
        # Simulation: assume success
        return json.dumps({"status": "success", "message": f"SMS sent to {phone_number}"})
    except Exception as e:
        logger.error(f"Failed to send SMS to {phone_number}: {e}")
        return f"Error: Failed to send SMS to {phone_number}."

@function_tool
def send_email(ctx: RunContext, email_address: str, subject: str, body: str):
    """Send an email to a specified recipient. Returns a JSON success/error string."""
    try:
        logger.info(f"Sending Email to {email_address} | Subject: {subject}")
        # In a real production environment, integrate with SendGrid, Resend, etc.
        # Simulation: assume success
        return json.dumps({"status": "success", "message": f"Email sent to {email_address}"})
    except Exception as e:
        logger.error(f"Failed to send email to {email_address}: {e}")
        return f"Error: Failed to send email to {email_address}."

@function_tool
def schedule_callback(ctx: RunContext, datetime_str: str, phone_number: str):
    """Schedule a callback reminder for the customer. datetime_str should be in ISO or human-readable format."""
    try:
        logger.info(f"Scheduling callback for {phone_number} at {datetime_str}")
        # In a real production environment, integrate with a task queue or database.
        # Simulation: assume success
        return json.dumps({"status": "success", "message": f"Callback scheduled for {phone_number} at {datetime_str}"})
    except Exception as e:
        logger.error(f"Failed to schedule callback for {phone_number}: {e}")
        return f"Error: Failed to schedule callback for {phone_number}."
 
@function_tool
async def mark_unresolved(
    ctx: RunContext, 
    phone_number: Annotated[str, "The citizen's mobile number connected to the complaint"],
    reason: Annotated[str, "Explanation of why the ticket is unresolved, provided by the citizen"] = "Citizen confirmed issue is still pending"
):
    """
    Flags a complaint as UNRESOLVED in the database for re-escalation.
    Use this during outbound follow-up calls if the citizen confirms the garbage was not picked up.
    """
    try:
        db_url = os.getenv("DATABASE_URL")
        if not db_url:
            return "Error: Database connection not configured."
 
        conn = await asyncpg.connect(db_url)
        try:
            # First, find the most recent complaint for this phone number
            # Then mark it as unresolved (assuming we add a status column or use the issue field)
            # For Suthra Punjab, we'll mark the 'issue' or a dedicated 'status' column
            await conn.execute("""
                UPDATE complaints 
                SET issue = issue || ' [UNRESOLVED - RE-ESCALATED]'
                WHERE phone = $1
                AND id = (SELECT id FROM complaints WHERE phone = $1 ORDER BY created_at DESC LIMIT 1)
            """, phone_number)
            logger.info(f"Marked complaint for {phone_number} as UNRESOLVED.")
            return "Success. The complaint has been flagged for re-escalation. Please inform the citizen."
        finally:
            await conn.close()
    except Exception as e:
        logger.error(f"Failed to mark unresolved: {e}")
        return f"Error updating record: {e}"
 
# Import the existing 6-point submission tool from communication.py
try:
    from tools.communication import submit_ticket as submit_complaint
except ImportError:
    submit_complaint = None

# --- PHASE 3 TOOLS (TELEPHONY) ---

class TelephonyTools:
    """Context-aware tools that interact with the live LiveKit room and session."""
    
    def __init__(self, context: Any):
        self.context = context

    @function_tool
    async def hangup(self, ctx: RunContext):
        """End the current call and disconnect. Triggers the agent to disconnect from the room, ending the SIP call."""
        try:
            logger.info("Tool: hangup() called")
            # Close the entire room to physically drop the SIP channel immediately
            await self.context.room.disconnect()
            return "Ending call now. Goodbye."
        except Exception as e:
            logger.error(f"Error in hangup: {e}")
            return f"Error: Failed to hang up call: {e}"

    @function_tool
    async def hold(self, ctx: RunContext, action: str):
        """Place the caller on hold or resume the call. action: 'pause' or 'resume'. Mutes/unmutes the agent and toggles hold music or silence."""
        try:
            logger.info(f"Tool: hold(action='{action}') called")
            # Logic depends on LiveKit agent session state
            # For now, we simulate by logging. Real implementation would mute/unmute
            if action == "pause":
                return "Placing call on hold. Please wait."
            elif action == "resume":
                return "Resuming call. Thank you for waiting."
            return "Error: Invalid action. Use 'pause' or 'resume'."
        except Exception as e:
            return f"Error: Failed to toggle hold: {e}"

    @function_tool
    async def blind_transfer(self, ctx: RunContext, target_number: str):
        """Transfer the current caller to a different representative or phone number. Transfers the caller to the specified phone number and disconnects the AI."""
        try:
            logger.info(f"Tool: blind_transfer(target='{target_number}') called")
            # This would typically involve sending a SIP REFER or using the LiveKit SIP API
            return f"Transferring you to {target_number} now. Please stay on the line."
        except Exception as e:
            logger.error(f"Error in blind_transfer: {e}")
            return f"Error: Transfer failed. The line may be busy."

    @function_tool
    async def play_audio(self, ctx: RunContext, audio_url: str):
        """Play a specific audio file or URL to the caller (e.g., a legal disclaimer). Injects a pre-recorded audio file directly into the WebRTC stream."""
        try:
            logger.info(f"Tool: play_audio(url='{audio_url}') called")
            # Real implementation would use session.play_audio or similar
            return f"Playing audio from {audio_url}."
        except Exception as e:
            return f"Error: Failed to play audio: {e}"

    async def execute_sip_transfer(self, speech: str = None):
        """Internal helper to execute a SIP REFER transfer to extension 101."""
        try:
            # 1. Speak acknowledgment if provided
            if speech and self.context.session:
                logger.info(f"Speaking transfer acknowledgment: {speech[:50]}...")
                self.context.session.say(speech)
                await asyncio.sleep(4.0) # Buffer for TTS

            # 2. Find SIP participant
            target_identity = None
            for p in list(self.context.room.remote_participants.values()):
                if p.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP:
                    target_identity = p.identity
                    break
            
            if not target_identity:
                return "Error: No SIP participant found to transfer."

            # 3. Trigger Transfer
            lk_url = os.getenv("LIVEKIT_URL", "ws://localhost:7880")
            if lk_url.startswith("ws://"): lk_url = lk_url.replace("ws://", "http://")
            if lk_url.startswith("wss://"): lk_url = lk_url.replace("wss://", "https://")

            async with api.LiveKitAPI(
                lk_url,
                os.getenv("LIVEKIT_API_KEY"),
                os.getenv("LIVEKIT_API_SECRET")
            ) as lk_api:
                request = api.TransferSIPParticipantRequest(
                    participant_identity=target_identity,
                    room_name=self.context.room.name,
                    transfer_to="sip:101@172.29.24.63", # Hardcoded to your human ring group
                    play_dialtone=True
                )
                await lk_api.sip.transfer_sip_participant(request)
            
            return "Transfer initiated successfully."
        except Exception as e:
            logger.error(f"SIP Transfer failed: {e}")
            return f"Error: Transfer failed: {e}"

    async def execute_hangup(self, speech: str = None):
        """Internal helper to speak and disconnect room immediately."""
        try:
            if speech and self.context.session:
                logger.info(f"Speaking hangup acknowledgment: {speech[:50]}...")
                self.context.session.say(speech)
                await asyncio.sleep(4.0) # Buffer for TTS
            
            # physically drop the SIP channel by disconnecting the room
            await self.context.room.disconnect()
            return "Call ended."
        except Exception as e:
            return f"Error hanging up: {e}"

    @function_tool
    async def collect_dtmf(self, ctx: RunContext, prompt_text: str, max_digits: int = 10):
        """Request and collect DTMF (touch-tone) digits from the caller. Prompts the user and waits for DTMF tones (digits like account numbers)."""
        try:
            logger.info(f"Tool: collect_dtmf(prompt='{prompt_text}', max={max_digits}) called")
            # This requires a listener for DTMF events on the SIP participant
            return "Please enter the digits now." # Real implementation would await the event
        except Exception as e:
            return f"Error: DTMF collection failed."

    # --- PHASE 5 TOOLS ---

    @function_tool
    async def query_knowledge_base(self, ctx: RunContext, search_query: str):
        """Search the company knowledge base for answers to complex questions. Uses RAG to find relevant information for the user's specific query."""
        agent_id = self.context.agent_config.get("id")
        return await query_knowledge_base(search_query, agent_id)

    @function_tool
    async def transfer_to_specialist(self, ctx: RunContext, target_agent_slug: str, transfer_reason: str):
        """Transfer the call to a different agent or specialist. Seamlessly hands over the caller to another AI agent profile."""
        session_ref = {
            "session": self.context.session,
            "room": self.context.room,
            "ctx": self.context.ctx
        }
        return await transfer_to_specialist(target_agent_slug, transfer_reason, session_ref)

    @function_tool
    async def start_call_recording(self, ctx: RunContext):
        """Start recording the current call for quality assurance. Programmatically triggers LiveKit Egress to record the session."""
        ctx_ref = {"ctx": self.context.ctx}
        return await start_call_recording(ctx_ref)

# --- PHASE 4 DYNAMIC TOOL WRAPPERS ---

def create_webhook_tool(tool_def: Dict[str, Any]) -> Callable:
    """Creates a dynamic llm_callable that triggers a webhook."""
    name = tool_def.get("name")
    description = tool_def.get("description", f"Triggers the {name} webhook.")
    url = tool_def.get("url") or tool_def.get("endpointUrl")

    # Define the dynamic handler
    @function_tool(name=name)
    async def webhook_handler(ctx: RunContext, **kwargs):
        """Triggers a dynamic webhook."""
        logger.info(f"Invoking Webhook Tool: {name} (URL: {url})")
        return await execute_webhook(url, kwargs)

    return webhook_handler

def create_mcp_tool_wrapper(mcp_tool_def: Dict[str, Any], mcp_manager: Any) -> Callable:
    """Creates a wrapper for an MCP tool."""
    name = mcp_tool_def.get("name")
    description = mcp_tool_def.get("description")
    server_id = mcp_tool_def.get("server_id")
    
    @function_tool(name=name)
    async def mcp_handler(ctx: RunContext, **kwargs):
        """Invokes a dynamic MCP tool."""
        logger.info(f"Invoking MCP Tool: {name} on server {server_id}")
        return await mcp_manager.call_tool(server_id, name, kwargs)
        
    return mcp_handler

def create_native_telephony_tool(tool_def: Dict[str, Any], telephony: TelephonyTools) -> Callable:
    """Creates a dynamic native tool (Transfer or Hangup) with custom speech."""
    name = tool_def.get("name")
    description = tool_def.get("description")
    params = tool_def.get("parametersSchema", {})
    action = params.get("action", "transfer") # 'transfer' or 'hangup'
    speech = params.get("speech") # Custom Urdu/English speech

    @function_tool(name=name, description=description)
    async def native_handler(ctx: RunContext, reason: Optional[str] = None):
        logger.info(f"Invoking Native Telephony Tool: {name} (Action: {action})")
        if action == "transfer":
            return await telephony.execute_sip_transfer(speech)
        else:
            return await telephony.execute_hangup(speech)
    
    return native_handler

# --- REGISTRY & INJECTION ---

class ToolRegistry:
    """Registry for mapping string names to callable tool functions."""
    
    def __init__(self):
        # Map tool names (as stored in DB/Redis) to their Python functions
        self._registry = {
            "get_datetime": get_datetime,
            "lookup_caller": lookup_caller,
            "record_note": record_note,
            "send_sms": send_sms,
            "send_email": send_email,
            "schedule_callback": schedule_callback,
            "mark_unresolved": mark_unresolved,
            "submit_complaint": submit_complaint,
        }
        
    def get_tools_for_agent(self, enabled_tools: List[Any], context: Any = None, mcp_manager: Any = None) -> List[llm.FunctionCall]:
        """
        Returns a list of LiveKit function tools for the enabled tool configs.
        enabled_tools: List of tool names (P1-3) or tool objects (Phase 4).
        """
        tools = []
        
        # Initialize context-aware tools if context is provided
        telephony = TelephonyTools(context) if context else None
        
        # Base registry (static tools)
        current_registry = self._registry.copy()
        if telephony:
            current_registry.update({
                "hangup": telephony.hangup,
                "hold": telephony.hold,
                "blind_transfer": telephony.blind_transfer,
                "play_audio": telephony.play_audio,
                "collect_dtmf": telephony.collect_dtmf,
                "query_knowledge_base": telephony.query_knowledge_base,
                "transfer_to_specialist": telephony.transfer_to_specialist,
                "start_call_recording": telephony.start_call_recording,
            })
            
        for tool_config in enabled_tools:
            # Handle string names (legacy/Phase 1-3)
            if isinstance(tool_config, str):
                name = tool_config
                if name in current_registry:
                    tools.append(current_registry[name])
                    logger.info(f"Injected static tool: {name}")
                else:
                    logger.warning(f"Static tool '{name}' enabled but not found in registry.")
                continue

            # Handle object-based tool configs (Phase 4)
            if isinstance(tool_config, dict):
                name = tool_config.get("name")
                tool_type = tool_config.get("type", "static")
                
                if tool_type == "webhook":
                    logger.info(f"Injecting dynamic Webhook tool: {name}")
                    tools.append(create_webhook_tool(tool_config))
                elif tool_type == "mcp" and mcp_manager:
                    logger.info(f"Injecting dynamic MCP tool: {name}")
                    tools.append(create_mcp_tool_wrapper(tool_config, mcp_manager))
                elif tool_type == "native" and telephony:
                    logger.info(f"Injecting dynamic Native tool: {name}")
                    tools.append(create_native_telephony_tool(tool_config, telephony))
                elif name in current_registry:
                    tools.append(current_registry[name])
                    logger.info(f"Injected static tool (via object): {name}")
                else:
                    logger.warning(f"Dynamic tool '{name}' of type '{tool_type}' not handled.")

        return tools

tool_registry = ToolRegistry()
