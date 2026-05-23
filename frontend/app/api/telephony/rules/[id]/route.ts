import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dispatchRules, phoneNumbers } from "@/db/schema";
import { eq } from "drizzle-orm";
import redis from "@/lib/redis";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const deletedRule = await db.delete(dispatchRules).where(eq(dispatchRules.id, id)).returning();

        if (deletedRule.length === 0) {
            return NextResponse.json({ error: "Dispatch rule not found." }, { status: 404 });
        }

        // Fetch the phone number to clear its Redis routing
        const [phone] = await db.select().from(phoneNumbers).where(eq(phoneNumbers.id, deletedRule[0].phoneNumberId));
        if (phone) {
            const cleanPhone = phone.number.replace(/\+/g, "").replace(/\s/g, "");
            await redis.del(`dispatch_rule:${cleanPhone}`);
            await redis.del(`dispatch_rule:${phone.number.replace(/\s/g, "")}`);
        }

        return NextResponse.json({ message: "Dispatch rule deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting dispatch rule:", error);
        return NextResponse.json({ error: "Failed to delete dispatch rule" }, { status: 500 });
    }
}
