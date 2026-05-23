"use client";
import React, { useState, useEffect } from "react";
import { Zap, Clock, BarChart2, Globe, Activity, ChevronRight, TrendingDown, Server } from "lucide-react";

// ── Horizontal bar for percentile display ──────────────────────────────────
function PercentileBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
    const pct = Math.min((value / max) * 100, 100);
    const isGood = value < 300, isWarn = value < 600;
    const statusColor = isGood ? "#10b981" : isWarn ? "#f59e0b" : "#ef4444";
    return (
        <div className="flex items-center gap-3">
            <span className="w-7 text-[10px] font-bold text-zinc-500 uppercase">{label}</span>
            <div className="flex-1 h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="w-16 text-right text-xs font-mono font-bold" style={{ color: statusColor }}>{value}ms</span>
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: statusColor }} />
        </div>
    );
}

// ── Waterfall step ──────────────────────────────────────────────────────────
function WaterfallStep({ label, ms, color, offset = 0, total }: { label: string; ms: number; color: string; offset?: number; total: number }) {
    return (
        <div className="flex items-center gap-3">
            <span className="w-20 text-[10px] text-zinc-400 text-right shrink-0">{label}</span>
            <div className="flex-1 h-8 relative">
                <div className="absolute h-full" style={{ left: `${(offset / total) * 100}%`, width: "2px", background: "#3f3f46" }} />
                <div
                    className="absolute h-6 top-1 rounded-md flex items-center px-2"
                    style={{ left: `${(offset / total) * 100}%`, width: `${(ms / total) * 100}%`, background: color + "33", border: `1px solid ${color}66` }}
                >
                    <span className="text-[10px] font-mono font-bold whitespace-nowrap" style={{ color }}>{ms}ms</span>
                </div>
            </div>
        </div>
    );
}

// ── Geo latency comparator ──────────────────────────────────────────────────
function GeoBar({ label, ms, isBad }: { label: string; ms: number; isBad?: boolean }) {
    return (
        <div className="flex items-center gap-3 py-2 border-b border-zinc-800 last:border-0">
            <Globe className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span className="text-xs text-zinc-400 flex-1">{label}</span>
            <div className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${isBad ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"}`}>
                {isBad ? "+" : ""}{ms}ms
            </div>
        </div>
    );
}

// ── Provider card ───────────────────────────────────────────────────────────
function ProviderCard({ name, p50, p90, p99, type }: { name: string; p50: number; p90: number; p99: number; type: "LLM" | "STT" | "TTS" | "RT" }) {
    const typeColors: Record<string, string> = { LLM: "#6366f1", STT: "#06b6d4", TTS: "#f59e0b", RT: "#10b981" };
    const color = typeColors[type] || "#6366f1";
    const max = Math.max(p50, p90, p99) * 1.2;
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-white">{name}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border" style={{ color, borderColor: color + "50", background: color + "15" }}>{type}</span>
            </div>
            <div className="space-y-2">
                <PercentileBar label="P50" value={p50} max={max} color={color} />
                <PercentileBar label="P90" value={p90} max={max} color={color + "99"} />
                <PercentileBar label="P99" value={p99} max={max} color={color + "55"} />
            </div>
        </div>
    );
}

const MOCK_PROVIDERS = [
    { name: "Deepgram Nova-2", p50: 120, p90: 185, p99: 310, type: "STT" as const },
    { name: "OpenAI Whisper", p50: 340, p90: 520, p99: 780, type: "STT" as const },
    { name: "Gemini 1.5 Flash", p50: 280, p90: 380, p99: 510, type: "LLM" as const },
    { name: "GPT-4o", p50: 420, p90: 640, p99: 920, type: "LLM" as const },
    { name: "Claude 3.5 Sonnet", p50: 510, p90: 720, p99: 1050, type: "LLM" as const },
    { name: "Cartesia Sonic", p50: 90, p90: 140, p99: 220, type: "TTS" as const },
    { name: "ElevenLabs v3", p50: 180, p90: 260, p99: 410, type: "TTS" as const },
    { name: "Gemini Live", p50: 85, p90: 130, p99: 190, type: "RT" as const },
];

const WATERFALL_TOTAL = 1800;

export default function LatencyTab() {
    const [ttfb] = useState(1.61);
    const [avgTtfb] = useState(2423);
    const [p50] = useState(2267);
    const [p90] = useState(4380);
    const [p99] = useState(4445);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-950/40 to-cyan-950/30 border border-emerald-900/30 rounded-2xl p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white">Latency X-Ray Observatory</h2>
                    <p className="text-xs text-zinc-400">Real-time performance breakdown. Target: TTFB under 800ms for natural conversation.</p>
                </div>
                <div className="ml-auto text-right">
                    <div className="text-3xl font-bold text-emerald-400 font-mono">{ttfb}s</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Current API Latency</div>
                </div>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Avg TTFB", value: `${avgTtfb}ms`, sub: "Time to First Byte", color: "#10b981" },
                    { label: "P50 (Median)", value: `${p50}ms`, sub: "50% of calls faster", color: "#6366f1" },
                    { label: "P90", value: `${p90}ms`, sub: "90% of calls faster", color: "#f59e0b" },
                    { label: "P99 (Worst 1%)", value: `${p99}ms`, sub: "Tail latency", color: "#ef4444" },
                ].map(m => (
                    <div key={m.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{m.label}</div>
                        <div className="text-3xl font-mono font-bold" style={{ color: m.color }}>{m.value}</div>
                        <div className="text-xs text-zinc-600 mt-1">{m.sub}</div>
                    </div>
                ))}
            </div>

            {/* Geo Latency Comparison */}
            <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Globe className="w-4 h-4 text-cyan-400" />
                        <h3 className="text-sm font-bold text-white">Geographic Latency Comparison</h3>
                    </div>
                    <p className="text-xs text-zinc-500 mb-4">Transit overhead added before AI processing begins. Use On-Shore models to eliminate penalties.</p>
                    <GeoBar label="US → US Server (baseline)" ms={-50} />
                    <GeoBar label="AU → US Server (transit penalty)" ms={350} isBad />
                    <GeoBar label="AU → AU Server (On-Shore mode)" ms={-50} />
                    <div className="mt-4 p-3 bg-emerald-950/30 border border-emerald-900/30 rounded-lg">
                        <p className="text-xs text-emerald-400">💡 Enable <strong>On-Shore Routing</strong> in Settings → Providers to use AWS Bedrock Sydney or Google Vertex AI Australia and save ~300ms.</p>
                    </div>
                </div>

                {/* E2E Waterfall */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-4 h-4 text-indigo-400" />
                        <h3 className="text-sm font-bold text-white">End-to-End Latency Waterfall</h3>
                        <span className="ml-auto text-xs text-zinc-500">Avg call</span>
                    </div>
                    <div className="space-y-2">
                        <WaterfallStep label="Audio Capture" ms={80} color="#06b6d4" offset={0} total={WATERFALL_TOTAL} />
                        <WaterfallStep label="STT (Deepgram)" ms={120} color="#06b6d4" offset={80} total={WATERFALL_TOTAL} />
                        <WaterfallStep label="VAD / EOU" ms={180} color="#8b5cf6" offset={200} total={WATERFALL_TOTAL} />
                        <WaterfallStep label="LLM (Gemini)" ms={280} color="#6366f1" offset={380} total={WATERFALL_TOTAL} />
                        <WaterfallStep label="TTS (Cartesia)" ms={90} color="#f59e0b" offset={660} total={WATERFALL_TOTAL} />
                        <WaterfallStep label="Audio Playback" ms={50} color="#10b981" offset={750} total={WATERFALL_TOTAL} />
                    </div>
                    <div className="mt-4 flex justify-between text-[10px] text-zinc-600 font-mono">
                        <span>0ms</span><span>450ms</span><span>900ms</span><span>1350ms</span><span>1800ms</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                        <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs text-emerald-400 font-bold">Total: ~800ms TTFB</span>
                        <span className="text-xs text-zinc-600">— within natural conversation threshold</span>
                    </div>
                </div>
            </div>

            {/* Provider Performance Grid */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Server className="w-4 h-4 text-orange-400" />
                    <h3 className="text-sm font-bold text-white">Provider Latency Benchmarks</h3>
                    <span className="ml-auto text-xs text-zinc-500">P50 / P90 / P99 across all calls</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {MOCK_PROVIDERS.map(p => <ProviderCard key={p.name} {...p} />)}
                </div>
            </div>

            {/* Recommendations */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" /> Latency Optimization Recommendations
                </h3>
                <div className="space-y-3">
                    {[
                        { text: "Switch STT from OpenAI Whisper → Deepgram Nova-2 to save 220ms median latency", impact: "High", color: "#10b981" },
                        { text: "Enable Deepgram Flux to reduce VAD silence detection from 300ms → 50ms", impact: "High", color: "#10b981" },
                        { text: "Replace ElevenLabs TTS → Cartesia Sonic to save 90ms median TTS time", impact: "Medium", color: "#f59e0b" },
                        { text: "Enable On-Shore routing for AU clients — eliminates 300ms transit overhead", impact: "Critical", color: "#ef4444" },
                    ].map((r, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-zinc-800/40 rounded-lg">
                            <ChevronRight className="w-3.5 h-3.5 mt-0.5 text-zinc-500" />
                            <span className="text-xs text-zinc-300 flex-1">{r.text}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ color: r.color, background: r.color + "20" }}>{r.impact}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
