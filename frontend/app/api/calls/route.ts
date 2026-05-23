import { NextResponse } from "next/server";
import { db } from "@/db";
import { callLogs, agents } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
    try {
        const logs = await db
            .select({
                id: callLogs.id,
                agentId: callLogs.agentId,
                agentName: agents.name,
                startedAt: callLogs.startedAt,
                endedAt: callLogs.endedAt,
                durationSeconds: callLogs.durationSeconds,
                status: callLogs.status,
                direction: callLogs.direction,
                fromNumber: callLogs.fromNumber,
                toNumber: callLogs.toNumber,
                summary: callLogs.summary,
            })
            .from(callLogs)
            .leftJoin(agents, eq(callLogs.agentId, agents.id))
            .orderBy(desc(callLogs.startedAt))
            .limit(100);

        return NextResponse.json(logs);
    } catch (error) {
        console.error("Error fetching call logs:", error);
        return NextResponse.json({ error: "Failed to fetch call logs" }, { status: 500 });
    }
}
