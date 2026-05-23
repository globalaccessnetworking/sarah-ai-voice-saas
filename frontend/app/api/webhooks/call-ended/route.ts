import { NextRequest, NextResponse } from "next/server";
import { sendSystemEmail } from "@/lib/email/dispatcher";

/**
 * Global Access AI - Post-Call Webhook
 * Secure endpoint for AI workers to trigger automated reporting.
 */

export async function POST(req: NextRequest) {
    try {
        // 1. Security Check
        const authHeader = req.headers.get("Authorization");
        const secret = process.env.INTERNAL_WEBHOOK_SECRET;

        if (!authHeader || authHeader !== `Bearer ${secret}`) {
            console.warn("[Webhook] Unauthorized access attempt blocked.");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Payload Extraction
        const payload = await req.json();
        const { call_id, agent_name, caller_number, duration, total_cost, client_email } = payload;

        if (!client_email) {
            return NextResponse.json({ error: "Missing client_email" }, { status: 400 });
        }

        console.log(`[Webhook] Processing post-call report for ${call_id} -> ${client_email}`);

        // 3. Hydration & Dispatch
        await sendSystemEmail(
            "system_report_post_call_summary",
            client_email,
            {
                call_id,
                agent_name,
                caller_number,
                duration,
                total_cost,
                dispatched_at: new Date().toISOString()
            }
        );

        return NextResponse.json({ 
            success: true, 
            message: "Post-call report dispatched successfully" 
        });

    } catch (error: any) {
        console.error("[Webhook] Internal Error:", error.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
