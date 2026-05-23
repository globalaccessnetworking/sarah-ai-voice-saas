import { NextResponse } from "next/server";
import { runFailoverHeartbeat } from "@/lib/email/failover";

/**
 * Health Check Heartbeat API
 * Manually or programmatically triggers provider verification.
 */
export async function POST() {
    try {
        await runFailoverHeartbeat();
        return NextResponse.json({ success: true, message: "Failover heartbeat completed." });
    } catch (error: any) {
        console.error("[HeartbeatAPI] Failed to execute heartbeat:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
