import { db, schema } from "./db";
import { gte, lte, and } from "drizzle-orm";

async function verify() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const logs = await db.query.callLogs.findMany({
        where: and(
            gte(schema.callLogs.startedAt, startOfDay),
            lte(schema.callLogs.startedAt, endOfDay)
        )
    });

    console.log(`Found ${logs.length} logs for today.`);
    logs.forEach(l => console.log(`- ID: ${l.id}, Duration: ${l.duration}, Cost: ${l.totalCost}`));
}

verify().catch(console.error);
