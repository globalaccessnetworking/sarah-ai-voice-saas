import { NextResponse } from "next/server";
import { smsService } from "@/lib/sms-service";

/**
 * Pulse API for processing the SMS retry queue.
 * Should be called via cronjob or interval.
 */
export async function GET(request: Request) {
    try {
        // Optional: Add basic security check for internal pings if exposed
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get("secret");
        
        if (process.env.SHARED_SECRET && secret !== process.env.SHARED_SECRET) {
            return NextResponse.json({ error: "Unauthorized pulse" }, { status: 401 });
        }

        await smsService.processQueue();
        
        return NextResponse.json({ 
            success: true, 
            timestamp: new Date().toISOString() 
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
