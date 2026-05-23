import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dispatchRules, phoneNumbers, agents } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";

export async function GET(request: NextRequest) {
    try {
        // We want to return the joined data for the UI so they don't have to fetch it piecemeal
        const rulesWithRelations = await db.select({
            id: dispatchRules.id,
            name: dispatchRules.name,
            phoneNumberId: dispatchRules.phoneNumberId,
            agentId: dispatchRules.agentId,
            createdAt: dispatchRules.createdAt,
            phoneNumber: phoneNumbers.number,
            agentName: agents.name,
        })
            .from(dispatchRules)
            .leftJoin(phoneNumbers, eq(dispatchRules.phoneNumberId, phoneNumbers.id))
            .leftJoin(agents, eq(dispatchRules.agentId, agents.id))
            .orderBy(desc(dispatchRules.createdAt));

        return NextResponse.json(rulesWithRelations, { status: 200 });
    } catch (error) {
        console.error("Error fetching dispatch rules:", error);
        return NextResponse.json({ error: "Failed to fetch dispatch rules" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, phoneNumberId, agentId } = body;

        if (!phoneNumberId || !agentId) {
            return NextResponse.json({ error: "Phone Number ID and Agent ID are required." }, { status: 400 });
        }

        // Check if an existing rule already binds this DID to an agent. If so, overwrite it? Or deny. Let's just create.
        // Or wait, deleting existing rule for same phone is probably safer since a phone goes to 1 agent.
        await db.delete(dispatchRules).where(eq(dispatchRules.phoneNumberId, phoneNumberId));

        const newId = `rule_${crypto.randomBytes(12).toString("hex")}`;
        const [newRule] = await db.insert(dispatchRules).values({
            id: newId,
            name: name || null,
            phoneNumberId: phoneNumberId,
            agentId: agentId,
        }).returning();

        return NextResponse.json(newRule, { status: 201 });
    } catch (error) {
        console.error("Error creating dispatch rule:", error);
        return NextResponse.json({ error: "Failed to create dispatch rule" }, { status: 500 });
    }
}
