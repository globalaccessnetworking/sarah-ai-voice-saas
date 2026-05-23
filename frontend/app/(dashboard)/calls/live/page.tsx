"use client";

import React, { useState, useEffect } from 'react';
import { PhoneCall, Mic, Bot, PhoneOff, AlertTriangle, MessageSquare, Gauge, FileText, Activity } from 'lucide-react';
import { toast } from 'sonner';

export default function DualBrainLiveCall() {
    const [liveData, setLiveData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchFeed = async () => {
        try {
            const res = await fetch('/api/calls/live-feed');
            const data = await res.json();
            setLiveData(data);
            setIsLoading(false);
        } catch (error) {
            console.error("Failed to load feed", error);
            setIsLoading(false);
        }
    };

    // Live polling simulation
    useEffect(() => {
        fetchFeed();
        const interval = setInterval(fetchFeed, 4000);
        return () => clearInterval(interval);
    }, []);

    const handleTakeover = () => {
        toast.success("Call Intercepted! Bridging your SIP extension...");
    };

    if (isLoading || !liveData) {
        return (
            <div className="flex h-screen items-center justify-center bg-black text-zinc-400">
                <div className="animate-pulse flex items-center gap-3">
                    <Activity className="w-6 h-6 animate-spin text-green-500" /> Connecting to LiveKit & Deepgram streams...
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-[1400px] mx-auto space-y-6">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-6 rounded-lg shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center animate-pulse border border-green-500/20">
                        <PhoneCall className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                            Live Call: {liveData.caller.name}
                        </h2>
                        <div className="flex items-center gap-3 mt-1 text-sm text-zinc-400">
                            <span className="font-mono">{liveData.caller.phone}</span>
                            <span>•</span>
                            <span>{liveData.caller.location}</span>
                            <span>•</span>
                            <span className="text-green-500">PTCL Trunk Active</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Performance Metrics */}
                    <div className="hidden lg:flex flex-col items-end mr-4 border-r border-zinc-800 pr-6">
                        <div className="text-xs text-zinc-500 mb-1 font-bold tracking-wider">LATENCY (MS)</div>
                        <div className="flex items-center gap-3 text-xs font-mono">
                            <span className="text-blue-400">Deepgram STT: {liveData.sysMetrics.deepgramLatencyMs}</span>
                            <span className="text-purple-400">GPT-4o: {liveData.sysMetrics.gpt4oLatencyMs}</span>
                            <span className="text-orange-400">TTS: {liveData.sysMetrics.elevenLabsLatencyMs}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleTakeover}
                        className="flex items-center gap-2 px-6 py-3 bg-red-600/10 text-red-500 border border-red-600/50 hover:bg-red-600 hover:text-white rounded-md transition-all font-bold shadow-[0_0_15px_rgba(220,38,38,0.2)] hover:shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                    >
                        <AlertTriangle className="w-5 h-5" />
                        TAKEOVER CALL
                    </button>
                    <button className="p-3 bg-zinc-800 text-zinc-400 rounded hover:text-white transition-colors">
                        <PhoneOff className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Split Screen Container */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-220px)] min-h-[600px]">
                
                {/* LEFT PANEL: Deepgram Raw Feed */}
                <div className="flex flex-col bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden shadow-lg">
                    <div className="bg-zinc-950/80 px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-zinc-300">
                            <Mic className="w-4 h-4 text-blue-400" /> Deepgram Nova-3 (Raw Feed)
                        </div>
                        <div className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
                            nova-3-urdu (Code-Switched)
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 font-mono text-sm leading-relaxed scroll-smooth">
                        {liveData.rawTranscript.map((msg: any) => (
                            <div key={msg.id} className={`flex ${msg.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-lg p-4 relative ${
                                    msg.speaker === 'user' 
                                    ? 'bg-blue-900/20 border border-blue-800/30 text-blue-100' 
                                    : 'bg-zinc-800/50 border border-zinc-700/50 text-zinc-200'
                                }`}>
                                    <div className="flex items-center justify-between gap-4 mb-2">
                                        <div className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                                            {msg.speaker === 'user' ? (
                                                <><MessageSquare className="w-3 h-3 text-blue-400" /> Caller</>
                                            ) : (
                                                <><Bot className="w-3 h-3 text-green-400" /> AI Agent</>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-zinc-600">{msg.time}</div>
                                    </div>
                                    <div className="text-[15px]">{msg.text}</div>
                                </div>
                            </div>
                        ))}
                        {/* Typing indicator simulation */}
                        <div className="flex justify-start">
                            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3 flex gap-1">
                                <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL: Claude 3.5 Analysis */}
                <div className="flex flex-col gap-6">
                    {/* Claude Summary Box */}
                    <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex flex-col shadow-lg">
                        <div className="bg-orange-950/20 px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                            <div className="flex items-center gap-2 font-bold text-zinc-300">
                                <FileText className="w-4 h-4 text-orange-400" /> Claude 3.5 Sonnet (Analysis)
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                                Background Task
                            </div>
                        </div>
                        
                        <div className="p-6 flex flex-col h-full">
                            <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3">Live Translation Summary</div>
                            <div className="text-lg text-zinc-200 leading-relaxed bg-zinc-950/50 p-5 rounded border border-zinc-800/50 italic flex-1">
                                "{liveData.claudeAnalysis.summary}"
                            </div>

                            <div className="mt-6 border-t border-zinc-800 pt-6">
                                <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3">CRM Auto-Categorization</div>
                                <div className="flex flex-wrap gap-2">
                                    {liveData.claudeAnalysis.tags.map((tag: string, i: number) => (
                                        <span key={i} className={`px-3 py-1 text-xs font-bold rounded-full border ${
                                            tag === 'EMERGENCY' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                            tag === 'JOHAR TOWN' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                            tag === 'FRUSTRATED CUSTOMER' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                            'bg-zinc-800 text-zinc-300 border-zinc-700'
                                        }`}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sentiment & Action Panel */}
                    <div className="h-48 grid grid-cols-2 gap-6">
                        {/* Sentiment Gauge */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 shadow-lg flex flex-col justify-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"></div>
                            
                            <div className="flex items-center gap-2 text-zinc-400 font-bold text-sm mb-4">
                                <Gauge className="w-4 h-4" /> Live Sentiment
                            </div>
                            
                            <div className="flex items-end justify-between mb-2">
                                <span className="text-3xl font-bold text-red-400">{liveData.claudeAnalysis.sentimentScore}/100</span>
                                <span className="text-sm font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">Frustrated</span>
                            </div>
                            
                            <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden border border-zinc-800">
                                <div 
                                    className="h-full bg-red-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${liveData.claudeAnalysis.sentimentScore}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-zinc-600 mt-2 font-bold uppercase">
                                <span>Angry</span>
                                <span>Neutral</span>
                                <span>Happy</span>
                            </div>
                        </div>

                        {/* Action Box */}
                        <div className="bg-blue-900/10 border border-blue-800/30 rounded-lg p-5 shadow-lg flex flex-col justify-center">
                            <div className="text-blue-400 font-bold text-sm mb-3">Recommended Action</div>
                            <div className="text-xl font-bold text-blue-200">
                                {liveData.claudeAnalysis.actionRequired}
                            </div>
                            <p className="text-blue-200/50 text-xs mt-2">
                                Auto-generated by Claude based on call intent. Webhook will fire automatically if rules are met.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
