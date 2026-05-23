import { NextRequest, NextResponse } from 'next/server';
import { RoomServiceClient } from 'livekit-server-sdk';

const LIVEKIT_URL = process.env.LIVEKIT_URL || 'http://localhost:7880';
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'devkey';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'secret';

const roomService = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ name: string }> }
) {
    try {
        const { name } = await params;
        const participants = await roomService.listParticipants(name);
        return NextResponse.json({
            roomName: name,
            participants: participants
        });
    } catch (error: any) {
        if (error.status === 404) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }
        console.error('Error fetching Room participants:', error);
        return NextResponse.json({ error: 'Failed to fetch participants', details: error.message }, { status: 500 });
    }
}
