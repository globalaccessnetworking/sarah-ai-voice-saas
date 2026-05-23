import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/asterisk/queues
 * Returns all Asterisk queue definitions, member states, and caller stats.
 * In production: connect to AMI and run "queue show", "queue status"
 */
export async function GET(req: NextRequest) {
    try {
        const queues = [
            {
                name: "dental-queue",
                extension: "8001",
                strategy: "roundrobin",
                callsWaiting: 2,
                callsHandledToday: 48,
                callsAbandonedToday: 3,
                avgWaitTime: 38,
                members: [
                    { name: "Local/sarah-ai@agents", status: "InUse", callsTaken: 24 },
                    { name: "Local/emma-ai@agents", status: "Not in use", callsTaken: 18 },
                    { name: "SIP/reception-1", status: "Paused", callsTaken: 6 },
                ],
            },
            {
                name: "sales-queue",
                extension: "8002",
                strategy: "fewestcalls",
                callsWaiting: 0,
                callsHandledToday: 43,
                callsAbandonedToday: 1,
                avgWaitTime: 12,
                members: [
                    { name: "Local/sales-ai@agents", status: "Not in use", callsTaken: 31 },
                    { name: "SIP/mark-sales@internal", status: "InUse", callsTaken: 12 },
                ],
            },
        ];

        return NextResponse.json({ success: true, data: queues, count: queues.length });
    } catch (error) {
        console.error("Asterisk queues error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch queue data from Asterisk" },
            { status: 503 }
        );
    }
}

/**
 * POST /api/asterisk/queues
 * Create or update an Asterisk queue.
 * Body: { name, strategy, maxCallers, timeout, wrapUpTime, members }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, strategy, maxCallers, timeout, wrapUpTime, members } = body;

        if (!name) {
            return NextResponse.json(
                { success: false, error: "Queue name is required" },
                { status: 400 }
            );
        }

        // In production:
        // 1. Write to /etc/asterisk/queues.conf
        // 2. Execute AMI action: "QueueReload" or "module reload app_queue.so"
        // 3. Add members via AMI action: "QueueAdd"

        const result = {
            name,
            strategy: strategy || "roundrobin",
            maxCallers: maxCallers || 10,
            timeout: timeout || 20,
            wrapUpTime: wrapUpTime || 30,
            members: members || [],
            status: "Created",
            timestamp: new Date().toISOString(),
        };

        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error("Asterisk queue create error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create queue" },
            { status: 500 }
        );
    }
}
