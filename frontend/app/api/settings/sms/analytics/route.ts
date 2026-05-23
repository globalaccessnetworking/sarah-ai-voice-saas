import { NextResponse } from "next/server";
import { db } from "@/db";
import { smsLogs } from "@/db/schema";
import { sql, and, gte, lt, eq } from "drizzle-orm";

/**
 * Analytics API for SMS Performance Tracking.
 * Computes Month-over-Month (MoM) metrics for the last 30 days.
 */
export async function GET() {
    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

        // 1. Current Period Stats (Last 30 Days)
        const currentStats = await db.select({
            total: sql<number>`count(*)`,
            sent: sql<number>`count(*) filter (where status = 'SENT')`,
            failed: sql<number>`count(*) filter (where status = 'FAILED')`
        })
        .from(smsLogs)
        .where(gte(smsLogs.createdAt, thirtyDaysAgo));

        // 2. Previous Period Stats (30-60 Days Ago)
        const previousStats = await db.select({
            total: sql<number>`count(*)`,
            sent: sql<number>`count(*) filter (where status = 'SENT')`,
            failed: sql<number>`count(*) filter (where status = 'FAILED')`
        })
        .from(smsLogs)
        .where(and(
            gte(smsLogs.createdAt, sixtyDaysAgo),
            lt(smsLogs.createdAt, thirtyDaysAgo)
        ));

        // 3. Time-Series Data (Daily Volume for Chart)
        const dailyTrends = await db.select({
            date: sql<string>`DATE_TRUNC('day', ${smsLogs.createdAt})::DATE`,
            count: sql<number>`count(*)`
        })
        .from(smsLogs)
        .where(gte(smsLogs.createdAt, thirtyDaysAgo))
        .groupBy(sql`DATE_TRUNC('day', ${smsLogs.createdAt})`)
        .orderBy(sql`DATE_TRUNC('day', ${smsLogs.createdAt})`);

        const stats = {
            current: currentStats[0] || { total: 0, sent: 0, failed: 0 },
            previous: previousStats[0] || { total: 0, sent: 0, failed: 0 },
            trends: dailyTrends
        };

        // Calculate MoM Percentages
        const momGrowth = stats.previous.total > 0 
            ? ((stats.current.total - stats.previous.total) / stats.previous.total) * 100 
            : 0;

        return NextResponse.json({ 
            success: true, 
            stats,
            momGrowth: momGrowth.toFixed(1)
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
