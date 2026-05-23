import { db, schema } from "./db";
import { v4 as uuidv4 } from "uuid";

/**
 * Temp script to seed dummy call logs for Phase 13 verification.
 */

async function seed() {
    console.log("Seeding dummy call logs...");
    
    // Get an agent ID
    const agent = await db.query.agents.findFirst();
    if (!agent) {
        console.error("No agents found. Please create an agent first.");
        return;
    }

    const now = new Date();
    
    const dummyCalls = [
        {
            id: `call_${uuidv4().slice(0, 8)}`,
            agentId: agent.id,
            duration: 120, // 2 minutes
            totalCost: "0.50",
            startedAt: now,
            status: "completed",
            direction: "inbound"
        },
        {
            id: `call_${uuidv4().slice(0, 8)}`,
            agentId: agent.id,
            duration: 300, // 5 minutes
            totalCost: "1.25",
            startedAt: now,
            status: "completed",
            direction: "outbound"
        }
    ];

    for (const call of dummyCalls) {
        await db.insert(schema.callLogs).values(call);
        console.log(`Inserted call ${call.id}`);
    }

    console.log("Seeding complete.");
}

seed().catch(console.error);
