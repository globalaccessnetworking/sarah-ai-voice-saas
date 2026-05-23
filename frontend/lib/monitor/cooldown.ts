/**
 * Stubbed Alert Cooldown Logic
 * Prevents build failure when lib/monitor/cooldown is missing.
 */
export async function canSendAlert(service: string, cooldownMinutes: number) {
    // Stub: always allow sending alerts for now
    return true;
}
