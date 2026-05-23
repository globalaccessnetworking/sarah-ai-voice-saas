import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { phoneNumbers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const number = await db.select().from(phoneNumbers).where(eq(phoneNumbers.id, id)).limit(1);

        if (number.length === 0) {
            return NextResponse.json({ error: "Phone number not found." }, { status: 404 });
        }

        return NextResponse.json(number[0], { status: 200 });
    } catch (error) {
        console.error("Error fetching phone number:", error);
        return NextResponse.json({ error: "Failed to fetch phone number" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const deletedNumber = await db.delete(phoneNumbers).where(eq(phoneNumbers.id, id)).returning();

        if (deletedNumber.length === 0) {
            return NextResponse.json({ error: "Phone number not found." }, { status: 404 });
        }

        return NextResponse.json({ message: "Phone number deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting phone number:", error);
        return NextResponse.json({ error: "Failed to delete phone number" }, { status: 500 });
    }
}
