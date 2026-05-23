import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
    try {
        const { agent_id, mode = "voice" } = await req.json();

        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;

        if (!apiKey || !apiSecret) {
            return NextResponse.json(
                { error: "LiveKit API keys not configured" },
                { status: 500 }
            );
        }

        const roomName = `test-room-${uuidv4().slice(0, 8)}`;
        const identity = `tester-${uuidv4().slice(0, 8)}`;

        // Create Access Token
        const at = new AccessToken(apiKey, apiSecret, {
            identity,
            name: "Admin Tester",
            metadata: JSON.stringify({
                agent_slug: "sov-agent-01", // Hardcoded for Sovereign Bridge test
                is_agent_tester: true,
                test_mode: mode
            }),
        });

        // Grant permissions
        at.addGrant({
            roomJoin: true,
            room: roomName,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
        });

        return NextResponse.json({
            token: await at.toJwt(),
            room_name: roomName,
            agent_name: "Sovereign Test Agent"
        });
    } catch (error) {
        console.error("Token generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate token" },
            { status: 500 }
        );
    }
}
