import { NextResponse } from "next/server";
import { db } from "@/db";
import { emailLogs } from "@/db/schema";
import { desc, sql, gte, count, eq } from "drizzle-orm";

export async function GET() {
    try {
        // Fetch logs from the last 30 days for analytics
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        const logs = await db.select()
            .from(emailLogs)
            .where(gte(emailLogs.timestamp, thirtyDaysAgo))
            .orderBy(desc(emailLogs.timestamp));

        // 1. Calculate General Metrics
        const total = logs.length;
        const sent = logs.filter(l => l.status === 'SENT').length;
        const failed = logs.filter(l => l.status === 'FAILED').length;
        const bounced = logs.filter(l => l.status === 'BOUNCED').length;
        
        const deliveryRate = total > 0 ? ((sent / total) * 100).toFixed(1) : "100";
        const bounceRate = total > 0 ? ((bounced / total) * 100).toFixed(1) : "0";

        // 2. Domain Distribution (Top 5)
        const domainMap: Record<string, number> = {};
        logs.forEach(l => {
            const domain = l.recipient.split('@')[1] || 'unknown';
            domainMap[domain] = (domainMap[domain] || 0) + 1;
        });

        const topDomains = Object.entries(domainMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        // 3. Daily Volume Trend (Last 7 Days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const dailyTrend: Record<string, { sent: number, failed: number }> = {};
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString();
            dailyTrend[date] = { sent: 0, failed: 0 };
        }

        logs.filter(l => new Date(l.timestamp) >= sevenDaysAgo).forEach(l => {
            const date = new Date(l.timestamp).toLocaleDateString();
            if (dailyTrend[date]) {
                if (l.status === 'SENT') dailyTrend[date].sent++;
                else dailyTrend[date].failed++;
            }
        });

        const trendData = Object.entries(dailyTrend).map(([date, stats]) => ({
            date,
            ...stats
        })).reverse();

        // 4. Suppression Recommendations
        // Identify recipients with > 2 failures in the last 30 days
        const failureCounts: Record<string, number> = {};
        logs.filter(l => l.status === 'FAILED' || l.status === 'BOUNCED').forEach(l => {
            failureCounts[l.recipient] = (failureCounts[l.recipient] || 0) + 1;
        });

        const suppressionRecommendations = Object.entries(failureCounts)
            .filter(([_, count]) => count >= 2)
            .map(([email, count]) => ({ email, failureCount: count }))
            .sort((a, b) => b.failureCount - a.failureCount)
            .slice(0, 10);

        return NextResponse.json({
            metrics: {
                total,
                sent,
                failed,
                bounced,
                deliveryRate: deliveryRate + "%",
                bounceRate: bounceRate + "%",
            },
            topDomains,
            trendData,
            suppressionRecommendations
        });
    } catch (error) {
        console.error("Failed to fetch email analytics:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
