import { NextResponse } from "next/server";
import { db } from "@/db";
import { webChatAgents } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const [agent] = await db.select().from(webChatAgents).where(eq(webChatAgents.id, id));

        if (!agent) {
            return NextResponse.json({ error: "Agent not found" }, { status: 404 });
        }
        return NextResponse.json(agent);
    } catch (error: any) {
        console.error("Failed to fetch web chat agent:", error);
        return NextResponse.json({ error: "Failed to fetch agent", details: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const body = await request.json();

        // Check exists
        const [existing] = await db.select().from(webChatAgents).where(eq(webChatAgents.id, id));
        if (!existing) {
            return NextResponse.json({ error: "Agent not found" }, { status: 404 });
        }

        const temperature = body.temperature !== undefined ? body.temperature.toString() : existing.temperature;
        const maxTokens = body.maxTokens !== undefined ? parseInt(body.maxTokens, 10) : existing.maxTokens;

        const [updatedAgent] = await db.update(webChatAgents)
            .set({
                name: body.name ?? existing.name,
                enabled: body.enabled ?? existing.enabled,
                description: body.description !== undefined ? body.description : existing.description,
                llmProvider: body.llmProvider ?? existing.llmProvider,
                llmModel: body.llmModel ?? existing.llmModel,
                temperature: temperature,
                maxTokens: maxTokens,
                systemPrompt: body.systemPrompt ?? existing.systemPrompt,
                knowledgeBase: body.knowledgeBase !== undefined ? body.knowledgeBase : existing.knowledgeBase,
                toolInstructions: body.toolInstructions !== undefined ? body.toolInstructions : existing.toolInstructions,
                widgetConfig: body.widgetConfig ?? existing.widgetConfig,
                voiceEnabled: body.voiceEnabled ?? existing.voiceEnabled,
                voiceConfig: body.voiceConfig ?? existing.voiceConfig,
                allowedOrigins: Array.isArray(body.allowedOrigins) ? body.allowedOrigins : existing.allowedOrigins,
                updatedAt: new Date()
            })
            .where(eq(webChatAgents.id, id))
            .returning();

        return NextResponse.json(updatedAgent);
    } catch (error: any) {
        console.error("Failed to update web chat agent:", error);
        return NextResponse.json({ error: "Failed to update agent", details: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;

        const [deleted] = await db.delete(webChatAgents)
            .where(eq(webChatAgents.id, id))
            .returning();

        if (!deleted) {
            return NextResponse.json({ error: "Agent not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, deleted: deleted.id });
    } catch (error: any) {
        console.error("Failed to delete web chat agent:", error);
        return NextResponse.json({ error: "Failed to delete agent", details: error.message }, { status: 500 });
    }
}
