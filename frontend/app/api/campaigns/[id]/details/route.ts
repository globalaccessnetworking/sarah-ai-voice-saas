import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, desc, sql } from 'drizzle-orm';

const { campaigns, campaignNumbers } = schema;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: campaignId } = await params;
        
        // 1. Fetch Campaign
        const campaignRecord = await db.query.campaigns.findFirst({
            where: eq(campaigns.id, campaignId),
        });

        if (!campaignRecord) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        // 2. Fetch Leads (Campaign Numbers)
        const leads = await db.select().from(campaignNumbers)
            .where(eq(campaignNumbers.campaignId, campaignId))
            .orderBy(desc(campaignNumbers.calledAt));

        // 3. Fetch Call Logs defensively
        // Match metadata->>'campaign_id' = campaignId
        const rawLogs = await db.execute(sql`
            SELECT id, room_name, status, duration_seconds, transcript, summary, metadata
            FROM call_logs
            WHERE metadata->>'campaign_id' = ${campaignId}
        `);
        
        // Defensive mapping depending on DB driver (pg vs postgres.js)
        const logs = Array.isArray(rawLogs) ? rawLogs : (rawLogs as any).rows || [];
        
        // 4. Map Call Logs to Leads
        const mappedLeads = leads.map(lead => {
            // Find all logs that belong to this lead 
            // We check if room_name includes the lead.id
            const leadLogs = logs.filter((log: any) => log.room_name && log.room_name.includes(lead.id));
            
            let latestLog = null;
            if (leadLogs.length > 0) {
                // sort by started_at if we had it, but we can just take the last one or rely on ID order.
                // Assuming append order is fine, or we could sort by id string length / alphabetical or whatever.
                latestLog = leadLogs[leadLogs.length - 1]; 
            }

            return {
                ...lead,
                callLog: latestLog ? {
                    id: latestLog.id,
                    status: latestLog.status,
                    durationSeconds: latestLog.duration_seconds,
                    transcript: latestLog.transcript,
                    summary: latestLog.summary
                } : null
            };
        });

        // 5. Calculate Stats from source of truth (campaign_numbers)
        const total = leads.length;
        const pending = leads.filter(l => l.status === 'pending').length;
        const processing = leads.filter(l => l.status === 'processing').length;
        const retry_scheduled = leads.filter(l => l.status === 'retry_scheduled').length;
        const completed = leads.filter(l => l.status === 'completed').length;
        // User requested: (completed + failed + no_answer + busy + disconnected_before_greeting + no_conversation) / total
        const failedStatuses = ['failed', 'no_answer', 'busy', 'disconnected_before_greeting', 'no_conversation'];
        const failed = leads.filter(l => l.status && failedStatuses.includes(l.status)).length;
        
        const progress = total === 0 ? 0 : Math.round(((completed + failed) / total) * 100);

        const stats = {
            total,
            pending,
            processing,
            retry_scheduled,
            completed,
            failed,
            progress
        };

        return NextResponse.json({
            campaign: campaignRecord,
            stats,
            leads: mappedLeads
        });

    } catch (error) {
        console.error("Error in campaign details GET:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
