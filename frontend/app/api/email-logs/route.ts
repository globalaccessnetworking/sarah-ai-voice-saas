import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { desc } from "drizzle-orm";

export async function GET() {
    try {
        const logs = await db.query.emailLogs.findMany({
            orderBy: [desc(schema.emailLogs.timestamp)],
            limit: 100,
        });

        return NextResponse.json(logs);
    } catch (error: any) {
        console.error("[EmailLogsAPI] Error fetching logs:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
