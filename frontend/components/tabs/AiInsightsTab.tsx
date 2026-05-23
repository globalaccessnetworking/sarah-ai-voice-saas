"use client";
import React, { useState, useEffect } from "react";
import {
    Brain, TrendingUp, TrendingDown, Minus, MessageSquare,
    Star, Clock, BarChart3, Target, Zap, AlertTriangle, CheckCircle2,
    PhoneCall, PhoneMissed, PhoneForwarded, Volume2
} from "lucide-react";

// ─── Pure CSS recharts replacement — no dependency needed ──────────────────
function DonutChart({ segments, size = 160 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
    const total = segments.reduce((s, seg) => s + seg.value, 0);
    let cumulative = 0;
    const cx = size / 2, cy = size / 2, r = size * 0.38, innerR = size * 0.24;
    const paths = segments.map((seg, i) => {
        const pct = seg.value / total;
        const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
        cumulative += pct;
        const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
        const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle);
        const ix1 = cx + innerR * Math.cos(startAngle), iy1 = cy + innerR * Math.sin(startAngle);
        const ix2 = cx + innerR * Math.cos(endAngle), iy2 = cy + innerR * Math.sin(endAngle);
        const largeArc = pct > 0.5 ? 1 : 0;
        return <path key={i} d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1} Z`} fill={seg.color} opacity={0.9} />;
    });
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {paths}
            <text x={cx} y={cy - 6} textAnchor="middle" fill="#fff" fontSize={size * 0.16} fontWeight="bold">{total}</text>
            <text x={cx} y={cy + 12} textAnchor="middle" fill="#71717a" fontSize={size * 0.09}>Total</text>
        </svg>
    );
}

function LineSparkline({ data, color = "#10b981", height = 60 }: { data: number[]; color?: string; height?: number }) {
    if (data.length < 2) return null;
    const max = Math.max(...data), min = Math.min(...data);
    const range = max - min || 1;
    const w = 280, h = height;
    const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 8) - 4}`).join(" ");
    return (
        <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
            <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// ─── Mock data ─────────────────────────────────────────────────────────────
const mockInsights = {
    callOutcomes: [
        { label: "Resolved", value: 312, color: "#10b981" },
        { label: "Escalated", value: 48, color: "#f59e0b" },
        { label: "Abandoned", value: 22, color: "#ef4444" },
        { label: "Voicemail", value: 18, color: "#6366f1" },
    ],
    sentimentTrend: [62, 68, 71, 65, 73, 78, 74, 80, 77, 82, 85, 79, 88, 91],
    callsByHour: [2, 1, 0, 0, 1, 3, 8, 22, 38, 45, 42, 31, 28, 35, 40, 38, 29, 24, 18, 12, 8, 5, 4, 3],
    topTopics: [
        { topic: "Appointment Booking", count: 142, trend: "up" },
        { topic: "Pricing Questions", count: 98, trend: "up" },
        { topic: "Technical Support", count: 87, trend: "down" },
        { topic: "Order Status", count: 76, trend: "stable" },
        { topic: "Cancellation Requests", count: 54, trend: "down" },
        { topic: "Billing Disputes", count: 38, trend: "up" },
        { topic: "Product Information", count: 31, trend: "stable" },
        { topic: "Complaints", count: 22, trend: "down" },
    ],
    agentPerformance: [
        { name: "Receptionist AI", score: 94, calls: 198, resolution: 96, sentiment: 88 },
        { name: "Sales Agent", score: 87, calls: 142, resolution: 82, sentiment: 91 },
        { name: "Support Bot", score: 79, calls: 86, resolution: 74, sentiment: 84 },
        { name: "Outbound AI", score: 71, calls: 74, resolution: 65, sentiment: 77 },
    ],
    talkTimeRatio: { agent: 38, caller: 62 },
    avgSilence: 2.8,
    summary: {
        totalCalls: 400,
        resolutionRate: 78,
        avgSentiment: 81,
        avgDuration: "1m 52s",
        peakHour: "10am",
    },
};

// ─── Metric Card ────────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, icon, color = "#10b981" }: { label: string; value: string; sub?: string; icon: React.ReactNode; color?: string }) {
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{label}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color + "18", color }}>{icon}</div>
            </div>
            <div>
                <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
                {sub && <div className="text-xs text-zinc-500 mt-1">{sub}</div>}
            </div>
        </div>
    );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function AiInsightsTab() {
    const [data] = useState(mockInsights);
    const maxBarVal = Math.max(...data.callsByHour);

    return (
        <div className="space-y-8">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-violet-950/40 to-indigo-950/30 border border-violet-900/30 rounded-2xl p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center">
                    <Brain className="w-6 h-6 text-violet-400" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white">AI Insights Engine</h2>
                    <p className="text-xs text-zinc-400">Powered by Gemini Flash post-call analysis. Data refreshes every 5 minutes.</p>
                </div>
                <div className="ml-auto flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Live Analysis Active
                </div>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <MetricCard label="Total Calls" value={String(data.summary.totalCalls)} sub="Last 7 days" icon={<PhoneCall className="w-4 h-4" />} color="#6366f1" />
                <MetricCard label="Resolution Rate" value={`${data.summary.resolutionRate}%`} sub="+4.2pp vs last week" icon={<CheckCircle2 className="w-4 h-4" />} color="#10b981" />
                <MetricCard label="Avg Sentiment" value={`${data.summary.avgSentiment}/100`} sub="Positive trend ↑" icon={<Star className="w-4 h-4" />} color="#f59e0b" />
                <MetricCard label="Avg Duration" value={data.summary.avgDuration} sub="Per call" icon={<Clock className="w-4 h-4" />} color="#06b6d4" />
                <MetricCard label="Peak Hour" value={data.summary.peakHour} sub="45 calls in 60 min" icon={<Zap className="w-4 h-4" />} color="#f97316" />
            </div>

            {/* Row: Donut + Sentiment Trend */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Call Outcomes Donut */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Target className="w-4 h-4 text-indigo-400" />
                        <h3 className="text-sm font-bold text-white">Call Outcomes</h3>
                        <span className="ml-auto text-[10px] text-zinc-500 uppercase tracking-widest">AI Classified</span>
                    </div>
                    <div className="flex items-center gap-8">
                        <DonutChart segments={data.callOutcomes} size={160} />
                        <div className="flex flex-col gap-3 flex-1">
                            {data.callOutcomes.map(seg => (
                                <div key={seg.label} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: seg.color }} />
                                        <span className="text-xs text-zinc-400">{seg.label}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-white">{seg.value}</span>
                                        <span className="text-[10px] text-zinc-600">{Math.round(seg.value / data.summary.totalCalls * 100)}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sentiment Trend */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-sm font-bold text-white">Sentiment Trend</h3>
                        <span className="ml-auto text-xs font-bold text-emerald-400">+29pt this week</span>
                    </div>
                    <p className="text-xs text-zinc-500 mb-6">Rolling 14-day caller satisfaction score (0–100)</p>
                    <LineSparkline data={data.sentimentTrend} color="#10b981" height={80} />
                    <div className="mt-4 flex justify-between text-[10px] text-zinc-600 font-mono">
                        <span>14 days ago</span>
                        <span>Today</span>
                    </div>

                    {/* Talk Time Ratio */}
                    <div className="mt-6 pt-4 border-t border-zinc-800">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-zinc-400 flex items-center gap-1.5"><Volume2 className="w-3 h-3" /> Talk Time Ratio</span>
                            <span className="text-[10px] text-zinc-500">Ideal: 40% agent / 60% caller</span>
                        </div>
                        <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                            <div className="bg-indigo-500 transition-all" style={{ width: `${data.talkTimeRatio.agent}%` }} title={`Agent: ${data.talkTimeRatio.agent}%`} />
                            <div className="bg-emerald-500 transition-all" style={{ width: `${data.talkTimeRatio.caller}%` }} title={`Caller: ${data.talkTimeRatio.caller}%`} />
                        </div>
                        <div className="flex justify-between mt-1.5 text-[10px] text-zinc-500">
                            <span className="text-indigo-400">Agent {data.talkTimeRatio.agent}%</span>
                            <span className="text-emerald-400">Caller {data.talkTimeRatio.caller}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Calls by Hour Heatmap */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                    <BarChart3 className="w-4 h-4 text-orange-400" />
                    <h3 className="text-sm font-bold text-white">Calls by Hour</h3>
                    <span className="ml-auto text-xs text-zinc-500">Peak: {data.summary.peakHour} · {maxBarVal} calls</span>
                </div>
                <div className="flex items-end gap-1.5 h-24">
                    {data.callsByHour.map((count, hour) => (
                        <div key={hour} className="flex-1 flex flex-col items-center gap-1 group">
                            <div
                                className="w-full rounded-t transition-all group-hover:opacity-100 opacity-80"
                                style={{
                                    height: `${(count / maxBarVal) * 80}px`,
                                    background: count === maxBarVal ? "#f97316" : count > maxBarVal * 0.6 ? "#6366f1" : "#27272a",
                                    minHeight: count > 0 ? 3 : 0
                                }}
                                title={`${hour}:00 — ${count} calls`}
                            />
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-zinc-600 font-mono">
                    {["12am", "3am", "6am", "9am", "12pm", "3pm", "6pm", "9pm"].map(t => <span key={t}>{t}</span>)}
                </div>
            </div>

            {/* Row: Top Topics + Agent Performance */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Top Topics */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <MessageSquare className="w-4 h-4 text-cyan-400" />
                        <h3 className="text-sm font-bold text-white">Top Call Topics</h3>
                        <span className="ml-auto text-[10px] text-zinc-500 uppercase tracking-widest">AI Extracted</span>
                    </div>
                    <div className="space-y-3">
                        {data.topTopics.map((t, i) => (
                            <div key={t.topic} className="flex items-center gap-3">
                                <span className="text-[10px] font-mono text-zinc-600 w-4">{i + 1}</span>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-zinc-300">{t.topic}</span>
                                        <div className="flex items-center gap-2">
                                            {t.trend === "up" && <TrendingUp className="w-3 h-3 text-emerald-400" />}
                                            {t.trend === "down" && <TrendingDown className="w-3 h-3 text-red-400" />}
                                            {t.trend === "stable" && <Minus className="w-3 h-3 text-zinc-500" />}
                                            <span className="text-xs font-bold text-white">{t.count}</span>
                                        </div>
                                    </div>
                                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-indigo-600" style={{ width: `${(t.count / data.topTopics[0].count) * 100}%` }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Agent Performance */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <h3 className="text-sm font-bold text-white">Agent Performance Scores</h3>
                    </div>
                    <div className="space-y-4">
                        {data.agentPerformance.map(agent => (
                            <div key={agent.name} className="p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/30">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-zinc-200">{agent.name}</span>
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-2 h-2 rounded-full ${agent.score >= 90 ? 'bg-emerald-400' : agent.score >= 75 ? 'bg-yellow-400' : 'bg-orange-400'}`} />
                                        <span className={`text-sm font-bold ${agent.score >= 90 ? 'text-emerald-400' : agent.score >= 75 ? 'text-yellow-400' : 'text-orange-400'}`}>{agent.score}</span>
                                        <span className="text-[10px] text-zinc-600">/100</span>
                                    </div>
                                </div>
                                <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden mb-2">
                                    <div className={`h-full rounded-full ${agent.score >= 90 ? 'bg-emerald-500' : agent.score >= 75 ? 'bg-yellow-500' : 'bg-orange-500'}`} style={{ width: `${agent.score}%` }} />
                                </div>
                                <div className="flex gap-4 text-[10px] text-zinc-500">
                                    <span>{agent.calls} calls</span>
                                    <span>Resolution: {agent.resolution}%</span>
                                    <span>Sentiment: {agent.sentiment}/100</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* AI Anomaly Alert */}
            <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-5 flex items-start gap-4">
                <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                    <div className="text-sm font-bold text-amber-300 mb-1">AI Anomaly Detected: Spike in Cancellation Requests</div>
                    <p className="text-xs text-amber-700/80">Cancellation topics increased 34% in the past 24 hours compared to last week. This may indicate a product, pricing, or service issue. Review recent transcripts on the <span className="text-amber-400 underline cursor-pointer">Call History</span> page.</p>
                </div>
            </div>
        </div>
    );
}
