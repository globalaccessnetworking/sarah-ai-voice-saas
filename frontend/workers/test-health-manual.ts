import { checkRedisHealth, checkDashboardHealth, checkAgentWorkerHealth } from "../lib/monitor/healthChecks";
import { canSendAlert } from "../lib/monitor/cooldown";

async function runTests() {
    console.log("--- Starting Health Check Tests ---");
    
    console.log("Redis Health:", await checkRedisHealth());
    console.log("Dashboard Health:", await checkDashboardHealth());
    console.log("Agent Worker Health:", await checkAgentWorkerHealth());

    console.log("\n--- Starting Cooldown Tests ---");
    // This will check the DB, might return true if no logs exist.
    const cooldownResult = await canSendAlert("Redis Memory", 30);
    console.log("Can send alert for Redis (30m cooldown):", cooldownResult);

    console.log("\n--- Test Suite Complete ---");
}

runTests().catch(console.error);
