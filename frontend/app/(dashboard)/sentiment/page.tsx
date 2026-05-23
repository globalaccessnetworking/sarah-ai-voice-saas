"use client";
import React, { useState, useEffect } from "react";
import {
    Heart, TrendingDown, TrendingUp, AlertTriangle, Mic, PhoneOff,
    UserX, UserCheck, Zap, Activity, ChevronRight, RefreshCw,
    BarChart3, ArrowUpRight, ArrowDownRight, MessageSquare
} from "lucide-react";

interface LiveCall {
    id: string;
    caller: string;
    agent: string;
    client: string;
    duration: number;
    sentiment: number; // -1 to 1
    sentimentTrend: "rising" | "falling" | "stable";
    escalated: boolean;
    keywords: string[];
}

interface SentimentHistory {
    callId: string;
    caller: string;
    agent: string;
    client: string;
    avgSentiment: number;
    lowestSentiment: number;
    escalated: boolean;
    escalationTime: number | null;
    date: string;
    outcome: string;
}

const DUMMY_LIVE: LiveCall[] = [
    { id: "c1", caller: "+61412345678", agent: "Sarah AI", client: "Bright Smiles Dental", duration: 145, sentiment: 0.72, sentimentTrend: "rising", escalated: false, keywords: ["appointment", "Tuesday", "clean"] },
    { id: "c2", caller: "+61298765432", agent: "Emma AI", client: "Peak Performance Gym", duration: 67, sentiment: -0.18, sentimentTrend: "falling", escalated: false, keywords: ["cancel", "refund", "unhappy"] },
    { id: "c3", caller: "+61387654321", agent: "James AI", client: "City Medical", duration: 230, sentiment: 0.35, sentimentTrend: "stable", escalated: false, keywords: ["booking", "doctor", "Thursday"] },
    { id: "c4", caller: "+61478123456", agent: "Alex AI", client: "24h Locksmith", duration: 38, sentiment: -0.62, sentimentTrend: "falling", escalated: true, keywords: ["locked out", "angry", "NOW", "urgent"] },
];

const HISTORY: SentimentHistory[] = [
    { callId: "h1", caller: "+61...5678", agent: "Sarah AI", client: "Bright Smiles", avgSentiment: 0.68, lowestSentiment: 0.21, escalated: false, escalationTime: null, date: "2026-03-11 06:01", outcome: "Booked" },
    { callId: "h2", caller: "+61...2341", agent: "Emma AI", client: "Peak Performance", avgSentiment: -0.45, lowestSentiment: -0.82, escalated: true, escalationTime: 142, date: "2026-03-11 05:45", outcome: "Escalated → Resolved" },
    { callId: "h3", caller: "+61...8877", agent: "Sarah AI", client: "City Medical", avgSentiment: 0.55, lowestSentiment: 0.10, escalated: false, escalationTime: null, date: "2026-03-11 05:20", outcome: "Booked" },
    { callId: "h4", caller: "+61...1230", agent: "James AI", client: "Bright Smiles", avgSentiment: 0.81, lowestSentiment: 0.60, escalated: false, escalationTime: null, date: "2026-03-11 04:58", outcome: "Info Given" },
    { callId: "h5", caller: "+61...4432", agent: "Alex AI", client: "24h Locksmith", avgSentiment: -0.71, lowestSentiment: -0.92, escalated: true, escalationTime: 55, date: "2026-03-11 04:30", outcome: "Escalated → Hang-Up" },
];

function SentimentGauge({ value }: { value: number }) {
    const pct = ((value + 1) / 2) * 100;
    const color = value > 0.4 ? "#10b981" : value > -0.2 ? "#f59e0b" : "#ef4444";
    const label = value > 0.4 ? "Positive" : value > -0.2 ? "Neutral" : "Negative";
    return (
        <div className="space-y-1.5">
            <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                <div className="h-2.5 rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: `linear-gradient(to right, #ef4444, #f59e0b, #10b981)` }} />
            </div>
            <div className="flex justify-between items-center">
                <span className="text-[9px] text-zinc-600">😤 Negative</span>
                <span className="text-[10px] font-bold" style={{ color }}>{label} ({value > 0 ? "+" : ""}{(value * 100).toFixed(0)}%)</span>
                <span className="text-[9px] text-zinc-600">Positive 😊</span>
            </div>
        </div>
    );
}

export default function SentimentPage() {
    const [calls, setCalls] = useState(DUMMY_LIVE);
    const [threshold, setThreshold] = useState(-0.3);
    const [ticking, setTicking] = useState(true);
    const [tab, setTab] = useState<"live" | "history" | "rules">("live");

    useEffect(() => {
        if (!ticking) return;
        const t = setInterval(() => {
            setCalls(prev => prev.map(c => {
                const delta = (Math.random() - 0.5) * 0.08;
                const newSentiment = Math.max(-1, Math.min(1, c.sentiment + delta));
                const escalated = newSentiment < threshold && !c.escalated ? true : c.escalated;
                return { ...c, sentiment: newSentiment, sentimentTrend: delta > 0.01 ? "rising" : delta < -0.01 ? "falling" : "stable", escalated };
            }));
        }, 3000);
        return () => clearInterval(t);
    }, [ticking, threshold]);

    const avgSentiment = calls.reduce((s, c) => s + c.sentiment, 0) / calls.length;
    const escalatedCount = calls.filter(c => c.escalated).length;

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200 p-8 md:p-10">
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* Header */}
                <div className="bg-gradient-to-r from-pink-950/40 to-rose-950/30 border border-pink-900/30 rounded-2xl p-6 flex items-center gap-5">
                    <div className="w-14 h-14 bg-pink-500/10 border border-pink-500/20 rounded-2xl flex items-center justify-center">
                        <Heart className="w-7 h-7 text-pink-400" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-white mb-1">Call Sentiment & Escalation Engine</h1>
                        <p className="text-xs text-zinc-400">Real-time sentiment scoring per active call. Auto-escalate to human agents when sentiment drops below your threshold. GPT-4 powered NLP analysis.</p>
                    </div>
                    <div className="flex gap-5 items-center">
                        <div className="text-right">
                            <div className={`text-2xl font-bold ${avgSentiment > 0 ? "text-emerald-400" : "text-red-400"}`}>{avgSentiment > 0 ? "+" : ""}{(avgSentiment * 100).toFixed(0)}%</div>
                            <div className="text-[10px] text-zinc-500">Avg Sentiment</div>
                        </div>
                        <div className="text-right">
                            <div className={`text-2xl font-bold ${escalatedCount > 0 ? "text-red-400" : "text-emerald-400"}`}>{escalatedCount}</div>
                            <div className="text-[10px] text-zinc-500">Escalated</div>
                        </div>
                        <button onClick={() => setTicking(p => !p)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold ${ticking ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-400"}`}>
                            <Activity className="w-3.5 h-3.5" /> {ticking ? "Live" : "Paused"}
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
                    {(["live", "history", "rules"] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)} className={`px-5 py-2 rounded-lg text-xs font-bold capitalize transition-all ${tab === t ? "bg-pink-600 text-white" : "text-zinc-400 hover:text-zinc-200"}`}>{t}</button>
                    ))}
                </div>

                {tab === "live" && (
                    <div className="grid md:grid-cols-2 gap-5">
                        {calls.map(call => {
                            const col = call.sentiment > 0.4 ? "#10b981" : call.sentiment > -0.2 ? "#f59e0b" : "#ef4444";
                            return (
                                <div key={call.id} className={`bg-zinc-900 border rounded-2xl p-5 space-y-4 ${call.escalated ? "border-red-900/60" : "border-zinc-800"}`}>
                                    {call.escalated && (
                                        <div className="flex items-center gap-2 bg-red-950/40 border border-red-900/40 rounded-xl px-3 py-2">
                                            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                                            <span className="text-xs text-red-300 font-bold">AUTO-ESCALATED — Transferring to human agent</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-xs font-bold text-zinc-200">{call.caller}</div>
                                            <div className="text-[10px] text-zinc-500">{call.client} · {call.agent}</div>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                                            <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                            {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, "0")}
                                            {call.sentimentTrend === "rising" ? <ArrowUpRight className="w-3 h-3 text-emerald-400" /> : call.sentimentTrend === "falling" ? <ArrowDownRight className="w-3 h-3 text-red-400" /> : null}
                                        </div>
                                    </div>
                                    <SentimentGauge value={call.sentiment} />
                                    <div className="flex flex-wrap gap-1">
                                        {call.keywords.map(kw => (
                                            <span key={kw} className={`text-[9px] px-2 py-0.5 rounded font-bold border ${call.sentiment < -0.3 ? "text-red-400 bg-red-500/10 border-red-500/20" : "text-zinc-400 bg-zinc-800 border-zinc-700"}`}>&ldquo;{kw}&rdquo;</span>
                                        ))}
                                    </div>
                                    {!call.escalated && call.sentiment < -0.2 && (
                                        <button className="w-full bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition-colors">
                                            <UserCheck className="w-3.5 h-3.5" /> Escalate to Human Now
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {tab === "history" && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                        <div className="grid grid-cols-12 px-5 py-3 border-b border-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                            <div className="col-span-2">Caller</div>
                            <div className="col-span-2">Client</div>
                            <div className="col-span-2">Avg Sentiment</div>
                            <div className="col-span-2">Lowest Point</div>
                            <div className="col-span-1">Escalated</div>
                            <div className="col-span-2">Outcome</div>
                            <div className="col-span-1">Date</div>
                        </div>
                        <div className="divide-y divide-zinc-800/50">
                            {HISTORY.map(h => {
                                const avgCol = h.avgSentiment > 0.2 ? "#10b981" : h.avgSentiment > -0.2 ? "#f59e0b" : "#ef4444";
                                return (
                                    <div key={h.callId} className="grid grid-cols-12 items-center px-5 py-4 hover:bg-zinc-800/20">
                                        <div className="col-span-2 font-mono text-xs text-zinc-400">{h.caller}</div>
                                        <div className="col-span-2 text-xs text-zinc-300">{h.client}</div>
                                        <div className="col-span-2 text-xs font-bold font-mono" style={{ color: avgCol }}>{h.avgSentiment > 0 ? "+" : ""}{(h.avgSentiment * 100).toFixed(0)}%</div>
                                        <div className="col-span-2 text-xs font-bold font-mono text-red-400">{(h.lowestSentiment * 100).toFixed(0)}%</div>
                                        <div className="col-span-1">
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${h.escalated ? "text-red-400 bg-red-500/10" : "text-emerald-400 bg-emerald-500/10"}`}>{h.escalated ? "Yes" : "No"}</span>
                                        </div>
                                        <div className="col-span-2 text-[10px] text-zinc-400">{h.outcome}</div>
                                        <div className="col-span-1 text-[9px] text-zinc-600">{h.date.slice(11)}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {tab === "rules" && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
                        <h2 className="text-sm font-bold text-white">Escalation Rules</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Auto-Escalation Threshold</label>
                                <div className="flex items-center gap-4">
                                    <input type="range" min={-100} max={0} value={threshold * 100} onChange={e => setThreshold(Number(e.target.value) / 100)} className="flex-1 accent-pink-500" />
                                    <div className="text-sm font-bold text-red-400 w-16 text-right">{(threshold * 100).toFixed(0)}%</div>
                                </div>
                                <div className="text-[10px] text-zinc-500 mt-1">Calls that drop below this sentiment score will be auto-escalated to a human agent.</div>
                            </div>
                            {[
                                [true, "Auto-transfer to next available human agent"],
                                [true, "Log sentiment dip in call record"],
                                [true, "Send Slack alert when escalation triggered"],
                                [false, "Record escalation reason for AI training"],
                            ].map(([enabled, label], i) => (
                                <div key={i} className="flex items-center justify-between py-3 border-b border-zinc-800/50">
                                    <span className="text-xs text-zinc-300">{label as string}</span>
                                    <div className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${enabled ? "bg-pink-600" : "bg-zinc-700"}`}>
                                        <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${enabled ? "right-0.5" : "left-0.5"}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full bg-pink-600 hover:bg-pink-500 text-white py-2.5 rounded-xl text-xs font-bold transition-colors">Save Escalation Rules</button>
                    </div>
                )}
            </div>
        </div>
    );
}
