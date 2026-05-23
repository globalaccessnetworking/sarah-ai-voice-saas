import { NextResponse } from "next/server";
import { RoomServiceClient } from "livekit-server-sdk";

export async function POST(req: Request) {
    try {
        // 1. Read the payload sent by the AI Worker
        const body = await req.json();
        console.log("Hangup tool triggered! Payload:", body);

        // The worker usually passes the room name in the background
        const roomName = body.room_name || body.room || body.roomId;

        if (!roomName) {
            console.error("No room name provided to hangup tool.");
            // We still return success so the AI thinks it worked and stops talking
            return NextResponse.json({ result: "End of call initiated, but no room ID found." });
        }

        // 2. Connect to LiveKit Server
        const roomService = new RoomServiceClient(
            process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL || "ws://localhost:7880",
            process.env.LIVEKIT_API_KEY || "",
            process.env.LIVEKIT_API_SECRET || ""
        );

        // 3. Kill the room (This instantly drops the SIP call)
        await roomService.deleteRoom(roomName);

        // 4. Reply to the AI
        return NextResponse.json({ 
            result: "Call has been successfully disconnected." 
        });

    } catch (error) {
        console.error("Error in hangup webhook:", error);
        return NextResponse.json({ error: "Failed to execute hangup" }, { status: 500 });
    }
}
