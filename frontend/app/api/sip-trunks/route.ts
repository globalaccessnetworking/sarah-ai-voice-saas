export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sipTrunks } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";

export async function GET(req: NextRequest) {
    try {
        // Fetch all SIP trunks, ordered by newest first
        const allTrunks = await db.select().from(sipTrunks).orderBy(desc(sipTrunks.createdAt));

        return NextResponse.json(allTrunks, { status: 200 });
    } catch (error) {
        console.error("Error fetching SIP trunks:", error);
        return NextResponse.json(
            { error: "Failed to fetch SIP trunks. Database connection might be unavailable." },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Basic validation
        if (!body.type || !['inbound', 'outbound'].includes(body.type)) {
            return NextResponse.json({ error: "Valid trunk 'type' is required (inbound or outbound)" }, { status: 400 });
        }
        if (!body.name) {
            return NextResponse.json({ error: "Trunk 'name' is required" }, { status: 400 });
        }

        const db = await import("@/db").then(m => m.db); // already imported above, can just use db

        // Generate ID
        const generatedId = `sip_${crypto.randomBytes(12).toString("hex")}`;

        // Insert new trunk
        const newTrunk = {
            id: generatedId,
            type: body.type,
            name: body.name,
            numbers: Array.isArray(body.numbers) ? body.numbers : [],
            address: body.address || null,
            transport: body.transport || "tcp",
            allowedAddresses: Array.isArray(body.allowedAddresses) ? body.allowedAddresses : [],
            allowedNumbers: Array.isArray(body.allowedNumbers) ? body.allowedNumbers : [],
            authUsername: body.authUsername || null,
            authPassword: body.authPassword || null,
            metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : {},
            headers: body.headers && typeof body.headers === 'object' ? body.headers : {},
            headersToAttributes: body.headersToAttributes && typeof body.headersToAttributes === 'object' ? body.headersToAttributes : {},
        };

        await db.insert(sipTrunks).values(newTrunk);

        return NextResponse.json({ message: "Trunk created successfully", id: generatedId }, { status: 201 });
    } catch (error) {
        console.error("Error creating SIP trunk:", error);
        return NextResponse.json(
            { error: "Failed to create SIP trunk." },
            { status: 500 }
        );
    }
}
