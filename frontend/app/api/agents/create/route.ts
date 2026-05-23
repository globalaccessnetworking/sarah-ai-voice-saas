import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // 1. Generate a clean ID
        const agentId = `ag_${Math.random().toString(36).substring(2, 11)}`;
        
        // 2. Explicitly map ONLY the required fields
        // This stops the "Column Mismatch" error from crashing the database
        const insertData = {
            id: agentId,
            name: body.name || "Unnamed Agent",
            slug: body.slug || agentId,
            systemPrompt: body.systemPrompt || "",
            initialGreeting: body.initialGreeting || "",
            status: "stopped",
            
            // LLM Settings
            llmProvider: body.llmProvider || "openai",
            llmModel: body.llmModel || "gpt-4o",
            llmTemperature: String(body.llmTemperature || "0.8"),
            
            // STT Settings
            sttProvider: body.sttProvider || "deepgram",
            sttModel: body.sttModel || "nova-3-general",
            sttLanguage: body.sttLanguage || "en-US",
            
            // TTS Settings
            ttsProvider: body.ttsProvider || "cartesia",
            ttsModel: body.ttsModel || "sonic-2",
            ttsLanguage: body.ttsLanguage || "en-US",
            ttsSpeed: String(body.ttsSpeed || "1.0"),
            
            // Timestamps
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        // 3. Insert using the clean mapped object
        const [created] = await db.insert(schema.agents).values(insertData).returning();

        console.log("✅ Agent saved to Database:", created.id);

        return NextResponse.json({ 
            success: true, 
            agent: created,
            agentId: created.id 
        }, { status: 201 });

    } catch (error: any) {
        console.error("❌ SQL Insert Error:", error);
        return NextResponse.json({ 
            error: error.message || "Failed to save agent to database" 
        }, { status: 500 });
    }
}

// GET method to fetch from DB
export async function GET() {
    try {
        const allAgents = await db.select().from(schema.agents);
        return NextResponse.json({ agents: allAgents });
    } catch (error) {
        console.error("❌ Database Fetch Error:", error);
        return NextResponse.json({ agents: [] });
    }
}
