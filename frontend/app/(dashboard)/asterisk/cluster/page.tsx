"use client";
import React, { useState } from "react";
import {
    Globe, Server, Zap, Activity, Shield, CheckCircle2,
    AlertTriangle, RefreshCw, Phone, GitFork, ArrowRight,
    MapPin, Wifi, Clock, ToggleRight, ToggleLeft
} from "lucide-react";

interface ClusterNode {
    id: string;
    name: string;
    region: string;
    country: string;
    flag: string;
    ip: string;
    status: "Healthy" | "Warning" | "Down";
    latencyMs: number;
    activeChannels: number;
    maxChannels: number;
    cpuPct: number;
    memPct: number;
    role: "Primary" | "Secondary" | "Standby";
    carrier: string;
    x: number; // % position on map
    y: number;
}

const NODES: ClusterNode[] = [
    { id: "n1", name: "SYD-01", region: "ap-southeast-2", country: "Sydney, AU", flag: "🇦🇺", ip: "13.210.88.101", status: "Healthy", latencyMs: 18, activeChannels: 12, maxChannels: 200, cpuPct: 22, memPct: 38, role: "Primary", carrier: "Vonex-AU", x: 82, y: 68 },
    { id: "n2", name: "MEL-01", region: "ap-southeast-4", country: "Melbourne, AU", flag: "🇦🇺", ip: "3.104.12.55", status: "Healthy", latencyMs: 24, activeChannels: 7, maxChannels: 200, cpuPct: 14, memPct: 28, role: "Secondary", carrier: "MyNetFone-AU", x: 80, y: 72 },
    { id: "n3", name: "PER-01", region: "ap-southeast-5", country: "Perth, AU", flag: "🇦🇺", ip: "54.206.44.22", status: "Healthy", latencyMs: 31, activeChannels: 3, maxChannels: 100, cpuPct: 8, memPct: 18, role: "Standby", carrier: "Symbio-AU", x: 71, y: 69 },
    { id: "n4", name: "TYO-01", region: "ap-northeast-1", country: "Tokyo, JP", flag: "🇯🇵", ip: "54.168.23.91", status: "Warning", latencyMs: 88, activeChannels: 2, maxChannels: 100, cpuPct: 67, memPct: 71, role: "Standby", carrier: "Telnyx-JP", x: 85, y: 40 },
    { id: "n5", name: "USW-01", region: "us-west-2", country: "Oregon, US", flag: "🇺🇸", ip: "52.11.44.200", status: "Healthy", latencyMs: 145, activeChannels: 1, maxChannels: 100, cpuPct: 5, memPct: 12, role: "Standby", carrier: "Telnyx-US", x: 18, y: 38 },
];

const ROUTING_RULES = [
    { prefix: "+61", region: "au", node: "SYD-01", fallback: "MEL-01", label: "Australian Numbers", flag: "🇦🇺" },
    { prefix: "+81", region: "jp", node: "TYO-01", fallback: "SYD-01", label: "Japanese Numbers", flag: "🇯🇵" },
    { prefix: "+1", region: "us", node: "USW-01", fallback: "SYD-01", label: "North American Numbers", flag: "🇺🇸" },
    { prefix: "+44", region: "eu", node: "SYD-01", fallback: "USW-01", label: "UK Numbers (via SYD)", flag: "🇬🇧" },
];

const STATUS_CONFIG = {
    Healthy: { color: "#10b981", bg: "bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-500" },
    Warning: { color: "#f59e0b", bg: "bg-yellow-500/10 border-yellow-500/20", dot: "bg-yellow-500" },
    Down: { color: "#ef4444", bg: "bg-red-500/10 border-red-500/20", dot: "bg-red-500" },
};

const ROLE_COLORS = { Primary: "#10b981", Secondary: "#06b6d4", Standby: "#6366f1" };

export default function ClusterPage() {
    const [selectedNode, setSelectedNode] = useState<ClusterNode | null>(NODES[0]);
    const [failingOver, setFailingOver] = useState<string | null>(null);

    const doFailover = async (id: string) => {
        setFailingOver(id);
        await new Promise(r => setTimeout(r, 2500));
        setFailingOver(null);
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200 p-8 md:p-10">
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* Header */}
                <div className="bg-gradient-to-r from-teal-950/40 to-emerald-950/30 border border-teal-900/30 rounded-2xl p-6 flex items-center gap-5">
                    <div className="w-14 h-14 bg-teal-500/10 border border-teal-500/20 rounded-2xl flex items-center justify-center">
                        <Globe className="w-7 h-7 text-teal-400" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-white mb-1">Multi-Region Asterisk Cluster</h1>
                        <p className="text-xs text-zinc-400">Geo-distributed Asterisk nodes across AU, JP, and US. Intelligent call routing based on caller prefix and lowest latency. Automatic failover between regions.</p>
                    </div>
                    <div className="flex gap-5">
                        <div className="text-right"><div className="text-2xl font-bold text-teal-400">{NODES.filter(n => n.status === "Healthy").length}/{NODES.length}</div><div className="text-[10px] text-zinc-500">Nodes Healthy</div></div>
                        <div className="text-right"><div className="text-2xl font-bold text-zinc-200">{NODES.reduce((s, n) => s + n.activeChannels, 0)}</div><div className="text-[10px] text-zinc-500">Active Channels</div></div>
                    </div>
                </div>

                {/* World map with nodes */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-teal-400" />
                        <h2 className="text-sm font-bold text-white">Global Node Map</h2>
                    </div>
                    <div className="relative bg-zinc-950 m-4 rounded-xl overflow-hidden" style={{ height: 260 }}>
                        {/* Simple geo background grid */}
                        <div className="absolute inset-0 opacity-5">
                            {Array.from({ length: 9 }).map((_, i) => <div key={i} className="absolute border-b border-zinc-400" style={{ top: `${(i + 1) * 10}%`, width: "100%", height: 1 }} />)}
                            {Array.from({ length: 11 }).map((_, i) => <div key={i} className="absolute border-r border-zinc-400" style={{ left: `${(i + 1) * 9}%`, height: "100%", width: 1 }} />)}
                        </div>
                        {NODES.map(node => {
                            const cfg = STATUS_CONFIG[node.status];
                            return (
                                <button key={node.id} onClick={() => setSelectedNode(node)}
                                    className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                                    style={{ left: `${node.x}%`, top: `${node.y}%` }}>
                                    <div className={`w-4 h-4 rounded-full border-2 ${cfg.dot} border-zinc-900 relative`}>
                                        <div className={`absolute inset-0 rounded-full ${cfg.dot} animate-ping opacity-40`} />
                                    </div>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-[9px] font-bold text-zinc-200 whitespace-nowrap transition-opacity pointer-events-none">
                                        {node.flag} {node.name} · {node.latencyMs}ms · {node.activeChannels}ch
                                    </div>
                                </button>
                            );
                        })}
                        <div className="absolute bottom-2 left-2 flex gap-2 text-[8px]">
                            {(["Healthy", "Warning", "Down"] as const).map(s => (
                                <div key={s} className="flex items-center gap-1">
                                    <div className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].dot}`} />
                                    <span className="text-zinc-500">{s}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Node list */}
                    <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                        <div className="grid grid-cols-12 px-5 py-3 border-b border-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                            <div className="col-span-2">Node</div>
                            <div className="col-span-2">Location</div>
                            <div className="col-span-1">Role</div>
                            <div className="col-span-1">Latency</div>
                            <div className="col-span-2">Channels</div>
                            <div className="col-span-2">CPU / RAM</div>
                            <div className="col-span-2">Actions</div>
                        </div>
                        <div className="divide-y divide-zinc-800/50">
                            {NODES.map(node => {
                                const cfg = STATUS_CONFIG[node.status];
                                const chanPct = (node.activeChannels / node.maxChannels) * 100;
                                return (
                                    <div key={node.id} onClick={() => setSelectedNode(node)}
                                        className={`grid grid-cols-12 items-center px-5 py-4 cursor-pointer hover:bg-zinc-800/20 ${selectedNode?.id === node.id ? "bg-zinc-800/30" : ""}`}>
                                        <div className="col-span-2 flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                            <span className="text-xs font-mono font-bold text-zinc-200">{node.name}</span>
                                        </div>
                                        <div className="col-span-2 text-[10px] text-zinc-400">{node.flag} {node.country.split(",")[0]}</div>
                                        <div className="col-span-1">
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ color: ROLE_COLORS[node.role], background: ROLE_COLORS[node.role] + "15" }}>{node.role}</span>
                                        </div>
                                        <div className="col-span-1 text-xs font-mono" style={{ color: node.latencyMs < 50 ? "#10b981" : node.latencyMs < 100 ? "#f59e0b" : "#ef4444" }}>{node.latencyMs}ms</div>
                                        <div className="col-span-2">
                                            <div className="flex items-center gap-1.5">
                                                <div className="flex-1 bg-zinc-800 rounded-full h-1.5">
                                                    <div className="h-1.5 rounded-full bg-teal-500" style={{ width: `${chanPct}%` }} />
                                                </div>
                                                <span className="text-[9px] text-zinc-400">{node.activeChannels}/{node.maxChannels}</span>
                                            </div>
                                        </div>
                                        <div className="col-span-2 flex gap-2">
                                            <span className="text-[9px] text-zinc-400">CPU {node.cpuPct}%</span>
                                            <span className="text-[9px] text-zinc-400">RAM {node.memPct}%</span>
                                        </div>
                                        <div className="col-span-2">
                                            <button onClick={e => { e.stopPropagation(); doFailover(node.id); }} disabled={failingOver === node.id}
                                                className="text-[9px] font-bold px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1">
                                                {failingOver === node.id ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <GitFork className="w-2.5 h-2.5" />}
                                                Failover
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Routing rules */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
                        <h2 className="text-sm font-bold text-white">Geo Routing Rules</h2>
                        <div className="space-y-3">
                            {ROUTING_RULES.map((rule, i) => (
                                <div key={i} className="bg-zinc-800/60 border border-zinc-800 rounded-xl p-3 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span>{rule.flag}</span>
                                        <span className="text-xs font-bold text-zinc-200">{rule.label}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                                        <code className="bg-black/60 px-1.5 py-0.5 rounded font-mono text-teal-400">{rule.prefix}*</code>
                                        <ArrowRight className="w-3 h-3" />
                                        <span className="font-bold text-zinc-200">{rule.node}</span>
                                        <span className="text-zinc-600">→</span>
                                        <span className="text-zinc-500">{rule.fallback}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold py-2.5 rounded-xl transition-colors">+ Add Routing Rule</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
