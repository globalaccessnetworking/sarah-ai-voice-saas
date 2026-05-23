import { NextResponse } from "next/server";
import { db } from "@/db";
import { serviceAlertConfigurations } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
    try {
        const config = await db.query.serviceAlertConfigurations.findFirst();
        
        if (!config) {
            // Return default object as per directives
            return NextResponse.json({
                enableAlerts: false,
                recipientEmails: "",
                monitoredServices: [],
                alertCooldown: 30, // Default 30 minutes
                checkInterval: 60, // Default 60 seconds
            });
        }

        return NextResponse.json(config);
    } catch (error) {
        console.error("[AlertsAPI] Failed to fetch alert settings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { 
            enableAlerts, 
            recipientEmails, 
            monitoredServices, 
            alertCooldown, 
            checkInterval 
        } = body;

        const existing = await db.query.serviceAlertConfigurations.findFirst();

        if (existing) {
            await db.update(serviceAlertConfigurations)
                .set({
                    enableAlerts,
                    recipientEmails,
                    monitoredServices,
                    alertCooldown,
                    checkInterval,
                    updatedAt: new Date()
                })
                .where(eq(serviceAlertConfigurations.id, existing.id));
        } else {
            await db.insert(serviceAlertConfigurations)
                .values({
                    enableAlerts,
                    recipientEmails,
                    monitoredServices,
                    alertCooldown: alertCooldown || 30,
                    checkInterval: checkInterval || 60,
                });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[AlertsAPI] Failed to save alert settings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
