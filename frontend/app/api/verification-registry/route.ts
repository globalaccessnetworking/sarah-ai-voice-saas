import { NextResponse } from 'next/server';
import { db } from "@/db";
import { callLogs, complaints } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const failedOnly = searchParams.get('failedOnly') === 'true';

        // Query the verification records
        // Note: Sarah's outbound engine tagged these as 'outbound' in call_logs
        let query = db.select({
            id: callLogs.id,
            startedAt: callLogs.startedAt,
            duration: callLogs.durationSeconds,
            metadata: callLogs.metadata,
            fromNumber: callLogs.fromNumber,
            toNumber: callLogs.toNumber,
            status: callLogs.status,
        })
        .from(callLogs)
        .where(eq(callLogs.direction, "outbound"))
        .orderBy(desc(callLogs.startedAt));

        const logs = await query;

        // Map and enrich with Outcome logic
        const registry = logs.map(log => {
            const meta = (log.metadata as any) || {};
            const outcome = meta.outcome || meta.feedback || 'no_feedback';
            
            return {
                id: log.id,
                timestamp: log.startedAt,
                ticketId: meta.ticket_id || 'N/A',
                phone: log.toNumber || log.fromNumber,
                duration: log.duration || 0,
                status: log.status,
                outcome: outcome, // 'verified' | 'still_issue' | 'no_feedback'
            };
        });

        // Apply failed filter if requested via UI
        const filteredRegistry = failedOnly 
            ? registry.filter(r => r.outcome === 'still_issue')
            : registry;

        return NextResponse.json({ logs: filteredRegistry });
    } catch (error) {
        console.error("Verification Registry API Error:", error);
        return NextResponse.json({ error: "Failed to fetch verification logs" }, { status: 500 });
    }
}
