import { NextResponse } from "next/server";
import { db } from "@/db";
import { emailLogs } from "@/db/schema";
import { desc, sql, gte } from "drizzle-orm";

export async function GET() {
    try {
        // Fetch logs from the last 24 hours for trend analysis
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const logs = await db.select()
            .from(emailLogs)
            .where(gte(emailLogs.timestamp, twentyFourHoursAgo))
            .orderBy(desc(emailLogs.timestamp));

        // Aggregate Metrics
        const total = logs.length;
        const sent = logs.filter(l => l.status === 'SENT').length;
        const failed = logs.filter(l => l.status === 'FAILED' || l.status === 'BOUNCED').length;
        
        // Success Rate
        const successRate = total > 0 ? (sent / total) * 100 : 100;

        // Throughput Velocity (last 60 minutes, bucketed by 5 mins)
        const sixtyMinsAgo = new Date(Date.now() - 60 * 60 * 1000);
        const hourlyLogs = logs.filter(l => new Date(l.timestamp) >= sixtyMinsAgo);
        
        const throughputData = Array.from({ length: 12 }, (_, i) => {
            const time = new Date(Date.now() - (11 - i) * 5 * 60 * 1000);
            const bucketStart = new Date(time.getTime() - 2.5 * 60 * 1000);
            const bucketEnd = new Date(time.getTime() + 2.5 * 60 * 1000);
            
            const count = hourlyLogs.filter(l => {
                const ts = new Date(l.timestamp);
                return ts >= bucketStart && ts < bucketEnd;
            }).length;

            return {
                time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                count
            };
        });

        // Provider Health
        // We'll infer provider involvement from logs if we added a provider field, 
        // but for now we'll just return overall health metrics.
        // In a real scenario, emailLogs would have a 'provider' column.
        
        return NextResponse.json({
            stats: {
                total,
                sent,
                failed,
                successRate: successRate.toFixed(1) + "%",
            },
            throughputData,
            recentEvents: logs.slice(0, 10) // Newest 10 for the activity feed
        });
    } catch (error) {
        console.error("Failed to fetch dispatcher metrics:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
