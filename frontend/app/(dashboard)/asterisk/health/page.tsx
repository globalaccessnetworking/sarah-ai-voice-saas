"use client";
import React, { useState, useEffect } from "react";
import {
    Activity, Cpu, HardDrive, Wifi, WifiOff, RefreshCw, 
    CheckCircle2, XCircle, AlertTriangle, Clock, Database,
    Phone, Globe, Zap, Server, BarChart3, TrendingUp
} from "lucide-react";

interface HealthCheck {
    name: string;
    category: string;
    status: "OK" | "Warning" | "Critical" | "Unknown";
    value: string;
    threshold?: string;
    lastChecked: string;
}

const INITIAL_CHECKS: HealthCheck[] = [
    { name: "AMI Connection", category: "Connectivity", status: "OK", value: "Connected", lastChecked: "1s ago" },
    { name: "SIP Registrations", category: "Connectivity", status: "OK", value: "3/3 trunks registered", lastChecked: "5s ago" },
    { name: "Active Channels", category: "Calls", status: "OK", value: "4 active, 1 ringing", lastChecked: "1s ago" },
    { name: "CPU Usage", category: "Resources", status: "OK", value: "12%", threshold: "<80%", lastChecked: "10s ago" },
    { name: "Memory Usage", category: "Resources", status: "OK", value: "38%", threshold: "<85%", lastChecked: "10s ago" },
    { name: "Disk Usage (/var/spool)", category: "Resources", status: "Warning", value: "74%", threshold: "<70%", lastChecked: "30s ago" },
    { name: "MOS Voice Quality", category: "Quality", status: "OK", value: "4.3 / 5.0", threshold: ">3.5", lastChecked: "5s ago" },
    { name: "Packet Loss", category: "Quality", status: "OK", value: "0.1%", threshold: "<2%", lastChecked: "15s ago" },
    { name: "Jitter (RTP)", category: "Quality", status: "OK", value: "2.3 ms", threshold: "<20ms", lastChecked: "15s ago" },
    { name: "Dialplan Load", category: "Core", status: "OK", value: "Loaded (extensions.conf v42)", lastChecked: "1m ago" },
    { name: "CDR Database", category: "Core", status: "OK", value: "PostgreSQL connected", lastChecked: "30s ago" },
    { name: "Recording Monitor", category: "Core", status: "OK", value: "MixMonitor active", lastChecked: "5s ago" },
    { name: "Queue Manager", category: "Queues", status: "OK", value: "3 queues, 7 members", lastChecked: "5s ago" },
    { name: "Asterisk Version", category: "Core", status: "OK", value: "20.8.1 (LTS)", lastChecked: "—" },
    { name: "Uptime", category: "Core", status: "OK", value: "14d 6h 22m", lastChecked: "Live" },
    { name: "AGI Server", category: "AI Pipeline", status: "OK", value: "FastAGI on :4573 (connected)", lastChecked: "5s ago" },
    { name: "STT Webhook", category: "AI Pipeline", status: "OK", value: "Deepgram /ws/v1 connected", lastChecked: "10s ago" },
    { name: "LLM Gateway", category: "AI Pipeline", status: "OK", value: "GPT-4o endpoint responding (142ms)", lastChecked: "15s ago" },
];

const STATUS_CONFIG = {
    OK: { color: "#10b981", bg: "bg-emerald-500/10 border-emerald-500/20", icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> },
    Warning: { color: "#f59e0b", bg: "bg-yellow-500/10 border-yellow-500/20", icon: <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" /> },
    Critical: { color: "#ef4444", bg: "bg-red-500/10 border-red-500/20", icon: <XCircle className="w-3.5 h-3.5 text-red-400" /> },
    Unknown: { color: "#71717a", bg: "bg-zinc-800 border-zinc-700", icon: <RefreshCw className="w-3.5 h-3.5 text-zinc-500" /> },
};

const CATEGORIES = ["All", "Connectivity", "Calls", "Resources", "Quality", "Core", "Queues", "AI Pipeline"];

export default function HealthMonitorPage() {
    const [checks, setChecks] = useState(INITIAL_CHECKS);
    const [catFilter, setCatFilter] = useState("All");
    const [refreshing, setRefreshing] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    const handleRefresh = async () => {
        setRefreshing(true);
        await new Promise(r => setTimeout(r, 1500));
        setRefreshing(false);
        setLastRefresh(new Date());
    };

    const filtered = catFilter === "All" ? checks : checks.filter(c => c.category === catFilter);
    const ok = checks.filter(c => c.status === "OK").length;
    const warnings = checks.filter(c => c.status === "Warning").length;
    const critical = checks.filter(c => c.status === "Critical").length;
    const overallStatus = critical > 0 ? "Critical" : warnings > 0 ? "Warning" : "OK";

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200 p-8 md:p-10">
            <div className="max-w-[1600px] mx-auto space-y-8">

                <div className={`rounded-2xl p-6 flex items-center gap-5 border ${overallStatus === "OK" ? "bg-emerald-950/20 border-emerald-900/30" : overallStatus === "Warning" ? "bg-yellow-950/20 border-yellow-900/30" : "bg-red-950/20 border-red-900/30"}`}>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${overallStatus === "OK" ? "bg-emerald-500/10 border border-emerald-500/20" : overallStatus === "Warning" ? "bg-yellow-500/10 border border-yellow-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
                        <Activity className={`w-7 h-7 ${overallStatus === "OK" ? "text-emerald-400" : overallStatus === "Warning" ? "text-yellow-400" : "text-red-400"}`} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-xl font-bold text-white">Asterisk Health Monitor</h1>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${overallStatus === "OK" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : overallStatus === "Warning" ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" : "text-red-400 bg-red-500/10 border-red-500/20"}`}>
                                System {overallStatus}
                            </span>
                        </div>
                        <p className="text-xs text-zinc-400">Real-time health checks across all Asterisk subsystems: SIP trunks, channels, resources, voice quality, AI pipeline, and CDR database. Last refresh: {lastRefresh.toLocaleTimeString()}</p>
                    </div>
                    <div className="flex gap-5">
                        <div className="text-center"><div className="text-2xl font-bold text-emerald-400">{ok}</div><div className="text-[10px] text-zinc-500">OK</div></div>
                        <div className="text-center"><div className="text-2xl font-bold text-yellow-400">{warnings}</div><div className="text-[10px] text-zinc-500">Warnings</div></div>
                        <div className="text-center"><div className="text-2xl font-bold text-red-400">{critical}</div><div className="text-[10px] text-zinc-500">Critical</div></div>
                        <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-bold transition-colors">
                            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
                        </button>
                    </div>
                </div>

                {/* Category pills */}
                <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => setCatFilter(cat)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${catFilter === cat ? "bg-orange-600 text-white" : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200"}`}>
                            {cat}
                            {cat !== "All" && (
                                <span className="ml-1.5 text-[9px] opacity-60">
                                    {checks.filter(c => c.category === cat).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Health checks grid */}
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map(check => {
                        const cfg = STATUS_CONFIG[check.status];
                        return (
                            <div key={check.name} className={`bg-zinc-900 border rounded-xl p-4 flex items-start gap-3 ${check.status !== "OK" ? `border-${check.status === "Warning" ? "yellow" : "red"}-900/40` : "border-zinc-800"}`}>
                                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${cfg.bg}`}>
                                    {cfg.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className="text-xs font-bold text-zinc-200">{check.name}</span>
                                        <span className="text-[9px] text-zinc-600">{check.lastChecked}</span>
                                    </div>
                                    <div className="text-[10px] text-zinc-500 mb-1">{check.category}</div>
                                    <div className="text-xs font-mono font-bold" style={{ color: cfg.color }}>{check.value}</div>
                                    {check.threshold && <div className="text-[9px] text-zinc-600 mt-0.5">Threshold: {check.threshold}</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
