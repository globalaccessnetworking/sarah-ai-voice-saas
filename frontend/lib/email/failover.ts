/**
 * Stubbed Email Failover Logic
 * Prevents build failure when lib/email is missing.
 */
export async function runFailoverHeartbeat() {
    console.log("[STUB] runFailoverHeartbeat called.");
    return { success: true };
}

export async function checkProviderHealth(id: string) {
    console.log(`[STUB] checkProviderHealth called for ID: ${id}`);
    return { success: true, status: "healthy" };
}
