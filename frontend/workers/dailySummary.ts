import cron, { ScheduledTask } from "node-cron";
import { db, schema } from "../db";
import { sendSystemEmail } from "../lib/email/dispatcher";
import { sql, eq, and, gte, lte } from "drizzle-orm";

/**
 * Scheduled Summary Aggregation Engine (Phase 16)
 * Respects dynamic configuration from the reporting_configuration table.
 */

let activeCronJob: ScheduledTask | null = null;
let currentCronString: string = "";
let currentStatus: boolean | null = null;

/**
 * Converts "HH:mm" to cron format "mm HH * * *"
 */
function timeToCron(timeStr: string): string {
    const [hour, minute] = (timeStr || "23:59").split(':');
    return `${minute || '59'} ${hour || '23'} * * *`;
}

/**
 * Executes the aggregation and dispatch logic
 */
export async function generateDailyReport() {
    console.log("[CRON] Daily Summary Engine triggered. Starting aggregation...");

    try {
        // 1. Fetch Latest Config
        const config = await db.query.reportingConfiguration.findFirst();

        if (config && !config.enableDailySummary) {
            console.log("[CRON] Reporting engine disabled in settings. Skipping execution.");
            return;
        }

        // 2. Calculate Time Bounds
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

        console.log(`[CRON] Aggregating from ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

        // 3. Execute Aggregation Query
        const [aggregation] = await db.select({
            total_calls: sql<number>`CAST(count(${schema.callLogs.id}) AS INTEGER)`,
            total_seconds: sql<number>`CAST(sum(${schema.callLogs.duration}) AS INTEGER)`,
            total_cost: sql<number>`CAST(sum(${schema.callLogs.totalCost}) AS NUMERIC)`
        })
        .from(schema.callLogs)
        .where(
            and(
                gte(schema.callLogs.startedAt, startOfDay),
                lte(schema.callLogs.startedAt, endOfDay)
            )
        );

        const total_calls = aggregation?.total_calls || 0;
        const total_seconds = aggregation?.total_seconds || 0;
        const total_cost = Number(aggregation?.total_cost || 0);

        if (total_calls === 0) {
            console.log("[CRON] No calls today. Skipping summary.");
            return;
        }

        const total_minutes = total_seconds / 60;

        // 4. Format Payload
        const variables = {
            period: "Daily",
            date_range: now.toLocaleDateString(),
            total_calls: total_calls.toString(),
            total_minutes: total_minutes.toFixed(2),
            total_cost: `$${total_cost.toFixed(2)}`
        };

        // 5. Resolve Recipients
        let recipients: string[] = [];
        if (config?.recipientEmails) {
            recipients = config.recipientEmails.split(',').map(e => e.trim()).filter(e => e.length > 0);
        }

        if (recipients.length === 0) {
            recipients = [process.env.ADMIN_EMAIL || "admin@globalaccess.ai"];
            console.log(`[CRON] No recipients configured. Using fallback: ${recipients[0]}`);
        }

        // 6. Dispatch Emails
        for (const recipient of recipients) {
            console.log(`[CRON] Dispatching summary report to ${recipient}`);
            await sendSystemEmail('system_report_scheduled_summary', recipient, variables);
        }

        console.log(`[CRON] Dispatch successful for ${recipients.length} recipients.`);
    } catch (error: any) {
        console.error("[CRON] Critical Failure in Daily Summary Engine:", error.message, error.stack);
    }
}

/**
 * Synchronizes the cron schedule with DB settings
 */
async function syncSchedule() {
    try {
        const config = await db.query.reportingConfiguration.findFirst();

        // Toggle Logic: If disabled, stop existing job
        if (!config || !config.enableDailySummary) {
            if (activeCronJob) {
                activeCronJob.stop();
                activeCronJob = null;
                currentCronString = "";
                currentStatus = false;
                console.log("[DAEMON] Reporting disabled. Cron stopped.");
            }
            return;
        }

        // Rescheduling Logic
        const newCronString = timeToCron(config.executionTime || "23:59");

        if (currentCronString !== newCronString || currentStatus !== true) {
            if (activeCronJob) {
                activeCronJob.stop();
            }

            activeCronJob = cron.schedule(newCronString, generateDailyReport, { 
                timezone: config.timezone || "UTC" 
            });

            currentCronString = newCronString;
            currentStatus = true;

            console.log(`[DAEMON] Schedule synced. Next report at ${config.executionTime} (${config.timezone || "UTC"}).`);
        }
    } catch (error: any) {
        console.error("[DAEMON] Failed to sync schedule:", error.message);
    }
}

// Initialization Sequence
(async () => {
    await syncSchedule();
    setInterval(syncSchedule, 60000); // Poll every 60 seconds
})();
