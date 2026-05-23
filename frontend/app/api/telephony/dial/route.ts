import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sipTrunks, agents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SipClient, RoomServiceClient } from "livekit-server-sdk";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { phoneNumber, agentId, contactData } = body;

        if (!phoneNumber || !agentId) {
            return NextResponse.json({ error: "Phone number and agent ID are required." }, { status: 400 });
        }

        // 1. Fetch Agent to verify it exists
        const [agent] = await db.select().from(agents).where(eq(agents.id, agentId));
        if (!agent) {
            return NextResponse.json({ error: "Agent not found." }, { status: 404 });
        }

        // 2. Fetch an Outbound SIP Trunk
        // Logic: Try to find a trunk explicitly marked as 'outbound', otherwise take any trunk
        let trunk = (await db.select().from(sipTrunks).where(eq(sipTrunks.type, "outbound")).limit(1))[0];

        if (!trunk) {
            trunk = (await db.select().from(sipTrunks).limit(1))[0];
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

        // 4. Create a unique Room Name for this call
        // Format: call_[agentId]_[uuid]
        const roomName = `call_${agentId}_${Math.random().toString(36).substring(2, 9)}`;

        // 5. Create the Room with metadata for the Python worker
        const roomMetadata = JSON.stringify({
            agentId: agentId,
            contactData: contactData || {},
            direction: "outbound",
            timestamp: new Date().toISOString()
        });

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
                participantIdentity: `sip_${phoneNumber.replace(/\+/g, "")}`,
                participantName: contactData?.Name || phoneNumber,
            }
        );

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
