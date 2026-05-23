import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { agentTools, tools } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { pushAgentToRedis } from "@/lib/redis";
import { agents } from "@/db/schema";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const agentId = searchParams.get("agentId");

        if (!agentId) {
            return NextResponse.json({ error: "agentId is required" }, { status: 400 });
        }

        // Fetch tools assigned to the agent
        const assignedTools = await db.select({
            id: agentTools.id,
            agentId: agentTools.agentId,
            toolId: agentTools.toolId,
            toolName: tools.name,
            toolType: tools.type,
        })
            .from(agentTools)
            .leftJoin(tools, eq(agentTools.toolId, tools.id))
            .where(eq(agentTools.agentId, agentId));

        return NextResponse.json(assignedTools, { status: 200 });
    } catch (error) {
        console.error("Error fetching agent tools:", error);
        return NextResponse.json({ error: "Failed to fetch agent tools" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { agentId, toolId } = body;

        if (!agentId || !toolId) {
            return NextResponse.json({ error: "agentId and toolId are required." }, { status: 400 });
        }

        // Avoid duplicates
        const existing = await db.select().from(agentTools).where(
            and(eq(agentTools.agentId, agentId), eq(agentTools.toolId, toolId))
        ).limit(1);

        if (existing.length > 0) {
            return NextResponse.json({ message: "Tool already assigned to agent" }, { status: 200 });
        }

        const newId = `agtool_${crypto.randomBytes(12).toString("hex")}`;
        const [newLink] = await db.insert(agentTools).values({
            id: newId,
            agentId,
            toolId,
        }).returning();

        // Sync agent to Redis with updated tools list
        const [agent] = await db.select().from(agents).where(eq(agents.id, agentId));
        if (agent) {
            // Fetch all tools for this agent with full metadata to populate toolsConfig
            const allTools = await db.select({
                id: tools.id,
                name: tools.name,
                type: tools.type,
                description: tools.description,
                endpointUrl: tools.endpointUrl,
                parametersSchema: tools.parametersSchema,
            })
                .from(agentTools)
                .leftJoin(tools, eq(agentTools.toolId, tools.id))
                .where(eq(agentTools.agentId, agentId));

            const updatedAgent = {
                ...agent,
                toolsConfig: allTools // This is now a List[Dict]
            };
            await pushAgentToRedis(updatedAgent);
        }

        return NextResponse.json(newLink, { status: 201 });
    } catch (error) {
        console.error("Error assigning tool to agent:", error);
        return NextResponse.json({ error: "Failed to assign tool to agent" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        // We'll accept JSON payload since Next.js DELETE requests don't strictly ban bodies
        const body = await request.json();
        const { agentId, toolId } = body;

        if (!agentId || !toolId) {
            return NextResponse.json({ error: "agentId and toolId are required." }, { status: 400 });
        }

        await db.delete(agentTools).where(
            and(eq(agentTools.agentId, agentId), eq(agentTools.toolId, toolId))
        );

        // Sync agent to Redis
        const [agent] = await db.select().from(agents).where(eq(agents.id, agentId));
        if (agent) {
            const allTools = await db.select({
                id: tools.id,
                name: tools.name,
                type: tools.type,
                description: tools.description,
                endpointUrl: tools.endpointUrl,
                parametersSchema: tools.parametersSchema,
            })
                .from(agentTools)
                .leftJoin(tools, eq(agentTools.toolId, tools.id))
                .where(eq(agentTools.agentId, agentId));

            const updatedAgent = {
                ...agent,
                toolsConfig: allTools
            };
            await pushAgentToRedis(updatedAgent);
        }

        return NextResponse.json({ message: "Tool unassigned successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting agent tool mapping:", error);
        return NextResponse.json({ error: "Failed to delete agent tool mapping" }, { status: 500 });
    }
}
