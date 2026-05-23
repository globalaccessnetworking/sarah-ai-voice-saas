"use client";
import React, { useState, useEffect } from "react";
import {
    Gauge, Zap, Activity, BarChart3, TrendingDown, TrendingUp,
    RefreshCw, Clock, Cpu, Volume2, Mic, Globe, AlertTriangle,
    ChevronRight, ArrowRight
} from "lucide-react";

interface LatencyMetrics {
    provider: string;
    category: "STT" | "LLM" | "TTS" | "Network" | "Overall";
    p50: number;
    p90: number;
    p99: number;
    avg: number;
    trend: "up" | "down" | "stable";
    color: string;
}

interface WaterfallSegment {
    label: string;
    start: number;
    duration: number;
    color: string;
}

const METRICS: LatencyMetrics[] = [
    { provider: "Deepgram Nova-3", category: "STT", p50: 120, p90: 180, p99: 310, avg: 138, trend: "stable", color: "#06b6d4" },
    { provider: "OpenAI Whisper", category: "STT", p50: 380, p90: 620, p99: 1100, avg: 420, trend: "down", color: "#8b5cf6" },
    { provider: "Google Chirp-2", category: "STT", p50: 210, p90: 340, p99: 580, avg: 235, trend: "stable", color: "#10b981" },
    { provider: "GPT-4o-mini", category: "LLM", p50: 280, p90: 480, p99: 820, avg: 310, trend: "down", color: "#f59e0b" },
    { provider: "Claude 3.5 Haiku", category: "LLM", p50: 320, p90: 510, p99: 890, avg: 355, trend: "stable", color: "#ec4899" },
    { provider: "Gemini 2.5 Flash", category: "LLM", p50: 195, p90: 310, p99: 590, avg: 220, trend: "down", color: "#10b981" },
    { provider: "Cartesia Sonic-2", category: "TTS", p50: 88, p90: 135, p99: 210, avg: 96, trend: "down", color: "#06b6d4" },
    { provider: "ElevenLabs Flash v2.5", category: "TTS", p50: 72, p90: 118, p99: 195, avg: 81, trend: "down", color: "#f59e0b" },
    { provider: "Google Studio", category: "TTS", p50: 145, p90: 230, p99: 410, avg: 162, trend: "stable", color: "#10b981" },
];

const WATERFALL: WaterfallSegment[] = [
    { label: "Network (inbound)", start: 0, duration: 25, color: "#6366f1" },
    { label: "STT (Deepgram)", start: 25, duration: 120, color: "#06b6d4" },
    { label: "LLM (GPT-4o-mini)", start: 145, duration: 280, color: "#f59e0b" },
    { label: "TTS (Cartesia)", start: 425, duration: 88, color: "#10b981" },
    { label: "Network (outbound)", start: 513, duration: 18, color: "#6366f1" },
];

const TREND_DATA = [580, 542, 510, 498, 520, 488, 471, 460, 445, 452, 438, 431, 519, 495, 480, 465, 448, 441, 430, 422, 419, 415, 412, 520, 508, 491, 478, 461];

export default function LatencyPage() {
    const [filter, setFilter] = useState<"All" | "STT" | "LLM" | "TTS">("All");
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [live, setLive] = useState({ p50: 431, p90: 682, p99: 1041, ttfb: 531 });
    const [tick, setTick] = useState(0);

    useEffect(() => {
        if (!autoRefresh) return;
        const t = setInterval(() => {
            setLive({
                p50: 400 + Math.round(Math.random() * 80),
                p90: 640 + Math.round(Math.random() * 100),
                p99: 980 + Math.round(Math.random() * 120),
                ttfb: 490 + Math.round(Math.random() * 90),
            });
            setTick(x => x + 1);
        }, 4000);
        return () => clearInterval(t);
    }, [autoRefresh]);

    const filtered = METRICS.filter(m => filter === "All" || m.category === filter);
    const totalEnd = WATERFALL[WATERFALL.length - 1].start + WATERFALL[WATERFALL.length - 1].duration;
    const totalLatency = WATERFALL.reduce((s, w) => s + w.duration, 0);

    const mosFromLatency = (lat: number) => Math.max(1, 5 - (lat - 200) / 300).toFixed(1);

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200 p-8 md:p-10">
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* Header */}
                <div className="bg-gradient-to-r from-cyan-950/40 to-blue-950/30 border border-cyan-900/30 rounded-2xl p-6 flex items-center gap-5">
                    <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center">
                        <Gauge className="w-7 h-7 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-white mb-1">Latency X-Ray Dashboard</h1>
                        <p className="text-xs text-zinc-400">TTFB, STT/LLM/TTS P50/P90/P99 percentile analysis. End-to-end call latency waterfall. 7-day rolling trend. Compare providers side by side.</p>
                    </div>
                    <div className="flex gap-5 items-center">
                        {[
                            { label: "TTFB", value: `${live.ttfb}ms`, color: live.ttfb < 500 ? "#10b981" : "#f59e0b" },
                            { label: "P50", value: `${live.p50}ms`, color: live.p50 < 450 ? "#10b981" : "#f59e0b" },
                            { label: "P99", value: `${live.p99}ms`, color: "#06b6d4" },
                            { label: "MOS", value: mosFromLatency(live.p50), color: Number(mosFromLatency(live.p50)) >= 4 ? "#10b981" : "#f59e0b" },
                        ].map(s => (
                            <div key={s.label} className="text-right">
                                <div className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
                                <div className="text-[10px] text-zinc-500">{s.label} Live</div>
                            </div>
                        ))}
                        <button onClick={() => setAutoRefresh(p => !p)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold ${autoRefresh ? "bg-cyan-600 text-white" : "bg-zinc-800 text-zinc-400"}`}>
                            <Activity className={`w-3.5 h-3.5 ${autoRefresh ? "animate-pulse" : ""}`} /> {autoRefresh ? "Live" : "Paused"}
                        </button>
                    </div>
                </div>

                {/* End-to-end waterfall */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <h2 className="text-sm font-bold text-white mb-1">End-to-End Call Latency Waterfall</h2>
                    <p className="text-[10px] text-zinc-500 mb-5">Average single call — from caller speech end to AI voice response start. Total: {totalLatency}ms</p>
                    <div className="space-y-2.5">
                        {WATERFALL.map(seg => {
                            const widthPct = (seg.duration / totalEnd) * 100;
                            const leftPct = (seg.start / totalEnd) * 100;
                            return (
                                <div key={seg.label} className="flex items-center gap-3">
                                    <span className="text-[10px] text-zinc-400 w-40 shrink-0">{seg.label}</span>
                                    <div className="flex-1 relative h-7 bg-zinc-800 rounded-lg overflow-hidden">
                                        <div className="absolute h-full rounded-lg flex items-center px-2 text-[9px] font-bold text-black/80 transition-all"
                                            style={{ left: `${leftPct}%`, width: `${widthPct}%`, background: seg.color }}>
                                            {seg.duration}ms
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-mono text-zinc-400 w-14 text-right">{seg.start}–{seg.start + seg.duration}ms</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-[10px] text-zinc-500">
                        <ArrowRight className="w-3 h-3" />
                        <span>Total time from caller speech end to AI audio response: <strong className="text-cyan-400">{totalLatency}ms</strong> average</span>
                    </div>
                </div>

                {/* 7-day trend mini sparkline */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-white">7-Day TTFB Rolling Average</h2>
                        <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold"><TrendingDown className="w-3.5 h-3.5" /> -18% this week</div>
                    </div>
                    <svg viewBox={`0 0 ${TREND_DATA.length * 30} 80`} className="w-full h-20">
                        <polyline
                            points={TREND_DATA.map((v, i) => `${i * 30 + 15},${80 - ((v - 400) / 200) * 70}`).join(" ")}
                            fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        {TREND_DATA.map((v, i) => (
                            <circle key={i} cx={i * 30 + 15} cy={80 - ((v - 400) / 200) * 70} r="2.5" fill="#06b6d4" />
                        ))}
                    </svg>
                    <div className="flex justify-between text-[9px] text-zinc-600 mt-1">
                        <span>7 days ago</span><span>Today</span>
                    </div>
                </div>

                {/* Provider comparison */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-white">Provider Comparison</h2>
                        <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
                            {(["All", "STT", "LLM", "TTS"] as const).map(f => (
                                <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === f ? "bg-cyan-600 text-white" : "text-zinc-400 hover:text-zinc-200"}`}>{f}</button>
                            ))}
                        </div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                        <div className="grid grid-cols-12 px-5 py-3 border-b border-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                            <div className="col-span-3">Provider</div>
                            <div className="col-span-1">Type</div>
                            <div className="col-span-2">P50</div>
                            <div className="col-span-2">P90</div>
                            <div className="col-span-2">P99</div>
                            <div className="col-span-1">Avg</div>
                            <div className="col-span-1">Trend</div>
                        </div>
                        <div className="divide-y divide-zinc-800/50">
                            {filtered.sort((a, b) => a.avg - b.avg).map(m => (
                                <div key={m.provider} className="grid grid-cols-12 items-center px-5 py-4 hover:bg-zinc-800/20">
                                    <div className="col-span-3 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ background: m.color }} />
                                        <span className="text-xs font-bold text-zinc-200">{m.provider}</span>
                                    </div>
                                    <div className="col-span-1">
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ color: m.color, background: m.color + "15" }}>{m.category}</span>
                                    </div>
                                    {[m.p50, m.p90, m.p99].map((val, i) => (
                                        <div key={i} className="col-span-2">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                                                    <div className="h-1.5 rounded-full" style={{ width: `${Math.min((val / 1200) * 100, 100)}%`, background: val < 200 ? "#10b981" : val < 500 ? "#f59e0b" : "#ef4444" }} />
                                                </div>
                                                <span className="text-xs font-mono text-zinc-300 w-12 text-right">{val}ms</span>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="col-span-1 text-xs font-mono font-bold text-zinc-200">{m.avg}ms</div>
                                    <div className="col-span-1">
                                        {m.trend === "down" ? <TrendingDown className="w-3.5 h-3.5 text-emerald-400" /> : m.trend === "up" ? <TrendingUp className="w-3.5 h-3.5 text-red-400" /> : <span className="text-zinc-500 text-xs">—</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
