"use client";
import React, { useState } from "react";
import {
    UserCircle, Phone, BarChart3, FileText, Download, Clock,
    Mic, CheckCircle2, DollarSign, TrendingUp, PlayCircle, Activity
} from "lucide-react";

const STATS = {
    totalCalls: 1847,
    totalMinutes: 4312,
    bookingRate: 68,
    avgCallDuration: 2.3,
    avgSentiment: 0.61,
    topAgent: "Sarah AI",
    planUsed: 78,
    planLimit: 2000,
    invoiceDue: 299.00,
    nextBillingDate: "2026-04-01",
    planName: "Professional",
};

const CALL_LOG = [
    { id: "c1", date: "2026-03-11 06:01", duration: "2:25", outcome: "Booked", sentiment: 0.72 },
    { id: "c2", date: "2026-03-11 05:45", duration: "1:07", outcome: "Info Given", sentiment: 0.22 },
    { id: "c3", date: "2026-03-11 05:20", duration: "5:12", outcome: "Booked", sentiment: 0.81 },
    { id: "c4", date: "2026-03-10 18:33", duration: "0:58", outcome: "Voicemail", sentiment: 0.10 },
    { id: "c5", date: "2026-03-10 17:15", duration: "3:40", outcome: "Booked", sentiment: 0.65 },
    { id: "c6", date: "2026-03-10 15:02", duration: "1:22", outcome: "No Answer", sentiment: -0.05 },
];

const RECORDINGS = [
    { id: "r1", date: "2026-03-11 06:01", size: "2.1 MB", duration: "2:25", transcript: "Available" },
    { id: "r2", date: "2026-03-11 05:20", size: "4.8 MB", duration: "5:12", transcript: "Available" },
    { id: "r3", date: "2026-03-10 18:33", size: "0.9 MB", duration: "0:58", transcript: "Processing" },
];

export default function PortalPage() {
    const [tab, setTab] = useState<"overview" | "calls" | "recordings" | "billing">("overview");
    const usagePct = (STATS.totalMinutes / STATS.planLimit) * 100;

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200 p-8 md:p-10">
            <div className="max-w-[1400px] mx-auto space-y-8">

                {/* Client identity banner */}
                <div className="bg-gradient-to-r from-blue-950/40 to-indigo-950/30 border border-blue-900/30 rounded-2xl p-6 flex items-center gap-5">
                    <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center">
                        <UserCircle className="w-8 h-8 text-blue-400" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-white mb-0.5">Bright Smiles Dental</h1>
                        <p className="text-xs text-zinc-400">Client Portal · {STATS.planName} Plan · Read-Only Dashboard</p>
                    </div>
                    <div className="flex gap-6">
                        {[
                            { label: "Total Calls", value: STATS.totalCalls.toLocaleString(), color: "#3b82f6" },
                            { label: "Booking Rate", value: `${STATS.bookingRate}%`, color: "#10b981" },
                            { label: "Avg Sentiment", value: `+${(STATS.avgSentiment * 100).toFixed(0)}%`, color: "#f59e0b" },
                        ].map(s => (
                            <div key={s.label} className="text-right">
                                <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                                <div className="text-[10px] text-zinc-500">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
                    {(["overview", "calls", "recordings", "billing"] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)} className={`px-5 py-2 rounded-lg text-xs font-bold capitalize transition-all ${tab === t ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-zinc-200"}`}>{t}</button>
                    ))}
                </div>

                {tab === "overview" && (
                    <div className="space-y-6">
                        <div className="grid md:grid-cols-3 gap-5">
                            {[
                                { label: "Total Calls This Month", value: STATS.totalCalls, sub: "↑ 12% from last month", icon: <Phone className="w-5 h-5" />, color: "#3b82f6" },
                                { label: "Booking Rate", value: `${STATS.bookingRate}%`, sub: "Industry avg: 52%", icon: <CheckCircle2 className="w-5 h-5" />, color: "#10b981" },
                                { label: "Avg Call Duration", value: `${STATS.avgCallDuration}m`, sub: "Per inbound call", icon: <Clock className="w-5 h-5" />, color: "#f59e0b" },
                                { label: "Minutes Used", value: `${STATS.totalMinutes.toLocaleString()}`, sub: `of ${STATS.planLimit.toLocaleString()} included`, icon: <Mic className="w-5 h-5" />, color: "#06b6d4" },
                                { label: "Top AI Agent", value: STATS.topAgent, sub: "Most calls handled", icon: <Activity className="w-5 h-5" />, color: "#ec4899" },
                                { label: "Avg Sentiment", value: `+${(STATS.avgSentiment * 100).toFixed(0)}%`, sub: "Callers rated positive", icon: <TrendingUp className="w-5 h-5" />, color: "#f59e0b" },
                            ].map(stat => (
                                <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                                    <div style={{ color: stat.color }} className="mb-2">{stat.icon}</div>
                                    <div className="text-xl font-bold text-white mb-0.5">{stat.value}</div>
                                    <div className="text-xs font-bold text-zinc-300">{stat.label}</div>
                                    <div className="text-[10px] text-zinc-600">{stat.sub}</div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                            <div className="flex justify-between text-xs mb-2">
                                <span className="font-bold text-zinc-300">Plan Minute Usage ({STATS.planName})</span>
                                <span className={`font-bold ${usagePct > 90 ? "text-red-400" : usagePct > 75 ? "text-yellow-400" : "text-emerald-400"}`}>{STATS.totalMinutes.toLocaleString()} / {STATS.planLimit.toLocaleString()} min</span>
                            </div>
                            <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                                <div className="h-3 rounded-full transition-all" style={{ width: `${usagePct}%`, background: usagePct > 90 ? "#ef4444" : usagePct > 75 ? "#f59e0b" : "#10b981" }} />
                            </div>
                            {usagePct > 75 && <div className="text-[10px] text-yellow-400 mt-2">⚠ You have used {usagePct.toFixed(0)}% of your plan. Overage rate: $0.18/min.</div>}
                        </div>
                    </div>
                )}

                {tab === "calls" && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
                            <h2 className="text-sm font-bold text-white">Call History</h2>
                            <button className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-800 px-3 py-1.5 rounded-lg hover:bg-zinc-700"><Download className="w-3.5 h-3.5" /> Export CSV</button>
                        </div>
                        <div className="divide-y divide-zinc-800/50">
                            {CALL_LOG.map(c => (
                                <div key={c.id} className="grid grid-cols-12 items-center px-5 py-4 hover:bg-zinc-800/20">
                                    <div className="col-span-4 text-xs text-zinc-400 font-mono">{c.date}</div>
                                    <div className="col-span-2 text-xs text-zinc-300">{c.duration}</div>
                                    <div className="col-span-3">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${c.outcome === "Booked" ? "text-emerald-400 bg-emerald-500/10" : c.outcome === "Voicemail" ? "text-yellow-400 bg-yellow-500/10" : "text-zinc-400 bg-zinc-800"}`}>{c.outcome}</span>
                                    </div>
                                    <div className="col-span-3 text-xs font-mono" style={{ color: c.sentiment > 0.2 ? "#10b981" : c.sentiment > -0.2 ? "#f59e0b" : "#ef4444" }}>
                                        {c.sentiment > 0 ? "+" : ""}{(c.sentiment * 100).toFixed(0)}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {tab === "recordings" && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-zinc-800"><h2 className="text-sm font-bold text-white">Recordings & Transcripts</h2></div>
                        <div className="divide-y divide-zinc-800/50">
                            {RECORDINGS.map(r => (
                                <div key={r.id} className="flex items-center gap-4 px-5 py-4">
                                    <div className="w-9 h-9 bg-zinc-800 rounded-xl flex items-center justify-center"><Mic className="w-4 h-4 text-zinc-400" /></div>
                                    <div className="flex-1">
                                        <div className="text-xs font-bold text-zinc-200">{r.date}</div>
                                        <div className="text-[10px] text-zinc-500">{r.duration} · {r.size}</div>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${r.transcript === "Available" ? "text-emerald-400 bg-emerald-500/10" : "text-yellow-400 bg-yellow-500/10"}`}>{r.transcript}</span>
                                    <button className="p-1.5 text-zinc-500 hover:text-zinc-200"><PlayCircle className="w-4 h-4" /></button>
                                    <button className="p-1.5 text-zinc-500 hover:text-zinc-200"><Download className="w-4 h-4" /></button>
                                    <button className="p-1.5 text-zinc-500 hover:text-zinc-200"><FileText className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {tab === "billing" && (
                    <div className="space-y-5">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                            <h2 className="text-sm font-bold text-white mb-4">Current Invoice</h2>
                            <div className="space-y-3">
                                {[
                                    { label: "Professional Plan (Monthly)", amount: 299.00 },
                                    { label: "Overage (640 min × $0.18)", amount: 115.20 },
                                ].map(row => (
                                    <div key={row.label} className="flex justify-between py-2 border-b border-zinc-800/50">
                                        <span className="text-xs text-zinc-400">{row.label}</span>
                                        <span className="text-xs font-bold text-zinc-200">${row.amount.toFixed(2)}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between pt-2">
                                    <span className="text-sm font-bold text-white">Total Due {STATS.nextBillingDate}</span>
                                    <span className="text-sm font-bold text-emerald-400">$414.20</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                            <h2 className="text-sm font-bold text-white mb-3">Plan Details</h2>
                            <div className="grid grid-cols-3 gap-4 text-xs">
                                {[
                                    { label: "Current Plan", value: STATS.planName },
                                    { label: "Included Minutes", value: "2,000/mo" },
                                    { label: "Overage Rate", value: "$0.18/min" },
                                ].map(d => (
                                    <div key={d.label}>
                                        <div className="text-zinc-500 mb-0.5">{d.label}</div>
                                        <div className="font-bold text-zinc-200">{d.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
