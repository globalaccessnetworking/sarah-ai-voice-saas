"use client";

import React, { useState, useEffect } from 'react';
import { 
    Phone, 
    Clock, 
    MessageSquare, 
    User, 
    Activity, 
    Zap, 
    DollarSign, 
    Maximize2, 
    Pause, 
    Play, 
    Volume2, 
    ShieldCheck, 
    Bot,
    Headphones
} from "lucide-react";
import { format } from 'date-fns';

interface LiveSession {
    id: string;
    agentName: string;
    userName: string;
    userPhone: string;
    startedAt: string;
    status: string;
    durationSeconds: number;
    currentCost: number;
    tokens: { llmInput: number, llmOutput: number, ttsChars: number };
    transcript: { role: string, text: string }[];
}

export default function LiveSessionsPage() {
    const [sessions, setSessions] = useState<LiveSession[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLive = async () => {
            try {
                const res = await fetch('/api/calls/live');
                const data = await res.json();
                setSessions(data.sessions);
                if (!selectedId && data.sessions.length > 0) {
                    setSelectedId(data.sessions[0].id);
                }
            } catch (e) {
                console.error("Live fetch failed", e);
            } finally {
                setIsLoading(false);
            }
        };

        const interval = setInterval(fetchLive, 2500); // Polling every 2.5s for "real-time" feel
        fetchLive();
        return () => clearInterval(interval);
    }, [selectedId]);

    const activeSession = sessions.find(s => s.id === selectedId);

    return (
        <div className="p-6 max-w-[1600px] mx-auto h-[calc(100vh-100px)] flex flex-col space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Mission Control: Live Sessions</h1>
                </div>
                <div className="flex items-center gap-4 bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2">
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-orange-400" />
                        <span className="text-xs text-zinc-400 font-bold uppercase">Active Streams: </span>
                        <span className="text-xs text-white font-mono">{sessions.length}</span>
                    </div>
                </div>
            </div>

            {/* Dashboard Split Layout */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
                
                {/* Left: Session List (Col 4) */}
                <div className="lg:col-span-4 flex flex-col space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                    {isLoading && sessions.length === 0 ? (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-600">
                            <Activity className="w-10 h-10 mx-auto mb-4 animate-pulse" />
                            <p>Connecting to Live Agent Cluster...</p>
                        </div>
                    ) : (
                        sessions.map(s => (
                            <button 
                                key={s.id}
                                onClick={() => setSelectedId(s.id)}
                                className={`w-full text-left bg-zinc-900 border transition-all rounded-xl p-4 flex flex-col gap-3 group relative overflow-hidden ${
                                    selectedId === s.id ? 'border-indigo-500/50 ring-1 ring-indigo-500/20' : 'border-zinc-800 hover:border-zinc-700'
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <Bot className={`w-4 h-4 ${selectedId === s.id ? 'text-indigo-400' : 'text-zinc-500'}`} />
                                        <span className="text-sm font-bold text-white">{s.agentName}</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                                        ${s.currentCost.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-zinc-400">
                                    <User className="w-3.5 h-3.5" />
                                    <span className="text-xs truncate">{s.userName} ({s.userPhone})</span>
                                </div>
                                <div className="flex items-center justify-between mt-1 pt-3 border-t border-zinc-800/50">
                                    <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-mono">
                                        <Clock className="w-3 h-3 text-indigo-400" /> {s.durationSeconds}s
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-[10px] text-zinc-600">I:{s.tokens.llmInput}</span>
                                        <span className="text-[10px] text-zinc-600">O:{s.tokens.llmOutput}</span>
                                    </div>
                                </div>
                                {selectedId === s.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>}
                            </button>
                        ))
                    )}
                </div>

                {/* Right: Detailed Observation (Col 8) */}
                <div className="lg:col-span-8 flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative">
                    {!activeSession ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-zinc-600">
                            <Maximize2 className="w-12 h-12 mb-4 opacity-10" />
                            <p>Select an active session to begin observation.</p>
                        </div>
                    ) : (
                        <>
                            {/* Detailed Header */}
                            <div className="p-6 border-b border-zinc-800 bg-black/20 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400">
                                        <Headphones className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">{activeSession.agentName} <span className="text-zinc-500 font-normal">vs</span> {activeSession.userName}</h2>
                                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Stream ID: {activeSession.id}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <div className="bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-right">
                                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Accrued Cost</div>
                                        <div className="text-lg font-mono font-bold text-emerald-400">${activeSession.currentCost.toFixed(4)}</div>
                                    </div>
                                    <button className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-full text-white transition-colors">
                                        <Volume2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Transcript Feed */}
                            <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar bg-zinc-950/30">
                                {activeSession.transcript.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'agent' ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${
                                            msg.role === 'agent' 
                                            ? 'bg-zinc-800 text-zinc-200 border border-zinc-700/50 rounded-tl-none shadow-lg' 
                                            : 'bg-indigo-600 text-white rounded-tr-none shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                                        }`}>
                                            <div className="text-[10px] font-bold uppercase opacity-50 mb-1 tracking-widest">
                                                {msg.role}
                                            </div>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                <div className="flex justify-start animate-pulse">
                                    <div className="bg-zinc-800/50 h-8 w-24 rounded-full border border-zinc-700/30 flex items-center justify-center">
                                        <span className="flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></span>
                                            <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                            <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Waveform Visualization Mock */}
                            <div className="h-24 bg-black/40 border-t border-zinc-800 p-4 flex items-center gap-4">
                                <Activity className="w-5 h-5 text-indigo-500" />
                                <div className="flex-1 flex items-center gap-1 h-full">
                                    {[...Array(40)].map((_, i) => (
                                        <div 
                                            key={i} 
                                            className="bg-indigo-500/30 w-1 rounded-full animate-pulse"
                                            style={{ 
                                                height: `${Math.random() * 80 + 20}%`,
                                                animationDuration: `${Math.random() + 0.5}s`
                                            }}
                                        ></div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold text-zinc-500 uppercase">Input Level</div>
                                        <div className="text-xs font-mono text-zinc-400">-42dB</div>
                                    </div>
                                    <ShieldCheck className="w-6 h-6 text-emerald-500/50" />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
