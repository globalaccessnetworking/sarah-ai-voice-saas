import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db, schema } from "../db";
import { eq, asc } from "drizzle-orm";
import { checkProviderHealth, runFailoverHeartbeat } from "../lib/email/failover";
import { sendSystemEmail } from "../lib/email/dispatcher";

async function runFailoverTest() {
    console.log("--- Starting Failover Engine Verification ---");

    // 1. Fetch current providers
    const providers = await db.query.emailConfigurations.findMany({
        orderBy: [asc(schema.emailConfigurations.priority)]
    });

    if (providers.length < 2) {
        console.warn("[Test] Insufficient providers for failover test. Need at least 2.");
        return;
    }

    const primary = providers[0];
    const secondary = providers[1];

    console.log(`[Test] Primary: ${primary.provider} (ID: ${primary.id})`);
    console.log(`[Test] Secondary: ${secondary.provider} (ID: ${secondary.id})`);

    // 2. Simulate Primary Failure (Temporarily breaking SMTP host)
    console.log("\n[Test] Simulating primary provider failure...");
    const originalHost = primary.smtpHost;
    
    await db.update(schema.emailConfigurations)
        .set({ smtpHost: "invalid.failover.test.localhost" })
        .where(eq(schema.emailConfigurations.id, primary.id));

    // 3. Run Heartbeat
    console.log("[Test] Running heartbeat...");
    await runFailoverHeartbeat();

    // 4. Verify Primary is DOWN
    const primaryUpdated = await db.query.emailConfigurations.findFirst({
        where: eq(schema.emailConfigurations.id, primary.id)
    });
    console.log(`[Test] Primary Health Status: ${primaryUpdated?.healthStatus}`);

    // 5. Attempt Dispatch (Should failover to secondary)
    console.log("\n[Test] Attempting email dispatch (expecting failover)...");
    try {
        await sendSystemEmail(
            "system_service_down_alert",
            "admin@globalaccess.ai",
            { service_name: "Failover Test", detected_at: new Date().toISOString() }
        );
        console.log("[Test] Dispatch SUCCESS (likely via secondary).");
    } catch (err: any) {
        console.error("[Test] Dispatch FAILED:", err.message);
    }

    // 6. Restore Primary
    console.log("\n[Test] Restoring primary provider configuration...");
    await db.update(schema.emailConfigurations)
        .set({ smtpHost: originalHost })
        .where(eq(schema.emailConfigurations.id, primary.id));

    // 7. Final Heartbeat check
    await checkProviderHealth(primary.id);
    const finalPrimary = await db.query.emailConfigurations.findFirst({
        where: eq(schema.emailConfigurations.id, primary.id)
    });
    console.log(`[Test] Primary restored health: ${finalPrimary?.healthStatus}`);

    console.log("\n--- Failover Engine Verification Complete ---");
}

runFailoverTest().catch(console.error);
