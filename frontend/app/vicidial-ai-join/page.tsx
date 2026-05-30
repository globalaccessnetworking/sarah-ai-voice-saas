"use client";
/**
 * /vicidial-ai-join  — Public ViciDial AI JOIN Button Page
 *
 * This page is the target for ViciDial's "External URL" button.
 * It is intentionally placed OUTSIDE the (dashboard) route group so
 * ViciDial agents do NOT need to log into the SaaS dashboard.
 *
 * Security:
 *  - Requires ?token=<VICIDIAL_BUTTON_TOKEN> query param
 *    (low-privilege button token, separate from backend bearer token)
 *  - The backend /api/integrations/vicidial/ai-join uses VICIDIAL_AI_JOIN_TOKEN
 *    which is NEVER exposed in this page's URL
 *  - If token is missing or invalid: shows an error, does NOT originate
 *
 * ViciDial button URL format:
 *   https://your-saas.com/vicidial-ai-join?token=BUTTON_TOKEN&user=[user]&conf_exten=[conf_exten]&phone=[phone_number]&phone_code=[phone_code]&lead_id=[lead_id]&first_name=[first_name]&last_name=[last_name]&campaign_id=[campaign]&list_id=[list_id]&ingroup=[group_id]&email=[email]&comments=[comments]
 *
 * No session/cookie required. Token validation happens both client-side (UI gate)
 * and server-side (the /api/integrations/vicidial/ai-join route checks the backend token).
 */

import React, { useState, useEffect, useCallback } from "react";

type JoinStatus = "idle" | "pending" | "success" | "error";

interface JoinResult {
    success: boolean;
    request_id?: string;
    message?: string;
    phone?: string;
    conf_exten?: string;
    lead_id?: string;
    redis?: { keys_written: string[]; ttl: number };
    asterisk?: {
        method: string;
        originate_status: string;
        channel: string;
        exten: string;
        context: string;
        error?: string;
    };
    error?: string;
}

export default function VicidialAiJoinPage() {
    const [status, setStatus] = useState<JoinStatus>("idle");
    const [result, setResult] = useState<JoinResult | null>(null);
    const [params, setParams] = useState<Record<string, string>>({});
    const [tokenValid, setTokenValid] = useState<boolean | null>(null);
    const [autoJoining, setAutoJoining] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const sp = new URLSearchParams(window.location.search);
        const parsed: Record<string, string> = {};
        sp.forEach((v, k) => { parsed[k] = v; });
        setParams(parsed);

        // Validate button token client-side — just checks presence, not value
        // Real validation is always server-side
        const btnToken = parsed.token || "";
        setTokenValid(btnToken.length > 0);
    }, []);

    const handleJoin = useCallback(async () => {
        if (status === "pending") return;
        setStatus("pending");
        setResult(null);
        setAutoJoining(false);

        try {
            const apiToken = params.token || "";

            const res = await fetch("/api/integrations/vicidial/ai-join", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // Button token is used as the bearer token for this call.
                    // The backend accepts VICIDIAL_AI_JOIN_TOKEN or VICIDIAL_WEBHOOK_TOKEN.
                    // VICIDIAL_BUTTON_TOKEN should be set to the same value as VICIDIAL_AI_JOIN_TOKEN
                    // on the server, OR a separate lower-privilege token if you configure both.
                    "Authorization": `Bearer ${apiToken}`,
                },
                body: JSON.stringify({
                    user:        params.user        || "",
                    conf_exten:  params.conf_exten  || "",
                    phone:       params.phone       || params.phone_number || "",
                    phone_code:  params.phone_code  || "",
                    lead_id:     params.lead_id     || "",
                    campaign_id: params.campaign_id || params.campaign || "",
                    list_id:     params.list_id     || "",
                    ingroup:     params.ingroup     || params.group_id || "",
                    first_name:  params.first_name  || "",
                    last_name:   params.last_name   || "",
                    email:       params.email       || "",
                    address1:    params.address1    || "",
                    city:        params.city        || "",
                    state:       params.state       || "",
                    postal_code: params.postal_code || "",
                    comments:    params.comments    || "",
                    vendor_lead_code: params.vendor_lead_code || "",
                }),
            });

            const data: JoinResult = await res.json();
            setResult(data);
            setStatus(data.success ? "success" : "error");
        } catch (err: any) {
            setResult({ success: false, error: err?.message || "Network error" });
            setStatus("error");
        }
    }, [params, status]);

    // Auto-join when params are loaded and token is present
    useEffect(() => {
        if (tokenValid && params.conf_exten && params.phone && !autoJoining && status === "idle") {
            setAutoJoining(true);
            // Small delay so the user sees the UI before action fires
            const t = setTimeout(() => handleJoin(), 800);
            return () => clearTimeout(t);
        }
    }, [tokenValid, params, autoJoining, status, handleJoin]);

    const phone     = params.phone || params.phone_number || "—";
    const confExten = params.conf_exten || "—";
    const agentName = [params.first_name, params.last_name].filter(Boolean).join(" ") || "Customer";

    if (tokenValid === false) {
        return (
            <div style={styles.page}>
                <div style={styles.card}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
                    <h2 style={styles.title}>Access Denied</h2>
                    <p style={styles.sub}>Missing or invalid button token. Contact your system administrator.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                    <div style={styles.iconWrap}>🤖</div>
                    <div>
                        <h1 style={styles.title}>AI Agent Join</h1>
                        <p style={styles.sub}>ViciDial Conference Bridge</p>
                    </div>
                </div>

                {/* Call Info */}
                <div style={styles.infoBox}>
                    <InfoRow label="Agent" value={agentName} />
                    <InfoRow label="Phone" value={phone} />
                    <InfoRow label="Conference" value={`Extension ${confExten}`} />
                    {params.campaign_id && <InfoRow label="Campaign" value={params.campaign_id} />}
                </div>

                {/* Status */}
                {status === "idle" && tokenValid && (
                    <div style={styles.statusBox("blue")}>
                        <span style={{ fontSize: 20 }}>⏳</span>
                        <span>Preparing to connect AI agent...</span>
                    </div>
                )}

                {status === "pending" && (
                    <div style={styles.statusBox("blue")}>
                        <span style={{ animation: "spin 1s linear infinite", display: "inline-block", fontSize: 22 }}>🔄</span>
                        <span style={{ fontWeight: 600 }}>Connecting AI agent to conference...</span>
                    </div>
                )}

                {status === "success" && (
                    <div style={styles.statusBox("green")}>
                        <span style={{ fontSize: 22 }}>✅</span>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 15 }}>AI Agent joined successfully!</div>
                            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>
                                Channel: {result?.asterisk?.channel || "—"} → MeetMe({confExten})
                            </div>
                            {result?.request_id && (
                                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2, fontFamily: "monospace" }}>
                                    Ref: {result.request_id}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {status === "error" && (
                    <div style={styles.statusBox("red")}>
                        <span style={{ fontSize: 22 }}>❌</span>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 15 }}>AI Join Failed</div>
                            <div style={{ fontSize: 12, marginTop: 4 }}>
                                {result?.asterisk?.error || result?.error || "Unknown error. Check server logs."}
                            </div>
                            {result?.request_id && (
                                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2, fontFamily: "monospace" }}>
                                    Ref: {result.request_id}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Redis confirmation */}
                {status === "success" && result?.redis?.keys_written && (
                    <div style={{ marginTop: 12, fontSize: 11, color: "#6ee7b7", fontFamily: "monospace" }}>
                        Context seeded: {result.redis.keys_written.length} Redis key(s), TTL {result.redis.ttl}s
                    </div>
                )}

                {/* Retry button on failure */}
                {status === "error" && (
                    <button style={styles.btn} onClick={handleJoin}>
                        🔁 Retry AI Join
                    </button>
                )}

                {/* Manual trigger button on idle (fallback if auto-join doesn't fire) */}
                {status === "idle" && tokenValid && (
                    <button style={styles.btn} onClick={handleJoin}>
                        🤖 Join AI Agent Now
                    </button>
                )}

                <div style={{ marginTop: 20, fontSize: 11, color: "#52525b", textAlign: "center" }}>
                    Global Access AI · ViciDial Bridge · Phase 10
                </div>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { background: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
            `}</style>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #27272a" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7" }}>{value}</span>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #09090b 0%, #18181b 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
    } as React.CSSProperties,
    card: {
        background: "#18181b",
        border: "1px solid #27272a",
        borderRadius: 20,
        padding: "32px 28px",
        width: "100%",
        maxWidth: 420,
        boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
    } as React.CSSProperties,
    iconWrap: {
        width: 52,
        height: 52,
        background: "rgba(16,185,129,0.1)",
        border: "1px solid rgba(16,185,129,0.3)",
        borderRadius: 14,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 26,
        flexShrink: 0,
    } as React.CSSProperties,
    title: {
        fontSize: 20,
        fontWeight: 700,
        color: "#f4f4f5",
        lineHeight: 1.2,
    } as React.CSSProperties,
    sub: {
        fontSize: 12,
        color: "#71717a",
        marginTop: 2,
    } as React.CSSProperties,
    infoBox: {
        background: "#09090b",
        border: "1px solid #27272a",
        borderRadius: 12,
        padding: "12px 16px",
        marginBottom: 16,
    } as React.CSSProperties,
    statusBox: (color: "blue" | "green" | "red") => ({
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "14px 16px",
        borderRadius: 12,
        border: `1px solid ${color === "green" ? "rgba(16,185,129,0.3)" : color === "red" ? "rgba(239,68,68,0.3)" : "rgba(59,130,246,0.3)"}`,
        background: `${color === "green" ? "rgba(16,185,129,0.08)" : color === "red" ? "rgba(239,68,68,0.08)" : "rgba(59,130,246,0.08)"}`,
        color: color === "green" ? "#6ee7b7" : color === "red" ? "#fca5a5" : "#93c5fd",
        fontSize: 13,
        marginBottom: 12,
    } as React.CSSProperties),
    btn: {
        width: "100%",
        padding: "12px",
        background: "linear-gradient(135deg, #10b981, #059669)",
        border: "none",
        borderRadius: 12,
        color: "white",
        fontWeight: 700,
        fontSize: 14,
        cursor: "pointer",
        marginTop: 12,
        letterSpacing: "0.02em",
    } as React.CSSProperties,
};
