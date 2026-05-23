import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limitStr = searchParams.get('limit') || '50';
        const limit = parseInt(limitStr, 10);

        const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp)).limit(limit);
        return NextResponse.json(logs);
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
    }
}
