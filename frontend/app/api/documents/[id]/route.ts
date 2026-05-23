import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const deleted = await db.delete(documents).where(eq(documents.id, id)).returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: `Deleted document ${id}` });
    } catch (error: any) {
        console.error(`Failed to delete document ${await params.then(p => p.id)}:`, error);
        return NextResponse.json({ error: "Failed to delete document", details: error.message }, { status: 500 });
    }
}
