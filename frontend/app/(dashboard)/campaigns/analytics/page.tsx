"use client";
import React, { useState } from "react";
import {
    Megaphone, Phone, TrendingUp, TrendingDown, CheckCircle2,
    BarChart3, Users, ArrowUpRight, ArrowDownRight, Zap,
    RefreshCw, Activity, Filter, Download, PlayCircle, PauseCircle
} from "lucide-react";

interface Campaign {
    id: string;
    name: string;
    client: string;
    agentA: string;
    agentB: string;
    status: "Active" | "Completed" | "Paused";
    totalDialed: number;
    answered: number;
    completed: number;
    converted: number;
    avgDuration: number;
    variantAConversions: number;
    variantBConversions: number;
    variantADialed: number;
    variantBDialed: number;
}

const CAMPAIGNS: Campaign[] = [
    {
        id: "c1", name: "Dental Recall March 2026", client: "Bright Smiles Dental",
        agentA: "Sarah AI (Script A — Friendly Reminder)", agentB: "Emma AI (Script B — Urgency-Based)",
        status: "Active", totalDialed: 450, answered: 312, completed: 287, converted: 196,
        avgDuration: 138, variantADialed: 225, variantBDialed: 225, variantAConversions: 92, variantBConversions: 104,
    },
    {
        id: "c2", name: "Gym Membership Renewal Feb 2026", client: "Peak Performance Gym",
        agentA: "Alex AI (Script A — Discount Offer)", agentB: "James AI (Script B — Feature Highlight)",
        status: "Completed", totalDialed: 200, answered: 142, completed: 130, converted: 71,
        avgDuration: 95, variantADialed: 100, variantBDialed: 100, variantAConversions: 38, variantBConversions: 33,
    },
    {
        id: "c3", name: "Medical Flu Vaccination Drive", client: "City Medical Centre",
        agentA: "Sarah AI (Script A — Health Focus)", agentB: "Emma AI (Script B — Convenience Focus)",
        status: "Paused", totalDialed: 180, answered: 110, completed: 98, converted: 67,
        avgDuration: 112, variantADialed: 90, variantBDialed: 90, variantAConversions: 31, variantBConversions: 36,
    },
];

const STATUS_COLORS = {
    Active: "text-emerald-400 bg-emerald-500/10",
    Completed: "text-zinc-400 bg-zinc-800",
    Paused: "text-yellow-400 bg-yellow-500/10",
};

function FunnelBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
                <span className="text-zinc-400">{label}</span>
                <span className="font-bold" style={{ color }}>{value.toLocaleString()}</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2.5">
                <div className="h-2.5 rounded-full" style={{ width: `${(value / max) * 100}%`, background: color }} />
            </div>
        </div>
    );
}

export default function CampaignAnalyticsPage() {
    const [selected, setSelected] = useState<string>("c1");
    const campaign = CAMPAIGNS.find(c => c.id === selected)!;
    const answerRate = ((campaign.answered / campaign.totalDialed) * 100).toFixed(1);
    const convRateA = ((campaign.variantAConversions / campaign.variantADialed) * 100).toFixed(1);
    const convRateB = ((campaign.variantBConversions / campaign.variantBDialed) * 100).toFixed(1);
    const winner = campaign.variantAConversions > campaign.variantBConversions ? "A" : "B";
    const winnerRate = winner === "A" ? convRateA : convRateB;
    const loserRate = winner === "A" ? convRateB : convRateA;
    const abLift = (((Number(winnerRate) - Number(loserRate)) / Number(loserRate)) * 100).toFixed(1);

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200 p-8 md:p-10">
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* Header */}
                <div className="bg-gradient-to-r from-rose-950/40 to-orange-950/30 border border-rose-900/30 rounded-2xl p-6 flex items-center gap-5">
                    <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center">
                        <Megaphone className="w-7 h-7 text-rose-400" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-white mb-1">Campaign Analytics & A/B Testing</h1>
                        <p className="text-xs text-zinc-400">Answer rate, callback rate, and conversion funnel per campaign. A/B test two AI agent scripts and automatically identify the winning variant by conversion rate.</p>
                    </div>
                    <div className="flex gap-5">
                        {[
                            { label: "Active", value: CAMPAIGNS.filter(c => c.status === "Active").length },
                            { label: "Total Dialed", value: CAMPAIGNS.reduce((s, c) => s + c.totalDialed, 0).toLocaleString() },
                            { label: "Total Converted", value: CAMPAIGNS.reduce((s, c) => s + c.converted, 0).toLocaleString() },
                        ].map(s => (
                            <div key={s.label} className="text-right">
                                <div className="text-2xl font-bold text-rose-400">{s.value}</div>
                                <div className="text-[10px] text-zinc-500">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Campaign selector */}
                <div className="flex gap-3 flex-wrap">
                    {CAMPAIGNS.map(c => (
                        <button key={c.id} onClick={() => setSelected(c.id)}
                            className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${selected === c.id ? "border-rose-500 bg-rose-500/10 text-rose-300" : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200"}`}>
                            <div className="flex items-center gap-2">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                                {c.name}
                            </div>
                        </button>
                    ))}
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Funnel */}
                    <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold text-white">{campaign.name}</h2>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${STATUS_COLORS[campaign.status]}`}>{campaign.status}</span>
                        </div>
                        <p className="text-[10px] text-zinc-500">{campaign.client}</p>

                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Conversion Funnel</h3>
                            <FunnelBar label="Total Dialed" value={campaign.totalDialed} max={campaign.totalDialed} color="#6366f1" />
                            <FunnelBar label="Answered" value={campaign.answered} max={campaign.totalDialed} color="#06b6d4" />
                            <FunnelBar label="Completed" value={campaign.completed} max={campaign.totalDialed} color="#f59e0b" />
                            <FunnelBar label="Converted (Booked / Purchased)" value={campaign.converted} max={campaign.totalDialed} color="#10b981" />
                        </div>

                        <div className="grid grid-cols-4 gap-3 pt-2">
                            {[
                                { label: "Answer Rate", value: `${answerRate}%`, color: "#06b6d4" },
                                { label: "Completion Rate", value: `${((campaign.completed / campaign.answered) * 100).toFixed(1)}%`, color: "#f59e0b" },
                                { label: "Conversion Rate", value: `${((campaign.converted / campaign.totalDialed) * 100).toFixed(1)}%`, color: "#10b981" },
                                { label: "Avg Duration", value: `${Math.floor(campaign.avgDuration / 60)}:${(campaign.avgDuration % 60).toString().padStart(2, "0")}`, color: "#ec4899" },
                            ].map(s => (
                                <div key={s.label} className="bg-zinc-800 rounded-xl p-3 text-center">
                                    <div className="text-lg font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
                                    <div className="text-[9px] text-zinc-500">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* A/B Test panel */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
                        <h2 className="text-sm font-bold text-white">A/B Script Test</h2>
                        <div className={`bg-${winner === "A" ? "emerald" : "cyan"}-950/30 border border-${winner === "A" ? "emerald" : "cyan"}-900/30 rounded-xl p-3 flex items-center gap-2`}>
                            <Zap className="w-3.5 h-3.5 text-yellow-400" />
                            <div className="text-xs font-bold text-yellow-300">Winner: Script {winner} ({abLift}% uplift)</div>
                        </div>

                        {[
                            { label: "A", name: campaign.agentA, dialed: campaign.variantADialed, conversions: campaign.variantAConversions, rate: convRateA, isWinner: winner === "A" },
                            { label: "B", name: campaign.agentB, dialed: campaign.variantBDialed, conversions: campaign.variantBConversions, rate: convRateB, isWinner: winner === "B" },
                        ].map(v => (
                            <div key={v.label} className={`border rounded-xl p-4 space-y-3 ${v.isWinner ? "border-emerald-500/40 bg-emerald-950/20" : "border-zinc-800"}`}>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${v.isWinner ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-400"}`}>Variant {v.label}</span>
                                    {v.isWinner && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                                </div>
                                <p className="text-[10px] text-zinc-400">{v.name}</p>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div><div className="text-sm font-bold text-zinc-200">{v.dialed}</div><div className="text-[9px] text-zinc-600">Dialed</div></div>
                                    <div><div className="text-sm font-bold text-zinc-200">{v.conversions}</div><div className="text-[9px] text-zinc-600">Converted</div></div>
                                    <div><div className={`text-sm font-bold ${v.isWinner ? "text-emerald-400" : "text-zinc-400"}`}>{v.rate}%</div><div className="text-[9px] text-zinc-600">Rate</div></div>
                                </div>
                                <div className="w-full bg-zinc-800 rounded-full h-2">
                                    <div className="h-2 rounded-full" style={{ width: `${v.rate}%`, background: v.isWinner ? "#10b981" : "#6366f1" }} />
                                </div>
                            </div>
                        ))}
                        <button className="w-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-2.5 rounded-xl transition-colors">Deploy Winning Script</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
