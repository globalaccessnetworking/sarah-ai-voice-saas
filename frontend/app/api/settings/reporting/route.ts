import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

/**
 * API Route for Automated Reporting Configuration
 * Endpoint: GET/POST /api/settings/reporting
 */

export async function GET() {
    try {
        console.log("[API] Fetching reporting configuration...");
        
        const config = await db.query.reportingConfiguration.findFirst({
            where: eq(schema.reportingConfiguration.id, 1)
        });

        if (!config) {
            return NextResponse.json({
                enableDailySummary: false,
                executionTime: "23:59",
                timezone: "UTC",
                recipientEmails: ""
            }, { status: 200 });
        }

        return NextResponse.json(config, { status: 200 });
    } catch (error: any) {
        console.error("[API] Failed to fetch reporting config:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        console.log("[API] Updating reporting configuration:", payload);

        // Perform UPSERT on id: 1
        const existing = await db.query.reportingConfiguration.findFirst({
            where: eq(schema.reportingConfiguration.id, 1)
        });

        const dataToSave = {
            enableDailySummary: payload.enableDailySummary,
            executionTime: payload.executionTime,
            timezone: payload.timezone,
            recipientEmails: payload.recipientEmails,
            updatedAt: new Date()
        };

        if (existing) {
            await db.update(schema.reportingConfiguration)
                .set(dataToSave)
                .where(eq(schema.reportingConfiguration.id, 1));
        } else {
            await db.insert(schema.reportingConfiguration)
                .values({ id: 1, ...dataToSave });
        }

        const saved = await db.query.reportingConfiguration.findFirst({
            where: eq(schema.reportingConfiguration.id, 1)
        });

        return NextResponse.json(saved, { status: 200 });
    } catch (error: any) {
        console.error("[API] Failed to update reporting config:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
