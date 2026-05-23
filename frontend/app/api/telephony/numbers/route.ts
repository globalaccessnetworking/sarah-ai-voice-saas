import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { phoneNumbers } from "@/db/schema";
import { desc } from "drizzle-orm";
import crypto from "crypto";

export async function GET(request: NextRequest) {
    try {
        const numbers = await db.select().from(phoneNumbers).orderBy(desc(phoneNumbers.createdAt));
        return NextResponse.json(numbers, { status: 200 });
    } catch (error) {
        console.error("Error fetching phone numbers:", error);
        return NextResponse.json({ error: "Failed to fetch phone numbers" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { number, friendlyName, trunkId } = body;

        if (!number || !trunkId) {
            return NextResponse.json({ error: "Number and trunk ID are required." }, { status: 400 });
        }

        const newId = `pn_${crypto.randomBytes(12).toString("hex")}`;
        const [newNumber] = await db.insert(phoneNumbers).values({
            id: newId,
            number: number.startsWith("+") ? number : `+${number}`,
            friendlyName: friendlyName || null,
            trunkId: trunkId,
        }).returning();

        return NextResponse.json(newNumber, { status: 201 });
    } catch (error) {
        console.error("Error creating phone number:", error);
        return NextResponse.json({ error: "Failed to create phone number" }, { status: 500 });
    }
}
