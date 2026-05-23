export const dynamic = 'force-dynamic';
import { unstable_noStore as noStore } from 'next/cache'; // 🔥 FIX 1: Import Cache Killer
import { NextResponse } from 'next/server';
import { RoomServiceClient } from 'livekit-server-sdk';
import { db } from '@/db';
import { callLogs } from '@/db/schema';
import { eq, isNull, desc } from 'drizzle-orm';

// ULTIMATE BIGINT FIX: Global override for JSON serialization
(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

const LIVEKIT_URL = process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL;
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

let _roomService: RoomServiceClient | null = null;
const getRoomService = () => {
    if (!_roomService) {
        if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
            throw new Error('MISSING_LIVEKIT_CONFIG: LIVEKIT_API_KEY, LIVEKIT_API_SECRET, or LIVEKIT_URL is not defined.');
        }
        _roomService = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
    }
    return _roomService;
};

// 10-Digit Cleaning Helper for Robust Matching (Handles SIP and double prefixes)
const getCleanPhone = (phone: string) => {
    if (!phone) return '';
    // Strip non-numeric and take last 10 digits (Standard for PK mobile/local)
    const numeric = phone.replace(/\D/g, '');
    return numeric.length >= 10 ? numeric.slice(-10) : numeric;
};

// UI Standardizer: Converts any numeric string to +92 format
const standardizePhone = (phone: string) => {
    if (!phone || phone === 'N/A') return 'Unknown';
    const core = getCleanPhone(phone);
    if (!core) return phone;
    return `+92${core}`;
};

export async function GET() {
    noStore(); // 🔥 FIX 1: Execute Cache Killer
    try {
        const roomService = getRoomService();
        console.log('[Executive API] Fetching LiveKit rooms...');
        const lkRooms = await roomService.listRooms();
        console.log(`[Executive API] Found ${lkRooms.length} rooms in LiveKit.`);
        
        console.log('[Executive API] Querying DB for recent calls...');
        // Order by DESC and limit to ensure we find the newest calls first
        const recentCalls = await db.select({
            id: callLogs.id,
            roomName: callLogs.roomName,
            fromNumber: callLogs.fromNumber,
            metadata: callLogs.metadata,
            endedAt: callLogs.endedAt,
            startedAt: callLogs.startedAt,
        })
        .from(callLogs)
        .orderBy(desc(callLogs.startedAt)) // Chronological sort is critical for finding active metadata
        .limit(100);

        console.log(`[Executive API] DB Candidate Calls: ${recentCalls.length}`);

        const mergedRooms = new Map<string, any>();

        for (const lkRoom of lkRooms) {
            const phoneMatch = lkRoom.name.match(/\d{9,15}/);
            const rawPhone = phoneMatch ? phoneMatch[0] : 'N/A';
            const room10Digit = getCleanPhone(rawPhone);
            const pairingKey = room10Digit || lkRoom.name;

            // 1. Initial Match from Batch
            let dbCall = recentCalls.find(c => {
                const dbPhone10Digit = getCleanPhone(c.fromNumber || '');
                return c.roomName === lkRoom.name ||
                    (room10Digit !== '' && dbPhone10Digit !== '' && dbPhone10Digit === room10Digit);
            });

            // 2. HARD FALLBACK: Explicit Query (CRITICAL FOR CALLER ID)
            if (!dbCall && room10Digit) {
                console.log(`[Executive API] Deep searching DB for ${room10Digit}...`);
                const results = await db.select()
                    .from(callLogs)
                    .where(eq(callLogs.fromNumber, rawPhone)) // Direct match
                    .orderBy(desc(callLogs.startedAt))
                    .limit(1);
                
                if (results.length > 0) {
                    dbCall = results[0];
                    console.log(`[Executive API] Found late-bound caller: ${(dbCall.metadata as any)?.callerName}`);
                }
            }

            // 🔥 SAFELY CALCULATED 15-SECOND GHOST KILLER 🔥
            // Normalizes LiveKit time (BigInt) to seconds to prevent math explosions
            const creationTimeNum = Number(lkRoom.creationTime);
            const creationSecs = creationTimeNum > 10000000000 ? creationTimeNum / 1000 : creationTimeNum;
            const ageSeconds = (Date.now() / 1000) - creationSecs;
            const isAgentOnly = lkRoom.numParticipants <= 1;

            if (dbCall?.endedAt || (isAgentOnly && ageSeconds > 15)) {
                console.log(`[Executive API] 👻 GHOST ROOM KILLED: ${lkRoom.name} | Age: ${ageSeconds.toFixed(1)}s, Participants: ${lkRoom.numParticipants}`);
                continue; 
            }

            const metadata = (dbCall?.metadata as any) || {};
            const callerName = metadata.caller_name || metadata.callerName || metadata.name || 'Unknown Caller';
            const callerPhone = standardizePhone(dbCall?.fromNumber || rawPhone);

            const roomData = {
                id: lkRoom.name,
                roomName: lkRoom.name,
                participantCount: lkRoom.numParticipants,
                callerName,
                callerPhone,
                startedAt: lkRoom.creationTime,
                isLive: true,
                metadata: metadata
            };

            const existing = mergedRooms.get(pairingKey);
            const isBetter = !existing || 
                lkRoom.numParticipants > existing.participantCount ||
                (lkRoom.numParticipants === existing.participantCount && lkRoom.creationTime > existing.startedAt);

            if (isBetter) {
                mergedRooms.set(pairingKey, roomData);
            }
        }

        const rooms = Array.from(mergedRooms.values());
        console.log(`[Executive API] Returning ${rooms.length} merged rooms (Original: ${lkRooms.length}).`);
        return NextResponse.json(rooms);
    } catch (error: any) {
        console.error('CRITICAL: Executive active-rooms API failed:', error);
        return NextResponse.json({ 
            error: 'Backend Error', 
            details: error.message 
        }, { status: 500 });
    }
}