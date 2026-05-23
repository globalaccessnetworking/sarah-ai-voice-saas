import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { sql } from "drizzle-orm";

export async function GET() {
    try {
        // 1. Deliverability Heatmap (Hour of Day vs Success Rate)
        const heatmap = await db.execute(sql`
            SELECT 
                EXTRACT(HOUR FROM timestamp) as hour,
                COUNT(*) as total,
                SUM(CASE WHEN status = 'SENT' THEN 1 ELSE 0 END) as successful
            FROM ${schema.emailLogs}
            GROUP BY hour
            ORDER BY hour ASC
        `);

        // 2. Aggregate Fatigue (Recent Volume)
        const aggregates = await db.execute(sql`
            SELECT 
                status,
                COUNT(*) as count
            FROM ${schema.emailLogs}
            WHERE timestamp > NOW() - INTERVAL '24 hours'
            GROUP BY status
        `);

        return NextResponse.json({
            heatmap,
            aggregates,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error("[PredictionAPI] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
