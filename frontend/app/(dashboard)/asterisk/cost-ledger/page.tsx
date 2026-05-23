"use client";
import React, { useState } from "react";
import {
    DollarSign, TrendingUp, TrendingDown, BarChart3, Download,
    Phone, Cpu, Mic, Volume2, AlertCircle, Filter, Calendar,
    Users, Zap, ArrowUp, ArrowDown
} from "lucide-react";

interface CallCost {
    id: string;
    callerNum: string;
    agentName: string;
    clientName: string;
    duration: number;
    date: string;
    carrierCost: number;
    sttCost: number;
    llmCost: number;
    ttsCost: number;
    totalCost: number;
    billedTo: number;
    profit: number;
}

const DEMO_CALLS: CallCost[] = [
    { id: "c1", callerNum: "+61412345678", agentName: "Sarah (Dental)", clientName: "Bright Smiles Dental", duration: 180, date: "2026-03-11", carrierCost: 0.036, sttCost: 0.018, llmCost: 0.054, ttsCost: 0.027, totalCost: 0.135, billedTo: 0.50, profit: 0.365 },
    { id: "c2", callerNum: "+61298765432", agentName: "Alex (Sales)", clientName: "Peak Performance Gym", duration: 245, date: "2026-03-11", carrierCost: 0.049, sttCost: 0.024, llmCost: 0.073, ttsCost: 0.036, totalCost: 0.183, billedTo: 0.70, profit: 0.517 },
    { id: "c3", callerNum: "+61387654321", agentName: "Reception AI", clientName: "City Medical Centre", duration: 92, date: "2026-03-11", carrierCost: 0.018, sttCost: 0.009, llmCost: 0.027, ttsCost: 0.013, totalCost: 0.068, billedTo: 0.25, profit: 0.182 },
    { id: "c4", callerNum: "+61411222333", agentName: "Night AI", clientName: "24h Locksmith", duration: 54, date: "2026-03-10", carrierCost: 0.010, sttCost: 0.005, llmCost: 0.016, ttsCost: 0.008, totalCost: 0.039, billedTo: 0.15, profit: 0.111 },
    { id: "c5", callerNum: "+61422111000", agentName: "Sarah (Dental)", clientName: "Bright Smiles Dental", duration: 310, date: "2026-03-10", carrierCost: 0.062, sttCost: 0.031, llmCost: 0.093, ttsCost: 0.046, totalCost: 0.232, billedTo: 0.80, profit: 0.568 },
];

const BY_CLIENT = [
    { client: "Bright Smiles Dental", calls: 48, totalCost: 6.48, totalBilled: 24.0, profit: 17.52, margin: "73%" },
    { client: "Peak Performance Gym", calls: 31, totalCost: 5.67, totalBilled: 21.7, profit: 16.03, margin: "74%" },
    { client: "City Medical Centre", calls: 28, totalCost: 1.90, totalBilled: 7.0, profit: 5.10, margin: "73%" },
    { client: "24h Locksmith", calls: 12, totalCost: 0.47, totalBilled: 1.8, profit: 1.33, margin: "74%" },
];

function formatDuration(s: number): string {
    const m = Math.floor(s / 60);
    return `${m}m ${s % 60}s`;
}

export default function CostLedgerPage() {
    const [period, setPeriod] = useState<"today" | "7d" | "30d">("today");
    const [tab, setTab] = useState<"calls" | "clients">("clients");

    const totalCost = DEMO_CALLS.reduce((s, c) => s + c.totalCost, 0);
    const totalBilled = DEMO_CALLS.reduce((s, c) => s + c.billedTo, 0);
    const totalProfit = DEMO_CALLS.reduce((s, c) => s + c.profit, 0);
    const margin = Math.round((totalProfit / totalBilled) * 100);

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200 p-8 md:p-10">
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* Header */}
                <div className="bg-gradient-to-r from-green-950/40 to-emerald-950/30 border border-green-900/30 rounded-2xl p-6 flex items-center gap-5">
                    <div className="w-14 h-14 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center">
                        <DollarSign className="w-7 h-7 text-green-400" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-white mb-1">Call Cost Ledger</h1>
                        <p className="text-xs text-zinc-400">Real-time cost breakdown per call: carrier rate + STT compute + LLM tokens + TTS synthesis. Track profitability per AI agent, per client, per campaign.</p>
                    </div>
                    <div className="flex gap-2">
                        {(["today", "7d", "30d"] as const).map(p => (
                            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${period === p ? "bg-green-600 text-white" : "bg-zinc-800 text-zinc-400"}`}>{p}</button>
                        ))}
                    </div>
                </div>

                {/* Top stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Total AI Cost", value: `$${totalCost.toFixed(2)}`, sub: "Carrier + Compute", color: "#ef4444", icon: <TrendingDown className="w-5 h-5" /> },
                        { label: "Total Billed", value: `$${totalBilled.toFixed(2)}`, sub: "Charged to clients", color: "#10b981", icon: <TrendingUp className="w-5 h-5" /> },
                        { label: "Net Profit", value: `$${totalProfit.toFixed(2)}`, sub: "Revenue minus cost", color: "#6366f1", icon: <DollarSign className="w-5 h-5" /> },
                        { label: "Profit Margin", value: `${margin}%`, sub: "On AI call minutes", color: "#f59e0b", icon: <BarChart3 className="w-5 h-5" /> },
                    ].map(stat => (
                        <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-2" style={{ color: stat.color }}>{stat.icon}</div>
                            <div className="text-2xl font-bold font-mono" style={{ color: stat.color }}>{stat.value}</div>
                            <div className="text-xs font-bold text-zinc-300 mt-1">{stat.label}</div>
                            <div className="text-[10px] text-zinc-600">{stat.sub}</div>
                        </div>
                    ))}
                </div>

                {/* Cost breakdown bars */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <h2 className="text-sm font-bold text-white mb-5">Average Cost Breakdown Per Call Minute</h2>
                    <div className="space-y-4">
                        {[
                            { label: "Carrier (PJSIP Direct)", pct: 27, cost: "$0.012/min", color: "#06b6d4", icon: <Phone className="w-3.5 h-3.5" /> },
                            { label: "STT (Deepgram Nova-2)", pct: 13, cost: "$0.0059/min", color: "#6366f1", icon: <Mic className="w-3.5 h-3.5" /> },
                            { label: "LLM (GPT-4o Mini)", pct: 40, cost: "$0.018/min", color: "#f59e0b", icon: <Cpu className="w-3.5 h-3.5" /> },
                            { label: "TTS (Cartesia Sonic)", pct: 20, cost: "$0.009/min", color: "#ec4899", icon: <Volume2 className="w-3.5 h-3.5" /> },
                        ].map(item => (
                            <div key={item.label} className="flex items-center gap-4">
                                <div style={{ color: item.color }} className="shrink-0">{item.icon}</div>
                                <div className="w-40 text-xs text-zinc-400 shrink-0">{item.label}</div>
                                <div className="flex-1 bg-zinc-800 rounded-full h-2.5">
                                    <div className="h-2.5 rounded-full" style={{ width: `${item.pct}%`, background: item.color }} />
                                </div>
                                <div className="w-20 text-right text-xs font-mono font-bold" style={{ color: item.color }}>{item.cost}</div>
                                <div className="w-10 text-right text-[10px] text-zinc-500">{item.pct}%</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="flex border-b border-zinc-800">
                        {([["clients", "By Client"], ["calls", "Per Call"]] as const).map(([key, label]) => (
                            <button key={key} onClick={() => setTab(key)} className={`px-5 py-3 text-xs font-bold uppercase tracking-widest transition-all ${tab === key ? "text-white border-b-2 border-green-500 bg-green-500/5" : "text-zinc-500 hover:text-zinc-300"}`}>{label}</button>
                        ))}
                        <div className="ml-auto flex items-center pr-4">
                            <button className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 px-3 py-1.5 rounded-lg">
                                <Download className="w-3 h-3" /> Export CSV
                            </button>
                        </div>
                    </div>

                    {tab === "clients" && (
                        <div className="divide-y divide-zinc-800/50">
                            <div className="grid grid-cols-12 px-5 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                <div className="col-span-3">Client</div>
                                <div className="col-span-1">Calls</div>
                                <div className="col-span-2">Cost</div>
                                <div className="col-span-2">Billed</div>
                                <div className="col-span-2">Profit</div>
                                <div className="col-span-2">Margin</div>
                            </div>
                            {BY_CLIENT.map(row => (
                                <div key={row.client} className="grid grid-cols-12 items-center px-5 py-4 hover:bg-zinc-800/20">
                                    <div className="col-span-3 text-sm font-bold text-zinc-200">{row.client}</div>
                                    <div className="col-span-1 text-sm text-zinc-400">{row.calls}</div>
                                    <div className="col-span-2 font-mono text-sm text-red-400">${row.totalCost.toFixed(2)}</div>
                                    <div className="col-span-2 font-mono text-sm text-emerald-400">${row.totalBilled.toFixed(2)}</div>
                                    <div className="col-span-2 font-mono text-sm text-violet-400">${row.profit.toFixed(2)}</div>
                                    <div className="col-span-2">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-zinc-800 rounded-full h-1.5">
                                                <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: row.margin }} />
                                            </div>
                                            <span className="text-xs font-bold text-emerald-400">{row.margin}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {tab === "calls" && (
                        <div className="divide-y divide-zinc-800/50">
                            <div className="grid grid-cols-12 px-5 py-2 text-[10px] font-bold text-zinc-500 uppercase">
                                <div className="col-span-2">Caller</div>
                                <div className="col-span-2">Agent</div>
                                <div className="col-span-1">Duration</div>
                                <div className="col-span-1">Carrier</div>
                                <div className="col-span-1">STT</div>
                                <div className="col-span-1">LLM</div>
                                <div className="col-span-1">TTS</div>
                                <div className="col-span-1">Total</div>
                                <div className="col-span-1">Billed</div>
                                <div className="col-span-1">Profit</div>
                            </div>
                            {DEMO_CALLS.map(call => (
                                <div key={call.id} className="grid grid-cols-12 items-center px-5 py-3 hover:bg-zinc-800/20 text-xs">
                                    <div className="col-span-2 font-mono text-zinc-400">{call.callerNum}</div>
                                    <div className="col-span-2 text-zinc-300">{call.agentName}</div>
                                    <div className="col-span-1 text-zinc-500">{formatDuration(call.duration)}</div>
                                    <div className="col-span-1 font-mono text-zinc-400">${call.carrierCost.toFixed(3)}</div>
                                    <div className="col-span-1 font-mono text-zinc-400">${call.sttCost.toFixed(3)}</div>
                                    <div className="col-span-1 font-mono text-zinc-400">${call.llmCost.toFixed(3)}</div>
                                    <div className="col-span-1 font-mono text-zinc-400">${call.ttsCost.toFixed(3)}</div>
                                    <div className="col-span-1 font-mono text-red-400 font-bold">${call.totalCost.toFixed(3)}</div>
                                    <div className="col-span-1 font-mono text-emerald-400">${call.billedTo.toFixed(2)}</div>
                                    <div className="col-span-1 font-mono text-violet-400">${call.profit.toFixed(3)}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
