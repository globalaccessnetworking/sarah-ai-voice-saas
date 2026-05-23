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


async def make_outbound_call(phone_number: str, trunk_id: str):
    """
    Manual Sarah outbound PSTN test.

    Correct flow for your current SDK:
      1. Create outbound SIP participant.
      2. Dispatch outbound-agent into the same room using AgentDispatch API.
      3. Pass metadata through participant_metadata and dispatch metadata.

    Do NOT use room_config here.
    Your installed CreateSIPParticipantRequest does not support room_config.
    """

    clean_phone = clean_number(phone_number)
    room_name = f"outbound_{clean_phone}"

    metadata_obj = {
        "type": "manual_outbound",
        "direction": "outbound",
        "agent_id": DEFAULT_AGENT_ID,
        "agent_name": AGENT_NAME,
        "phone": clean_phone,
        "to_number": clean_phone,
        "citizen_name": "Respected Citizen",
        "issue_type": "Manual outbound test",
        "ticket_id": f"MANUAL-{int(time.time())}",
        "config": {
            "outboundGreetingText": (
                "السلام علیکم، میں پنجاب ہیلپ لائن سے سارہ بول رہی ہوں۔ "
                "کیا آپ میری آواز سن سکتے ہیں؟"
            )
        }
    }

    metadata = json.dumps(metadata_obj, ensure_ascii=False)

    print("=" * 70)
    print("Sarah Manual Outbound Call Test")
    print("=" * 70)
    print(f"Target phone      : {phone_number}")
    print(f"Clean phone       : {clean_phone}")
    print(f"SIP trunk ID      : {trunk_id}")
    print(f"Room name         : {room_name}")
    print(f"Agent dispatch    : {AGENT_NAME}")
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
                    participant_identity=f"sip_{clean_phone}",
                    participant_name=f"Phone {clean_phone}",
                    participant_metadata=metadata,
                )
            )

            sip_call_id = getattr(sip_response, "sip_call_id", "")
            print("✅ SIP participant created.")
            if sip_call_id:
                print(f"SIP call ID       : {sip_call_id}")

            print("Step 2: Dispatching outbound-agent into the same room...")

            dispatch = await lkapi.agent_dispatch.create_dispatch(
                api.CreateAgentDispatchRequest(
                    agent_name=AGENT_NAME,
                    room=room_name,
                    metadata=metadata,
                )
            )

            dispatch_id = getattr(dispatch, "id", "") or getattr(dispatch, "dispatch_id", "")
            print("✅ Agent dispatch created.")
            if dispatch_id:
                print(f"Dispatch ID       : {dispatch_id}")

            print("=" * 70)
            print("✅ Outbound call launched successfully.")
            print(f"Room              : {room_name}")
            print(f"SIP participant   : sip_{clean_phone}")
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
        print("  python outbound_agent.py <phone_number> [trunk_id]")
        print()
        print("Example:")
        print("  python outbound_agent.py 923044749779 ST_ajkRrwumeHk5")
        sys.exit(1)

    target_number = sys.argv[1].strip()
    target_trunk = sys.argv[2].strip() if len(sys.argv) > 2 else DEFAULT_TRUNK_ID

    required = ["LIVEKIT_URL", "LIVEKIT_API_KEY", "LIVEKIT_API_SECRET"]
    missing = [key for key in required if not os.getenv(key)]

    if missing:
        print(f"❌ Missing environment variables: {', '.join(missing)}")
        sys.exit(1)

    asyncio.run(make_outbound_call(target_number, target_trunk))
