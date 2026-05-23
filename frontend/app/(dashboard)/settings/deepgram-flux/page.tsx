"use client";
import React, { useState } from "react";
import {
    Zap, Mic, MessageSquare, Settings, CheckCircle, Info, ToggleLeft,
    ToggleRight, ChevronRight, Brain, Timer, Volume2, BarChart3, Star
} from "lucide-react";

interface FluxConfig {
    enabled: boolean;
    endOfUtteranceDelay: number;
    interruptionSensitivity: number;
    smartFormatting: boolean;
    fillersEnabled: boolean;
    contextWindowMs: number;
    vadConfidence: number;
    suppressBackchannel: boolean;
    smartPunctuation: boolean;
}

const DEFAULT_CONFIG: FluxConfig = {
    enabled: true,
    endOfUtteranceDelay: 50,
    interruptionSensitivity: 75,
    smartFormatting: true,
    fillersEnabled: true,
    contextWindowMs: 300,
    vadConfidence: 0.7,
    suppressBackchannel: true,
    smartPunctuation: true,
};

function SliderRow({ label, desc, value, min, max, unit, color, onChange }: {
    label: string; desc: string; value: number; min: number; max: number; unit: string; color: string; onChange: (v: number) => void;
}) {
    return (
        <div className="p-4 bg-zinc-800/40 rounded-xl">
            <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-zinc-200">{label}</span>
                <span className="text-sm font-mono font-bold" style={{ color }}>{value}{unit}</span>
            </div>
            <p className="text-xs text-zinc-500 mb-3">{desc}</p>
            <input
                type="range" min={min} max={max} value={value}
                onChange={e => onChange(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: color }}
            />
            <div className="flex justify-between mt-1 text-[10px] text-zinc-600">
                <span>{min}{unit}</span><span>{max}{unit}</span>
            </div>
        </div>
    );
}

function ToggleRow({ label, desc, enabled, onChange }: { label: string; desc: string; enabled: boolean; onChange: (v: boolean) => void }) {
    return (
        <div className="flex items-center gap-4 p-4 bg-zinc-800/40 rounded-xl">
            <div className="flex-1">
                <div className="text-sm font-bold text-zinc-200">{label}</div>
                <div className="text-xs text-zinc-500">{desc}</div>
            </div>
            <button
                onClick={() => onChange(!enabled)}
                className={`w-11 h-6 rounded-full transition-all relative shrink-0 ${enabled ? "bg-emerald-600" : "bg-zinc-700"}`}
            >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${enabled ? "right-1" : "left-1"}`} />
            </button>
        </div>
    );
}

export default function DeepgramFluxPage() {
    const [config, setConfig] = useState<FluxConfig>(DEFAULT_CONFIG);
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const updateConfig = (key: keyof FluxConfig, value: any) => setConfig(p => ({ ...p, [key]: value }));

    return (
        <div className="min-h-screen bg-black text-zinc-200">
            <div className="w-full overflow-y-auto bg-zinc-950 p-8 md:p-10">
                <div className="max-w-[1400px] mx-auto space-y-8">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-cyan-950/50 to-blue-950/30 border border-cyan-900/30 rounded-2xl p-6 flex items-center gap-5">
                        <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center">
                            <Zap className="w-7 h-7 text-cyan-400" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-xl font-bold text-white">Deepgram Flux</h1>
                                <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full uppercase tracking-widest">Voice Quality</span>
                                {config.enabled && <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
                                </span>}
                            </div>
                            <p className="text-xs text-zinc-400">Context-aware end-of-utterance detection that reduces response latency from 300ms → 50ms. Eliminates false interruptions and backchannel noise.</p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold font-mono text-cyan-400">-250ms</div>
                            <div className="text-xs text-zinc-500 uppercase tracking-widest">Latency Savings</div>
                        </div>
                    </div>

                    {/* Enable Master Toggle */}
                    <div className={`flex items-center gap-4 p-5 rounded-xl border transition-all ${config.enabled ? "bg-emerald-950/20 border-emerald-900/30" : "bg-zinc-900 border-zinc-800"}`}>
                        <div className="flex-1">
                            <div className="text-base font-bold text-white mb-0.5">Enable Deepgram Flux Engine</div>
                            <div className="text-xs text-zinc-500">Replace standard VAD silence detection with Flux's neural end-of-utterance prediction model. Recommended for all production agents.</div>
                        </div>
                        <button
                            onClick={() => updateConfig("enabled", !config.enabled)}
                            className={`w-14 h-7 rounded-full transition-all relative ${config.enabled ? "bg-emerald-600" : "bg-zinc-700"}`}
                        >
                            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${config.enabled ? "right-1" : "left-1"}`} />
                        </button>
                    </div>

                    <div className={`grid lg:grid-cols-2 gap-6 transition-opacity ${!config.enabled ? "opacity-50 pointer-events-none" : ""}`}>
                        {/* Performance Tuning */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
                            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                                <Timer className="w-4 h-4 text-orange-400" /> End-of-Utterance Tuning
                            </h2>
                            <SliderRow
                                label="EOU Detection Delay" desc="Milliseconds to wait after Flux signals end-of-speech before responding."
                                value={config.endOfUtteranceDelay} min={0} max={500} unit="ms" color="#f59e0b"
                                onChange={v => updateConfig("endOfUtteranceDelay", v)}
                            />
                            <SliderRow
                                label="Context Window" desc="How much audio history Flux uses to make its prediction (larger = more accurate, slightly more latency)."
                                value={config.contextWindowMs} min={100} max={800} unit="ms" color="#6366f1"
                                onChange={v => updateConfig("contextWindowMs", v)}
                            />
                            <SliderRow
                                label="VAD Confidence Threshold" desc="Minimum confidence score (0-1) before triggering end-of-utterance. Lower = more sensitive."
                                value={config.vadConfidence * 100} min={30} max={95} unit="%" color="#10b981"
                                onChange={v => updateConfig("vadConfidence", v / 100)}
                            />
                        </div>

                        {/* Interruption & Formatting */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
                            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                                <Mic className="w-4 h-4 text-cyan-400" /> Interruption & Formatting
                            </h2>
                            <SliderRow
                                label="Interruption Sensitivity" desc="How aggressively Flux allows callers to interrupt the AI agent's speech."
                                value={config.interruptionSensitivity} min={0} max={100} unit="%" color="#ef4444"
                                onChange={v => updateConfig("interruptionSensitivity", v)}
                            />
                            <div className="space-y-3">
                                <ToggleRow label="Smart Formatting" desc="Auto-format numbers, currencies, dates, and addresses in transcripts." enabled={config.smartFormatting} onChange={v => updateConfig("smartFormatting", v)} />
                                <ToggleRow label="Smart Punctuation" desc="Add punctuation to transcripts based on context." enabled={config.smartPunctuation} onChange={v => updateConfig("smartPunctuation", v)} />
                                <ToggleRow label="Filler Detection" desc="Detect and optionally suppress 'um', 'uh', 'like' from transcripts." enabled={config.fillersEnabled} onChange={v => updateConfig("fillersEnabled", v)} />
                                <ToggleRow label="Backchannel Suppression" desc="Ignore 'mm-hmm', 'yeah', 'ok' from triggering a new agent response." enabled={config.suppressBackchannel} onChange={v => updateConfig("suppressBackchannel", v)} />
                            </div>
                        </div>
                    </div>

                    {/* Impact Metrics */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                        <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-5"><BarChart3 className="w-4 h-4 text-indigo-400" /> Expected Impact with Current Settings</h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: "TTFB Reduction", value: `~${Math.round((300 - config.endOfUtteranceDelay) * 0.8)}ms`, color: "#10b981", desc: "Less silence detection delay" },
                                { label: "False Interruptions", value: `${Math.round(100 - config.interruptionSensitivity * 0.6)}% reduction`, color: "#6366f1", desc: "More natural flow" },
                                { label: "Transcript Accuracy", value: config.smartFormatting ? "+12%" : "+0%", color: "#f59e0b", desc: "Smart formatting on" },
                                { label: "Conversation Score", value: config.enabled ? "↑ Excellent" : "Standard", color: "#ef4444", desc: "vs. standard VAD" },
                            ].map(m => (
                                <div key={m.label} className="bg-zinc-800/40 p-4 rounded-xl">
                                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">{m.label}</div>
                                    <div className="text-xl font-bold font-mono" style={{ color: m.color }}>{m.value}</div>
                                    <div className="text-[10px] text-zinc-600 mt-1">{m.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Save */}
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-zinc-500">Changes apply to all new calls immediately. Active calls will use current settings until they end.</p>
                        <button
                            onClick={handleSave}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${saved ? "bg-emerald-600 text-white" : "bg-indigo-600 hover:bg-indigo-500 text-white"}`}
                        >
                            {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : "Save Flux Configuration"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
