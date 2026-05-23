import { NextRequest, NextResponse } from "next/server";
import { sendSystemEmail } from "@/lib/email/dispatcher";
import { db } from "@/db";

export async function POST(req: NextRequest) {
    try {
        const { recipientEmail } = await req.json();

        if (!recipientEmail) {
            return NextResponse.json({ error: "Recipient email is required" }, { status: 400 });
        }

        // Fetch active config to determine the provider name for the test email
        const config = await db.query.emailConfigurations.findFirst();
        const providerName = config?.provider || "Unknown";

        // Trigger the seeded "System-Test Email" template
        // Variables required by template: from_name, from_email, provider
        await sendSystemEmail("system_test_email", recipientEmail, {
            from_name: config?.fromName || "Global Access Admin",
            from_email: config?.fromEmail || "noreply@globalaccess.ai",
            provider: providerName
        });

        return NextResponse.json({ message: "Test email sent successfully" });
    } catch (error: any) {
        console.error("[EmailTestAPI] Dispatch failed:", error);
        
        // Pass the exact backend error (SMTP/SES) to the frontend for debugging
        return NextResponse.json({ 
            error: error.message || "Failed to send test email" 
        }, { status: 400 });
    }
}
