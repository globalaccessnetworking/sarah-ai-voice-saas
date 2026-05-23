export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sipTrunks } from "@/db/schema";
import { eq } from "drizzle-orm";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        if (!id) return NextResponse.json({ error: "Trunk ID is required" }, { status: 400 });

        const [trunk] = await db
            .select()
            .from(sipTrunks)
            .where(eq(sipTrunks.id, id))
            .limit(1);

        if (!trunk) {
            return NextResponse.json({ error: "SIP Trunk not found" }, { status: 404 });
        }

        return NextResponse.json(trunk, { status: 200 });
    } catch (error) {
        // We know id might not be defined if the error happened before extracting it, but normally it is.
        // It's safer to just log the error.
        console.error(`Error fetching SIP trunk:`, error);
        return NextResponse.json({ error: "Failed to fetch SIP trunk." }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        if (!id) return NextResponse.json({ error: "Trunk ID is required" }, { status: 400 });

        const body = await req.json();

        // Verify it exists
        const [existing] = await db.select({ id: sipTrunks.id }).from(sipTrunks).where(eq(sipTrunks.id, id)).limit(1);
        if (!existing) {
            return NextResponse.json({ error: "SIP Trunk not found" }, { status: 404 });
        }

        // Prepare updates
        const updates: Partial<typeof sipTrunks.$inferInsert> = {
            updatedAt: new Date()
        };

        if (body.name !== undefined) updates.name = body.name;
        if (body.type !== undefined) updates.type = body.type;
        if (body.address !== undefined) updates.address = body.address;
        if (body.transport !== undefined) updates.transport = body.transport;
        if (body.numbers !== undefined) updates.numbers = body.numbers;
        if (body.allowedAddresses !== undefined) updates.allowedAddresses = body.allowedAddresses;
        if (body.allowedNumbers !== undefined) updates.allowedNumbers = body.allowedNumbers;
        if (body.authUsername !== undefined) updates.authUsername = body.authUsername;
        if (body.authPassword !== undefined) updates.authPassword = body.authPassword;
        if (body.metadata !== undefined) updates.metadata = body.metadata;
        if (body.headers !== undefined) updates.headers = body.headers;
        if (body.headersToAttributes !== undefined) updates.headersToAttributes = body.headersToAttributes;

        await db
            .update(sipTrunks)
            .set(updates)
            .where(eq(sipTrunks.id, id));

        return NextResponse.json({ message: "SIP trunk updated successfully" }, { status: 200 });
    } catch (error) {
        console.error(`Error updating SIP trunk:`, error);
        return NextResponse.json({ error: "Failed to update SIP trunk." }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        if (!id) return NextResponse.json({ error: "Trunk ID is required" }, { status: 400 });

        // Verify it exists
        const [existing] = await db.select({ id: sipTrunks.id }).from(sipTrunks).where(eq(sipTrunks.id, id)).limit(1);
        if (!existing) {
            return NextResponse.json({ error: "SIP Trunk not found" }, { status: 404 });
        }

        await db.delete(sipTrunks).where(eq(sipTrunks.id, id));

        return NextResponse.json({ message: "SIP trunk deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error(`Error deleting SIP trunk:`, error);
        return NextResponse.json({ error: "Failed to delete SIP trunk." }, { status: 500 });
    }
}
