import { NextResponse } from 'next/server';
import { RoomServiceClient } from 'livekit-server-sdk';

const LIVEKIT_URL = process.env.LIVEKIT_URL || 'http://localhost:7880';
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'devkey';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'secret';

const roomService = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const rooms = await roomService.listRooms();
        return NextResponse.json(rooms);
    } catch (error: any) {
        console.error('Error fetching rooms:', error);
        return NextResponse.json({ error: 'Failed to fetch rooms', details: error.message }, { status: 500 });
    }
}
