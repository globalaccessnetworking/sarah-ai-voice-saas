import { NextResponse } from "next/server";
import { db } from "@/db";
import { callLogs, agents } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const log = await db
            .select({
                id: callLogs.id,
                agentId: callLogs.agentId,
                agentName: agents.name,
                sessionId: callLogs.sessionId,
                roomName: callLogs.roomName,
                startedAt: callLogs.startedAt,
                endedAt: callLogs.endedAt,
                durationSeconds: callLogs.durationSeconds,
                status: callLogs.status,
                direction: callLogs.direction,
                fromNumber: callLogs.fromNumber,
                toNumber: callLogs.toNumber,
                transcript: callLogs.transcript,
                summary: callLogs.summary,
                recordingUrl: callLogs.recordingUrl,
                metadata: callLogs.metadata,
                createdAt: callLogs.createdAt,
            })
            .from(callLogs)
            .leftJoin(agents, eq(callLogs.agentId, agents.id))
            .where(eq(callLogs.id, id))
            .limit(1)
            .then(res => res[0]);

        if (!log) {
            return NextResponse.json({ error: "Call log not found" }, { status: 404 });
        }

        return NextResponse.json(log);
    } catch (error) {
        console.error("Error fetching call log details:", error);
        return NextResponse.json({ error: "Failed to fetch call log details" }, { status: 500 });
    }
}
