import { db } from "./index";
import { callLogs, agents } from "./schema";
import { eq } from "drizzle-orm";

async function seed() {
    console.log("🌱 Seeding Call Logs...");

    // Get an agent ID
    let agent = await db.select().from(agents).limit(1).then(res => res[0]);
    if (!agent) {
        console.log("⚠️ No agents found. Creating a dummy agent for seeding...");
        const newAgentId = 'agt_' + Math.random().toString(36).substring(2, 15);
        await db.insert(agents).values({
            id: newAgentId,
            name: "Audit Demo Agent",
            slug: "audit-demo",
            systemPrompt: "You are a helpful audit demo agent.",
            status: "running"
        });
        agent = await db.select().from(agents).where(eq(agents.id, newAgentId)).limit(1).then(res => res[0]);
    }

    const transcript = [
        { speaker: 'agent', timestamp: '10:00:01', text: 'Hello! This is Sarah from the Global Access Utility Department. How can I help you today?' },
        { speaker: 'caller', timestamp: '10:00:05', text: 'Hi Sarah, I wanted to check the status of my power restoration request for 123 Maple St.' },
        { speaker: 'agent', timestamp: '10:00:10', text: 'I can certainly look that up for you. One moment while I access the grid status tools.' },
        {
            speaker: 'tool',
            timestamp: '10:00:12',
            tool_name: 'lookup_grid_status',
            args: { "address": "123 Maple St", "service_type": "electricity" },
            result: { "status": "restored", "timestamp": "2026-03-07T09:45:00Z", "technician": "Unit-402" }
        },
        { speaker: 'agent', timestamp: '10:00:15', text: 'Thanks for waiting. It looks like the service was restored at 9:45 AM this morning by our field team. Is your power back on?' },
        { speaker: 'caller', timestamp: '10:00:20', text: 'Yes, it just came back! I just wanted to confirm if there were any follow-up steps.' },
        { speaker: 'agent', timestamp: '10:00:25', text: 'No further steps are needed on your end. We have marked the ticket as resolved. Is there anything else I can assist you with?' },
        { speaker: 'caller', timestamp: '10:00:30', text: 'That is all. Thank you so much!' },
        { speaker: 'agent', timestamp: '10:00:33', text: 'You are very welcome. Have a wonderful day!' }
    ];

    const metadata = {
        latency_p50_ms: 342,
        stt_provider: 'DEEPGRAM',
        llm_provider: 'OPENAI',
        ttfb_ms: 410,
        end_reason: 'hangup'
    };

    const callId = 'call_' + Math.random().toString(36).substring(2, 15);

    await db.insert(callLogs).values({
        id: callId,
        agentId: agent.id,
        sessionId: 'sess_' + Math.random().toString(36).substring(2, 10),
        roomName: 'room_' + Math.random().toString(36).substring(2, 10),
        direction: 'inbound',
        status: 'completed',
        fromNumber: '+15550192837',
        toNumber: '+18005550199',
        transcript: transcript,
        summary: 'Citizen called to verify power restoration status for 123 Maple St. Agent confirmed restoration at 09:45 AM via grid lookup tool. Citizen confirmed power is back and ticket was closed.',
        durationSeconds: 32,
        metadata: metadata,
        startedAt: new Date(Date.now() - 3600000), // 1 hour ago
        endedAt: new Date(Date.now() - 3600000 + 32000),
    });

    console.log(`✅ Seeded call log: ${callId}`);
}

seed().catch(console.error);
