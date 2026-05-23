import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tools } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const tool = await db.select().from(tools).where(eq(tools.id, id)).limit(1);

        if (tool.length === 0) {
            return NextResponse.json({ error: "Tool not found." }, { status: 404 });
        }

        return NextResponse.json(tool[0], { status: 200 });
    } catch (error) {
        console.error("Error fetching tool:", error);
        return NextResponse.json({ error: "Failed to fetch tool" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();

        const updatedTool = await db.update(tools)
            .set({ ...body, updatedAt: new Date() })
            .where(eq(tools.id, id))
            .returning();

        if (updatedTool.length === 0) {
            return NextResponse.json({ error: "Tool not found." }, { status: 404 });
        }

        return NextResponse.json(updatedTool[0], { status: 200 });
    } catch (error) {
        console.error("Error updating tool:", error);
        return NextResponse.json({ error: "Failed to update tool" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const deletedTool = await db.delete(tools).where(eq(tools.id, id)).returning();

        if (deletedTool.length === 0) {
            return NextResponse.json({ error: "Tool not found." }, { status: 404 });
        }

        return NextResponse.json({ message: "Tool deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting tool:", error);
        return NextResponse.json({ error: "Failed to delete tool" }, { status: 500 });
    }
}
