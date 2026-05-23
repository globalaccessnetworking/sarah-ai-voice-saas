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
        const body = await request.json();
        const { identity } = body;

        if (!identity) {
            return NextResponse.json({ error: 'Participant identity is required' }, { status: 400 });
        }

        await roomService.removeParticipant(name, identity);
        return NextResponse.json({ success: true, message: `Participant ${identity} kicked from room ${name}` });
    } catch (error: any) {
        console.error(`Error kicking participant from room ${roomName}:`, error);
        return NextResponse.json({ error: 'Failed to kick participant', details: error.message }, { status: 500 });
    }
}
