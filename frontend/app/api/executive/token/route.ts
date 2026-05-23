import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

export async function GET(
    request: NextRequest
) {
    try {
        const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
        const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

        if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
            console.error('MISSING_LIVEKIT_CONFIG: Token generation failed due to missing env vars.');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const { searchParams } = new URL(request.url);
        const room = searchParams.get('room');

        if (!room) {
            return NextResponse.json({ error: 'Room name is required' }, { status: 400 });
        }

        const identity = `ceo-monitor-${Math.floor(Math.random() * 10000)}`;

        const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
            identity,
            name: 'Executive Dashboard (Stealth)',
        });

        at.addGrant({
            roomJoin: true,
            room: room,
            canPublish: false,       // Stealth: Cannot transmit audio/video
            canPublishData: false,   // Stealth: Cannot transmit data messages
            canSubscribe: true,      // Receiver only
            hidden: true,            // Invisible to other participants
        });

        return NextResponse.json({ token: await at.toJwt() });
    } catch (error) {
        console.error('Error creating executive token:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
