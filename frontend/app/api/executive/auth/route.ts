import { NextRequest, NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

// GET handler to verify endpoint visibility
export async function GET() {
    noStore();
    return NextResponse.json({ status: 'Executive Auth Endpoint Active' });
}

export async function POST(req: NextRequest) {
    noStore(); // Prevent response caching for security checks
    try {
        const body = await req.json();
        const { password } = body;
        const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD;

        console.log('[Auth API] Received request. Password exists:', !!password);
        console.log('[Auth API] Secret config detected:', !!DASHBOARD_PASSWORD);

        if (!DASHBOARD_PASSWORD) {
            console.error('[Auth API] CRITICAL ERROR: DASHBOARD_PASSWORD is not set in environment variables.');
            return NextResponse.json({ success: false, error: 'Server Misconfiguration' }, { status: 500 });
        }

        if (password === DASHBOARD_PASSWORD) {
            console.log('[Auth API] Password verified successfully.');
            return NextResponse.json({ success: true });
        }

        console.warn('[Auth API] Unauthorized access attempt with invalid password.');
        return NextResponse.json(
            { success: false, error: 'Invalid password' },
            { status: 401 }
        );
    } catch (error) {
        console.error('[Auth API] Failed to parse auth request:', error);
        return NextResponse.json(
            { success: false, error: 'Malformed Request' },
            { status: 400 }
        );
    }
}
