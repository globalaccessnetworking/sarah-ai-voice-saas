import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { vicidialMappings } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// PATCH /api/integrations/vicidial/mappings/[id] — Update mapping
export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const body = await req.json();

        const [updated] = await db
            .update(vicidialMappings)
            .set({
                name: body.name !== undefined ? body.name : undefined,
                vicidialCampaignId: body.vicidialCampaignId !== undefined ? body.vicidialCampaignId : undefined,
                vicidialListId: body.vicidialListId !== undefined ? body.vicidialListId : undefined,
                vicidialIngroup: body.vicidialIngroup !== undefined ? body.vicidialIngroup : undefined,
                agentId: body.agentId !== undefined ? body.agentId : undefined,
                openingMessage: body.openingMessage !== undefined ? body.openingMessage : undefined,
                callGoal: body.callGoal !== undefined ? body.callGoal : undefined,
                script: body.script !== undefined ? body.script : undefined,
                leadFieldMapping: body.leadFieldMapping !== undefined ? body.leadFieldMapping : undefined,
                dispositionMapping: body.dispositionMapping !== undefined ? body.dispositionMapping : undefined,
                isActive: body.isActive !== undefined ? body.isActive : undefined,
                updatedAt: new Date()
            })
            .where(eq(vicidialMappings.id, id))
            .returning();

        if (!updated) {
            return NextResponse.json(
                { error: "Mapping not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(updated, { status: 200 });
    } catch (error: any) {
        console.error("[VICIDIAL_MAPPINGS_PATCH_ERROR]", error);
        return NextResponse.json(
            { error: "Failed to update mapping", details: error?.message || "" },
            { status: 500 }
        );
    }
}

// DELETE /api/integrations/vicidial/mappings/[id] — Delete mapping
export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        const [deleted] = await db
            .delete(vicidialMappings)
            .where(eq(vicidialMappings.id, id))
            .returning();

        if (!deleted) {
            return NextResponse.json(
                { error: "Mapping not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: "Mapping deleted successfully", id: deleted.id },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("[VICIDIAL_MAPPINGS_DELETE_ERROR]", error);
        return NextResponse.json(
            { error: "Failed to delete mapping", details: error?.message || "" },
            { status: 500 }
        );
    }
}
