"use client";
import React, { useState } from "react";
import {
    Shield, Lock, Globe, AlertTriangle, CheckCircle2, XCircle,
    Eye, Trash2, Plus, Clock, Activity, RefreshCw, Ban, Star
} from "lucide-react";

interface BannedIP {
    ip: string;
    reason: string;
    bannedAt: string;
    expiresAt: string;
    attempts: number;
    country: string;
}

interface WhitelistedIP {
    ip: string;
    label: string;
    addedAt: string;
    addedBy: string;
}

interface AuditEvent {
    time: string;
    user: string;
    action: string;
    target: string;
    severity: "info" | "warning" | "critical";
}

const BANNED_IPS: BannedIP[] = [
    { ip: "185.220.101.47", reason: "Brute force — 28 failed auth attempts", bannedAt: "2026-03-10 08:14", expiresAt: "2026-03-10 20:14", attempts: 28, country: "🇷🇺 RU" },
    { ip: "103.21.244.0", reason: "Automated scanner — SIP flood attack", bannedAt: "2026-03-09 14:32", expiresAt: "2026-03-16 14:32", attempts: 512, country: "🇨🇳 CN" },
    { ip: "45.155.205.233", reason: "Repeated unauthorized API access", bannedAt: "2026-03-08 09:55", expiresAt: "Permanent", attempts: 14, country: "🇩🇪 DE" },
];

const WHITELISTED_IPS: WhitelistedIP[] = [
    { ip: "220.240.XX.XX", label: "Head Office — Sydney", addedAt: "2026-01-15", addedBy: "admin@globalaccess.com.au" },
    { ip: "192.168.1.0/24", label: "Internal LAN", addedAt: "2026-01-15", addedBy: "admin@globalaccess.com.au" },
    { ip: "10.0.0.0/8", label: "VPN Subnet", addedAt: "2026-02-01", addedBy: "ops@globalaccess.com.au" },
];

const AUDIT_LOG: AuditEvent[] = [
    { time: "2026-03-10 14:22", user: "admin", action: "Updated", target: "Agent 'Receptionist AI' system prompt", severity: "info" },
    { time: "2026-03-10 11:04", user: "admin", action: "Banned IP", target: "185.220.101.47 (Fail2Ban)", severity: "warning" },
    { time: "2026-03-10 09:32", user: "admin", action: "Rotated", target: "LiveKit API Key", severity: "warning" },
    { time: "2026-03-09 18:15", user: "ops-user", action: "Exported", target: "Call History — 90 days", severity: "info" },
    { time: "2026-03-09 14:33", user: "system", action: "Auto-banned", target: "103.21.244.0 via SIP flood detection", severity: "critical" },
    { time: "2026-03-08 12:10", user: "admin", action: "Added Whitelist", target: "220.240.XX.XX — Sydney Office", severity: "info" },
];

const severityStyles = {
    info: { color: "#06b6d4", bg: "#06b6d410", label: "Info" },
    warning: { color: "#f59e0b", bg: "#f59e0b10", label: "Warning" },
    critical: { color: "#ef4444", bg: "#ef444410", label: "Critical" },
};

export default function SecurityCentrePage() {
    const [fail2banEnabled, setFail2banEnabled] = useState(true);
    const [rateLimitEnabled, setRateLimitEnabled] = useState(true);
    const [twoFaEnabled, setTwoFaEnabled] = useState(false);

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="w-9 h-9 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center">
                            <Shield className="w-5 h-5 text-red-400" />
                        </div>
                        Security Command Centre
                    </h1>
                    <p className="text-xs text-zinc-500 mt-1 ml-12">Infrastructure protection, IP management, and compliance audit trail.</p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-950/30 border border-emerald-900/30 px-4 py-2 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-emerald-400 font-bold">All Systems Secure</span>
                </div>
            </div>

            {/* Protection KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Banned IPs", value: "3", sub: "1 auto-banned today", color: "#ef4444", icon: <Ban className="w-4 h-4" /> },
                    { label: "Whitelisted IPs", value: "3", sub: "Bypass all limits", color: "#10b981", icon: <Star className="w-4 h-4" /> },
                    { label: "Auth Failures (24h)", value: "42", sub: "12 auto-blocked", color: "#f59e0b", icon: <AlertTriangle className="w-4 h-4" /> },
                    { label: "Audit Events (7d)", value: "128", sub: "6 high-priority", color: "#6366f1", icon: <Eye className="w-4 h-4" /> },
                ].map(s => (
                    <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.color + "15", color: s.color }}>{s.icon}</div>
                        <div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-widest">{s.label}</div>
                            <div className="text-2xl font-bold text-white">{s.value}</div>
                            <div className="text-[10px] text-zinc-600">{s.sub}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Protection Toggles */}
            <div className="grid lg:grid-cols-3 gap-4">
                {[
                    { label: "IP Protection (Fail2Ban)", desc: "Auto-ban IPs with 10+ failed auth attempts in 30 min", enabled: fail2banEnabled, toggle: () => setFail2banEnabled(p => !p), color: "#10b981" },
                    { label: "API Rate Limiting", desc: "Max 200 API calls/min per token. Blocks burst attacks.", enabled: rateLimitEnabled, toggle: () => setRateLimitEnabled(p => !p), color: "#10b981" },
                    { label: "Two-Factor Auth (2FA)", desc: "Require TOTP for all admin logins", enabled: twoFaEnabled, toggle: () => setTwoFaEnabled(p => !p), color: "#f59e0b" },
                ].map(item => (
                    <div key={item.label} className={`bg-zinc-900 border rounded-xl p-5 flex items-start gap-4 transition-all ${item.enabled ? "border-zinc-700" : "border-red-900/30 bg-red-950/10"}`}>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                {item.enabled
                                    ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    : <XCircle className="w-4 h-4 text-red-400" />
                                }
                                <span className="text-sm font-bold text-white">{item.label}</span>
                            </div>
                            <p className="text-xs text-zinc-500">{item.desc}</p>
                        </div>
                        <button
                            onClick={item.toggle}
                            className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 mt-1 ${item.enabled ? "bg-emerald-600" : "bg-zinc-700"}`}
                        >
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${item.enabled ? "right-0.5" : "left-0.5"}`} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Grid: Banned IPs + Whitelisted IPs */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Banned IPs */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2"><Ban className="w-4 h-4 text-red-400" /> Banned IPs</h3>
                        <span className="text-[10px] text-zinc-500">Auto-managed by Fail2Ban</span>
                    </div>
                    <div className="space-y-3">
                        {BANNED_IPS.map(b => (
                            <div key={b.ip} className="p-3 bg-red-950/20 border border-red-900/30 rounded-xl">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-bold text-red-300">{b.ip}</span>
                                            <span className="text-[10px] text-zinc-500">{b.country}</span>
                                        </div>
                                        <p className="text-[10px] text-zinc-500 mt-0.5">{b.reason}</p>
                                    </div>
                                    <button className="p-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors" title="Unban">
                                        <XCircle className="w-3.5 h-3.5 text-zinc-500 hover:text-emerald-400" />
                                    </button>
                                </div>
                                <div className="flex gap-4 text-[10px] text-zinc-600">
                                    <span>Banned: {b.bannedAt}</span>
                                    <span>Expires: {b.expiresAt}</span>
                                    <span className="text-red-500 font-bold">{b.attempts} attempts</span>
                                </div>
                            </div>
                        ))}
                        <button className="w-full py-2 text-xs text-zinc-500 bg-zinc-800/40 hover:bg-zinc-800 rounded-xl transition-colors flex items-center justify-center gap-2">
                            <Plus className="w-3.5 h-3.5" /> Manually Ban IP
                        </button>
                    </div>
                </div>

                {/* Whitelisted IPs */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Whitelisted IPs</h3>
                        <span className="text-[10px] text-zinc-500">Bypass all rate limits</span>
                    </div>
                    <div className="space-y-3">
                        {WHITELISTED_IPS.map(w => (
                            <div key={w.ip} className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-xl">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <span className="font-mono text-xs font-bold text-emerald-300">{w.ip}</span>
                                        <div className="text-[10px] text-zinc-400 mt-0.5">{w.label}</div>
                                        <div className="text-[10px] text-zinc-600 mt-0.5">Added {w.addedAt} by {w.addedBy}</div>
                                    </div>
                                    <button className="p-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors" title="Remove">
                                        <Trash2 className="w-3.5 h-3.5 text-zinc-500 hover:text-red-400" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button className="w-full py-2 text-xs text-zinc-500 bg-zinc-800/40 hover:bg-zinc-800 rounded-xl transition-colors flex items-center justify-center gap-2">
                            <Plus className="w-3.5 h-3.5" /> Add Trusted IP / Range
                        </button>
                    </div>
                </div>
            </div>

            {/* Audit Log */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2"><Activity className="w-4 h-4 text-indigo-400" /> Audit Trail</h3>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"><RefreshCw className="w-3 h-3" /> Refresh</button>
                        <button className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors">Export Log</button>
                    </div>
                </div>
                <div className="space-y-2">
                    {AUDIT_LOG.map((evt, i) => {
                        const style = severityStyles[evt.severity];
                        return (
                            <div key={i} className="flex items-start gap-3 p-3 bg-zinc-800/30 rounded-lg hover:bg-zinc-800/60 transition-colors">
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 mt-0.5" style={{ color: style.color, background: style.bg }}>
                                    {style.label}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <span className="text-xs text-zinc-300">
                                        <span className="font-bold text-white">{evt.user}</span> {evt.action} {evt.target}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-zinc-600 shrink-0">
                                    <Clock className="w-3 h-3" />
                                    {evt.time}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
