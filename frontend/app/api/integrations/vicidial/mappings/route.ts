import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { vicidialMappings, agents } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET /api/integrations/vicidial/mappings — List all mappings
export async function GET(req: NextRequest) {
    try {
        const mappings = await db
            .select({
                id: vicidialMappings.id,
                name: vicidialMappings.name,
                vicidialCampaignId: vicidialMappings.vicidialCampaignId,
                vicidialListId: vicidialMappings.vicidialListId,
                vicidialIngroup: vicidialMappings.vicidialIngroup,
                agentId: vicidialMappings.agentId,
                agentName: agents.name,
                agentSlug: agents.slug,
                openingMessage: vicidialMappings.openingMessage,
                callGoal: vicidialMappings.callGoal,
                script: vicidialMappings.script,
                leadFieldMapping: vicidialMappings.leadFieldMapping,
                dispositionMapping: vicidialMappings.dispositionMapping,
                isActive: vicidialMappings.isActive,
                createdAt: vicidialMappings.createdAt,
                updatedAt: vicidialMappings.updatedAt
            })
            .from(vicidialMappings)
            .leftJoin(agents, eq(vicidialMappings.agentId, agents.id))
            .orderBy(vicidialMappings.createdAt);

        return NextResponse.json(mappings, { status: 200 });
    } catch (error: any) {
        console.error("[VICIDIAL_MAPPINGS_GET_ERROR]", error);
        return NextResponse.json(
            { error: "Failed to fetch mappings", details: error?.message || "" },
            { status: 500 }
        );
    }
}

// POST /api/integrations/vicidial/mappings — Create a mapping
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        if (!body.name || !body.agentId) {
            return NextResponse.json(
                { error: "name and agentId are required" },
                { status: 400 }
            );
        }

        // Validate that at least one match key is provided
        if (!body.vicidialCampaignId && !body.vicidialListId && !body.vicidialIngroup) {
            return NextResponse.json(
                { error: "At least one criteria is required: vicidialCampaignId, vicidialListId, or vicidialIngroup" },
                { status: 400 }
            );
        }

        const [created] = await db
            .insert(vicidialMappings)
            .values({
                name: body.name,
                vicidialCampaignId: body.vicidialCampaignId || null,
                vicidialListId: body.vicidialListId || null,
                vicidialIngroup: body.vicidialIngroup || null,
                agentId: body.agentId,
                openingMessage: body.openingMessage || "",
                callGoal: body.callGoal || "",
                script: body.script || "",
                leadFieldMapping: body.leadFieldMapping || {},
                dispositionMapping: body.dispositionMapping || {},
                isActive: body.isActive !== undefined ? body.isActive : true,
            })
            .returning();

        return NextResponse.json(created, { status: 201 });
    } catch (error: any) {
        console.error("[VICIDIAL_MAPPINGS_POST_ERROR]", error);
        return NextResponse.json(
            { error: "Failed to create mapping", details: error?.message || "" },
            { status: 500 }
        );
    }
}
