"use client";
import React, { useState } from "react";
import {
    Search, Microscope, FileText, AlertTriangle, CheckCircle2,
    RefreshCw, Zap, MessageSquare, Flag, Eye, Download, Filter,
    ShieldAlert, BookOpen, TrendingDown, Hash
} from "lucide-react";

interface TranscriptResult {
    id: string;
    callId: string;
    date: string;
    client: string;
    agent: string;
    caller: string;
    duration: number;
    snippet: string;
    matchCount: number;
    sentiment: number;
    flags: string[];
}

interface ForensicAnalysis {
    callId: string;
    failureReason: string;
    keyMoments: { time: string; event: string; impact: "positive" | "negative" | "neutral" }[];
    recommendations: string[];
    objections: string[];
    missedOpportunities: string[];
}

const TRANSCRIPTS: TranscriptResult[] = [
    { id: "t1", callId: "CALL-20260311-0001", date: "2026-03-11 06:01", client: "Bright Smiles Dental", agent: "Sarah AI", caller: "+61412345678", duration: 145, snippet: "...looking to book an appointment for a dental check-up. I haven't been in about two years and I'm a bit concerned about...", matchCount: 3, sentiment: 0.72, flags: [] },
    { id: "t2", callId: "CALL-20260311-0002", date: "2026-03-11 05:45", client: "Peak Performance Gym", agent: "Emma AI", caller: "+61298765432", duration: 67, snippet: "...I want to cancel my membership immediately. This is completely unacceptable. I've been charged twice and no one is helping me...", matchCount: 5, sentiment: -0.82, flags: ["refund", "cancel", "complaint"] },
    { id: "t3", callId: "CALL-20260309-0015", date: "2026-03-09 14:30", client: "City Medical Centre", agent: "James AI", caller: "+61387654321", duration: 312, snippet: "...regarding my prescription renewal. My doctor said I need to come in but I'm concerned about the Medicare billing and whether my card details are...", matchCount: 2, sentiment: 0.20, flags: ["card details", "Medicare"] },
    { id: "t4", callId: "CALL-20260308-0044", date: "2026-03-08 11:15", client: "24h Locksmith", agent: "Alex AI", caller: "+61478123456", duration: 38, snippet: "...completely locked out and I need someone NOW. My credit card number is 4532... the CVV is... why is no one answering this properly...", matchCount: 7, sentiment: -0.91, flags: ["credit card number", "CVV", "PCI violation"] },
];

const ANALYSIS: Record<string, ForensicAnalysis> = {
    "t2": {
        callId: "CALL-20260311-0002",
        failureReason: "Agent failed to acknowledge the double-charge complaint within the first 30 seconds, causing sentiment to drop rapidly. The caller escalated because they felt ignored.",
        keyMoments: [
            { time: "0:08", event: "Caller mentions double-charge — agent pivoted to gym hours script", impact: "negative" },
            { time: "0:22", event: "Caller repeats complaint — agent still did not acknowledge", impact: "negative" },
            { time: "0:45", event: "Caller threatens cancellation — agent escalated to human", impact: "neutral" },
            { time: "1:02", event: "Human resolved billing error, offered 1-month free", impact: "positive" },
        ],
        recommendations: ["Add billing dispute detection keyword → immediate empathy response", "Train agent to acknowledge financial complaints in first 2 turns", "Add auto-offer of supervisor for double-charge keywords"],
        objections: ["Was charged twice with no explanation", "Feels like no one is listening", "Wants immediate resolution not a hold"],
        missedOpportunities: ["Could have offered account credit immediately", "Should have verified billing before escalating", "Upsell premium membership waived as gesture was not attempted"],
    },
};

const COMPLIANCE_FLAGS = [
    { keyword: "credit card number", category: "PCI", severity: "Critical", hits: 1 },
    { keyword: "CVV", category: "PCI", severity: "Critical", hits: 1 },
    { keyword: "Medicare", category: "HIPAA", severity: "Warning", hits: 1 },
    { keyword: "card details", category: "PCI", severity: "Warning", hits: 2 },
    { keyword: "refund", category: "Compliance", severity: "Info", hits: 8 },
    { keyword: "cancel", category: "Compliance", severity: "Info", hits: 14 },
];

export default function ForensicsPage() {
    const [query, setQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState<TranscriptResult[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<ForensicAnalysis | null>(null);
    const [tab, setTab] = useState<"search" | "compliance" | "flags">("search");

    const doSearch = async () => {
        if (!query.trim()) return;
        setSearching(true);
        await new Promise(r => setTimeout(r, 800));
        setResults(TRANSCRIPTS.filter(t => t.snippet.toLowerCase().includes(query.toLowerCase()) || t.client.toLowerCase().includes(query.toLowerCase()) || t.flags.some(f => f.includes(query.toLowerCase()))));
        setSearching(false);
    };

    const doAnalyze = async (id: string) => {
        setSelectedId(id);
        setAnalyzing(true);
        setAnalysis(null);
        await new Promise(r => setTimeout(r, 2000));
        setAnalysis(ANALYSIS[id] || {
            callId: TRANSCRIPTS.find(t => t.id === id)?.callId || "",
            failureReason: "Call completed successfully. No significant failure patterns detected. Agent followed protocol correctly throughout.",
            keyMoments: [{ time: "0:15", event: "Caller stated intent clearly — agent confirmed correctly", impact: "positive" }],
            recommendations: ["No changes required — this is a model call to learn from"],
            objections: [],
            missedOpportunities: [],
        });
        setAnalyzing(false);
    };

    const IMPACT_COLORS = { positive: "text-emerald-400", negative: "text-red-400", neutral: "text-zinc-400" };
    const SEV_COLORS: Record<string, string> = { Critical: "text-red-400 bg-red-500/10 border-red-500/20", Warning: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", Info: "text-zinc-400 bg-zinc-800 border-zinc-700" };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200 p-8 md:p-10">
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* Header */}
                <div className="bg-gradient-to-r from-violet-950/40 to-purple-950/30 border border-violet-900/30 rounded-2xl p-6 flex items-center gap-5">
                    <div className="w-14 h-14 bg-violet-500/10 border border-violet-500/20 rounded-2xl flex items-center justify-center">
                        <Microscope className="w-7 h-7 text-violet-400" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-white mb-1">AI Call Forensics</h1>
                        <p className="text-xs text-zinc-400">Full-text transcript search across all calls. GPT-4 powered &ldquo;Why did this call fail?&rdquo; analysis. Compliance keyword flagging for PCI, HIPAA, and legal requirements.</p>
                    </div>
                    <div className="flex gap-5">
                        <div className="text-right"><div className="text-2xl font-bold text-violet-400">{TRANSCRIPTS.length}</div><div className="text-[10px] text-zinc-500">Transcripts</div></div>
                        <div className="text-right"><div className="text-2xl font-bold text-red-400">{TRANSCRIPTS.filter(t => t.flags.length > 0).length}</div><div className="text-[10px] text-zinc-500">Flagged</div></div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
                    {(["search", "compliance", "flags"] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)} className={`px-5 py-2 rounded-lg text-xs font-bold capitalize transition-all ${tab === t ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-zinc-200"}`}>{t}</button>
                    ))}
                </div>

                {tab === "search" && (
                    <div className="space-y-5">
                        <div className="flex gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && doSearch()}
                                    placeholder="Search transcripts... (e.g. 'cancel', 'refund', 'credit card', caller number)"
                                    className="w-full pl-9 pr-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-violet-500" />
                            </div>
                            <button onClick={doSearch} disabled={searching} className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                                {searching ? <><RefreshCw className="w-4 h-4 animate-spin" /> Searching...</> : <><Search className="w-4 h-4" /> Search</>}
                            </button>
                        </div>

                        {results.length > 0 && (
                            <div className="space-y-4">
                                <div className="text-xs text-zinc-400">{results.length} result(s) for &ldquo;{query}&rdquo;</div>
                                {results.map(r => (
                                    <div key={r.id} className={`bg-zinc-900 border rounded-2xl p-5 space-y-3 ${r.flags.length > 0 ? "border-red-900/50" : "border-zinc-800"}`}>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-xs font-mono text-violet-400">{r.callId}</span>
                                                    {r.flags.map(f => <span key={f} className="text-[8px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5"><ShieldAlert className="w-2.5 h-2.5" /> {f}</span>)}
                                                </div>
                                                <div className="text-[10px] text-zinc-500">{r.client} · {r.agent} · {r.caller} · {r.date}</div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => doAnalyze(r.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/20 rounded-xl text-[10px] font-bold transition-colors">
                                                    <Zap className="w-3 h-3" /> Analyze with AI
                                                </button>
                                                <button className="p-1.5 text-zinc-600 hover:text-zinc-200"><Download className="w-3.5 h-3.5" /></button>
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-zinc-400 bg-zinc-800/60 rounded-xl px-3 py-2 border border-zinc-800 leading-relaxed">
                                            ...{r.snippet}...
                                        </p>
                                        <div className="flex gap-3 text-[10px] text-zinc-500">
                                            <span>{Math.floor(r.duration / 60)}:{(r.duration % 60).toString().padStart(2, "0")} mins</span>
                                            <span className={r.sentiment > 0.2 ? "text-emerald-400" : r.sentiment > -0.2 ? "text-yellow-400" : "text-red-400"}>{r.sentiment > 0 ? "+" : ""}{(r.sentiment * 100).toFixed(0)}% sentiment</span>
                                            <span>{r.matchCount} matches</span>
                                        </div>

                                        {selectedId === r.id && (
                                            <div className="mt-2 bg-zinc-800/60 rounded-xl p-4 border border-violet-500/20">
                                                {analyzing ? (
                                                    <div className="flex items-center gap-3 text-violet-400 text-sm">
                                                        <RefreshCw className="w-4 h-4 animate-spin" /> GPT-4 analyzing call transcript...
                                                    </div>
                                                ) : analysis && (
                                                    <div className="space-y-4">
                                                        <div>
                                                            <div className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-1">Why Did This Call {analysis.objections.length > 0 ? "Fail" : "Succeed"}?</div>
                                                            <p className="text-xs text-zinc-300">{analysis.failureReason}</p>
                                                        </div>
                                                        {analysis.keyMoments.length > 0 && (
                                                            <div>
                                                                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Key Moments</div>
                                                                <div className="space-y-1.5">
                                                                    {analysis.keyMoments.map((m, i) => (
                                                                        <div key={i} className="flex items-start gap-2">
                                                                            <span className="text-[9px] font-mono text-zinc-600 w-8 shrink-0">{m.time}</span>
                                                                            <span className={`text-[10px] ${IMPACT_COLORS[m.impact]}`}>{m.event}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {analysis.recommendations.length > 0 && (
                                                            <div>
                                                                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">AI Recommendations</div>
                                                                {analysis.recommendations.map((rec, i) => (
                                                                    <div key={i} className="flex items-start gap-2 text-[10px] text-zinc-300">
                                                                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" /> {rec}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {results.length === 0 && !searching && query && (
                            <div className="text-center py-10 text-zinc-600">
                                <Search className="w-8 h-8 mx-auto mb-2" />
                                <div className="text-sm">No transcripts found for &ldquo;{query}&rdquo;</div>
                            </div>
                        )}
                        {!query && (
                            <div className="text-center py-10 text-zinc-700">
                                <Microscope className="w-8 h-8 mx-auto mb-2" />
                                <div className="text-sm">Enter a keyword, phrase, caller number, or client name to search all transcripts</div>
                                <div className="text-xs mt-1">Try: &quot;cancel&quot;, &quot;refund&quot;, &quot;appointment&quot;, &quot;credit card&quot;</div>
                            </div>
                        )}
                    </div>
                )}

                {tab === "compliance" && (
                    <div className="space-y-5">
                        <div className="bg-red-950/20 border border-red-900/30 rounded-2xl p-4 flex items-start gap-3">
                            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
                            <div>
                                <div className="text-sm font-bold text-red-300 mb-1">2 Critical PCI Violations Detected</div>
                                <p className="text-[11px] text-red-400/80">Credit card numbers and CVV codes were spoken aloud during calls. Recording of these segments should be immediately reviewed and deleted per PCI-DSS requirements.</p>
                            </div>
                        </div>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                            <div className="px-5 py-4 border-b border-zinc-800"><h2 className="text-sm font-bold text-white">Compliance Keyword Monitor</h2></div>
                            <div className="divide-y divide-zinc-800/50">
                                {COMPLIANCE_FLAGS.map((f, i) => (
                                    <div key={i} className="flex items-center gap-4 px-5 py-4">
                                        <Hash className="w-4 h-4 text-zinc-600 shrink-0" />
                                        <div className="flex-1 font-mono text-sm text-zinc-200">&quot;{f.keyword}&quot;</div>
                                        <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">{f.category}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${SEV_COLORS[f.severity]}`}>{f.severity}</span>
                                        <span className="text-xs font-bold text-zinc-400 w-16 text-right">{f.hits} hit{f.hits !== 1 ? "s" : ""}</span>
                                        <button className="text-zinc-600 hover:text-zinc-200"><Eye className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {tab === "flags" && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                        <h2 className="text-sm font-bold text-white mb-4">Flagged Calls</h2>
                        <div className="space-y-3">
                            {TRANSCRIPTS.filter(t => t.flags.length > 0).map(t => (
                                <div key={t.id} className="bg-red-950/20 border border-red-900/30 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="font-mono text-xs text-red-400">{t.callId}</div>
                                        <div className="text-[10px] text-zinc-500">{t.date}</div>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {t.flags.map(f => <span key={f} className="text-[10px] font-bold bg-red-500/10 text-red-300 border border-red-500/20 px-2 py-0.5 rounded flex items-center gap-1"><ShieldAlert className="w-2.5 h-2.5" />{f}</span>)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
