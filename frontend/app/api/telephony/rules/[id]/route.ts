import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dispatchRules } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const deletedRule = await db.delete(dispatchRules).where(eq(dispatchRules.id, id)).returning();

        if (deletedRule.length === 0) {
            return NextResponse.json({ error: "Dispatch rule not found." }, { status: 404 });
        }

        return NextResponse.json({ message: "Dispatch rule deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting dispatch rule:", error);
        return NextResponse.json({ error: "Failed to delete dispatch rule" }, { status: 500 });
    }
}
