import asyncio
from livekit import api

async def main():
    livekit_api = api.LiveKitAPI()
    
    print("🚀 Triggering Outbound Call via SIP Trunk...")
    try:
        await livekit_api.sip.create_sip_participant(
            api.CreateSIPParticipantRequest(
                sip_trunk_id="ST_FTTeNXj6CwSU",
                # Just the phone number, LiveKit handles the routing via the Trunk ID
                sip_call_to="+923044749779",
                room_name="call-outbound",
                participant_identity="telephony-agent"
            )
        )
        print("✅ Success! LiveKit is now dialing your Asterisk server.")
    except Exception as e:
        print(f"❌ API Error: {e}")
    finally:
        await livekit_api.aclose()

if __name__ == "__main__":
    asyncio.run(main())
