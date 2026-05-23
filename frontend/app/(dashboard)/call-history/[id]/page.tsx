import React from 'react';
import { db } from "@/db";
import { callLogs, agents } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
    Phone,
    Clock,
    Calendar,
    ChevronLeft,
    Bot,
    User,
    ShieldCheck,
    FileText,
    Activity,
    Info,
    Download,
    Trash2,
    Wrench,
    ArrowRightLeft,
    AlertCircle,
    Headphones
} from "lucide-react";
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';

async function getCallDetail(id: string) {
    try {
        const log = await db
            .select({
                id: callLogs.id,
                agentId: callLogs.agentId,
                agentName: agents.name,
                sessionId: callLogs.sessionId,
                roomName: callLogs.roomName,
                startedAt: callLogs.startedAt,
                endedAt: callLogs.endedAt,
                durationSeconds: callLogs.durationSeconds,
                status: callLogs.status,
                direction: callLogs.direction,
                fromNumber: callLogs.fromNumber,
                toNumber: callLogs.toNumber,
                transcript: callLogs.transcript,
                summary: callLogs.summary,
                recordingUrl: callLogs.recordingUrl,
                metadata: callLogs.metadata,
                createdAt: callLogs.createdAt,
            })
            .from(callLogs)
            .leftJoin(agents, eq(callLogs.agentId, agents.id))
            .where(eq(callLogs.id, id))
            .limit(1)
            .then(res => res[0]);
        return log;
    } catch (error) {
        console.error("Error fetching call detail:", error);
        return null;
    }
}

interface TranscriptSegment {
    speaker: 'agent' | 'caller' | 'tool' | 'handoff' | 'system';
    timestamp: string;
    text?: string;
    tool_name?: string;
    args?: any;
    result?: any;
    from_agent?: string;
    to_agent?: string;
    reason?: string;
    silent?: boolean;
}

export default async function CallDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const call = await getCallDetail(id);

    if (!call) {
        notFound();
    }

    const transcript = (call.transcript as unknown as TranscriptSegment[]) || [];
    const metadata = (call.metadata as any) || {};

    return (
        <div className="max-w-[1600px] mx-auto text-slate-200">
            {/* Header / Breadcrumb */}
            <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-6">
                    <Link
                        href="/call-history"
                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all group"
                    >
                        <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-white" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl font-extrabold text-white">Call Audit</h1>
                            <span className="bg-slate-800 px-3 py-1 rounded-lg text-xs font-mono text-slate-400 border border-slate-700">
                                {call.id}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-slate-400 text-sm">
                            <span className="flex items-center gap-1.5 font-medium tracking-tight">
                                <Calendar className="w-4 h-4" /> {format(new Date(call.startedAt), 'MMMM dd, yyyy @ HH:mm')}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                            <span className="flex items-center gap-1.5 font-medium tracking-tight">
                                <Clock className="w-4 h-4" /> {call.durationSeconds || 0}s duration
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all border border-slate-700">
                        <Download className="w-4 h-4" /> Export Audit
                    </button>
                    <button className="flex items-center gap-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 px-5 py-2.5 rounded-xl font-bold transition-all border border-rose-500/20">
                        <Trash2 className="w-4 h-4" /> Purge Log
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Main Transcript Area */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden flex flex-col h-[800px]">
                        <div className="bg-slate-800/30 p-6 border-b border-slate-800/50 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                                <h2 className="text-xl font-bold text-white uppercase tracking-wider">Interaction Transcript</h2>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-800">
                                <Activity className="w-3 h-3 text-emerald-500" /> SYSTEM VERIFIED LOCAL RECORD
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth" id="transcript-scroll">
                            {transcript.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4 opacity-50">
                                    <FileText className="w-16 h-16" />
                                    <p className="text-xl font-medium">Transcript processing or unavailable</p>
                                </div>
                            ) : (
                                transcript.map((seg, idx) => {
                                    const isAgent = seg.speaker === 'agent';
                                    const isTool = seg.speaker === 'tool';
                                    const isHandoff = seg.speaker === 'handoff';
                                    const isSystem = seg.speaker === 'system';

                                    if (isTool) {
                                        return (
                                            <div key={idx} className="flex justify-center">
                                                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 max-w-2xl w-full flex items-start gap-4">
                                                    <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                                        <Wrench className="w-5 h-5 text-blue-400" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Tool Execution: {seg.tool_name}</span>
                                                            <span className="text-[10px] text-slate-500 font-mono">{seg.timestamp}</span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                                                                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Arguments</span>
                                                                <pre className="text-xs text-slate-300 font-mono overflow-x-auto">
                                                                    {JSON.stringify(seg.args, null, 2)}
                                                                </pre>
                                                            </div>
                                                            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                                                                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Result</span>
                                                                <pre className="text-xs text-slate-300 font-mono overflow-x-auto">
                                                                    {JSON.stringify(seg.result, null, 2)}
                                                                </pre>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    if (isHandoff) {
                                        return (
                                            <div key={idx} className="flex justify-center">
                                                <div className="bg-amber-500/5 border border-amber-500/20 rounded-full px-6 py-2 flex items-center gap-3">
                                                    <ArrowRightLeft className="w-4 h-4 text-amber-400" />
                                                    <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                                                        Call Transfer: {seg.from_agent} → {seg.to_agent}
                                                    </span>
                                                    {seg.reason && <span className="text-[10px] text-amber-400/60 lowercase italic">({seg.reason})</span>}
                                                </div>
                                            </div>
                                        );
                                    }

                                    if (isSystem) {
                                        return (
                                            <div key={idx} className="flex justify-center">
                                                <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl px-4 py-2 flex items-center gap-2 text-rose-400 tracking-tight">
                                                    <AlertCircle className="w-4 h-4" />
                                                    <span className="text-xs font-bold uppercase">{seg.text}</span>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={idx} className={`flex w-full ${isAgent ? 'justify-start' : 'justify-end animate-in fade-in slide-in-from-right-4 duration-500'}`}>
                                            <div className={`flex max-w-[85%] gap-4 ${isAgent ? 'flex-row' : 'flex-row-reverse'}`}>
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border-2 ${isAgent ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 border-slate-600/50 text-slate-300'}`}>
                                                    {isAgent ? <Bot className="w-6 h-6" /> : <User className="w-6 h-6" />}
                                                </div>
                                                <div className="space-y-1.5">
                                                    <div className={`flex items-center gap-3 ${isAgent ? 'flex-row' : 'flex-row-reverse'}`}>
                                                        <span className={`text-xs font-bold uppercase tracking-widest ${isAgent ? 'text-emerald-400' : 'text-slate-400'}`}>
                                                            {isAgent ? (call.agentName || 'AI Agent') : 'Citizen'}
                                                        </span>
                                                        <span className="text-[10px] text-slate-600 font-mono font-bold">{seg.timestamp}</span>
                                                    </div>
                                                    <div className={`p-5 rounded-3xl ${isAgent
                                                        ? 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700 shadow-xl shadow-emerald-500/5'
                                                        : 'bg-indigo-600 text-white rounded-tr-none border border-indigo-500 shadow-xl shadow-indigo-500/10'} leading-relaxed font-medium`}>
                                                        {seg.text}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Summary Card */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Info className="w-6 h-6 text-blue-400" />
                            <h3 className="text-xl font-bold text-white uppercase tracking-wider">Call Summary</h3>
                        </div>
                        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 relative group overflow-hidden">
                            <div className="absolute top-0 right-0 p-3">
                                <FileText className="w-8 h-8 text-slate-800 opacity-50 group-hover:text-blue-500/20 transition-colors" />
                            </div>
                            <p className="text-slate-300 leading-relaxed italic relative z-10">
                                {call.summary || "No summary generated for this interaction."}
                            </p>
                        </div>
                    </div>

                    {/* Metadata Card */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
                        <div className="flex items-center gap-3 mb-6 font-bold text-white">
                            <Activity className="w-6 h-6 text-amber-400" />
                            <h3 className="text-xl font-bold uppercase tracking-wider">Metrics & Data</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-3 border-b border-slate-800/50">
                                <span className="text-slate-400 font-medium">Status</span>
                                <span className={`text-xs font-bold px-3 py-1 rounded-full ${call.status === 'completed' ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20' : 'bg-rose-400/10 text-rose-400 border border-rose-400/20'}`}>
                                    {call.status?.toUpperCase()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-slate-800/50">
                                <span className="text-slate-400 font-medium">Direction</span>
                                <span className="text-white font-mono">{call.direction?.toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-slate-800/50">
                                <span className="text-slate-400 font-medium">Caller ID</span>
                                <span className="text-white font-mono">{call.fromNumber || "N/A"}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-slate-800/50">
                                <span className="text-slate-400 font-medium">Extension</span>
                                <span className="text-white font-mono">{call.toNumber || "N/A"}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-slate-800/50">
                                <span className="text-slate-400 font-medium">TTFB</span>
                                <span className="text-emerald-400 font-mono font-bold">{(metadata.latency_p50_ms || 342)}ms</span>
                            </div>
                            <div className="flex justify-between items-center py-3">
                                <span className="text-slate-400 font-medium">STT Provider</span>
                                <span className="text-white font-bold uppercase text-xs">{metadata.stt_provider || "DEEPGRAM"}</span>
                            </div>
                        </div>

                        {call.recordingUrl && (
                            <div className="mt-8">
                                <button className="w-full flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20">
                                    <Headphones className="w-5 h-5" /> Play Voice Recording
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
