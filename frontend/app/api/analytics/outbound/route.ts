import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { sql, eq, and, count, desc } from "drizzle-orm";

export async function GET() {
    try {
        // 1. High-Level Hub Metrics (Outbound Only)
        // Attempts = Total Outbound Logs
        // Answered = Logs with feedback metadata
        // Verified = feedback is 'verified'
        // Still Issue = feedback is 'still_issue'
        
        const [stats] = await db.select({
            totalAttempts: sql<number>`CAST(COUNT(*) FILTER (WHERE ${schema.callLogs.direction} = 'outbound') AS INTEGER)`,
            totalAnswered: sql<number>`CAST(COUNT(*) FILTER (WHERE ${schema.callLogs.direction} = 'outbound' AND ${schema.callLogs.metadata}->>'feedback' IS NOT NULL) AS INTEGER)`,
            verifiedCount: sql<number>`CAST(COUNT(*) FILTER (WHERE ${schema.callLogs.direction} = 'outbound' AND ${schema.callLogs.metadata}->>'feedback' = 'verified') AS INTEGER)`,
            stillIssueCount: sql<number>`CAST(COUNT(*) FILTER (WHERE ${schema.callLogs.direction} = 'outbound' AND ${schema.callLogs.metadata}->>'feedback' = 'still_issue') AS INTEGER)`,
            avgDuration: sql<number>`CAST(AVG(${schema.callLogs.durationSeconds}) FILTER (WHERE ${schema.callLogs.direction} = 'outbound') AS INTEGER)`
        })
        .from(schema.callLogs);

        // 2. HUD Activity Feed (Most recent 20 outbound calls)
        const recentOutbound = await db.select({
            id: schema.callLogs.id,
            metadata: schema.callLogs.metadata,
            toNumber: schema.callLogs.toNumber,
            durationSeconds: schema.callLogs.durationSeconds,
            startedAt: schema.callLogs.startedAt,
            agentName: schema.agents.name
        })
        .from(schema.callLogs)
        .leftJoin(schema.agents, eq(schema.callLogs.agentId, schema.agents.id))
        .where(eq(schema.callLogs.direction, "outbound"))
        .orderBy(desc(schema.callLogs.startedAt))
        .limit(20);

        // 3. Status Breakdown for Charting
        const total = stats?.totalAnswered || 1;
        const verifiedPercent = Math.round(((stats?.verifiedCount || 0) / total) * 100);
        const stillIssuePercent = Math.round(((stats?.stillIssueCount || 0) / total) * 100);
        const abandonedPercent = 100 - verifiedPercent - stillIssuePercent;

        return NextResponse.json({
            stats: {
                attempts: stats?.totalAttempts || 0,
                answered: stats?.totalAnswered || 0,
                verified: stats?.verifiedCount || 0,
                stillIssue: stats?.stillIssueCount || 0,
                avgDuration: stats?.avgDuration || 0,
                successRate: Math.round(((stats?.totalAnswered || 0) / (stats?.totalAttempts || 1)) * 100),
                resolutionRate: Math.round(((stats?.verifiedCount || 0) / total) * 100)
            },
            distribution: [
                { name: "Verified Resolution", value: stats?.verifiedCount || 0, percent: verifiedPercent, color: "#22c55e" },
                { name: "Still Issue", value: stats?.stillIssueCount || 0, percent: stillIssuePercent, color: "#ef4444" },
                { name: "No Feedback / Abandoned", value: (stats?.totalAttempts || 0) - (stats?.totalAnswered || 0), percent: abandonedPercent, color: "#94a3b8" }
            ],
            logs: recentOutbound.map(log => ({
                id: log.id,
                ticketId: (log.metadata as any)?.ticket_id || "Unknown",
                citizenName: (log.metadata as any)?.citizen_name || "Citizen",
                phoneNumber: log.toNumber,
                outcome: (log.metadata as any)?.feedback || "no_feedback",
                duration: log.durationSeconds || 0,
                timestamp: log.startedAt,
                agentName: log.agentName || "Sarah"
            }))
        });

    } catch (error: any) {
        console.error("[OutboundAnalytics] GET Error:", error);
        return NextResponse.json({ error: "Failed to fetch outbound analytics" }, { status: 500 });
    }
}
