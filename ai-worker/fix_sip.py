import asyncio
import os
import warnings
from livekit import api

# Suppress deprecation warnings so the output is clean
warnings.filterwarnings("ignore", category=DeprecationWarning)

async def setup():
    os.environ["LIVEKIT_URL"] = "http://127.0.0.1:7880"
    os.environ["LIVEKIT_API_KEY"] = "gl0bal_acc3ss_key"
    os.environ["LIVEKIT_API_SECRET"] = "gL8#zP2!vN9Q&kR5*xT0^mB7@jA4(sE1"
    
    lkapi = api.LiveKitAPI()
    
    # Clean old rules and trunks
    try:
        trunks = await lkapi.sip.list_sip_inbound_trunk(api.ListSIPInboundTrunkRequest())
        for t in trunks.items:
            await lkapi.sip.delete_sip_inbound_trunk(api.DeleteSIPInboundTrunkRequest(sip_trunk_id=t.sip_trunk_id))
            
        rules = await lkapi.sip.list_sip_dispatch_rule(api.ListSIPDispatchRuleRequest())
        for r in rules.items:
            await lkapi.sip.delete_sip_dispatch_rule(api.DeleteSIPDispatchRuleRequest(sip_dispatch_rule_id=r.sip_dispatch_rule_id))
    except Exception:
        pass

    # Create trunk WITH Headers mapped to attributes!
    trunk_info = api.SIPInboundTrunkInfo(
        name="vicidial-trunk",
        numbers=[".*"],
        headers_to_attributes={"X-Slug": "slug"}
    )
    new_trunk = await lkapi.sip.create_sip_inbound_trunk(api.CreateSIPInboundTrunkRequest(trunk=trunk_info))
    
    # Create dispatch WITH the room_config doorbell!
    r_req = api.CreateSIPDispatchRuleRequest(
        name="asterisk-dispatch",
        trunk_ids=[new_trunk.sip_trunk_id],
        rule=api.SIPDispatchRule(
            dispatch_rule_individual=api.SIPDispatchRuleIndividual(room_prefix="outbound_")
        ),
        room_config=api.RoomConfiguration(
            agents=[api.RoomAgentDispatch(agent_name="outbound-agent")]
        )
    )
    await lkapi.sip.create_sip_dispatch_rule(r_req)
    
    print(f"TRUNK_ID={new_trunk.sip_trunk_id}")
    await lkapi.aclose()

asyncio.run(setup())
