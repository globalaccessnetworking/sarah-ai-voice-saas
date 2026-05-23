import { NextResponse } from "next/server";
import { generateDailyReport } from "@/workers/dailySummary";

/**
 * Manual Trigger for Daily Summary Aggregation
 * Endpoint: GET /api/webhooks/trigger-summary
 * Used for testing Phase 13 Scheduled Summary Engine
 */

export async function GET() {
    try {
        console.log("[API] Manual trigger for daily summary received.");
        
        // Execute the aggregation and dispatch logic
        await generateDailyReport();

        return NextResponse.json({ 
            message: "Daily summary generation triggered successfully." 
        }, { status: 200 });
    } catch (error: any) {
        console.error("[API] Failed to trigger daily summary:", error.message);
        return NextResponse.json({ 
            error: "Failed to trigger summary generation",
            details: error.message 
        }, { status: 500 });
    }
}
