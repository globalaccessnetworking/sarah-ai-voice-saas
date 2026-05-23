import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const template = await db.query.emailTemplates.findFirst({
            where: eq(schema.emailTemplates.id, id),
        });

        if (!template) {
            return NextResponse.json({ error: "Template not found" }, { status: 404 });
        }

        return NextResponse.json(template);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { htmlContent } = await req.json();

        if (htmlContent === undefined) {
            return NextResponse.json({ error: "htmlContent is required" }, { status: 400 });
        }

        const result = await db.update(schema.emailTemplates)
            .set({
                htmlContent,
                updatedAt: new Date(),
            })
            .where(eq(schema.emailTemplates.id, id))
            .returning();

        if (result.length === 0) {
            return NextResponse.json({ error: "Template not found or update failed" }, { status: 404 });
        }

        return NextResponse.json(result[0]);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
