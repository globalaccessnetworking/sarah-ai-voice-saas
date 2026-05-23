import { db } from "@/db";
import { 
    smsConfigurations, 
    smsTemplates, 
    smsLogs, 
    smsJobs,
    districts, 
    supervisorRegistry 
} from "@/db/schema";
import { eq, and, sql, lt, desc } from "drizzle-orm";
import axios from "axios";

export class SMSService {
    private static instance: SMSService;

    private constructor() {}

    public static getInstance(): SMSService {
        if (!SMSService.instance) {
            SMSService.instance = new SMSService();
        }
        return SMSService.instance;
    }

    /**
     * Non-blocking SMS dispatch to ensure zero impact on application latency.
     */
    public async sendAsync(options: {
        recipient: string;
        ticketId?: string;
        triggerType: string;
        variables?: Record<string, string>;
        isUrgent?: boolean;
        skipQueue?: boolean;
    }) {
        if (options.skipQueue) {
            return this.dispatch(options).catch(err => {
                console.error("[SMS Service] Direct Dispatch Failure:", err);
            });
        }

        // Phase 4: Queue for persistence & retry if it fails
        this.queueJob(options).catch(err => {
            console.error("[SMS Service] Queue Failure:", err);
        });
    }

    private async queueJob(options: any) {
        try {
            // Check Credit Guard before queuing
            await this.performCreditGuardCheck();

            await db.insert(smsJobs).values({
                recipient: options.recipient,
                ticketId: options.ticketId,
                content: "PREPARING", // Will be filled during dispatch
                triggerType: options.triggerType,
                status: "PENDING",
                attemptCount: 0,
                maxRetries: 3
            });

            // Start processing if not already handled by a background worker
            // In a production environment, a separate cron would call /api/sms/process-queue
            this.dispatch(options).catch(err => {
                console.warn("[SMS Service] Initial dispatch failed, relying on retry queue.");
            });
        } catch (e) {
            console.error("[SMS Service] Job Queuing Failed:", e);
        }
    }

    private async performCreditGuardCheck() {
        try {
            const [config] = await db.select().from(smsConfigurations).where(eq(smsConfigurations.isActive, true)).limit(1);
            if (!config || config.lowCreditAlertSent) return;

            // Sendpk Balance API (Concept)
            // Note: Placeholder URL - needs actual endpoint if Sendpk provides one
            // If they don't provide a balance API, this part remains as a logical block for when they do.
            const balance = 1000; // Mocked - Replace with actual API call
            
            if (balance < (config.creditThreshold || 500)) {
                await this.sendAsync({
                    recipient: process.env.ADMIN_MOBILE || "+923000000000",
                    triggerType: "low_credit_alert",
                    variables: { balance: balance.toString() },
                    skipQueue: true // Direct alert to admin
                });

                await db.update(smsConfigurations)
                    .set({ lowCreditAlertSent: true })
                    .where(eq(smsConfigurations.id, config.id));
            }
        } catch (e) {
            console.warn("[SMS Service] Credit Guard check failed.");
        }
    }

    private async dispatch(options: {
        recipient: string;
        ticketId?: string;
        triggerType: string;
        variables?: Record<string, string>;
        isUrgent?: boolean;
    }) {
        try {
            // 1. Fetch Active Config
            const [config] = await db.select().from(smsConfigurations).where(eq(smsConfigurations.isActive, true)).limit(1);
            if (!config) throw new Error("No active SMS gateway configured");

            // 2. Fetch Template
            const [template] = await db.select().from(smsTemplates).where(eq(smsTemplates.triggerType, options.triggerType)).limit(1);
            if (!template) throw new Error(`Template for ${options.triggerType} not found`);

            // 3. Prepare Content
            let content = template.content;
            if (options.isUrgent) {
                content = `[URGENT] ${content}`;
            }

            // Replace Placeholders
            const vars = { ticket_id: options.ticketId || "", ...options.variables };
            Object.entries(vars).forEach(([key, val]) => {
                content = content.replace(new RegExp(`{{${key}}}`, 'g'), val);
            });

            // 4. Send via Provider (Sendpk Logic)
            const payload = {
                api_key: (config.apiParams as any)?.apiKey || "",
                sender: config.senderId,
                mobile: options.recipient.replace("+", ""), // Sendpk expects numbers without +
                message: content,
                format: "json",
                ...(template.useUnicode ? { type: "unicode" } : {})
            };

            const response = await axios.post(config.apiUrl, null, { params: payload });

            // 5. Log Result
            const logStatus = response.status === 200 ? "SENT" : "FAILED";
            await db.insert(smsLogs).values({
                recipient: options.recipient,
                ticketId: options.ticketId,
                content: content,
                status: logStatus,
                providerResponse: response.data
            });

            // Phase 4: Update Job Table if applicable
            if (options.ticketId) {
                await db.update(smsJobs)
                    .set({ 
                        status: logStatus === "SENT" ? "COMPLETED" : "PENDING",
                        content: content,
                        attemptCount: sql`${smsJobs.attemptCount} + 1`
                    })
                    .where(and(
                        eq(smsJobs.recipient, options.recipient),
                        eq(smsJobs.ticketId, options.ticketId),
                        eq(smsJobs.status, "PENDING")
                    ));
            }

            return response.data;
        } catch (error: any) {
            console.error(`[SMS Service] Error: ${error.message}`);
            
            // Log Failure
            await db.insert(smsLogs).values({
                recipient: options.recipient,
                ticketId: options.ticketId,
                content: "DISPATCH_ERROR",
                status: "FAILED",
                providerResponse: { error: error.message }
            });

            // Phase 4: Handle Retry Escalation
            if (options.ticketId) {
                const [job] = await db.select().from(smsJobs).where(and(eq(smsJobs.ticketId, options.ticketId), eq(smsJobs.recipient, options.recipient))).limit(1);
                
                if (job) {
                    const nextAttempt = new Date();
                    // Exponential backoff: 5m, 15m, 60m
                    const minutes = job.attemptCount === 0 ? 5 : job.attemptCount === 1 ? 15 : 60;
                    nextAttempt.setMinutes(nextAttempt.getMinutes() + minutes);

                    const isHardFailure = (job.attemptCount || 0) >= (job.maxRetries || 3);

                    await db.update(smsJobs)
                        .set({
                            status: isHardFailure ? "FAILED" : "PENDING",
                            lastError: error.message,
                            attemptCount: sql`${smsJobs.attemptCount} + 1`,
                            nextAttemptAt: nextAttempt
                        })
                        .where(eq(smsJobs.id, job.id));
                    
                    if (isHardFailure) {
                        console.error(`🔴 HARD FAILURE for Ticket ${options.ticketId}. Manual intervention required.`);
                        // TODO: Trigger Email Alert logic here in next step
                    }
                }
            }

            throw error;
        }
    }

    /**
     * Resolves the district supervisor and sends an alert.
     */
    public async alertSupervisor(options: {
        districtName: string;
        ticketId: string;
        isUrgent?: boolean;
    }) {
        try {
            // 1. Find District
            const [district] = await db.select().from(districts).where(eq(districts.name, options.districtName)).limit(1);
            
            if (!district) {
                console.warn(`[SMS Service] District ${options.districtName} not found, falling back to HQ.`);
                const fallback = process.env.HQ_FALLBACK_PHONE;
                if (fallback) {
                    return this.sendAsync({
                        recipient: fallback,
                        ticketId: options.ticketId,
                        triggerType: "ticket_reopened",
                        isUrgent: options.isUrgent
                    });
                }
                return;
            }

            // 2. Find ALL Staff in district (Multi-Staff support)
            const staff = await db.select()
                .from(supervisorRegistry)
                .where(eq(supervisorRegistry.districtId, district.id));
            
            if (staff.length === 0) {
                const fallback = process.env.HQ_FALLBACK_PHONE;
                if (fallback) {
                    return this.sendAsync({
                        recipient: fallback,
                        ticketId: options.ticketId,
                        triggerType: "ticket_reopened",
                        isUrgent: options.isUrgent
                    });
                }
                return;
            }

            // 3. Broadcast to all (Log which staff was pinged)
            for (const person of staff) {
                await this.sendAsync({
                    recipient: person.phoneNumber,
                    ticketId: options.ticketId,
                    triggerType: "ticket_reopened",
                    isUrgent: options.isUrgent,
                    variables: { staff_name: person.name }
                });
            }

        } catch (error) {
            console.error("[SMS Service] Supervisor Alert Failure:", error);
        }
    }
    /**
     * Processes the pending retry queue.
     * Called by a background pulse / cron.
     */
    public async processQueue() {
        try {
            const now = new Date();
            const pendingJobs = await db.select()
                .from(smsJobs)
                .where(and(
                    eq(smsJobs.status, "PENDING"),
                    lt(smsJobs.nextAttemptAt, now)
                ))
                .limit(10); // Process in small batches

            if (pendingJobs.length === 0) return;

            console.log(`[SMS Queue] Processing ${pendingJobs.length} retry jobs...`);

            for (const job of pendingJobs) {
                await this.dispatch({
                    recipient: job.recipient,
                    ticketId: job.ticketId || undefined,
                    triggerType: job.triggerType || "retry_dispatch",
                    isUrgent: job.content.includes("[URGENT]")
                }).catch(e => {
                    console.warn(`[SMS Queue] Job ${job.id} failed again. Logged for next retry.`);
                });
            }
        } catch (e) {
            console.error("[SMS Queue] Process Queue Failure:", e);
        }
    }
}

export const smsService = SMSService.getInstance();
