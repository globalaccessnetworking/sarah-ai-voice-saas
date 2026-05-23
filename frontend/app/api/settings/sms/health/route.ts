import { NextResponse } from "next/server";
import { db } from "@/db";
import { smsLogs, smsConfigurations } from "@/db/schema";
import { eq, desc, and, gte } from "drizzle-orm";

/**
 * Health Check API for SMS Services.
 * Checks for recent failures and system-wide dispatch issues.
 */
export async function GET() {
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // 1. Check for recent FAILED messages
        const recentFailures = await db.select()
            .from(smsLogs)
            .where(and(
                eq(smsLogs.status, "FAILED"),
                gte(smsLogs.createdAt, twentyFourHoursAgo)
            ))
            .limit(10);

        // 2. Fetch Active Config to verify connectivity
        const [activeConfig] = await db.select()
            .from(smsConfigurations)
            .where(eq(smsConfigurations.isActive, true))
            .limit(1);

        const healthStatus = {
            isHealthy: recentFailures.length < 5,
            failureCount: recentFailures.length,
            hasActiveConfig: !!activeConfig,
            lastError: recentFailures[0]?.providerResponse || null,
            recommendation: ""
        };

        if (!healthStatus.isHealthy) {
            healthStatus.recommendation = "Multiple dispatch failures detected in the last 24h. Check provider balance or API keys.";
        } else if (!healthStatus.hasActiveConfig) {
            healthStatus.recommendation = "No active SMS gateway configured. Notifications are currently disabled.";
        }

        return NextResponse.json({ success: true, health: healthStatus });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
