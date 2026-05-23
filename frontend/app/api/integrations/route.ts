export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { systemSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/integrations — fetch integration configs from systemSettings
export async function GET(req: NextRequest) {
    try {
        const settings = await db
            .select()
            .from(systemSettings)
            .where(eq(systemSettings.id, "global_config"))
            .limit(1);

        const storageConfig = settings[0]?.storageConfig as Record<string, any> || {};
        const integrations = storageConfig.integrations || {};

        return NextResponse.json(integrations, { status: 200 });
    } catch (error) {
        console.error("Error fetching integrations:", error);
        return NextResponse.json(
            { error: "Failed to fetch integrations." },
            { status: 500 }
        );
    }
}

// POST /api/integrations — save integration config
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        if (!body.providerId) {
            return NextResponse.json(
                { error: "providerId is required" },
                { status: 400 }
            );
        }

        // Fetch current settings
        const settings = await db
            .select()
            .from(systemSettings)
            .where(eq(systemSettings.id, "global_config"))
            .limit(1);

        const currentStorage = settings[0]?.storageConfig as Record<string, any> || {};
        const currentIntegrations = currentStorage.integrations || {};

        // Merge new integration config
        const updatedIntegrations = {
            ...currentIntegrations,
            [body.providerId]: {
                ...currentIntegrations[body.providerId],
                ...body.config,
                updatedAt: new Date().toISOString(),
            },
        };

        // Upsert settings
        await db
            .insert(systemSettings)
            .values({
                id: "global_config",
                storageConfig: { ...currentStorage, integrations: updatedIntegrations },
            })
            .onConflictDoUpdate({
                target: systemSettings.id,
                set: {
                    storageConfig: { ...currentStorage, integrations: updatedIntegrations },
                    updatedAt: new Date(),
                },
            });

        return NextResponse.json(
            { message: "Integration saved", providerId: body.providerId },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error saving integration:", error);
        return NextResponse.json(
            { error: "Failed to save integration." },
            { status: 500 }
        );
    }
}
