"use client";
import React, { useState, useEffect } from "react";
import {
    Users, Clock, Phone, PhoneCall, Settings, Plus, Trash2,
    ArrowRight, Pause, Play, AlertCircle, CheckCircle2,
    BarChart3, Mic, TrendingUp, RefreshCw, ChevronDown, ChevronUp
} from "lucide-react";

type Strategy = "Round Robin" | "Least Recent" | "Fewest Calls" | "Random" | "Ring All";

interface QueueMember {
    name: string;
    type: "Agent" | "AI" | "Human";
    state: "Available" | "Busy" | "Paused" | "Offline";
    callsTaken: number;
    lastCall: string;
    penalty: number;
}

interface Queue {
    id: string;
    name: string;
    extension: string;
    strategy: Strategy;
    maxCallers: number;
    timeout: number;
    wrapUpTime: number;
    holdMusic: string;
    overflowAction: "Voicemail" | "AI Agent" | "Hangup";
    announcePeriod: number;
    members: QueueMember[];
    callsWaiting: number;
    avgWaitTime: number;
    callsHandledToday: number;
    callsAbandonedToday: number;
}

const DEFAULT_QUEUES: Queue[] = [
    {
        id: "q1", name: "Dental Reception", extension: "8001", strategy: "Round Robin",
        maxCallers: 10, timeout: 20, wrapUpTime: 30, holdMusic: "jazz-01.mp3",
        overflowAction: "AI Agent", announcePeriod: 30,
        members: [
            { name: "Sarah (AI Agent)", type: "AI", state: "Busy", callsTaken: 24, lastCall: "2m ago", penalty: 0 },
            { name: "Emma (AI Agent)", type: "AI", state: "Available", callsTaken: 18, lastCall: "5m ago", penalty: 0 },
            { name: "Dr Receptionist", type: "Human", state: "Paused", callsTaken: 6, lastCall: "4h ago", penalty: 1 },
        ],
        callsWaiting: 2, avgWaitTime: 38, callsHandledToday: 48, callsAbandonedToday: 3,
    },
    {
        id: "q2", name: "Sales Queue", extension: "8002", strategy: "Fewest Calls",
        maxCallers: 5, timeout: 30, wrapUpTime: 60, holdMusic: "corporate-01.mp3",
        overflowAction: "Voicemail", announcePeriod: 60,
        members: [
            { name: "Mark (Human)", type: "Human", state: "Available", callsTaken: 12, lastCall: "10m ago", penalty: 0 },
            { name: "Sales AI Agent", type: "AI", state: "Available", callsTaken: 31, lastCall: "1m ago", penalty: 0 },
        ],
        callsWaiting: 0, avgWaitTime: 12, callsHandledToday: 43, callsAbandonedToday: 1,
    },
    {
        id: "q3", name: "Emergency Triage", extension: "8003", strategy: "Ring All",
        maxCallers: 3, timeout: 10, wrapUpTime: 0, holdMusic: "silence.mp3",
        overflowAction: "AI Agent", announcePeriod: 10,
        members: [
            { name: "On-Call AI", type: "AI", state: "Available", callsTaken: 4, lastCall: "1h ago", penalty: 0 },
        ],
        callsWaiting: 0, avgWaitTime: 5, callsHandledToday: 4, callsAbandonedToday: 0,
    },
];

const STRATEGIES: Strategy[] = ["Round Robin", "Least Recent", "Fewest Calls", "Random", "Ring All"];

const STATE_COLOR: Record<string, string> = {
    Available: "text-emerald-400",
    Busy: "text-orange-400",
    Paused: "text-yellow-400",
    Offline: "text-zinc-500",
};

export default function QueuesPage() {
    const [queues, setQueues] = useState(DEFAULT_QUEUES);
    const [expanded, setExpanded] = useState<string | null>("q1");
    const [editMode, setEditMode] = useState<string | null>(null);

    const [waitTimers, setWaitTimers] = useState<Record<string, number>>(
        Object.fromEntries(DEFAULT_QUEUES.map(q => [q.id, q.avgWaitTime]))
    );

    // Simulate callers waiting time ticking
    useEffect(() => {
        const t = setInterval(() => {
            setWaitTimers(prev => {
                const next = { ...prev };
                queues.forEach(q => { if (q.callsWaiting > 0) next[q.id] = (next[q.id] || 0) + 1; });
                return next;
            });
        }, 1000);
        return () => clearInterval(t);
    }, [queues]);

    const updateQueue = (id: string, key: keyof Queue, value: unknown) => {
        setQueues(prev => prev.map(q => q.id === id ? { ...q, [key]: value } : q));
    };

    const toggleMemberPause = (queueId: string, memberName: string) => {
        setQueues(prev => prev.map(q => q.id === queueId ? {
            ...q,
            members: q.members.map(m => m.name === memberName ? {
                ...m, state: m.state === "Paused" ? "Available" : "Paused"
            } : m)
        } : q));
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200 p-8 md:p-10">
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-950/40 to-indigo-950/30 border border-blue-900/30 rounded-2xl p-6 flex items-center gap-5">
                    <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center">
                        <Users className="w-7 h-7 text-blue-400" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-white mb-1">Intelligent Call Queuing</h1>
                        <p className="text-xs text-zinc-400">Asterisk ConfBridge-powered queues with AI agent members, priority routing, wait-time announcements, overflow to AI, and real-time queue monitoring.</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <div className="text-2xl font-bold text-blue-400">{queues.length}</div>
                            <div className="text-[10px] text-zinc-500">Queues</div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-yellow-400">{queues.reduce((s, q) => s + q.callsWaiting, 0)}</div>
                            <div className="text-[10px] text-zinc-500">Waiting</div>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-colors">
                            <Plus className="w-4 h-4" /> New Queue
                        </button>
                    </div>
                </div>

                {/* Summary stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Calls Handled Today", value: queues.reduce((s, q) => s + q.callsHandledToday, 0), color: "#10b981" },
                        { label: "Calls Abandoned", value: queues.reduce((s, q) => s + q.callsAbandonedToday, 0), color: "#ef4444" },
                        { label: "Avg Wait Time", value: `${Math.round(queues.reduce((s, q) => s + q.avgWaitTime, 0) / queues.length)}s`, color: "#f59e0b" },
                        { label: "Active Members", value: queues.reduce((s, q) => s + q.members.filter(m => m.state === "Available" || m.state === "Busy").length, 0), color: "#6366f1" },
                    ].map(stat => (
                        <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                            <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
                            <div className="text-[10px] text-zinc-500 mt-1">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Queue Cards */}
                <div className="space-y-5">
                    {queues.map(queue => (
                        <div key={queue.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                            {/* Queue Header */}
                            <div className="flex items-center gap-5 p-5 cursor-pointer hover:bg-zinc-800/30" onClick={() => setExpanded(p => p === queue.id ? null : queue.id)}>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-sm font-bold text-white">{queue.name}</h3>
                                        <span className="font-mono text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">ext. {queue.extension}</span>
                                        <span className="text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">{queue.strategy}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${queue.overflowAction === "AI Agent" ? "text-violet-400 bg-violet-500/10" : "text-zinc-400 bg-zinc-800"}`}>
                                            Overflow → {queue.overflowAction}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-[10px] text-zinc-500">
                                        <span>{queue.members.length} members</span>
                                        <span>·</span>
                                        <span>{queue.members.filter(m => m.state === "Available").length} available</span>
                                        <span>·</span>
                                        <span>Max {queue.maxCallers} callers · {queue.timeout}s ring timeout</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    {queue.callsWaiting > 0 && (
                                        <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-2">
                                            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                                            <span className="text-sm font-bold text-yellow-400">{queue.callsWaiting} waiting</span>
                                            <span className="text-[10px] text-zinc-500">— {waitTimers[queue.id]}s avg</span>
                                        </div>
                                    )}
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-white">{queue.callsHandledToday}</div>
                                        <div className="text-[10px] text-zinc-500">handled today</div>
                                    </div>
                                    {expanded === queue.id ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                                </div>
                            </div>

                            {/* Expanded Content */}
                            {expanded === queue.id && (
                                <div className="border-t border-zinc-800">
                                    {/* Members table */}
                                    <div className="p-5">
                                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Queue Members</div>
                                        <div className="divide-y divide-zinc-800/50 border border-zinc-800 rounded-xl overflow-hidden">
                                            {queue.members.map(member => (
                                                <div key={member.name} className="flex items-center gap-4 px-4 py-3 bg-zinc-800/20">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold text-zinc-200">{member.name}</span>
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${member.type === "AI" ? "text-violet-400 bg-violet-500/10" : "text-blue-400 bg-blue-500/10"}`}>{member.type}</span>
                                                        </div>
                                                    </div>
                                                    <span className={`text-xs font-bold ${STATE_COLOR[member.state]}`}>{member.state}</span>
                                                    <span className="text-[10px] text-zinc-500">{member.callsTaken} calls · last {member.lastCall}</span>
                                                    <button onClick={() => toggleMemberPause(queue.id, member.name)}
                                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${member.state === "Paused" ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" : "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"}`}>
                                                        {member.state === "Paused" ? "Resume" : "Pause"}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Config */}
                                    <div className="px-5 pb-5 grid md:grid-cols-4 gap-4">
                                        {[
                                            { label: "Ring Timeout", key: "timeout" as keyof Queue, suffix: "s" },
                                            { label: "Wrap-Up Time", key: "wrapUpTime" as keyof Queue, suffix: "s" },
                                            { label: "Max Callers", key: "maxCallers" as keyof Queue, suffix: "" },
                                            { label: "Announce Interval", key: "announcePeriod" as keyof Queue, suffix: "s" },
                                        ].map(cfg => (
                                            <div key={cfg.label}>
                                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">{cfg.label}</label>
                                                <div className="flex items-center bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden">
                                                    <input type="number" value={queue[cfg.key] as number} onChange={e => updateQueue(queue.id, cfg.key, Number(e.target.value))}
                                                        className="bg-transparent px-3 py-2 text-xs text-zinc-200 flex-1 focus:outline-none w-full" />
                                                    {cfg.suffix && <span className="pr-3 text-zinc-500 text-xs">{cfg.suffix}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
