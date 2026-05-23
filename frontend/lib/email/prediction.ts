import { db, schema } from "@/db";
import { eq, and, gt, sql } from "drizzle-orm";

/**
 * Global Access AI Prediction Hub
 * Handles deliverability intelligence, volume fatigue, and send-time optimization.
 */

/**
 * Calculates a fatigue score for a recipient based on historical volume.
 * Score 0-100. > 80 indicates high risk of being marked as spam.
 */
export async function calculateFatigueScore(recipient: string): Promise<number> {
    try {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Fetch logs for the recipient
        const logs = await db.query.emailLogs.findMany({
            where: and(
                eq(schema.emailLogs.recipient, recipient),
                gt(schema.emailLogs.timestamp, thirtyDaysAgo)
            )
        });

        const count24h = logs.filter(l => l.timestamp > oneDayAgo).length;
        const count7d = logs.filter(l => l.timestamp > sevenDaysAgo).length;
        const count30d = logs.length;

        /**
         * Algorithm:
         * Weight 24h: 10 points per email (Max 50)
         * Weight 7d: 2 points per email (Max 30)
         * Weight 30d: 0.5 points per email (Max 20)
         */
        const score = Math.min(50, count24h * 10) + 
                      Math.min(30, count7d * 2) + 
                      Math.min(20, count30d * 0.5);

        return Math.round(score);
    } catch (error) {
        console.error("[PredictionEngine] Fatigue Score Calculation Error:", error);
        return 0;
    }
}

/**
 * Predicts the optimal send time window based on historical delivery success patterns.
 * Returns an array of one-hour slots (0-23) ordered by likelihood of engagement.
 */
export async function getOptimalSendTimeWindow(recipient: string): Promise<number[]> {
    try {
        const domain = recipient.split("@")[1];

        // Fetch success logs for the same domain to detect provider-specific windows
        const result = await db.execute(sql`
            SELECT 
                EXTRACT(HOUR FROM timestamp) as hour,
                COUNT(*) as success_count
            FROM ${schema.emailLogs}
            WHERE 
                status = 'SENT'
                AND recipient LIKE ${'%' + domain}
            GROUP BY hour
            ORDER BY success_count DESC
            LIMIT 5
        `);

        if (!result.rows || result.rows.length === 0) {
            // Default to safe business hours (9, 10, 14, 15, 11)
            return [10, 14, 11, 15, 9];
        }

        return (result.rows as any[]).map((p) => Number(p.hour));
    } catch (error) {
        console.error("[PredictionEngine] Send Time Optimization Error:", error);
        return [10, 14, 11, 15, 9]; // Business hour defaults
    }
}
