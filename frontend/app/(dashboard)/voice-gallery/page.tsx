"use client";
import React, { useState } from "react";
import {
    Mic, Play, Pause, Upload, Sliders, Download, Check, Star,
    Music, Globe, Zap, Volume2, RefreshCw, Plus, Crown, 
    ChevronRight, Lock
} from "lucide-react";

interface Voice {
    id: string;
    name: string;
    accent: string;
    language: string;
    gender: "Male" | "Female" | "Neutral";
    style: string;
    provider: string;
    custom: boolean;
    premium: boolean;
    playingSample?: boolean;
    stability: number;
    similarity: number;
    speed: number;
    sampleText: string;
}

const VOICES: Voice[] = [
    { id: "v1", name: "Sarah (AU)", accent: "Australian", language: "English", gender: "Female", style: "Professional", provider: "Cartesia", custom: false, premium: false, stability: 75, similarity: 80, speed: 100, sampleText: "Hello! You've reached Sydney Dental Group. How can I help you today?" },
    { id: "v2", name: "James (US)", accent: "American", language: "English", gender: "Male", style: "Warm", provider: "ElevenLabs", custom: false, premium: true, stability: 85, similarity: 90, speed: 95, sampleText: "Thank you for calling. I'm James, your AI assistant. How can I assist you?" },
    { id: "v3", name: "Emma (UK)", accent: "British", language: "English", gender: "Female", style: "Formal", provider: "Cartesia", custom: false, premium: true, stability: 90, similarity: 85, speed: 98, sampleText: "Good afternoon. You're through to our customer service team. How may I help?" },
    { id: "v4", name: "Miguel (ES)", accent: "Spanish", language: "Spanish", gender: "Male", style: "Friendly", provider: "ElevenLabs", custom: false, premium: true, stability: 80, similarity: 75, speed: 100, sampleText: "Hola! ¿En qué puedo ayudarte hoy?" },
    { id: "v5", name: "My Custom Voice", accent: "Australian", language: "English", gender: "Female", style: "Custom", provider: "Custom Clone", custom: true, premium: false, stability: 78, similarity: 82, speed: 100, sampleText: "This is your custom cloned voice. Hello there!" },
    { id: "v6", name: "Alex (AU)", accent: "Australian", language: "English", gender: "Neutral", style: "Casual", provider: "Deepgram", custom: false, premium: false, stability: 70, similarity: 85, speed: 105, sampleText: "Hey there! Thanks for calling. What can I do for you today?" },
];

function VoiceSlider({ label, value, onChange, color = "#6366f1" }: { label: string; value: number; onChange: (v: number) => void; color?: string }) {
    return (
        <div>
            <div className="flex justify-between mb-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{label}</span>
                <span className="text-[10px] font-bold font-mono" style={{ color }}>{value}%</span>
            </div>
            <input type="range" min={0} max={100} value={value} onChange={e => onChange(Number(e.target.value))} className="w-full h-1.5 rounded-full appearance-none cursor-pointer" style={{ accentColor: color }} />
        </div>
    );
}

export default function VoiceGalleryPage() {
    const [voices, setVoices] = useState(VOICES);
    const [playing, setPlaying] = useState<string | null>(null);
    const [selected, setSelected] = useState<Voice | null>(null);
    const [activeTab, setActiveTab] = useState<"gallery" | "upload" | "marketplace">("gallery");
    const [uploadState, setUploadState] = useState<"idle" | "uploading" | "processing" | "done">("idle");
    const [filterGender, setFilterGender] = useState<string>("All");
    const [filterProvider, setFilterProvider] = useState<string>("All");

    const handlePlay = (id: string) => {
        setPlaying(prev => prev === id ? null : id);
        setTimeout(() => setPlaying(null), 4000);
    };

    const handleVoiceSlider = (id: string, key: "stability" | "similarity" | "speed", val: number) => {
        setVoices(p => p.map(v => v.id === id ? { ...v, [key]: val } : v));
        if (selected?.id === id) setSelected(p => p ? { ...p, [key]: val } : null);
    };

    const handleUpload = async () => {
        setUploadState("uploading");
        await new Promise(r => setTimeout(r, 1200));
        setUploadState("processing");
        await new Promise(r => setTimeout(r, 2000));
        setUploadState("done");
    };

    const filtered = voices.filter(v =>
        (filterGender === "All" || v.gender === filterGender) &&
        (filterProvider === "All" || v.provider === filterProvider)
    );
    const providers = [...new Set(voices.map(v => v.provider))];

    return (
        <div className="min-h-screen bg-black text-zinc-200">
            <div className="w-full overflow-y-auto bg-zinc-950 p-8 md:p-10">
                <div className="max-w-[1600px] mx-auto space-y-8">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-rose-950/40 to-pink-950/30 border border-rose-900/30 rounded-2xl p-6 flex items-center gap-5">
                        <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center">
                            <Mic className="w-7 h-7 text-rose-400" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold text-white mb-1">AI Voice Gallery</h1>
                            <p className="text-xs text-zinc-400">Manage your agent voices, clone custom voices from recordings, and browse the voice marketplace. Apply voices to agents in Agent Builder.</p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-rose-400">{voices.length}</div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Total Voices</div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
                        {(["gallery", "upload", "marketplace"] as const).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
                                {tab === "gallery" ? "🎙️ My Voices" : tab === "upload" ? "⬆️ Clone Voice" : "🏪 Marketplace"}
                            </button>
                        ))}
                    </div>

                    {activeTab === "gallery" && (
                        <>
                            <div className="flex gap-3 flex-wrap">
                                {["All", "Male", "Female", "Neutral"].map(g => (
                                    <button key={g} onClick={() => setFilterGender(g)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterGender === g ? "bg-rose-600 text-white" : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200"}`}>{g}</button>
                                ))}
                                <div className="w-px bg-zinc-800 mx-1" />
                                {["All", ...providers].map(p => (
                                    <button key={p} onClick={() => setFilterProvider(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterProvider === p ? "bg-indigo-600 text-white" : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200"}`}>{p}</button>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                {filtered.map(voice => (
                                    <div key={voice.id} className={`bg-zinc-900 border rounded-2xl p-5 flex flex-col gap-4 cursor-pointer transition-all hover:shadow-lg ${voice.custom ? "border-amber-500/40" : "border-zinc-800 hover:border-zinc-600"}`} onClick={() => setSelected(voice)}>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-sm font-bold text-white">{voice.name}</span>
                                                    {voice.custom && <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">Custom</span>}
                                                    {voice.premium && <Crown className="w-3.5 h-3.5 text-yellow-400" />}
                                                </div>
                                                <div className="text-[10px] text-zinc-500">{voice.accent} · {voice.gender} · {voice.style}</div>
                                            </div>
                                            <span className="text-[10px] font-bold text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">{voice.provider}</span>
                                        </div>

                                        <p className="text-[11px] text-zinc-400 italic leading-relaxed line-clamp-2">"{voice.sampleText}"</p>

                                        <div className="flex items-center justify-between">
                                            <button
                                                onClick={e => { e.stopPropagation(); handlePlay(voice.id); }}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${playing === voice.id ? "bg-rose-600 text-white" : "bg-zinc-800 hover:bg-rose-600 text-zinc-300 hover:text-white"}`}
                                            >
                                                {playing === voice.id ? <><Pause className="w-3 h-3" /> Playing...</> : <><Play className="w-3 h-3" /> Preview</>}
                                            </button>
                                            <div className="text-[10px] text-zinc-500">{voice.language}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {activeTab === "upload" && (
                        <div className="max-w-2xl mx-auto space-y-6">
                            <div className="bg-gradient-to-r from-amber-950/30 to-orange-950/20 border border-amber-900/30 rounded-xl p-4 flex items-start gap-3">
                                <Mic className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-300 leading-relaxed"><strong>Voice Cloning:</strong> Upload a clean 30-second (minimum) audio sample in WAV or MP3 format. Avoid background noise, music, or multiple speakers. The AI will create a digital voice clone that mimics the speaker's style and tone.</p>
                            </div>
                            <div className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${uploadState !== "idle" ? "border-emerald-600 bg-emerald-950/10" : "border-zinc-700 hover:border-zinc-400"}`}>
                                {uploadState === "idle" && (
                                    <>
                                        <Upload className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
                                        <div className="text-base font-bold text-zinc-300 mb-2">Drop audio file here</div>
                                        <div className="text-xs text-zinc-500 mb-5">MP3 or WAV · Min 30 seconds · Max 50MB</div>
                                        <button onClick={handleUpload} className="bg-rose-600 hover:bg-rose-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors">
                                            Select Audio File
                                        </button>
                                    </>
                                )}
                                {uploadState === "uploading" && (
                                    <div className="flex flex-col items-center gap-3">
                                        <RefreshCw className="w-10 h-10 text-blue-400 animate-spin" />
                                        <div className="text-sm font-bold text-white">Uploading audio...</div>
                                        <div className="w-48 bg-zinc-800 rounded-full h-1.5">
                                            <div className="bg-blue-500 h-1.5 rounded-full w-2/3 transition-all" />
                                        </div>
                                    </div>
                                )}
                                {uploadState === "processing" && (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="flex gap-2">
                                            {[0, 1, 2, 3, 4].map(i => (
                                                <div key={i} className="w-2 bg-amber-400 rounded-sm animate-pulse" style={{ height: 20 + i * 10, animationDelay: `${i * 0.15}s` }} />
                                            ))}
                                        </div>
                                        <div className="text-sm font-bold text-white">Cloning voice... this takes ~30 seconds</div>
                                        <div className="text-xs text-zinc-500">Extracting vocal characteristics & training model</div>
                                    </div>
                                )}
                                {uploadState === "done" && (
                                    <div className="flex flex-col items-center gap-3">
                                        <Check className="w-12 h-12 text-emerald-400" />
                                        <div className="text-base font-bold text-white">Voice clone created!</div>
                                        <div className="text-xs text-zinc-400">Your custom voice is ready to use in Agent Builder.</div>
                                        <button onClick={() => { setUploadState("idle"); setActiveTab("gallery"); }} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-bold">View in Gallery</button>
                                    </div>
                                )}
                            </div>
                            {uploadState === "idle" && (
                                <div className="grid grid-cols-3 gap-4">
                                    {[{ label: "Min Duration", value: "30s" }, { label: "Max File Size", value: "50 MB" }, { label: "Clone Time", value: "~30s" }].map(m => (
                                        <div key={m.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                                            <div className="text-lg font-bold text-white">{m.value}</div>
                                            <div className="text-[10px] text-zinc-500">{m.label}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "marketplace" && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {[
                                    { name: "Professional AU Pack", voices: 12, price: "$49/mo", color: "#06b6d4", badge: "Best Seller" },
                                    { name: "Global Multilingual Pack", voices: 28, price: "$99/mo", color: "#8b5cf6", badge: "Popular" },
                                    { name: "Celebrity Soundalikes", voices: 6, price: "$199/mo", color: "#f59e0b", badge: "Premium" },
                                ].map(pack => (
                                    <div key={pack.name} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
                                        <div className="flex items-start justify-between">
                                            <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ color: pack.color, background: pack.color + "20" }}>{pack.badge}</span>
                                            <Crown className="w-4 h-4 text-yellow-400" />
                                        </div>
                                        <div>
                                            <div className="text-base font-bold text-white mb-1">{pack.name}</div>
                                            <div className="text-xs text-zinc-500">{pack.voices} professional voices</div>
                                        </div>
                                        <div className="text-2xl font-bold" style={{ color: pack.color }}>{pack.price}</div>
                                        <button className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors">
                                            <Lock className="w-3.5 h-3.5" /> Unlock Pack
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Voice Detail Drawer */}
            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)}>
                    <div className="w-full max-w-sm bg-zinc-950 border-l border-zinc-800 h-full overflow-y-auto p-6 space-y-5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-white">{selected.name}</h2>
                            <button onClick={() => setSelected(null)} className="text-zinc-500 hover:text-white text-2xl">×</button>
                        </div>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                            <p className="text-xs text-zinc-400 italic">"{selected.sampleText}"</p>
                            <button onClick={() => handlePlay(selected.id)} className="mt-3 w-full py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                                <Play className="w-3.5 h-3.5" /> Play Sample
                            </button>
                        </div>
                        <div className="space-y-4">
                            <VoiceSlider label="Stability" value={selected.stability} onChange={v => handleVoiceSlider(selected.id, "stability", v)} color="#10b981" />
                            <VoiceSlider label="Similarity Boost" value={selected.similarity} onChange={v => handleVoiceSlider(selected.id, "similarity", v)} color="#6366f1" />
                            <VoiceSlider label="Speed" value={selected.speed} onChange={v => handleVoiceSlider(selected.id, "speed", v)} color="#f59e0b" />
                        </div>
                        <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-colors">
                            Apply to Agent Builder
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
