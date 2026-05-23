"use client";

import React, { useState, useEffect } from "react";
import "@livekit/components-styles";
import {
    LiveKitRoom,
    RoomAudioRenderer,
    BarVisualizer,
    VoiceAssistantControlBar,
    useConnectionState,
    useRoomContext,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import { Mic, Headphones, Bot, Sparkles, ChevronDown, Activity, ShieldCheck } from "lucide-react";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function SandboxPage() {
    const [token, setToken] = useState<string | null>(null);
    const [agentPersona, setAgentPersona] = useState("audit-demo");
    const [availableAgents, setAvailableAgents] = useState<{name: string, slug: string}[]>([]);

    useEffect(() => {
        const fetchAgents = async () => {
            try {
                const res = await fetch("/api/sandbox/agents");
                const data = await res.json();
                if (Array.isArray(data)) {
                    setAvailableAgents(data);
                }
            } catch (err) {
                console.error("Failed to fetch available agents:", err);
            }
        };
        fetchAgents();
    }, []);

    useEffect(() => {
        const fetchToken = async () => {
            try {
                // Clear token to force room reset when persona changes
                setToken(null);
                const res = await fetch(`/api/sandbox/token?agentId=${agentPersona}`);
                const data = await res.json();
                if (data.token) {
                    setToken(data.token);
                }
            } catch (err) {
                console.error("Failed to fetch LiveKit token:", err);
            }
        };
        fetchToken();
    }, [agentPersona]);

    if (!token) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
                <Activity className="w-10 h-10 text-blue-500 animate-spin" />
                <p className="text-zinc-500 animate-pulse">Initializing Secure RTC Tunnel for {agentPersona}...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-semibold text-white tracking-tight flex items-center gap-3">
                    <Mic className="w-8 h-8 text-rose-500" />
                    Agent Sandbox
                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 border-rose-500/20 text-rose-500">Manual Proving Ground</Badge>
                </h1>
                <p className="text-zinc-500 text-sm max-w-2xl">
                    Direct low-level WebRTC manual testing. Use this sandbox to talk directly to your AI agents to audit personality, latency, and RAG context accuracy before automated benchmarking.
                </p>
            </div>

            <LiveKitRoom
                serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
                token={token}
                connect={true}
                audio={true}
                video={false}
                className="flex flex-col gap-8"
            >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Configuration */}
                    <div className="space-y-6">
                        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 backdrop-blur-md">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Bot className="w-4 h-4" /> Simulation Parameters
                            </h3>
                            
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-600 uppercase">Select Agent Persona</label>
                                    <Select value={agentPersona} onValueChange={(val: string | null) => val && setAgentPersona(val)}>
                                        <SelectTrigger className="bg-zinc-950/50 border-zinc-800 text-zinc-300">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                                            {availableAgents.length > 0 ? (
                                                availableAgents.map((agent) => (
                                                    <SelectItem key={agent.slug} value={agent.slug}>
                                                        {agent.name}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="audit-demo">Default Auditor</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl space-y-2">
                                    <div className="flex items-center gap-2 text-blue-400">
                                        <Sparkles className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-bold uppercase tracking-tight">RAG Context Enabled</span>
                                    </div>
                                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                                        The agent is currently pulling context from the active Knowledge Base vectorized in Phase 19.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 backdrop-blur-md">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Activity className="w-4 h-4" /> Connection Intel
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-600">Protocol</span>
                                    <span className="text-zinc-300 font-mono">WebRTC / ICE</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-600">Encryption</span>
                                    <span className="text-emerald-500 flex items-center gap-1 font-bold">
                                        <ShieldCheck className="w-3 h-3" /> E2EE Active
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Visualizer */}
                    <div className="lg:col-span-2">
                        <div className="w-full h-[550px] bg-zinc-900/60 border border-zinc-800/60 rounded-3xl flex flex-col items-center justify-center relative shadow-2xl overflow-hidden group">
                            {/* Glowing radial background */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.08),transparent_70%)] group-hover:bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.12),transparent_70%)] transition-colors duration-1000" />
                            
                            <ConnectionStatusBadge />

                            {/* Bar Visualizer */}
                            <div className="relative z-10 flex flex-col items-center gap-12">
                                <div className="w-32 h-32 rounded-full bg-zinc-950 border border-zinc-800/50 flex items-center justify-center shadow-[0_0_50px_-12px_rgba(59,130,246,0.3)]">
                                    <Bot className="w-12 h-12 text-blue-500" />
                                </div>
                                
                                <div className="h-20 flex items-center justify-center">
                                    <BarVisualizer 
                                        barCount={7}
                                        className="w-48 h-12 text-blue-500"
                                    />
                                </div>

                                <p className="text-zinc-400 text-sm font-medium tracking-wide animate-pulse">
                                    AI Agent is listening...
                                </p>
                            </div>

                            {/* Control Bar Overlay */}
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 w-fit">
                                <VoiceAssistantControlBar className="bg-zinc-950/80 border border-zinc-800 rounded-full px-4 py-2 hover:bg-zinc-950 transition-colors shadow-xl" />
                            </div>

                            <RoomAudioRenderer />
                        </div>
                    </div>
                </div>
            </LiveKitRoom>
        </div>
    );
}

function ConnectionStatusBadge() {
    const status = useConnectionState();
    
    const isConnected = status === ConnectionState.Connected;
    const isConnecting = status === ConnectionState.Connecting || status === ConnectionState.Reconnecting;

    return (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20">
            <Badge className={cn(
                "px-4 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest flex items-center gap-2",
                isConnected ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : 
                isConnecting ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 animate-pulse" :
                "bg-zinc-500/10 text-zinc-500 border-zinc-800"
            )}>
                <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    isConnected ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : 
                    isConnecting ? "bg-yellow-500" : "bg-zinc-500"
                )} />
                {isConnected ? "Agent Online - Listening" : 
                 isConnecting ? "Connecting to LiveKit Edge Network..." : "Disconnected"}
            </Badge>
        </div>
    );
}

function Loader2({ className }: { className?: string }) {
    return <Activity className={className} />;
}
