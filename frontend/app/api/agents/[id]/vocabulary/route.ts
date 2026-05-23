import { NextResponse } from "next/server";
import { db } from "@/db";
import { ttsCustomVocabulary } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        if (!id) return NextResponse.json({ error: "Missing Agent ID" }, { status: 400 });

        const words = await db
            .select()
            .from(ttsCustomVocabulary)
            .where(eq(ttsCustomVocabulary.agentId, id));

        return NextResponse.json(words);
    } catch (error) {
        console.error("Failed to fetch vocabulary:", error);
        return NextResponse.json({ error: "Failed to fetch vocabulary" }, { status: 500 });
    }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        if (!id) return NextResponse.json({ error: "Missing Agent ID" }, { status: 400 });

        const body = await request.json();
        let { phrase, replacement } = body;

        phrase = (phrase || "").trim();
        replacement = (replacement || "").trim();

        if (!phrase || !replacement) {
            return NextResponse.json({ error: "Phrase and replacement are required" }, { status: 400 });
        }

        if (phrase.length > 50 || replacement.length > 50) {
            return NextResponse.json({ error: "Phrase and replacement must be under 50 characters." }, { status: 400 });
        }

        const newWord = await db
            .insert(ttsCustomVocabulary)
            .values({
                agentId: id,
                phrase,
                replacement,
                isSynced: false
            })
            .returning();

        return NextResponse.json(newWord[0]);
    } catch (error) {
        console.error("Failed to insert word:", error);
        return NextResponse.json({ error: "Failed to insert word" }, { status: 500 });
    }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const url = new URL(request.url);
        const wordId = url.searchParams.get("wordId");

        if (!id || !wordId) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        await db
            .delete(ttsCustomVocabulary)
            .where(and(eq(ttsCustomVocabulary.id, wordId), eq(ttsCustomVocabulary.agentId, id)));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete word:", error);
        return NextResponse.json({ error: "Failed to delete word" }, { status: 500 });
    }
}
