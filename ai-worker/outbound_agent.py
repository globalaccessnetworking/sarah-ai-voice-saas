import asyncio
import json
import os
import sys
import time
from dotenv import load_dotenv
from livekit import api

load_dotenv()

DEFAULT_TRUNK_ID = os.getenv("LIVEKIT_SIP_TRUNK_ID", "ST_ajkRrwumeHk5")
AGENT_NAME = os.getenv("OUTBOUND_AGENT_NAME", "outbound-agent")
DEFAULT_AGENT_ID = os.getenv("OUTBOUND_AGENT_ID", "ag_mev9j86bj")


def clean_number(phone_number: str) -> str:
    return phone_number.replace("+", "").replace(" ", "").replace("-", "").strip()


async def make_outbound_call(phone_number: str, trunk_id: str, opening_message: str = None):
    """
    Manual generic SaaS outbound PSTN test.

    Correct flow for your current SDK:
      1. Create outbound SIP participant.
      2. Dispatch agent into the same room using AgentDispatch API.
      3. Pass metadata through participant_metadata and dispatch metadata.

    Do NOT use room_config here.
    Your installed CreateSIPParticipantRequest does not support room_config.
    """

    clean_phone = clean_number(phone_number)
    timestamp_val = int(time.time())
    room_name = f"outbound_{clean_phone}_{timestamp_val}"

    # Generic SaaS attributes
    contact_name = "Valued Customer"
    call_goal = "Demonstrate AI voice capability and answer user inquiries"
    campaign_id = "manual_test_campaign"
    campaign_name = "Manual Outbound Test"
    ticket_id = f"MANUAL-{timestamp_val}"

    config_block = {
        "script": "Introduce the platform and answer any questions from the caller.",
        "call_goal": call_goal,
        "voice_provider": "cartesia",
        "stt_provider": "deepgram",
        "tts_provider": "cartesia",
        "llm_provider": "openai"
    }

    if opening_message:
        config_block["opening_message"] = opening_message
        config_block["openingMessage"] = opening_message
        config_block["outboundGreetingText"] = opening_message
        config_block["initialGreeting"] = opening_message

    metadata_obj = {
        "type": "manual_outbound",
        "direction": "outbound",
        "call_direction": "outbound",
        "agent_id": DEFAULT_AGENT_ID,
        "agent_name": AGENT_NAME,
        "phone": clean_phone,
        "to_number": clean_phone,
        "contact_name": contact_name,
        "lead_name": contact_name,
        "campaign_id": campaign_id,
        "campaign_name": campaign_name,
        "room_name": room_name,
        "external_record_id": ticket_id,
        
        # Legacy Backward Compatibility Aliases
        "citizen_name": contact_name,
        "issue_type": call_goal,
        "ticket_id": ticket_id,
        
        "config": config_block
    }

    metadata = json.dumps(metadata_obj, ensure_ascii=False)

    print("=" * 70)
    print("Generic AI Dialer Manual Outbound Call Test")
    print("=" * 70)
    print(f"Target phone      : {phone_number}")
    print(f"Clean phone       : {clean_phone}")
    print(f"SIP trunk ID      : {trunk_id}")
    print(f"Room name         : {room_name}")
    print(f"Agent dispatch    : {AGENT_NAME}")
    if opening_message:
        print(f"Opening message   : {opening_message}")
    print("=" * 70)

    async with api.LiveKitAPI(
        os.getenv("LIVEKIT_URL"),
        os.getenv("LIVEKIT_API_KEY"),
        os.getenv("LIVEKIT_API_SECRET"),
    ) as lkapi:
        try:
            print("Step 1: Creating outbound SIP participant...")

            sip_response = await lkapi.sip.create_sip_participant(
                api.CreateSIPParticipantRequest(
                    sip_trunk_id=trunk_id,
                    sip_call_to=clean_phone,
                    room_name=room_name,
                    participant_identity=f"sip_{clean_phone}_{timestamp_val}",
                    participant_name=contact_name,
                    participant_metadata=metadata,
                )
            )

            sip_call_id = getattr(sip_response, "sip_call_id", "")
            print("✅ SIP participant created.")
            if sip_call_id:
                print(f"SIP call ID       : {sip_call_id}")

            print("Step 2: Dispatching AI agent into the same room...")

            dispatch = await lkapi.agent_dispatch.create_dispatch(
                api.CreateAgentDispatchRequest(
                    agent_name=AGENT_NAME,
                    room=room_name,
                    metadata=metadata,
                )
            )

            dispatch_id = getattr(dispatch, "id", "") or getattr(dispatch, "dispatch_id", "")
            print("✅ Agent dispatch explicitly created.")
            if dispatch_id:
                print(f"Dispatch ID       : {dispatch_id}")

            print("=" * 70)
            print("✅ Outbound call launched successfully.")
            print(f"Room              : {room_name}")
            print(f"SIP participant   : sip_{clean_phone}_{timestamp_val}")
            print(f"AI agent          : {AGENT_NAME}")
            print("=" * 70)
            print("Watch logs:")
            print("  pm2 logs sarah-outbound --lines 150")
            print("  docker logs --since 2m livekit-sip")
            print("  asterisk -rvvvvv")
            print("=" * 70)

        except Exception as e:
            print("❌ Failed to initiate outbound call.")
            print(f"Error: {e}")
            raise


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python outbound_agent.py <phone_number> [trunk_id] [opening_message]")
        print()
        print("Example:")
        print("  python outbound_agent.py 923044749779 ST_ajkRrwumeHk5 \"Hi, this is a quick test call from our AI voice agent. Can you hear me clearly?\"")
        sys.exit(1)

    target_number = sys.argv[1].strip()
    target_trunk = sys.argv[2].strip() if len(sys.argv) > 2 else DEFAULT_TRUNK_ID
    opening_msg = sys.argv[3].strip() if len(sys.argv) > 3 else None

    required = ["LIVEKIT_URL", "LIVEKIT_API_KEY", "LIVEKIT_API_SECRET"]
    missing = [key for key in required if not os.getenv(key)]

    if missing:
        print(f"❌ Missing environment variables: {', '.join(missing)}")
        sys.exit(1)

    asyncio.run(make_outbound_call(target_number, target_trunk, opening_msg))
