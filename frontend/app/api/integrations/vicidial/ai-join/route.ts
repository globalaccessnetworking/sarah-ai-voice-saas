/**
 * POST /api/integrations/vicidial/ai-join
 *
 * Phase 10 — Custom ViciDial AI JOIN Bridge
 *
 * Security model:
 *  - Requires Authorization: Bearer <VICIDIAL_AI_JOIN_TOKEN>
 *    (falls back to VICIDIAL_WEBHOOK_TOKEN if dedicated token not set)
 *  - Also supports x-vicidial-token header
 *  - CLI fallback only if AI_JOIN_ENABLE_CLI_FALLBACK=true (off by default)
 *  - ALL inputs strictly validated — no shell metacharacters, digits-only where required
 *  - Context always fixed to "default", never user-supplied
 *  - Channel always SIP/<AI_JOIN_SIP_PEER>/<phone>, never user-supplied
 *  - Full structured audit log on every request
 *
 * Asterisk AMI user: ai_join (dedicated, localhost-only, originate permission only)
 * See: /etc/asterisk/manager.conf  and server .env.local for ASTERISK_AMI_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import net from "net";
import { isRedisClientConnected, getSanitizedRedisTarget } from "@/lib/redis";
import {
    normalizePhone,
    validateConfExten,
    validateSafeId,
    buildContextPayload,
    seedVicidialContext,
    VICIDIAL_CONTEXT_TTL,
} from "@/lib/vicidial-context";

const execFileAsync = promisify(execFile);

// ─── Authentication ───────────────────────────────────────────────────────────

function getAuthToken(): string {
    // Prefer dedicated AI join token; fall back to shared webhook token
    return (
        process.env.VICIDIAL_AI_JOIN_TOKEN ||
        process.env.VICIDIAL_WEBHOOK_TOKEN ||
        "vicidial_secure_token_2026"
    );
}

function isAuthorized(req: NextRequest): boolean {
    const configToken = getAuthToken();

    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.substring(7).trim();
        if (token === configToken) return true;
    }

    const customHeader = req.headers.get("x-vicidial-token");
    if (customHeader?.trim() === configToken) return true;

    // Optional IP allowlist (shared with lead-context)
    const allowedIpsEnv = process.env.VICIDIAL_ALLOWED_IPS;
    if (allowedIpsEnv) {
        const allowedIps = allowedIpsEnv.split(",").map((ip) => ip.trim());
        const clientIp =
            req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
            req.headers.get("x-real-ip")?.trim();
        if (clientIp && allowedIps.includes(clientIp)) return true;
    }

    return false;
}

// ─── AMI Originate (preferred) ────────────────────────────────────────────────

interface AmiResult {
    method: "AMI" | "CLI_FALLBACK";
    originate_status: "success" | "failure" | "unknown";
    channel: string;
    exten: string;
    context: string;
    raw_response?: string;
    error?: string;
}

async function originateViaAmi(
    phone: string,
    confExten: string,
    leadId: string,
    requestId: string
): Promise<AmiResult> {
    const host    = process.env.ASTERISK_AMI_HOST   || "127.0.0.1";
    const port    = parseInt(process.env.ASTERISK_AMI_PORT || "5038", 10);
    const user    = process.env.ASTERISK_AMI_USER   || "ai_join";
    const secret  = process.env.ASTERISK_AMI_SECRET || "";
    const sipPeer = process.env.AI_JOIN_SIP_PEER    || "LIVEKIT_SIP";
    const context = process.env.AI_JOIN_CONTEXT     || "default";

    const channel = `SIP/${sipPeer}/${phone}`;
    const callerId = `AI_JOIN_${leadId || requestId}`;

    const result: AmiResult = {
        method: "AMI",
        originate_status: "unknown",
        channel,
        exten: confExten,
        context,
    };

    if (!secret) {
        result.originate_status = "failure";
        result.error = "ASTERISK_AMI_SECRET not configured. Add it to .env.local on the server.";
        return result;
    }

    return new Promise((resolve) => {
        const sock = new net.Socket();
        let buffer = "";
        let loginSent = false;
        let originateSent = false;
        let resolved = false;

        const timeout = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                sock.destroy();
                result.originate_status = "failure";
                result.error = "AMI connection timeout after 10s";
                resolve(result);
            }
        }, 10000);

        sock.connect(port, host, () => {
            // Connection established — wait for Asterisk banner
        });

        sock.on("data", (data) => {
            buffer += data.toString();

            // Step 1: Asterisk sends banner — send Login
            if (!loginSent && buffer.includes("Asterisk Call Manager")) {
                loginSent = true;
                const loginAction =
                    `Action: Login\r\n` +
                    `Username: ${user}\r\n` +
                    `Secret: ${secret}\r\n` +
                    `ActionID: ${requestId}-login\r\n\r\n`;
                sock.write(loginAction);
            }

            // Step 2: Login response — send Originate
            if (loginSent && !originateSent && buffer.includes("Response: Success") && buffer.includes(`ActionID: ${requestId}-login`)) {
                originateSent = true;
                const originateAction =
                    `Action: Originate\r\n` +
                    `Channel: ${channel}\r\n` +
                    `Context: ${context}\r\n` +
                    `Exten: ${confExten}\r\n` +
                    `Priority: 1\r\n` +
                    `CallerID: ${callerId}\r\n` +
                    `Timeout: 30000\r\n` +
                    `Async: true\r\n` +
                    `ActionID: ${requestId}-orig\r\n\r\n`;
                sock.write(originateAction);
            }

            // Step 3: Originate response — parse and close
            if (originateSent && buffer.includes(`ActionID: ${requestId}-orig`)) {
                const isSuccess = buffer.includes("Response: Success") &&
                    buffer.includes(`ActionID: ${requestId}-orig`);
                const isFailure = buffer.includes("Response: Error") &&
                    buffer.includes(`ActionID: ${requestId}-orig`);

                if (isSuccess || isFailure) {
                    if (!resolved) {
                        resolved = true;
                        clearTimeout(timeout);
                        result.originate_status = isSuccess ? "success" : "failure";
                        if (!isSuccess) {
                            const match = buffer.match(/Message:\s*(.+)/);
                            result.error = match ? match[1].trim() : "AMI returned error";
                        }
                        // Logout cleanly
                        sock.write(`Action: Logoff\r\nActionID: ${requestId}-logoff\r\n\r\n`);
                        setTimeout(() => sock.destroy(), 500);
                        resolve(result);
                    }
                }
            }

            // Login failure
            if (loginSent && buffer.includes("Response: Error") && buffer.includes(`ActionID: ${requestId}-login`)) {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    result.originate_status = "failure";
                    result.error = "AMI login failed — check ASTERISK_AMI_USER and ASTERISK_AMI_SECRET";
                    sock.destroy();
                    resolve(result);
                }
            }
        });

        sock.on("error", (err) => {
            if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                result.originate_status = "failure";
                result.error = `AMI socket error: ${err.message}`;
                resolve(result);
            }
        });

        sock.on("close", () => {
            if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                if (result.originate_status === "unknown") {
                    result.originate_status = "failure";
                    result.error = "AMI connection closed before response";
                }
                resolve(result);
            }
        });
    });
}

// ─── CLI Fallback (only if AI_JOIN_ENABLE_CLI_FALLBACK=true) ─────────────────

async function originateViaCli(
    phone: string,
    confExten: string
): Promise<AmiResult> {
    const sipPeer = process.env.AI_JOIN_SIP_PEER || "LIVEKIT_SIP";
    const context = process.env.AI_JOIN_CONTEXT  || "default";
    const channel = `SIP/${sipPeer}/${phone}`;

    const result: AmiResult = {
        method: "CLI_FALLBACK",
        originate_status: "unknown",
        channel,
        exten: confExten,
        context,
    };

    try {
        // execFile with FIXED executable + ARRAY args — no shell, no injection risk
        const amiCommand = `channel originate ${channel} extension ${confExten}@${context}`;
        const { stdout, stderr } = await execFileAsync(
            "/usr/sbin/asterisk",
            ["-rx", amiCommand],
            { timeout: 15000 }
        );
        result.originate_status = "success";
        result.raw_response = (stdout || "").trim();
        if (stderr?.trim()) {
            console.warn(`[AI_JOIN] CLI stderr: ${stderr.trim()}`);
        }
    } catch (err: any) {
        result.originate_status = "failure";
        result.error = err?.message || "CLI originate failed";
    }

    return result;
}

// ─── Main Route Handler ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    const requestId = crypto.randomUUID();
    const requestedAt = new Date().toISOString();

    // Capture IP for audit log (never expose in response)
    const sourceIp =
        req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        req.headers.get("x-real-ip")?.trim() ||
        "unknown";

    // 1. Authentication
    if (!isAuthorized(req)) {
        console.warn(`[AI_JOIN] [${requestId}] Unauthorized request from ${sourceIp}`);
        return NextResponse.json(
            { error: "Unauthorized. Valid token required.", request_id: requestId },
            { status: 401 }
        );
    }

    let body: Record<string, any> = {};
    try {
        body = await req.json();
    } catch {
        return NextResponse.json(
            { error: "Invalid JSON body", request_id: requestId },
            { status: 400 }
        );
    }

    // 2. Validate and sanitize inputs
    const cleanPhone = normalizePhone(
        body.phone,
        body.phone_number,
        body.phone_code
    );
    if (!cleanPhone) {
        return NextResponse.json(
            { error: "Invalid phone. Must be 7–15 digits only.", request_id: requestId },
            { status: 400 }
        );
    }

    const cleanConfExten = validateConfExten(body.conf_exten || body.confExten);
    if (!cleanConfExten) {
        return NextResponse.json(
            { error: "Invalid conf_exten. Must be 4–12 digits only.", request_id: requestId },
            { status: 400 }
        );
    }

    // Validate safe identifier fields — reject if any contain shell metacharacters
    const cleanUser       = validateSafeId(body.user, 50);
    const cleanLeadId     = validateSafeId(body.lead_id || body.leadId, 100);
    const cleanCampaignId = validateSafeId(body.campaign_id || body.campaign, 100);
    const cleanListId     = validateSafeId(body.list_id, 100);
    const cleanIngroup    = validateSafeId(body.ingroup, 100);

    // Audit log — structured, never leaks secrets
    console.log(`[AI_JOIN] [${requestId}] Request: ip=${sourceIp} user=${cleanUser} phone=${cleanPhone} conf_exten=${cleanConfExten} lead_id=${cleanLeadId} campaign=${cleanCampaignId}`);

    // 3. Seed Redis with ViciDial context BEFORE originating
    //    This ensures the worker finds lookup_hit=true when it connects
    const contextPayload = buildContextPayload(body, cleanPhone);
    // Override with cleaned validated IDs
    contextPayload.vicidial_campaign_id = cleanCampaignId;
    contextPayload.vicidial_list_id     = cleanListId;
    contextPayload.vicidial_ingroup     = cleanIngroup;
    contextPayload.vicidial_lead_id     = cleanLeadId;

    const seedResult = await seedVicidialContext(contextPayload, VICIDIAL_CONTEXT_TTL);

    if (!seedResult.success) {
        console.error(`[AI_JOIN] [${requestId}] Redis seed failed: ${seedResult.error}`);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to seed Redis context. Cannot proceed with originate.",
                request_id: requestId,
                redis: { error: seedResult.error, keys_written: seedResult.keys_written },
            },
            { status: 500 }
        );
    }

    console.log(`[AI_JOIN] [${requestId}] Redis seeded keys=${seedResult.keys_written.join(", ")} ttl=${VICIDIAL_CONTEXT_TTL}s`);

    // 4. Originate AI SIP leg into conference
    const useCliFallback = process.env.AI_JOIN_ENABLE_CLI_FALLBACK === "true";
    let amiResult: AmiResult;

    // Always try AMI first
    amiResult = await originateViaAmi(cleanPhone, cleanConfExten, cleanLeadId, requestId);

    console.log(`[AI_JOIN] [${requestId}] AMI result: status=${amiResult.originate_status} channel=${amiResult.channel}`);

    // Fall back to CLI only if explicitly enabled AND AMI failed
    if (amiResult.originate_status !== "success" && useCliFallback) {
        console.warn(`[AI_JOIN] [${requestId}] AMI failed (${amiResult.error}), falling back to CLI (AI_JOIN_ENABLE_CLI_FALLBACK=true)`);
        amiResult = await originateViaCli(cleanPhone, cleanConfExten);
        console.log(`[AI_JOIN] [${requestId}] CLI result: status=${amiResult.originate_status}`);
    } else if (amiResult.originate_status !== "success" && !useCliFallback) {
        console.error(`[AI_JOIN] [${requestId}] AMI failed and CLI fallback is disabled. Set AI_JOIN_ENABLE_CLI_FALLBACK=true to enable.`);
    }

    const success = amiResult.originate_status === "success";

    // Final audit log
    console.log(`[AI_JOIN] [${requestId}] Final: success=${success} method=${amiResult.method} phone=${cleanPhone} conf_exten=${cleanConfExten} lead_id=${cleanLeadId}`);

    const httpStatus = success ? 200 : 502;

    return NextResponse.json(
        {
            success,
            request_id: requestId,
            message: success
                ? "AI join originated successfully."
                : `Originate failed via ${amiResult.method}. Redis context was seeded — retry originate manually if needed.`,
            phone: cleanPhone,
            conf_exten: cleanConfExten,
            lead_id: cleanLeadId,
            redis: {
                keys_written: seedResult.keys_written,
                ttl: VICIDIAL_CONTEXT_TTL,
                target: getSanitizedRedisTarget(),
            },
            asterisk: {
                method: amiResult.method,
                originate_status: amiResult.originate_status,
                channel: amiResult.channel,
                exten: amiResult.exten,
                context: amiResult.context,
                // Only include error in response if failure — never expose AMI auth details
                ...(amiResult.originate_status !== "success" && {
                    error: amiResult.error?.includes("SECRET") || amiResult.error?.includes("secret")
                        ? "AMI authentication error. Check server environment configuration."
                        : amiResult.error,
                }),
            },
        },
        { status: httpStatus }
    );
}
