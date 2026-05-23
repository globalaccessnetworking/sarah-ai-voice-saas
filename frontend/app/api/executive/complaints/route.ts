import { NextResponse } from 'next/server';
import { db } from '@/db';
import { complaints } from '@/db/schema';
import { desc } from 'drizzle-orm';

// ULTIMATE BIGINT FIX: Global override for JSON serialization
(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

export async function GET() {
    try {
        const latestComplaints = await db.select({
            id: complaints.id,
            ticket_id: complaints.ticket_id,
            issue: complaints.issue,
            district: complaints.district,
            status: complaints.status,
            priority: complaints.priority,
            createdAt: complaints.createdAt,
        })
        .from(complaints)
        .orderBy(desc(complaints.createdAt))
        .limit(50);

        return NextResponse.json(latestComplaints);
    } catch (error: any) {
        console.error('CRITICAL: Executive complaints API failed:', error);
        return NextResponse.json({ error: 'Backend Error', details: error.message }, { status: 500 });
    }
}
