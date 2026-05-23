import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: kbId } = await params;

        const docs = await db.select()
            .from(documents)
            .where(eq(documents.kbId, kbId))
            .orderBy(desc(documents.createdAt));

        return NextResponse.json(docs);
    } catch (error: any) {
        console.error(`Failed to fetch documents for KB ${await params.then(p => p.id)}:`, error);
        return NextResponse.json({ error: "Failed to fetch documents", details: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: kbId } = await params;
        const formData = await request.formData();

        const file = formData.get('file') as File;
        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Mock saving physical file. In a real app we'd upload this to S3/GCS or local disk.
        // For Phase 13, we insert the document metadata into PostgreSQL and mark as 'pending'

        const newDoc = await db.insert(documents).values({
            kbId: kbId,
            filename: file.name,
            fileType: file.type || 'application/octet-stream',
            sizeBytes: file.size,
            status: 'pending' // Will be picked up by a python worker later
        }).returning();

        return NextResponse.json(newDoc[0], { status: 201 });
    } catch (error: any) {
        console.error(`Failed to upload document to KB ${await params.then(p => p.id)}:`, error);
        return NextResponse.json({ error: "Failed to upload document", details: error.message }, { status: 500 });
    }
}
