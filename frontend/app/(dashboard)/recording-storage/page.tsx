"use client";
import React, { useState } from "react";
import {
    Play, Download, Trash2, Eye, EyeOff, Search, Filter, HardDrive,
    Cloud, Shield, Calendar, Clock, PhoneCall, Bot, User, BarChart3,
    CheckCircle, AlertCircle, ChevronRight, Pause, Volume2
} from "lucide-react";

interface Recording {
    id: string;
    agentName: string;
    callerName: string;
    callerPhone: string;
    date: string;
    duration: string;
    durationSec: number;
    size: string;
    sentiment: "positive" | "neutral" | "negative";
    outcome: "Resolved" | "Escalated" | "Abandoned";
    cost: number;
    piiRedacted: boolean;
    storageLocation: "local" | "s3";
    transcriptPreview: string;
}

const MOCK_RECORDINGS: Recording[] = [
    { id: "REC-001", agentName: "Receptionist AI", callerName: "Sarah Thompson", callerPhone: "+61 4XX XXX 001", date: "2026-03-10", duration: "3m 22s", durationSec: 202, size: "3.2 MB", sentiment: "positive", outcome: "Resolved", cost: 0.042, piiRedacted: true, storageLocation: "s3", transcriptPreview: "Hi, I'd like to book an appointment for next Tuesday..." },
    { id: "REC-002", agentName: "Sales Agent", callerName: "James Wilson", callerPhone: "+61 4XX XXX 002", date: "2026-03-10", duration: "5m 48s", durationSec: 348, size: "5.8 MB", sentiment: "neutral", outcome: "Escalated", cost: 0.089, piiRedacted: false, storageLocation: "local", transcriptPreview: "I need to discuss my enterprise pricing options..." },
    { id: "REC-003", agentName: "Support Bot", callerName: "Emily Chen", callerPhone: "+61 4XX XXX 003", date: "2026-03-09", duration: "1m 14s", durationSec: 74, size: "1.4 MB", sentiment: "negative", outcome: "Abandoned", cost: 0.018, piiRedacted: true, storageLocation: "local", transcriptPreview: "This is the third time I'm calling about the same issue..." },
    { id: "REC-004", agentName: "Receptionist AI", callerName: "Michael Brown", callerPhone: "+61 4XX XXX 004", date: "2026-03-09", duration: "2m 55s", durationSec: 175, size: "2.8 MB", sentiment: "positive", outcome: "Resolved", cost: 0.036, piiRedacted: true, storageLocation: "s3", transcriptPreview: "Great, I'd like to confirm my appointment for Thursday..." },
    { id: "REC-005", agentName: "Outbound AI", callerName: "Lisa Park", callerPhone: "+61 4XX XXX 005", date: "2026-03-08", duration: "4m 10s", durationSec: 250, size: "4.1 MB", sentiment: "positive", outcome: "Resolved", cost: 0.063, piiRedacted: false, storageLocation: "local", transcriptPreview: "Oh yes, I was expecting a call about the promotion..." },
];

const sentimentColor = { positive: "#10b981", neutral: "#f59e0b", negative: "#ef4444" };
const outcomeColor = { Resolved: "#10b981", Escalated: "#f59e0b", Abandoned: "#ef4444" };

export default function RecordingStoragePage() {
    const [search, setSearch] = useState("");
    const [playing, setPlaying] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"recordings" | "storage" | "settings">("recordings");

    const filtered = MOCK_RECORDINGS.filter(r =>
        r.agentName.toLowerCase().includes(search.toLowerCase()) ||
        r.callerName.toLowerCase().includes(search.toLowerCase()) ||
        r.callerPhone.includes(search)
    );

    const totalSize = 47.3;
    const s3Offloaded = 18.2;
    const localUsed = 29.1;

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="w-9 h-9 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center">
                            <Volume2 className="w-5 h-5 text-red-400" />
                        </div>
                        Recording & Storage Centre
                    </h1>
                    <p className="text-xs text-zinc-500 mt-1 ml-12">All call recordings with playback, transcripts, and cloud storage management.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-300">
                        <span className="text-zinc-500">Storage:</span> <span className="text-white font-bold">{totalSize} GB</span> used
                    </div>
                </div>
            </div>

            {/* Stats Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Recordings", value: "400", icon: <Volume2 className="w-4 h-4" />, color: "#6366f1" },
                    { label: "Local Storage", value: `${localUsed} GB`, icon: <HardDrive className="w-4 h-4" />, color: "#f59e0b" },
                    { label: "S3 Offloaded", value: `${s3Offloaded} GB`, icon: <Cloud className="w-4 h-4" />, color: "#10b981" },
                    { label: "PII Redacted", value: "312", icon: <Shield className="w-4 h-4" />, color: "#06b6d4" },
                ].map(s => (
                    <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.color + "15", color: s.color }}>
                            {s.icon}
                        </div>
                        <div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-widest">{s.label}</div>
                            <div className="text-xl font-bold text-white">{s.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
                {(["recordings", "storage", "settings"] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                    >
                        {tab === "recordings" ? "📼 Recordings" : tab === "storage" ? "💾 Storage" : "⚙️ Settings"}
                    </button>
                ))}
            </div>

            {activeTab === "recordings" && (
                <>
                    {/* Search Bar */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search by agent, caller name, or phone..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                        <button className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-zinc-400 hover:text-zinc-200">
                            <Filter className="w-3.5 h-3.5" /> Filter
                        </button>
                    </div>

                    {/* Recording Table */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                        <div className="grid grid-cols-12 text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-5 py-3 border-b border-zinc-800 bg-black/20">
                            <div className="col-span-1">ID</div>
                            <div className="col-span-2">Agent</div>
                            <div className="col-span-2">Caller</div>
                            <div className="col-span-1">Date</div>
                            <div className="col-span-1">Duration</div>
                            <div className="col-span-1">Sentiment</div>
                            <div className="col-span-1">Outcome</div>
                            <div className="col-span-1">Storage</div>
                            <div className="col-span-2">Actions</div>
                        </div>
                        {filtered.map((rec, i) => (
                            <div key={rec.id} className={`grid grid-cols-12 px-5 py-4 items-center text-xs border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors ${i % 2 === 0 ? '' : 'bg-zinc-900/50'}`}>
                                <div className="col-span-1 font-mono text-zinc-500">{rec.id}</div>
                                <div className="col-span-2">
                                    <div className="flex items-center gap-1.5">
                                        <Bot className="w-3 h-3 text-indigo-400" />
                                        <span className="text-zinc-300 font-medium truncate">{rec.agentName}</span>
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <div className="text-zinc-200">{rec.piiRedacted ? "●●● Redacted" : rec.callerName}</div>
                                    <div className="text-zinc-600 font-mono text-[10px]">{rec.piiRedacted ? "+61 4XX XXX XXX" : rec.callerPhone}</div>
                                </div>
                                <div className="col-span-1 text-zinc-500 font-mono">{rec.date}</div>
                                <div className="col-span-1">
                                    <div className="text-zinc-300">{rec.duration}</div>
                                    <div className="text-zinc-600 text-[10px]">{rec.size}</div>
                                </div>
                                <div className="col-span-1">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ color: sentimentColor[rec.sentiment], background: sentimentColor[rec.sentiment] + "20" }}>
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: sentimentColor[rec.sentiment] }} />
                                        {rec.sentiment}
                                    </span>
                                </div>
                                <div className="col-span-1">
                                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ color: outcomeColor[rec.outcome], background: outcomeColor[rec.outcome] + "20" }}>
                                        {rec.outcome}
                                    </span>
                                </div>
                                <div className="col-span-1">
                                    {rec.storageLocation === "s3"
                                        ? <span className="flex items-center gap-1 text-emerald-400 text-[10px]"><Cloud className="w-3 h-3" /> S3</span>
                                        : <span className="flex items-center gap-1 text-zinc-400 text-[10px]"><HardDrive className="w-3 h-3" /> Local</span>
                                    }
                                </div>
                                <div className="col-span-2 flex items-center gap-1">
                                    <button
                                        onClick={() => setPlaying(playing === rec.id ? null : rec.id)}
                                        className="p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
                                        title="Play Recording"
                                    >
                                        {playing === rec.id ? <Pause className="w-3 h-3 text-white" /> : <Play className="w-3 h-3 text-white" />}
                                    </button>
                                    <button className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors" title="View Transcript"><Eye className="w-3 h-3 text-zinc-400" /></button>
                                    <button className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors" title="Download"><Download className="w-3 h-3 text-zinc-400" /></button>
                                    <button className="p-1.5 bg-zinc-800 hover:bg-red-900/50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-3 h-3 text-zinc-600 hover:text-red-400" /></button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Expanded Player */}
                    {playing && (() => {
                        const rec = MOCK_RECORDINGS.find(r => r.id === playing)!;
                        return (
                            <div className="bg-zinc-900 border border-indigo-500/30 rounded-2xl p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-bold text-white">{rec.id} — {rec.agentName} with {rec.piiRedacted ? "Redacted Caller" : rec.callerName}</div>
                                        <div className="text-xs text-zinc-500">{rec.date} · {rec.duration} · {rec.size}</div>
                                    </div>
                                    <button onClick={() => setPlaying(null)} className="text-zinc-500 hover:text-white text-xs">✕ Close</button>
                                </div>
                                {/* Waveform mock */}
                                <div className="h-16 bg-zinc-950 rounded-xl flex items-center gap-0.5 px-4 overflow-hidden">
                                    {Array.from({ length: 80 }).map((_, i) => (
                                        <div key={i} className="w-1 rounded-full bg-indigo-500/60" style={{ height: `${Math.random() * 80 + 10}%` }} />
                                    ))}
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setPlaying(null)} className="p-2 bg-indigo-600 rounded-full"><Pause className="w-4 h-4 text-white" /></button>
                                    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full"><div className="w-1/3 h-full bg-indigo-500 rounded-full" /></div>
                                    <span className="text-xs font-mono text-zinc-400">1:07 / {rec.duration}</span>
                                </div>
                                <div className="p-4 bg-zinc-800/60 rounded-xl border-l-2 border-indigo-500">
                                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Transcript Preview</div>
                                    <p className="text-sm text-zinc-300 italic">"{rec.transcriptPreview}"</p>
                                    {rec.piiRedacted && <div className="mt-2 flex items-center gap-1.5 text-[10px] text-cyan-400"><Shield className="w-3 h-3" /> PII has been redacted from this transcript</div>}
                                </div>
                            </div>
                        );
                    })()}
                </>
            )}

            {activeTab === "storage" && (
                <div className="grid lg:grid-cols-2 gap-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2"><HardDrive className="w-4 h-4 text-yellow-400" /> Local Storage</h3>
                        <div>
                            <div className="flex justify-between text-xs mb-2"><span className="text-zinc-400">Used</span><span className="text-white font-bold">{localUsed} GB / 100 GB</span></div>
                            <div className="h-3 bg-zinc-800 rounded-full"><div className="h-full bg-gradient-to-r from-yellow-600 to-orange-600 rounded-full" style={{ width: `${(localUsed / 100) * 100}%` }} /></div>
                        </div>
                        <div className="space-y-2 text-xs">
                            {[
                                { label: "This week", size: "4.2 GB", count: 89 },
                                { label: "This month", size: "18.6 GB", count: 342 },
                                { label: "Oldest recording", size: "Mon Feb 3, 2026", count: 0 },
                            ].map(r => (
                                <div key={r.label} className="flex justify-between text-zinc-400 py-1.5 border-b border-zinc-800">
                                    <span>{r.label}</span>
                                    <span className="text-zinc-200 font-mono">{r.size}{r.count > 0 ? ` (${r.count} files)` : ""}</span>
                                </div>
                            ))}
                        </div>
                        <button className="w-full py-2 bg-red-950/30 border border-red-900/30 rounded-xl text-xs text-red-400 hover:bg-red-900/30 transition-colors">🗑️ Clean Up Old Recordings</button>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2"><Cloud className="w-4 h-4 text-emerald-400" /> AWS S3 Cloud Storage</h3>
                        <div className="flex items-center gap-3 p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-xl">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                            <div>
                                <div className="text-xs font-bold text-emerald-300">S3 Connected</div>
                                <div className="text-[10px] text-zinc-500">Bucket: global-access-recordings-au</div>
                            </div>
                        </div>
                        <div className="space-y-3 text-xs">
                            <div className="flex justify-between text-zinc-400"><span>Offloaded this month</span><span className="text-zinc-200 font-mono">{s3Offloaded} GB</span></div>
                            <div className="flex justify-between text-zinc-400"><span>S3 Storage Cost</span><span className="text-emerald-400 font-mono">~$0.41/mo</span></div>
                            <div className="flex justify-between text-zinc-400"><span>Auto-offload policy</span><span className="text-zinc-200">After 7 days</span></div>
                        </div>
                        <button className="w-full py-2 bg-indigo-600 rounded-xl text-xs text-white hover:bg-indigo-500 transition-colors font-bold">Configure S3 Settings →</button>
                    </div>
                </div>
            )}

            {activeTab === "settings" && (
                <div className="grid lg:grid-cols-2 gap-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2"><Shield className="w-4 h-4 text-cyan-400" /> PII Redaction Engine</h3>
                        <div className="space-y-3">
                            {["Names & Identities", "Phone Numbers", "Credit Card Numbers", "Email Addresses", "Physical Addresses", "Date of Birth"].map(field => (
                                <div key={field} className="flex items-center justify-between p-3 bg-zinc-800/40 rounded-lg">
                                    <span className="text-xs text-zinc-300">{field}</span>
                                    <div className="w-8 h-4 bg-cyan-600 rounded-full relative cursor-pointer">
                                        <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2"><Calendar className="w-4 h-4 text-orange-400" /> Retention Policy</h3>
                        <div className="space-y-4">
                            {[
                                { label: "Standard calls", value: "90 days" },
                                { label: "Escalated calls", value: "1 year" },
                                { label: "Compliance recordings", value: "7 years" },
                            ].map(p => (
                                <div key={p.label} className="flex items-center justify-between p-3 bg-zinc-800/40 rounded-lg">
                                    <span className="text-xs text-zinc-300">{p.label}</span>
                                    <select className="text-xs bg-zinc-700 border border-zinc-600 rounded-lg px-2 py-1 text-zinc-200 focus:outline-none">
                                        <option>{p.value}</option>
                                    </select>
                                </div>
                            ))}
                        </div>
                        <div className="p-3 bg-amber-950/20 border border-amber-900/30 rounded-xl">
                            <p className="text-xs text-amber-400">⚖️ GDPR: Ensure your retention policy complies with local data protection laws. Consult your legal team.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
