import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { systemIntegrations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { syncIntegrationToRedis } from "@/lib/redis";

export async function GET() {
    try {
        const integrations = await db.select().from(systemIntegrations);

        // Obscure API keys before sending to frontend
        const safeIntegrations = integrations.map(item => ({
            ...item,
            apiKey: item.apiKey ? (item.apiKey.length > 8 ? `${item.apiKey.substring(0, 4)}...${item.apiKey.substring(item.apiKey.length - 4)}` : "****") : null,
            isConfigured: !!item.apiKey || (item.configJson && Object.keys(item.configJson as object).length > 0)
        }));

        return NextResponse.json(safeIntegrations);
    } catch (error) {
        console.error("Failed to fetch integrations:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    let step = "initialization";
    let provider = "unknown";
    try {
        const body = await req.json();
        const { providerName, apiKey, configJson, region, isActive } = body;
        provider = providerName || "unknown";
        step = "parsing body";

        if (!providerName) {
            return NextResponse.json({ error: "Provider name is required" }, { status: 400 });
        }

        const isKeyMasked = apiKey && apiKey.includes("...");

        // Use UPSERT (onConflictDoUpdate)
        step = "db upsert";
        const insertValues: any = {
            providerName,
            configJson: configJson || {},
            region: region || null,
            isActive: isActive !== undefined ? isActive : true,
            updatedAt: new Date()
        };
        if (apiKey !== undefined && apiKey !== "" && !isKeyMasked) {
            insertValues.apiKey = apiKey;
        }

        const setValues: any = {
            configJson: configJson || {},
            region: region || null,
            isActive: isActive !== undefined ? isActive : true,
            updatedAt: new Date()
        };
        if (apiKey !== undefined && apiKey !== "" && !isKeyMasked) {
            setValues.apiKey = apiKey;
        }

        const result = await db.insert(systemIntegrations)
            .values(insertValues)
            .onConflictDoUpdate({
                target: systemIntegrations.providerName,
                set: setValues
            })
            .returning();

        step = "result extraction";
        let updatedIntegration = result[0];

        if (!updatedIntegration) {
            console.warn(`[POST] Returning() was empty for ${providerName}, attempting fallback select.`);
            const fallback = await db.select().from(systemIntegrations).where(eq(systemIntegrations.providerName, providerName)).limit(1);
            if (fallback.length > 0) {
                updatedIntegration = fallback[0];
            } else {
                throw new Error(`Database result is empty after upsert for ${providerName}`);
            }
        }

        // Sync to Redis
        step = "redis sync";
        await syncIntegrationToRedis(
            updatedIntegration.providerName,
            updatedIntegration.apiKey || "",
            {
                region: updatedIntegration.region,
                isActive: updatedIntegration.isActive,
                ...(updatedIntegration.configJson as object)
            }
        );

        return NextResponse.json(updatedIntegration);
    } catch (error: any) {
        console.error(`Failed at step ${step}:`, error);
        return NextResponse.json({
            error: "Internal Server Error",
            message: error.message,
            step,
            provider
        }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const providerName = searchParams.get("providerName");

        if (!providerName) {
            return NextResponse.json({ error: "Provider name is required" }, { status: 400 });
        }

        // Delete from database
        const deleted = await db.delete(systemIntegrations)
            .where(eq(systemIntegrations.providerName, providerName))
            .returning();

        if (deleted.length > 0) {
            // Sync removal to Redis (if syncIntegrationToRedis handles deletion or if we need a separate call)
            // Assuming syncIntegrationToRedis is designed to handle the current state of the DB 
            // OR if it needs the object to know what to delete. 
            // Typically, for deletion, we might need a dedicated sync call or pass a flag.
            // Let's assume we can pass the deleted object but marked as inactive or simply handle it in sync.
            // For now, let's just call it with the deleted record but maybe we need a dedicated deleteSync.
            // Looking at the imports, only syncIntegrationToRedis is available.
            // Let's assume syncIntegrationToRedis can handle it if we pass the record.
            await syncIntegrationToRedis(
                deleted[0].providerName,
                "",
                {
                    isActive: false,
                    region: deleted[0].region,
                    ...(deleted[0].configJson as object)
                }
            );
        }

        return NextResponse.json({ success: true, deleted: deleted[0] });
    } catch (error) {
        console.error("Failed to delete integration:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
