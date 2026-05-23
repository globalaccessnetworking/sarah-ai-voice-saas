import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { knowledgeBases } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const kb = await db.select().from(knowledgeBases).where(eq(knowledgeBases.id, id));

        if (kb.length === 0) {
            return NextResponse.json({ error: "Knowledge base not found" }, { status: 404 });
        }

        return NextResponse.json(kb[0]);
    } catch (error: any) {
        console.error(`Failed to fetch knowledge base ${await params.then(p => p.id)}:`, error);
        return NextResponse.json({ error: "Failed to fetch knowledge base", details: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const deleted = await db.delete(knowledgeBases).where(eq(knowledgeBases.id, id)).returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: "Knowledge base not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: `Deleted knowledge base ${id}` });
    } catch (error: any) {
        console.error(`Failed to delete knowledge base ${await params.then(p => p.id)}:`, error);
        return NextResponse.json({ error: "Failed to delete knowledge base", details: error.message }, { status: 500 });
    }
}
