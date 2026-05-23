import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sipTrunks, agents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SipClient, RoomServiceClient, AgentDispatchClient } from "livekit-server-sdk";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { phoneNumber, agentId, trunkId, openingMessage, callGoal, contactData } = body;

        if (!phoneNumber || !agentId) {
            return NextResponse.json({ error: "Phone number and agent ID are required." }, { status: 400 });
        }

        // 1. Fetch Agent to verify it exists
        const [agent] = await db.select().from(agents).where(eq(agents.id, agentId));
        if (!agent) {
            return NextResponse.json({ error: "Agent not found." }, { status: 404 });
        }

        // 2. Fetch an Outbound SIP Trunk
        let trunk;
        if (trunkId) {
            trunk = (await db.select().from(sipTrunks).where(eq(sipTrunks.id, trunkId)).limit(1))[0];
        } else {
            trunk = (await db.select().from(sipTrunks).where(eq(sipTrunks.type, "outbound")).limit(1))[0];
            if (!trunk) trunk = (await db.select().from(sipTrunks).limit(1))[0];
        }

        if (!trunk) {
            return NextResponse.json({ error: "No SIP trunk configured. Please add a trunk in Settings > SIP Trunks." }, { status: 500 });
        }

        // 3. Initialize LiveKit clients
        const host = process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL;
        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;

        if (!host || !apiKey || !apiSecret) {
            return NextResponse.json({ error: "LiveKit server credentials not configured in environment." }, { status: 500 });
        }

        const sipClient = new SipClient(host, apiKey, apiSecret);
        const roomClient = new RoomServiceClient(host, apiKey, apiSecret);
        const agentDispatchClient = AgentDispatchClient ? new AgentDispatchClient(host, apiKey, apiSecret) : null;

        // 4. Create a unique Room Name for this call
        const cleanPhone = phoneNumber.replace(/\+/g, "").replace(/\s/g, "");
        const externalRecordId = `test_${Math.floor(Date.now() / 1000)}`;
        const roomName = `outbound_${cleanPhone}_${externalRecordId}`;

        // 5. Build full generic metadata payload
        const metadataObj = {
            type: "outbound_manual_test",
            direction: "outbound",
            call_direction: "outbound",
            agent_id: agentId,
            agent_slug: agent.slug,
            agent_name: "outbound-agent",
            phone: cleanPhone,
            to_number: cleanPhone,
            contact_name: contactData?.Name || "Test User",
            lead_name: contactData?.Name || "Test User",
            campaign_id: "manual_test",
            external_record_id: externalRecordId,
            room_name: roomName,
            call_goal: callGoal || "Test outbound AI call",
            opening_message: openingMessage || undefined,
            config: {} // Any additional config overrides
        };

        const roomMetadata = JSON.stringify(metadataObj);

        await roomClient.createRoom({
            name: roomName,
            emptyTimeout: 120, // 2 minutes to allow for dialing/ringing
            maxParticipants: 10,
            metadata: roomMetadata,
        });

        // 6. Trigger SIP Participant (the Outbound Dialer)
        await sipClient.createSipParticipant(
            trunk.id,
            phoneNumber,
            roomName,
            {
                participantIdentity: `sip_${cleanPhone}`,
                participantName: metadataObj.contact_name,
                participantMetadata: roomMetadata
            }
        );

        // 7. Explicit Agent Dispatch
        if (agentDispatchClient) {
            await agentDispatchClient.createDispatch(roomName, "outbound-agent", { metadata: roomMetadata });
        } else {
            console.warn("AgentDispatchClient not available in this SDK version. Waiting for inbound SIP to trigger rule.");
        }

        return NextResponse.json({
            success: true,
            roomName,
            message: `Dialing ${phoneNumber} via ${trunk.name} (Agent: ${agent.name})`
        }, { status: 200 });

    } catch (error: any) {
        console.error("Outbound dialer error:", error);
        return NextResponse.json({
            error: "Failed to initiate outbound call.",
            details: error.message
        }, { status: 500 });
    }
}
