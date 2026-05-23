import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reportRules } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Update the rule
        const updatedRule = await db.update(reportRules)
            .set({
                name: body.name,
                enabled: body.enabled,
                triggerType: body.triggerType,
                scheduleConfig: body.scheduleConfig,
                agentFilter: body.agentFilter,
                directionFilter: body.directionFilter,
                recipients: body.recipients,
                templateId: body.templateId,
                updatedAt: new Date(),
            })
            .where(eq(reportRules.id, id))
            .returning();

        if (updatedRule.length === 0) {
            return NextResponse.json({ error: "Rule not found" }, { status: 404 });
        }

        return NextResponse.json(updatedRule[0]);
    } catch (error: any) {
        console.error(`Failed to update report rule ${await params.then(p => p.id)}:`, error);
        return NextResponse.json({ error: "Failed to update report rule", details: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const deleted = await db.delete(reportRules)
            .where(eq(reportRules.id, id))
            .returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: "Rule not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: `Deleted rule ${id}` });
    } catch (error: any) {
        console.error(`Failed to delete report rule ${await params.then(p => p.id)}:`, error);
        return NextResponse.json({ error: "Failed to delete report rule", details: error.message }, { status: 500 });
    }
}
