import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq, asc } from "drizzle-orm";
import { encrypt } from "@/lib/crypto";

export async function GET() {
    try {
        const configs = await db.query.emailConfigurations.findMany({
            orderBy: [asc(schema.emailConfigurations.priority)]
        });
        
        // Don't return the encrypted passwords to the frontend
        const safeConfigs = configs.map(config => {
            const { password, ...safe } = config;
            return safe;
        });
        
        return NextResponse.json(safeConfigs);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        const { id, ...configData } = data;

        // Encrypt password if it was provided
        if (configData.password) {
            configData.password = encrypt(configData.password);
        }

        let result;
        
        if (id) {
            // Update existing by ID
            result = await db.update(schema.emailConfigurations)
                .set({
                    ...configData,
                    updatedAt: new Date()
                })
                .where(eq(schema.emailConfigurations.id, id))
                .returning();
        } else {
            // Create new
            // Auto-assign priority if not provided (max + 1)
            if (!configData.priority) {
                const existing = await db.query.emailConfigurations.findMany();
                configData.priority = existing.length + 1;
            }

            result = await db.insert(schema.emailConfigurations)
                .values({
                    ...configData,
                    updatedAt: new Date()
                })
                .returning();
        }

        return NextResponse.json(result[0]);
    } catch (error: any) {
        console.error("[SettingsAPI] Error saving email config:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Configuration ID is required" }, { status: 400 });
        }

        await db.delete(schema.emailConfigurations)
            .where(eq(schema.emailConfigurations.id, id));

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
