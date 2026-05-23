import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { agentTools, tools, agents } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import crypto from "crypto";
import { pushAgentToRedis } from "@/lib/redis";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: toolId } = await params;
        const body = await request.json();
        const { agentIds } = body; // Array of agent IDs

        if (!Array.isArray(agentIds)) {
            return NextResponse.json({ error: "agentIds must be an array" }, { status: 400 });
        }

        // 1. Fetch current tool data to ensure it exists
        const [tool] = await db.select().from(tools).where(eq(tools.id, toolId));
        if (!tool) {
            return NextResponse.json({ error: "Tool not found" }, { status: 404 });
        }

        // 2. Identify existing assignments to find which agents need a Redis sync
        const currentLinks = await db.select().from(agentTools).where(eq(agentTools.toolId, toolId));
        const currentAgentIds = currentLinks.map(l => l.agentId);

        // 3. Perform atomic update: Delete all current assignments, insert new ones
        await db.transaction(async (tx) => {
            // Delete all current assignments for this tool
            await tx.delete(agentTools).where(eq(agentTools.toolId, toolId));

            // Insert new assignments
            if (agentIds.length > 0) {
                const newLinks = agentIds.map(agentId => ({
                    id: `agtool_${crypto.randomBytes(12).toString("hex")}`,
                    agentId,
                    toolId
                }));
                await tx.insert(agentTools).values(newLinks);
            }
        });

        // 4. Identify all agents that were or are now affected
        const affectedAgentIds = Array.from(new Set([...currentAgentIds, ...agentIds]));

        // 5. Sync all affected agents to Redis in background
        if (affectedAgentIds.length > 0) {
            try {
                const affectedAgents = await db.select().from(agents).where(inArray(agents.id, affectedAgentIds));

                for (const agent of affectedAgents) {
                    // Fetch full tools config for each agent
                    const fullTools = await db.select({
                        id: tools.id,
                        name: tools.name,
                        type: tools.type,
                        description: tools.description,
                        endpointUrl: tools.endpointUrl,
                        parametersSchema: tools.parametersSchema,
                        enabled: tools.enabled
                    })
                        .from(agentTools)
                        .innerJoin(tools, eq(agentTools.toolId, tools.id)) // Use innerJoin to avoid nulls
                        .where(eq(agentTools.agentId, agent.id));

                    const updatedAgent = {
                        ...agent,
                        toolsConfig: fullTools
                    };

                    await pushAgentToRedis(updatedAgent);
                }
            } catch (redisError) {
                console.error("Redis sync failed but database update succeeded:", redisError);
                // Allow database success to return even if Redis sync had a transient error
            }
        }

        // 6. Return new hydrated assignments for UI update
        const finalAssignments = await db.select({
            id: agentTools.id,
            agentId: agentTools.agentId,
            toolId: agentTools.toolId,
            toolName: tools.name,
            toolType: tools.type
        })
            .from(agentTools)
            .innerJoin(tools, eq(agentTools.toolId, tools.id))
            .where(eq(agentTools.toolId, toolId));

        return NextResponse.json({ assignments: finalAssignments }, { status: 200 });

    } catch (error) {
        console.error("Error updating tool assignments:", error);
        return NextResponse.json({ error: "Failed to update assignments" }, { status: 500 });
    }
}
