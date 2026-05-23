import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tools } from "@/db/schema";
import { desc } from "drizzle-orm";
import crypto from "crypto";

export async function GET(request: NextRequest) {
    try {
        const allTools = await db.select().from(tools).orderBy(desc(tools.createdAt));
        return NextResponse.json(allTools, { status: 200 });
    } catch (error) {
        console.error("Error fetching tools:", error);
        return NextResponse.json({ error: "Failed to fetch tools" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, description, type, endpointUrl, parametersSchema } = body;

        if (!name || !type) {
            return NextResponse.json({ error: "Name and type are required." }, { status: 400 });
        }

        const newId = `tool_${crypto.randomBytes(12).toString("hex")}`;
        const [newTool] = await db.insert(tools).values({
            id: newId,
            name,
            description: description || null,
            type,
            endpointUrl: endpointUrl || null,
            parametersSchema: parametersSchema || {},
        }).returning();

        return NextResponse.json(newTool, { status: 201 });
    } catch (error) {
        console.error("Error creating tool:", error);
        return NextResponse.json({ error: "Failed to create tool" }, { status: 500 });
    }
}
