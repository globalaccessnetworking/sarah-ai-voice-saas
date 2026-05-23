"use client";
import React, { useState } from "react";
import {
    Globe, Zap, Server, CheckCircle, AlertTriangle, MapPin, TrendingDown,
    RefreshCw, ChevronRight, Info, Settings
} from "lucide-react";

interface RegionConfig {
    id: string;
    label: string;
    region: string;
    flag: string;
    latency: number;
    transitPenalty: number;
    available: boolean;
}

interface ProviderRouting {
    provider: string;
    type: "LLM" | "STT" | "TTS";
    currentRegion: string;
    autoRoute: boolean;
    preferredRegion: string;
    color: string;
}

const AU_REGIONS: RegionConfig[] = [
    { id: "ap-southeast-2", label: "AWS Sydney (ap-southeast-2)", region: "Sydney, AU", flag: "🇦🇺", latency: 18, transitPenalty: 0, available: true },
    { id: "us-east-1", label: "AWS N. Virginia (us-east-1)", region: "Virginia, US", flag: "🇺🇸", latency: 342, transitPenalty: 324, available: true },
    { id: "us-west-2", label: "AWS Oregon (us-west-2)", region: "Oregon, US", flag: "🇺🇸", latency: 280, transitPenalty: 262, available: true },
    { id: "eu-west-1", label: "AWS Ireland (eu-west-1)", region: "Dublin, EU", flag: "🇮🇪", latency: 310, transitPenalty: 292, available: true },
    { id: "asia-southeast1", label: "Google Vertex AI Singapore", region: "Singapore", flag: "🇸🇬", latency: 89, transitPenalty: 71, available: true },
    { id: "australia-southeast1", label: "Google Vertex AI Melbourne", region: "Melbourne, AU", flag: "🇦🇺", latency: 22, transitPenalty: 0, available: false },
];

const PROVIDER_ROUTING: ProviderRouting[] = [
    { provider: "OpenAI GPT-4o", type: "LLM", currentRegion: "us-east-1", autoRoute: false, preferredRegion: "ap-southeast-2", color: "#10b981" },
    { provider: "Gemini 1.5 Flash", type: "LLM", currentRegion: "ap-southeast-2", autoRoute: true, preferredRegion: "ap-southeast-2", color: "#6366f1" },
    { provider: "Claude 3.5 Sonnet", type: "LLM", currentRegion: "us-east-1", autoRoute: false, preferredRegion: "ap-southeast-2", color: "#f59e0b" },
    { provider: "Deepgram Nova-2", type: "STT", currentRegion: "ap-southeast-2", autoRoute: true, preferredRegion: "ap-southeast-2", color: "#06b6d4" },
    { provider: "Cartesia Sonic", type: "TTS", currentRegion: "us-west-2", autoRoute: false, preferredRegion: "ap-southeast-2", color: "#f97316" },
    { provider: "ElevenLabs v3", type: "TTS", currentRegion: "eu-west-1", autoRoute: false, preferredRegion: "us-east-1", color: "#8b5cf6" },
];

export default function GeoRoutingPage() {
    const [providers, setProviders] = useState(PROVIDER_ROUTING);
    const [globalAutoRoute, setGlobalAutoRoute] = useState(false);

    const toggleAutoRoute = (idx: number) => {
        setProviders(prev => prev.map((p, i) => i === idx ? { ...p, autoRoute: !p.autoRoute } : p));
    };

    const onShoreCount = providers.filter(p => p.currentRegion.includes("ap-southeast") || p.currentRegion.includes("australia")).length;
    const totalSavings = providers.reduce((sum, p) => {
        const region = AU_REGIONS.find(r => r.id === p.currentRegion);
        if (!region) return sum;
        const onShoreRegion = AU_REGIONS.find(r => r.flag === "🇦🇺");
        return sum + (region.transitPenalty || 0);
    }, 0);

    return (
        <div className="min-h-screen bg-black text-zinc-200">
            <div className="w-full overflow-y-auto bg-zinc-950 p-8 md:p-10">
                <div className="max-w-[1400px] mx-auto space-y-8">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-950/40 to-indigo-950/30 border border-blue-900/30 rounded-2xl p-6 flex items-center gap-5">
                        <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center">
                            <Globe className="w-7 h-7 text-blue-400" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold text-white mb-1">Geo-Located Model Routing</h1>
                            <p className="text-xs text-zinc-400">Route AI model API calls to the closest geographic region. AU → AU routing eliminates 300ms+ transit overhead on every single call.</p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-blue-400">{onShoreCount}/{providers.length}</div>
                            <div className="text-xs text-zinc-500 uppercase tracking-widest">On-Shore</div>
                        </div>
                    </div>

                    {/* Why it matters */}
                    <div className="grid lg:grid-cols-3 gap-4">
                        {[
                            { label: "AU → AU (On-Shore)", latency: "18ms", penalty: "None", color: "#10b981", icon: "🇦🇺" },
                            { label: "AU → Singapore (Nearest)", latency: "89ms", penalty: "+71ms", color: "#f59e0b", icon: "🇸🇬" },
                            { label: "AU → US (Default)", latency: "342ms", penalty: "+324ms", color: "#ef4444", icon: "🇺🇸" },
                        ].map(item => (
                            <div key={item.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                                <div className="text-2xl mb-2">{item.icon}</div>
                                <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">{item.label}</div>
                                <div className="text-3xl font-bold font-mono text-white mb-1">{item.latency}</div>
                                <div className="text-sm font-bold" style={{ color: item.color }}>Transit penalty: {item.penalty}</div>
                            </div>
                        ))}
                    </div>

                    {/* Global Auto-Route Banner */}
                    <div className={`flex items-center gap-4 p-5 rounded-xl border transition-all ${globalAutoRoute ? "bg-emerald-950/20 border-emerald-900/30" : "bg-zinc-900 border-zinc-800"}`}>
                        <Globe className={`w-5 h-5 ${globalAutoRoute ? "text-emerald-400" : "text-zinc-500"}`} />
                        <div className="flex-1">
                            <div className="text-sm font-bold text-white">Global Auto-Route (Recommended)</div>
                            <div className="text-xs text-zinc-500">Automatically send every API call to the nearest available compute region. Saves {totalSavings}ms+ per call on average.</div>
                        </div>
                        <button
                            onClick={() => setGlobalAutoRoute(p => !p)}
                            className={`w-12 h-6 rounded-full transition-all relative ${globalAutoRoute ? "bg-emerald-600" : "bg-zinc-700"}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${globalAutoRoute ? "right-1" : "left-1"}`} />
                        </button>
                    </div>

                    {/* Provider Routing Table */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-white flex items-center gap-2"><Server className="w-4 h-4 text-indigo-400" /> Per-Provider Region Settings</h2>
                            <span className="text-xs text-zinc-500">Changes apply to new calls immediately</span>
                        </div>
                        <div className="divide-y divide-zinc-800/50">
                            {providers.map((p, idx) => {
                                const currentR = AU_REGIONS.find(r => r.id === p.currentRegion);
                                const isOnshore = currentR?.flag === "🇦🇺";
                                return (
                                    <div key={p.provider} className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-800/30 transition-colors">
                                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-white">{p.provider}</span>
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ color: p.color, background: p.color + "20" }}>{p.type}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{currentR?.flag || "❓"}</span>
                                            <div>
                                                <div className="text-xs text-zinc-300">{currentR?.region || "Unknown"}</div>
                                                <div className={`text-[10px] font-bold ${isOnshore ? "text-emerald-400" : "text-red-400"}`}>
                                                    {isOnshore ? "✓ On-Shore" : `+${currentR?.transitPenalty || 0}ms penalty`}
                                                </div>
                                            </div>
                                        </div>
                                        <select
                                            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                                            value={p.currentRegion}
                                            onChange={e => setProviders(prev => prev.map((pp, i) => i === idx ? { ...pp, currentRegion: e.target.value } : pp))}
                                        >
                                            {AU_REGIONS.map(r => (
                                                <option key={r.id} value={r.id} disabled={!r.available}>
                                                    {r.flag} {r.label} ({r.latency}ms)
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => toggleAutoRoute(idx)}
                                            className={`w-9 h-5 rounded-full transition-all relative ${p.autoRoute ? "bg-emerald-600" : "bg-zinc-700"}`}
                                        >
                                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${p.autoRoute ? "right-0.5" : "left-0.5"}`} />
                                        </button>
                                        <span className="text-[10px] text-zinc-600 w-10">{p.autoRoute ? "Auto" : "Manual"}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Save button */}
                    <div className="flex justify-end">
                        <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-colors">
                            <CheckCircle className="w-4 h-4" /> Save Routing Config
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
