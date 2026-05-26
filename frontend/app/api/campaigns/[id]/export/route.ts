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

        // 4. Map logs to leads using correct priority order & extract unique leadData keys
        const leadDataKeys = new Set<string>();
        
        const mappedLeads = leads.map(lead => {
            const isCompleted = lead.status === 'completed' || lead.disposition === 'success';
            
            // Match log based on prioritized stable keys & robust fallbacks
            const leadLogs = logs.filter((log: any) => {
                const meta = log.metadata || {};
                const roomName = String(log.room_name || '');
                const phone = String(lead.phone || '');
                const fromNum = String(log.from_number || '');
                const toNum = String(log.to_number || '');
                
                // Normalization helper for clean phone comparisons (strips +, 92, 0)
                const clean = (num: string) => {
                    let n = num.replace(/[^0-9]/g, '');
                    while (n.startsWith("92") || n.startsWith("0")) {
                        if (n.startsWith("92")) n = n.slice(2);
                        else if (n.startsWith("0")) n = n.slice(1);
                    }
                    return n;
                };

                const cleanLeadPhone = clean(phone);

                // Priority 1: metadata.lead_id = lead.id
                if (meta.lead_id === lead.id) return true;
                
                // Priority 2: metadata.external_record_id = lead.id
                if (meta.external_record_id === lead.id) return true;
                
                // Priority 3: metadata.campaign_id = campaign.id AND room_name includes phone
                if (meta.campaign_id === campaignId && cleanLeadPhone && clean(roomName).includes(cleanLeadPhone)) return true;
                
                // Priority 4: room_name includes lead.id
                if (roomName.includes(lead.id)) return true;
                
                // Priority 5: room_name includes phone
                if (cleanLeadPhone && clean(roomName).includes(cleanLeadPhone)) return true;

                // Priority 6 (Fallback): log.to_number or log.from_number matches phone
                if (cleanLeadPhone && (clean(toNum).includes(cleanLeadPhone) || clean(fromNum).includes(cleanLeadPhone))) {
                    return true;
                }
                
                return false;
            });
            
            // Due to query sorting by created_at DESC, first element is the latest call log
            const latestLog = leadLogs.length > 0 ? leadLogs[0] : null;

            // Collect lead data keys dynamically
            const ld = lead.leadData;
            if (ld && typeof ld === 'object') {
                Object.keys(ld).forEach(k => leadDataKeys.add(k));
            }

            return {
                ...lead,
                failureReason: isCompleted ? null : lead.failureReason,
                nextRetryAt: isCompleted ? null : lead.nextRetryAt,
                callLogId: latestLog?.id || '',
                summary: latestLog?.summary || '',
                duration: latestLog?.duration_seconds || lead.lastCallDurationSeconds || 0
            };
        });

        // 5. Sort dynamic keys alphabetically so the column order is perfectly consistent
        const dynamicKeys = Array.from(leadDataKeys).sort();

        // 6. CSV Header Columns
        const headers = [
            "Campaign ID",
            "Lead ID",
            "Call Log ID",
            "Phone",
            "Name",
            "Company",
            "Status",
            "Disposition",
            "Failure Reason",
            "Attempts",
            "Last Attempt At",
            "Next Retry At",
            "Called At",
            "Duration (Seconds)",
            "Transcript Summary",
            ...dynamicKeys.map(k => `LeadData_${k}`)
        ];

        // Safe CSV formatting & Formula Injection Protection
        const escapeCSV = (val: any) => {
            if (val === null || val === undefined) return '""';
            let str = String(val);
            
            // Clean/Protect against Excel Formula Injection (=, +, -, @)
            if (str.startsWith("=") || str.startsWith("+") || str.startsWith("-") || str.startsWith("@")) {
                str = `'${str}`;
            }
            
            // Escape double quotes
            str = str.replace(/"/g, '""');
            return `"${str}"`;
        };

        const csvLines = [headers.join(",")];

        // 7. Populate CSV Rows
        mappedLeads.forEach(lead => {
            const row = [
                escapeCSV(lead.campaignId),
                escapeCSV(lead.id),
                escapeCSV(lead.callLogId),
                escapeCSV(lead.phone),
                escapeCSV(lead.name),
                escapeCSV(lead.companyName),
                escapeCSV(lead.status),
                escapeCSV(lead.disposition),
                escapeCSV(lead.failureReason),
                escapeCSV(lead.attemptCount),
                escapeCSV(lead.lastAttemptAt ? new Date(lead.lastAttemptAt).toISOString() : ''),
                escapeCSV(lead.nextRetryAt ? new Date(lead.nextRetryAt).toISOString() : ''),
                escapeCSV(lead.calledAt ? new Date(lead.calledAt).toISOString() : ''),
                escapeCSV(lead.duration),
                escapeCSV(lead.summary),
                ...dynamicKeys.map(k => {
                    const ld = lead.leadData as Record<string, any>;
                    return escapeCSV(ld ? ld[k] : '');
                })
            ];
            csvLines.push(row.join(","));
        });

        const csvContent = csvLines.join("\n");
        const filename = `campaign_${campaignRecord.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_results.csv`;

        return new Response(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });

    } catch (error) {
        console.error("Error in campaign details CSV export GET:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
