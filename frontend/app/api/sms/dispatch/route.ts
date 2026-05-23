import { NextResponse } from "next/server";
import { db } from "@/db";
import { complaints } from "@/db/schema";
import { eq } from "drizzle-orm";
import { smsService } from "@/lib/sms-service";

/**
 * Internal API for triggering SMS alerts from the AI Worker (Python).
 * Expects X-Internal-Secret header for security.
 */
export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get("X-Internal-Secret");
        const sharedSecret = process.env.SHARED_SECRET;

        // 1. Security Check
        if (!sharedSecret || authHeader !== sharedSecret) {
            console.warn("[SMS Dispatch] Unauthorized access attempt");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { ticketId, triggerType, isUrgent } = body;

        if (!ticketId || !triggerType) {
            return NextResponse.json({ error: "Missing ticketId or triggerType" }, { status: 400 });
        }

        // 2. Resolve Complaint & District
        const [complaint] = await db.select()
            .from(complaints)
            .where(eq(complaints.ticket_id, ticketId))
            .limit(1);

        if (!complaint) {
            console.warn(`[SMS Dispatch] Complaint not found: ${ticketId}`);
            return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
        }

        // 3. Trigger Dispatched Alert via SMSService
        // Uses the Supervisor Routing logic defined in SMSService
        if (triggerType === "ticket_reopened") {
            await smsService.alertSupervisor({
                districtName: complaint.district || "Other",
                ticketId: ticketId,
                isUrgent: isUrgent || false
            });
        }

        return NextResponse.json({ success: true, message: `Dispatch triggered for ${ticketId}` });

    } catch (error: any) {
        console.error("[SMS Dispatch API] Critical Failure:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
