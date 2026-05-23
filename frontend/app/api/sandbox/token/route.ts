import { AccessToken } from "livekit-server-sdk";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const agentId = searchParams.get("agentId") || "audit-demo";

        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;
        
        if (!apiKey || !apiSecret) {
            console.error("LiveKit API credentials missing");
            return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
        }

        const participantName = `Admin-Test-${Math.floor(Math.random() * 1000)}`;
        // Use a unique room name per session to avoid interference from old jobs/participants
        const roomName = `simulation-sandbox-${Math.random().toString(36).substring(7)}`; 

        const at = new AccessToken(apiKey, apiSecret, {
            identity: participantName,
            metadata: JSON.stringify({ agentId }) 
        });

        at.addGrant({
            roomJoin: true,
            room: roomName,
            canPublish: true,
            canSubscribe: true,
            canUpdateOwnMetadata: true,
        });

        return NextResponse.json({ token: await at.toJwt() });
    } catch (error) {
        console.error("Failed to generate LiveKit token:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
