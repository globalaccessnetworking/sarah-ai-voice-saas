import { NextRequest, NextResponse } from 'next/server';
import { RoomServiceClient } from 'livekit-server-sdk';

const LIVEKIT_URL = process.env.LIVEKIT_URL || 'http://localhost:7880';
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'devkey';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'secret';

const roomService = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

export const dynamic = 'force-dynamic';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ name: string }> }
) {
    let roomName = 'unknown';
    try {
        const { name } = await params;
        roomName = name;
        await roomService.deleteRoom(name);
        return NextResponse.json({ success: true, message: `Room ${name} closed successfully` });
    } catch (error: any) {
        console.error(`Error closing room ${roomName}:`, error);
        return NextResponse.json({ error: 'Failed to close room', details: error.message }, { status: 500 });
    }
}
