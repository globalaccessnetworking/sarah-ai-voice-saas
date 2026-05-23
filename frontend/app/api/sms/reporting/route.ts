import { NextResponse } from "next/server";
import { db } from "@/db";
import { smsLogs, complaints } from "@/db/schema";
import { eq, and, gte, lte, sql, count } from "drizzle-orm";

/**
 * Governance Reporting API
 * Aggregates SMS performance metrics per district for historical audits.
 * Supports format=csv for spreadsheet exports.
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const start = searchParams.get("start") || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const end = searchParams.get("end") || new Date().toISOString();
        const format = searchParams.get("format"); // 'csv' or 'json'

        // 1. Fetch Aggregated Stats via Join
        // We join logs with complaints to map them back to districts
        const stats = await db
            .select({
                district: complaints.district,
                total: count(smsLogs.id),
                sent: sql<number>`count(${smsLogs.id}) filter (where ${smsLogs.status} = 'SENT')`,
                failed: sql<number>`count(${smsLogs.id}) filter (where ${smsLogs.status} = 'FAILED')`,
            })
            .from(smsLogs)
            .innerJoin(complaints, eq(smsLogs.ticketId, complaints.ticket_id))
            .where(
                and(
                    gte(smsLogs.createdAt, new Date(start)),
                    lte(smsLogs.createdAt, new Date(end))
                )
            )
            .groupBy(complaints.district);

        // 2. Handle CSV Export
        if (format === "csv") {
            const headers = ["District", "Total Alerts", "Success Rate (%)", "Delivered", "Failed"];
            const rows = stats.map(s => {
                const rate = s.total > 0 ? ((s.sent / s.total) * 100).toFixed(1) : "0.0";
                return [s.district, s.total, `${rate}%`, s.sent, s.failed];
            });

            const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
            
            return new Response(csvContent, {
                headers: {
                    "Content-Type": "text/csv",
                    "Content-Disposition": `attachment; filename=governance_report_${start.split('T')[0]}.csv`
                }
            });
        }

        // 3. Return JSON for Dashboard
        return NextResponse.json({
            success: true,
            period: { start, end },
            data: stats
        });

    } catch (error: any) {
        console.error("Reporting API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
