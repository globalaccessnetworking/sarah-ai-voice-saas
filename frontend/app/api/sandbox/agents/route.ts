import { NextResponse } from "next/server";
import { db } from "@/db";
import { agents } from "@/db/schema";

export async function GET() {
    try {
        const allAgents = await db.select({
            id: agents.id,
            name: agents.name,
            slug: agents.slug,
        }).from(agents);
        
        return NextResponse.json(allAgents);
    } catch (error) {
        console.error("Failed to fetch agents:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
