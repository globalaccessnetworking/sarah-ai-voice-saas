import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'devkey';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'secret';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ name: string }> }
) {
    try {
        const { name } = await params;
        const identity = `admin-monitor-${Math.floor(Math.random() * 10000)}`;

        const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
            identity,
            name: 'Admin Monitor',
        });

        at.addGrant({
            roomJoin: true,
            room: name,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
            hidden: true, // Hide from participants list to remain invisible monitor
        });

        return NextResponse.json({ token: await at.toJwt() });
    } catch (error) {
        console.error('Error creating admin token:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
