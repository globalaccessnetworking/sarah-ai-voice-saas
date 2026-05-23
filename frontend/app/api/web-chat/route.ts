import { NextResponse } from "next/server";
import { db } from "@/db";
import { webChatAgents } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const agents = await db.select().from(webChatAgents).orderBy(desc(webChatAgents.createdAt));
        return NextResponse.json(agents);
    } catch (error: any) {
        console.error("Failed to fetch web chat agents:", error);
        return NextResponse.json({ error: "Failed to fetch agents", details: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        let body;
        try {
            body = await request.json();
            console.log("Creating new Web Chat Agent Payload:", body);
        } catch (e) {
            console.error("Invalid JSON:", e);
            return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        if (!body.name || !body.llmProvider || !body.llmModel || !body.systemPrompt) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Validate and stringify temperature/maxTokens to correct types for Insert
        const temperature = body.temperature !== undefined ? body.temperature.toString() : '0.70';
        const maxTokens = body.maxTokens !== undefined ? parseInt(body.maxTokens, 10) : 1024;

        const [newAgent] = await db.insert(webChatAgents).values({
            name: body.name,
            enabled: body.enabled !== undefined ? body.enabled : true,
            description: body.description || null,
            llmProvider: body.llmProvider,
            llmModel: body.llmModel,
            temperature: temperature,
            maxTokens: maxTokens,
            systemPrompt: body.systemPrompt,
            knowledgeBase: body.knowledgeBase || null,
            toolInstructions: body.toolInstructions || null,
            widgetConfig: body.widgetConfig || {},
            voiceEnabled: body.voiceEnabled !== undefined ? body.voiceEnabled : false,
            voiceConfig: body.voiceConfig || {},
            allowedOrigins: Array.isArray(body.allowedOrigins) ? body.allowedOrigins : []
        }).returning();

        return NextResponse.json(newAgent, { status: 201 });
    } catch (error: any) {
        console.error("Failed to create web chat agent:", error);
        return NextResponse.json({ error: "Failed to create agent", details: error.message }, { status: 500 });
    }
}
