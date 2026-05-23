import cron from "node-cron";
import { db, schema } from "../db";
import { 
    checkRedisHealth, 
    checkDashboardHealth, 
    checkAgentWorkerHealth, 
    checkLiveKitHealth, 
    checkSipConnectivity,
    checkEgressEngineHealth
} from "../lib/monitor/healthChecks";
import { canSendAlert } from "../lib/monitor/cooldown";
import { sendSystemEmail } from "../lib/email/dispatcher";
import { runFailoverHeartbeat } from "../lib/email/failover";

/**
 * Global Access AI - Service Health Monitoring Daemon
 * Periodically verifies infrastructure and dispatches alerts.
 */

let lastRunTimestamp = 0;

console.log("[Daemon] Service Health Monitor Initialized.");

// Run every 1 minute
cron.schedule("* * * * *", async () => {
    try {
        console.log("[Daemon] Executing monitoring cycle...");

        // 1. Fetch Configuration
        const config = await db.query.serviceAlertConfigurations.findFirst();

        if (!config || !config.enableAlerts) {
            console.log("[Daemon] Monitoring disabled. Skipping cycle.");
            return;
        }

        // 2. Check Interval Logic
        const now = Date.now();
        const intervalMs = config.checkInterval * 1000;
        
        if (now - lastRunTimestamp < intervalMs) {
            console.log("[Daemon] Check interval not reached. Skipping.");
            return;
        }
        
        lastRunTimestamp = now;

        // 3. Loop Monitored Services
        const services = config.monitoredServices as string[];
        const recipients = config.recipientEmails.split(",").map(e => e.trim());

        for (const service of services) {
            let isOnline = true;

            switch (service) {
                case "Agent Worker (Python)":
                    isOnline = await checkAgentWorkerHealth();
                    break;
                case "LiveKit WebRTC":
                    isOnline = await checkLiveKitHealth();
                    break;
                case "Redis Memory":
                    isOnline = await checkRedisHealth();
                    break;
                case "Next.js Dashboard":
                    isOnline = await checkDashboardHealth();
                    break;
                case "Egress Engine":
                    isOnline = await checkEgressEngineHealth();
                    break;
                case "SIP Trunk Connectivity":
                    isOnline = await checkSipConnectivity();
                    break;
                default:
                    console.warn(`[Daemon] Unknown service: ${service}`);
            }

            if (!isOnline) {
                console.error(`[Daemon] FATAL: ${service} is OFFLINE.`);

                // 4. Cooldown and Dispatch
                const shouldNotify = await canSendAlert(service, config.alertCooldown);

                if (shouldNotify) {
                    for (const email of recipients) {
                        try {
                            await sendSystemEmail(
                                "system_service_down_alert",
                                email,
                                {
                                    service_name: service,
                                    detected_at: new Date().toISOString(),
                                    downtime_duration: "Immediate"
                                }
                            );
                            console.log(`[Daemon] Alert dispatched to ${email} for ${service}`);
                        } catch (err) {
                            console.error(`[Daemon] Failed to dispatch alert for ${service}:`, err);
                        }
                    }
                }
            } else {
                console.log(`[Daemon] ${service}: HEALTHY`);
            }
        }
        
        // 4. Perform Email Provider Failover Heartbeat
        await runFailoverHeartbeat();

    } catch (error) {
        console.error("[Daemon] Error in monitoring cycle:", error);
    }
});
