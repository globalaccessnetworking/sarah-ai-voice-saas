import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reportRules } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const rules = await db.select().from(reportRules).orderBy(desc(reportRules.createdAt));
        return NextResponse.json(rules);
    } catch (error: any) {
        console.error("Failed to fetch report rules:", error);
        return NextResponse.json({ error: "Failed to fetch report rules", details: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Basic validation
        if (!body.name || !body.triggerType || !body.recipients) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const newRule = await db.insert(reportRules).values({
            name: body.name,
            enabled: body.enabled ?? true,
            triggerType: body.triggerType,
            scheduleConfig: body.scheduleConfig || {},
            agentFilter: body.agentFilter || [],
            directionFilter: body.directionFilter || "all",
            recipients: body.recipients,
            templateId: body.templateId || null,
        }).returning();

        return NextResponse.json(newRule[0], { status: 201 });
    } catch (error: any) {
        console.error("Failed to create report rule:", error);
        return NextResponse.json({ error: "Failed to create report rule", details: error.message }, { status: 500 });
    }
}
