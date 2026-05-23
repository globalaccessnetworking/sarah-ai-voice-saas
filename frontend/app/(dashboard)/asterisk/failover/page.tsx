"use client";
import React, { useState } from "react";
import {
    Shield, AlertTriangle, CheckCircle2, XCircle, RefreshCw,
    ArrowRight, Clock, Zap, Settings, Plus, ToggleLeft, ToggleRight,
    TrendingDown, Globe, History
} from "lucide-react";

interface TrunkPair {
    id: string;
    name: string;
    primary: string;
    backup: string;
    status: "Primary Active" | "Backup Active" | "Failing Over" | "Both Down";
    triggers: string[];
    lastFailover: string | null;
    failovers30d: number;
    autoRecover: boolean;
    healthCheck: boolean;
}

const TRUNK_PAIRS: TrunkPair[] = [
    {
        id: "tp1", name: "AU Main Traffic",
        primary: "Vonex-AU-Primary", backup: "MyNetFone-AU",
        status: "Primary Active", triggers: ["SIP 503", "SIP 504", "Registration Loss", "Timeout >5s"],
        lastFailover: "2026-03-08T14:22:00Z", failovers30d: 2,
        autoRecover: true, healthCheck: true,
    },
    {
        id: "tp2", name: "AU Overflow",
        primary: "MyNetFone-AU", backup: "Symbio-AU-Backup",
        status: "Primary Active", triggers: ["SIP 503", "Max Channels Reached"],
        lastFailover: null, failovers30d: 0,
        autoRecover: true, healthCheck: true,
    },
    {
        id: "tp3", name: "Global Fallback",
        primary: "Symbio-AU-Backup", backup: "Telnyx-Global",
        status: "Primary Active", triggers: ["SIP 503", "SIP 504", "Packet Loss >5%"],
        lastFailover: "2026-02-20T09:10:00Z", failovers30d: 1,
        autoRecover: false, healthCheck: false,
    },
];

const EVENT_LOG = [
    { time: "2026-03-08 14:22:31", pair: "AU Main Traffic", event: "Failover triggered (SIP 503 from Vonex)", direction: "Primary → Backup", recoverIn: "8m 42s" },
    { time: "2026-03-08 14:31:13", pair: "AU Main Traffic", event: "Auto-recovered — Vonex trunk re-registered", direction: "Backup → Primary", recoverIn: "—" },
    { time: "2026-02-20 09:10:05", pair: "Global Fallback", event: "Failover triggered (Registration loss on Symbio)", direction: "Primary → Backup", recoverIn: "Manual" },
];

const STATUS_CONFIG = {
    "Primary Active": { color: "#10b981", bg: "bg-emerald-500/10", border: "border-emerald-500/20", dot: "bg-emerald-400" },
    "Backup Active": { color: "#f59e0b", bg: "bg-yellow-500/10", border: "border-yellow-500/20", dot: "bg-yellow-400" },
    "Failing Over": { color: "#6366f1", bg: "bg-violet-500/10", border: "border-violet-500/20", dot: "bg-violet-400 animate-pulse" },
    "Both Down": { color: "#ef4444", bg: "bg-red-500/10", border: "border-red-500/20", dot: "bg-red-400 animate-pulse" },
};

export default function FailoverPage() {
    const [pairs, setPairs] = useState(TRUNK_PAIRS);

    const triggerFailover = (id: string) => {
        setPairs(prev => prev.map(p => {
            if (p.id !== id) return p;
            if (p.status === "Primary Active") return { ...p, status: "Failing Over" as const };
            if (p.status === "Backup Active") return { ...p, status: "Primary Active" as const };
            return p;
        }));
        setTimeout(() => {
            setPairs(prev => prev.map(p => p.id === id && p.status === "Failing Over" ? { ...p, status: "Backup Active" as const } : p));
        }, 2000);
    };

    const toggleOption = (id: string, key: "autoRecover" | "healthCheck") => {
        setPairs(prev => prev.map(p => p.id === id ? { ...p, [key]: !p[key] } : p));
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200 p-8 md:p-10">
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* Header */}
                <div className="bg-gradient-to-r from-red-950/40 to-orange-950/30 border border-red-900/30 rounded-2xl p-6 flex items-center gap-5">
                    <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center">
                        <Shield className="w-7 h-7 text-red-400" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-white mb-1">Carrier Failover & Redundancy</h1>
                        <p className="text-xs text-zinc-400">When a primary SIP trunk fails (SIP 503/504, registration loss, packet loss), Asterisk auto-fails over to backup carrier in under 2 seconds. Zero call drops.</p>
                    </div>
                    <div className="flex gap-6">
                        <div className="text-right">
                            <div className="text-2xl font-bold text-emerald-400">{pairs.filter(p => p.status === "Primary Active").length}/{pairs.length}</div>
                            <div className="text-[10px] text-zinc-500">Primary Active</div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-white">{pairs.reduce((s, p) => s + p.failovers30d, 0)}</div>
                            <div className="text-[10px] text-zinc-500">Failovers (30d)</div>
                        </div>
                    </div>
                </div>

                {/* Trunk pairs */}
                <div className="space-y-5">
                    {pairs.map(pair => {
                        const cfg = STATUS_CONFIG[pair.status];
                        return (
                            <div key={pair.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                                <div className="flex items-start justify-between mb-5">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-sm font-bold text-white">{pair.name}</h3>
                                            <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.border}`} style={{ color: cfg.color }}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} /> {pair.status}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-zinc-500">
                                            {pair.failovers30d} failovers this month · Last: {pair.lastFailover ? new Date(pair.lastFailover).toLocaleDateString() : "Never"}
                                        </div>
                                    </div>
                                    <button onClick={() => triggerFailover(pair.id)}
                                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition-colors flex items-center gap-2">
                                        {pair.status === "Failing Over" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                                        {pair.status === "Backup Active" ? "Recover Primary" : "Force Failover"}
                                    </button>
                                </div>

                                {/* Trunk flow diagram */}
                                <div className="flex items-center gap-3 mb-5 bg-zinc-800/50 rounded-xl p-4">
                                    <div className={`flex-1 text-center py-3 rounded-xl border ${pair.status === "Primary Active" ? "bg-emerald-500/10 border-emerald-500/30" : "bg-zinc-800 border-zinc-700"}`}>
                                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Primary</div>
                                        <div className="text-sm font-bold" style={{ color: pair.status === "Primary Active" ? "#10b981" : "#71717a" }}>{pair.primary}</div>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <ArrowRight className="w-5 h-5 text-zinc-600" />
                                        <span className="text-[9px] text-zinc-600">fails over</span>
                                    </div>
                                    <div className={`flex-1 text-center py-3 rounded-xl border ${pair.status === "Backup Active" ? "bg-yellow-500/10 border-yellow-500/30" : "bg-zinc-800 border-zinc-700"}`}>
                                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Backup</div>
                                        <div className="text-sm font-bold" style={{ color: pair.status === "Backup Active" ? "#f59e0b" : "#71717a" }}>{pair.backup}</div>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-3 gap-4">
                                    <div>
                                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Failover Triggers</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {pair.triggers.map(t => (
                                                <span key={t} className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 col-span-2 justify-end">
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => toggleOption(pair.id, "autoRecover")} className={`text-sm ${pair.autoRecover ? "text-emerald-400" : "text-zinc-600"}`}>
                                                {pair.autoRecover ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                                            </button>
                                            <span className="text-xs text-zinc-400">Auto-Recover</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => toggleOption(pair.id, "healthCheck")} className={`text-sm ${pair.healthCheck ? "text-emerald-400" : "text-zinc-600"}`}>
                                                {pair.healthCheck ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                                            </button>
                                            <span className="text-xs text-zinc-400">Health Check</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Event Log */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-zinc-800"><h2 className="text-sm font-bold text-white">Failover Event History</h2></div>
                    <div className="divide-y divide-zinc-800/50">
                        {EVENT_LOG.map((ev, i) => (
                            <div key={i} className="flex items-center gap-5 px-5 py-4">
                                <span className="font-mono text-[10px] text-zinc-500 w-36 shrink-0">{ev.time}</span>
                                <span className="text-[10px] font-bold text-zinc-300 w-28 shrink-0">{ev.pair}</span>
                                <span className="text-xs text-zinc-400 flex-1">{ev.event}</span>
                                <span className="text-[10px] text-yellow-400 font-mono">{ev.direction}</span>
                                <span className="text-[10px] text-zinc-500">Recovery: {ev.recoverIn}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
