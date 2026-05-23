import { NextResponse } from "next/server";
import { db } from "@/db";
import { agents, ttsCustomVocabulary } from "@/db/schema";
import { eq } from "drizzle-orm";
// Use the official Uplift SDK as provided by Uplift AI support
import UpliftAI from "@upliftai/sdk-js";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        if (!id) return NextResponse.json({ error: "Missing Agent ID" }, { status: 400 });

        // 1. Get the Agent to find the master config ID
        const agent = await db.query.agents.findFirst({
            where: eq(agents.id, id)
        });

        if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
        
        const dictionaryId = agent.outboundTtsDictionaryId;
        if (!dictionaryId) {
            return NextResponse.json({ error: "No Uplift Master Dictionary ID configured for this agent. Please set it in the GUI first." }, { status: 400 });
        }

        const apiKey = process.env.UPLIFT_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "UPLIFT_API_KEY is not configured on the server." }, { status: 500 });
        }

        // 2. Fetch Customer's custom words from DB
        const customWords = await db
            .select()
            .from(ttsCustomVocabulary)
            .where(eq(ttsCustomVocabulary.agentId, id));

        if (!customWords.length) {
            return NextResponse.json({ success: true, message: "No custom words to sync yet." });
        }

        // Format for Uplift SDK
        const customReplacements = customWords.map(w => ({
            phrase: w.phrase,
            replacement: w.replacement
        }));

        // 3. Connect to Uplift AI API
        const client = new UpliftAI({ apiKey });

        // 4. Download Core Words
        let existingConfig;
        try {
            existingConfig = await client.tts.phraseReplacements.get(dictionaryId);
        } catch (err: any) {
             console.error("Failed to fetch existing config:", err);
             return NextResponse.json({ error: "Invalid or expired Uplift Dictionary ID. Check your API key and Dictionary ID." }, { status: 400 });
        }
        
        const coreWords = existingConfig?.phraseReplacements || [];

        // 5. Merge Strategy (Custom overwrites Core if exact duplicate phrase)
        const mergedMap = new Map();
        
        // Add core words
        for (const item of coreWords) {
            mergedMap.set(item.phrase.toLowerCase(), item);
        }
        
        // Overwrite/Add custom words
        for (const item of customReplacements) {
            mergedMap.set(item.phrase.toLowerCase(), item);
        }

        const mergedList = Array.from(mergedMap.values());

        // 6. Hard Limit Protection
        if (mergedList.length > 5000) {
            return NextResponse.json({ 
                error: `Cannot sync: Merged dictionary has ${mergedList.length} items. Maximum allowed by Uplift AI is 5000.` 
            }, { status: 400 });
        }

        // 7. Push to Uplift API exactly as specified in documentation
        try {
            await client.tts.phraseReplacements.update(dictionaryId, mergedList);
        } catch (err: any) {
            console.error("Failed to update phrase replacements payload:", err);
            return NextResponse.json({ error: "Failed to push the 249KB payload update to Uplift AI." }, { status: 500 });
        }

        // 8. Mark active DB words as synced
        await db.update(ttsCustomVocabulary)
            .set({ isSynced: true })
            .where(eq(ttsCustomVocabulary.agentId, id));

        return NextResponse.json({ 
            success: true, 
            message: `Successfully synced! Sarah is now trained. Total dictionary size: ${mergedList.length} words.` 
        });

    } catch (error: any) {
        console.error("Sync Engine Error:", error);
        return NextResponse.json({ error: error?.message || "Internal failure in Sync Engine" }, { status: 500 });
    }
}
