/**
 * Stubbed Health Checks
 * Prevents build failure when lib/monitor/healthChecks is missing.
 */
export async function checkRedisHealth() { return true; }
export async function checkDashboardHealth() { return true; }
export async function checkAgentWorkerHealth() { return true; }
export async function checkLiveKitHealth() { return true; }
export async function checkSipConnectivity() { return true; }
export async function checkEgressEngineHealth() { return true; }
