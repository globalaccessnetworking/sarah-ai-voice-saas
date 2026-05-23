import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { asc } from "drizzle-orm";

export async function GET() {
    try {
        // Fetch lightweight template metadata
        const templates = await db.query.emailTemplates.findMany({
            columns: {
                id: true,
                name: true,
                uniqueIdentifier: true,
                type: true,
                expectedVariables: true,
                updatedAt: true,
            },
            orderBy: [asc(schema.emailTemplates.name)],
        });

        return NextResponse.json(templates);
    } catch (error: any) {
        console.error("[EmailTemplatesAPI] Failed to fetch templates:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
