import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { room, identity, name, metadata, permissions } = await req.json();

        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;

        if (!apiKey || !apiSecret) {
            return NextResponse.json(
                { error: "LiveKit API keys not configured" },
                { status: 500 }
            );
        }

        if (!room || !identity) {
            return NextResponse.json(
                { error: "Room and identity are required" },
                { status: 400 }
            );
        }

        // Create Access Token
        const at = new AccessToken(apiKey, apiSecret, {
            identity,
            name: name || identity,
            metadata: typeof metadata === 'object' ? JSON.stringify(metadata) : metadata,
        });

        // Grant permissions
        at.addGrant({
            roomJoin: true,
            room,
            canPublish: permissions?.canPublish ?? true,
            canSubscribe: permissions?.canSubscribe ?? true,
            canPublishData: permissions?.canPublishData ?? true,
            ingressAdmin: permissions?.ingressAdmin ?? false,
        });

        return NextResponse.json({
            token: await at.toJwt(),
        });
    } catch (error) {
        console.error("Sandbox token generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate sandbox token" },
            { status: 500 }
        );
    }
}
