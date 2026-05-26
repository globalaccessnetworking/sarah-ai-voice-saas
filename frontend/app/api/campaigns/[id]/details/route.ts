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

        // 3. Fetch Call Logs defensively and order by created_at DESC to guarantee newest first
        const rawLogs = await db.execute(sql`
            SELECT id, room_name, status, duration_seconds, transcript, summary, recording_url, metadata, created_at
            FROM call_logs
            WHERE metadata->>'campaign_id' = ${campaignId}
            ORDER BY created_at DESC
        `);
        
        const logs = Array.isArray(rawLogs) ? rawLogs : (rawLogs as any).rows || [];
        
        // 4. Map Call Logs to Leads using prioritized matching logic
        const mappedLeads = leads.map(lead => {
            const leadLogs = logs.filter((log: any) => {
                const meta = log.metadata || {};
                const roomName = log.room_name || '';
                const phone = lead.phone || '';
                
                // Priority 1: metadata.lead_id = lead.id
                if (meta.lead_id === lead.id) return true;
                
                // Priority 2: metadata.external_record_id = lead.id
                if (meta.external_record_id === lead.id) return true;
                
                // Priority 3: metadata.campaign_id = campaign.id AND room_name includes phone
                if (meta.campaign_id === campaignId && phone && roomName.includes(phone)) return true;
                
                // Priority 4: room_name includes lead.id
                if (roomName.includes(lead.id)) return true;
                
                // Priority 5: room_name includes phone
                if (phone && roomName.includes(phone)) return true;
                
                return false;
            });
            
            // Due to query sorting by created_at DESC, first element is the latest call log
            const latestLog = leadLogs.length > 0 ? leadLogs[0] : null;

            return {
                ...lead,
                callLog: latestLog ? {
                    id: latestLog.id,
                    status: latestLog.status,
                    durationSeconds: latestLog.duration_seconds,
                    transcript: latestLog.transcript,
                    summary: latestLog.summary,
                    recordingUrl: latestLog.recording_url
                } : null
            };
        });

        // 5. Outcome Breakdown Helper (Priority: disposition -> failureReason -> status)
        const getOutcome = (lead: any): string => {
            const raw = lead.disposition || lead.failureReason || lead.status || '';
            return String(raw).toLowerCase().trim().replace(/_/g, ' ');
        };

        // Aggregates initialization
        let pending = 0;
        let processing = 0;
        let retry_scheduled = 0;
        let completed = 0;
        
        let no_answer = 0;
        let busy = 0;
        let rejected = 0;
        let no_conversation = 0;
        let disconnected_before_greeting = 0;
        let invalid_number = 0;
        let other_failures = 0;

        mappedLeads.forEach(lead => {
            const status = lead.status || 'pending';
            
            if (status === 'pending') {
                pending++;
                return;
            }
            if (status === 'processing') {
                processing++;
                return;
            }
            if (status === 'retry_scheduled') {
                retry_scheduled++;
                return;
            }

            const outcome = getOutcome(lead);

            // Match against prioritized outcomes
            if (outcome.includes("no answer") || outcome === "no answer") {
                no_answer++;
            } else if (outcome.includes("busy")) {
                busy++;
            } else if (outcome.includes("rejected") || outcome.includes("decline") || outcome.includes("dnc") || outcome.includes("do not call")) {
                rejected++;
            } else if (outcome.includes("no conversation") || outcome === "no conversation") {
                no_conversation++;
            } else if (outcome.includes("disconnected before greeting") || outcome === "disconnected before greeting") {
                disconnected_before_greeting++;
            } else if (outcome.includes("invalid number") || outcome.includes("invalid_number") || outcome.includes("invalid")) {
                invalid_number++;
            } else if (outcome.includes("completed") || outcome === "completed" || outcome.includes("success")) {
                completed++;
            } else {
                other_failures++;
            }
        });

        // Failed represents the aggregate of all terminal failures
        const failed = no_answer + busy + rejected + no_conversation + disconnected_before_greeting + invalid_number + other_failures;
        const total = leads.length;

        // 6. Campaign Performance Metrics Math
        // Completion Rate: (completed + failed terminal leads) / total
        const completion_rate = total === 0 ? 0 : Math.round(((completed + failed) / total) * 100);

        // Connect Rate: answered/conversation leads / attempted leads
        const attemptedLeads = mappedLeads.filter(l => (l.attemptCount || 0) > 0);
        
        const answeredLeads = mappedLeads.filter(l => {
            if ((l.attemptCount || 0) <= 0) return false;
            const duration = l.callLog?.durationSeconds || l.lastCallDurationSeconds || 0;
            return duration > 0;
        });

        const connect_rate = attemptedLeads.length === 0 ? 0 : Math.round((answeredLeads.length / attemptedLeads.length) * 100);

        // Average Attempts: sum(attempt_count) / total leads
        const totalAttempts = leads.reduce((sum, l) => sum + (l.attemptCount || 0), 0);
        const average_attempts = total === 0 ? 0 : Math.round((totalAttempts / total) * 10) / 10;

        // Average Duration: average of only leads/calls with duration > 0
        const totalDuration = answeredLeads.reduce((sum, l) => sum + (l.callLog?.durationSeconds || l.lastCallDurationSeconds || 0), 0);
        const average_duration = answeredLeads.length === 0 ? 0 : Math.round(totalDuration / answeredLeads.length);

        const stats = {
            total,
            pending,
            processing,
            retry_scheduled,
            completed,
            failed,
            progress: completion_rate, // Completion rate is progress
            no_answer,
            busy,
            rejected,
            no_conversation,
            disconnected_before_greeting,
            invalid_number,
            other_failures,
            average_attempts,
            average_duration,
            connect_rate,
            completion_rate
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
