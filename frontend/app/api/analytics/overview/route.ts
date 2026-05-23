import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { sql, gte, and, count, sum, eq, desc } from "drizzle-orm";

export async function GET() {
    try {
        // Calculate Time Bounds (Past 7 Days)
        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);

        // 1. High-Level Metrics
        const [metrics] = await db.select({
            totalCalls: sql<number>`CAST(count(${schema.callLogs.id}) AS INTEGER)`,
            totalMinutes: sql<number>`CAST(sum(${schema.callLogs.duration}) AS INTEGER) / 60`,
            totalSpend: sql<number>`CAST(sum(${schema.callLogs.totalCost}) AS NUMERIC)`,
        })
        .from(schema.callLogs);

        const [agentCount] = await db.select({ value: count() }).from(schema.agents);

        // 2. Chart Data (Last 7 Days)
        const rawChartData = await db.select({
            date: sql<string>`DATE_TRUNC('day', ${schema.callLogs.startedAt})`,
            calls: count(schema.callLogs.id),
            cost: sum(schema.callLogs.totalCost)
        })
        .from(schema.callLogs)
        .where(gte(schema.callLogs.startedAt, sevenDaysAgo))
        .groupBy(sql`DATE_TRUNC('day', ${schema.callLogs.startedAt})`)
        .orderBy(sql`DATE_TRUNC('day', ${schema.callLogs.startedAt})`);

        // Format chart data for Recharts
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        let chartData = rawChartData.map(d => ({
            date: days[new Date(d.date).getUTCDay()],
            calls: Number(d.calls),
            cost: Number(d.cost || 0)
        }));

        // Mock data if empty
        if (chartData.length === 0) {
            chartData = [
                { date: 'Mon', calls: 45, cost: 2.30 },
                { date: 'Tue', calls: 52, cost: 3.10 },
                { date: 'Wed', calls: 48, cost: 2.80 },
                { date: 'Thu', calls: 61, cost: 4.20 },
                { date: 'Fri', calls: 55, cost: 3.90 },
                { date: 'Sat', calls: 67, cost: 5.10 },
                { date: 'Sun', calls: 70, cost: 5.40 }
            ];
        }

        // 3. Recent Activity (Standard Select with Join to avoid referencedTable error)
        const callData = await db.select({
            id: schema.callLogs.id,
            duration: schema.callLogs.duration,
            toNumber: schema.callLogs.toNumber,
            status: schema.callLogs.status,
            startedAt: schema.callLogs.startedAt,
            agentName: schema.agents.name,
        })
        .from(schema.callLogs)
        .leftJoin(schema.agents, eq(schema.callLogs.agentId, schema.agents.id))
        .orderBy(desc(schema.callLogs.startedAt))
        .limit(5);

        return NextResponse.json({
            totalCalls: metrics?.totalCalls || 0,
            totalMinutes: Math.floor(metrics?.totalMinutes || 0),
            totalSpend: Number(metrics?.totalSpend || 0).toFixed(2),
            activeAgents: agentCount?.value || 0,
            chartData,
            recentCalls: callData.map(c => {
                const dur = c.duration || 0;
                return {
                    id: c.id,
                    agentName: c.agentName || "System Agent",
                    recipient: c.toNumber || "Unknown",
                    duration: `${Math.floor(dur / 60)}m ${dur % 60}s`,
                    status: c.status
                };
            })
        });

    } catch (error: any) {
        console.error("[AnalyticsAPI] GET Error:", error);
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }
}
