"use client";
import React, { useState, useEffect, useRef } from "react";
import {
    Phone, PhoneOff, PhoneIncoming, Mic, MicOff, Volume2, VolumeX,
    RotateCcw, UserPlus, Hash, ChevronRight, Clock, Users,
    Film, Minus, Plus, X, Settings, Wifi, Activity, RefreshCw
} from "lucide-react";

type CallState = "idle" | "dialing" | "ringing" | "active" | "held" | "incoming";

interface ActiveCall {
    id: string;
    number: string;
    name: string;
    state: CallState;
    duration: number;
    held: boolean;
    muted: boolean;
}

interface RecentCall {
    number: string;
    name: string;
    direction: "in" | "out" | "missed";
    duration: string;
    time: string;
}

const RECENT: RecentCall[] = [
    { number: "+61412345678", name: "John Smith", direction: "in", duration: "2:25", time: "06:01" },
    { number: "+61298765432", name: "Sarah Johnson", direction: "out", duration: "1:07", time: "05:45" },
    { number: "+61387654321", name: "Unknown", direction: "missed", duration: "—", time: "05:10" },
    { number: "+61478123456", name: "Peak Performance Gym", direction: "in", duration: "3:40", time: "04:30" },
    { number: "8001", name: "dental-queue", direction: "out", duration: "0:12", time: "03:55" },
];

const DTMF_KEYS = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["*", "0", "#"],
];

const DTMF_SUB: Record<string, string> = { "2": "ABC", "3": "DEF", "4": "GHI", "5": "JKL", "6": "MNO", "7": "PQRS", "8": "TUV", "9": "WXYZ", "0": "+", "*": "", "#": "" };

const DIR_COLORS: Record<string, string> = { in: "text-emerald-400", out: "text-blue-400", missed: "text-red-400" };
const DIR_ICONS: Record<string, React.ReactNode> = {
    in: <PhoneIncoming className="w-3 h-3 text-emerald-400" />,
    out: <ChevronRight className="w-3 h-3 text-blue-400 rotate-45" />,
    missed: <PhoneOff className="w-3 h-3 text-red-400" />,
};

function useDuration(active: boolean) {
    const [secs, setSecs] = useState(0);
    useEffect(() => {
        if (!active) { setSecs(0); return; }
        const t = setInterval(() => setSecs(s => s + 1), 1000);
        return () => clearInterval(t);
    }, [active]);
    return `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, "0")}`;
}

export default function SoftphonePage() {
    const [callState, setCallState] = useState<CallState>("idle");
    const [dialInput, setDialInput] = useState("");
    const [muted, setMuted] = useState(false);
    const [held, setHeld] = useState(false);
    const [speakerVolume, setSpeakerVolume] = useState(80);
    const [tab, setTab] = useState<"dial" | "recent" | "contacts" | "settings">("dial");
    const [dtmfSent, setDtmfSent] = useState<string | null>(null);
    const [incomingName, setIncomingName] = useState("");

    const duration = useDuration(callState === "active");

    const pressKey = (key: string) => {
        if (callState === "idle") {
            setDialInput(d => d + key);
        } else if (callState === "active") {
            setDtmfSent(key);
            setTimeout(() => setDtmfSent(null), 500);
        }
    };

    const dial = async (num?: string) => {
        const target = num || dialInput;
        if (!target) return;
        setCallState("dialing");
        setDialInput(target);
        await new Promise(r => setTimeout(r, 1500));
        setCallState("ringing");
        await new Promise(r => setTimeout(r, 2500));
        setCallState("active");
        setMuted(false);
        setHeld(false);
    };

    const hangup = () => { setCallState("idle"); setDialInput(""); setMuted(false); setHeld(false); };

    const simulateIncoming = async () => {
        setIncomingName("+61412345678");
        setCallState("incoming");
    };

    const answerCall = () => { setCallState("active"); setMuted(false); setHeld(false); };

    const isCallActive = callState === "active" || callState === "held";

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200 p-8 md:p-10">
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* Header */}
                <div className="bg-gradient-to-r from-slate-950/60 to-zinc-950/60 border border-slate-800/60 rounded-2xl p-6 flex items-center gap-5">
                    <div className="w-14 h-14 bg-slate-500/10 border border-slate-500/20 rounded-2xl flex items-center justify-center">
                        <Phone className="w-7 h-7 text-slate-300" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-white mb-1">WebRTC In-Browser Softphone</h1>
                        <p className="text-xs text-zinc-400">Make and receive calls directly from the dashboard. Uses SIP.js over WebRTC, registered to Asterisk via WSS. Works from any browser with no physical phone required.</p>
                    </div>
                    <div className="flex gap-5 items-center">
                        <div className="flex items-center gap-2 text-xs text-emerald-400">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="font-bold">WSS Connected</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                            <Wifi className="w-3.5 h-3.5" />
                            <span>pbx.globalaccess.ai:8089</span>
                        </div>
                        <button onClick={simulateIncoming} className="text-[10px] bg-zinc-800 text-zinc-400 px-3 py-1.5 rounded-lg hover:bg-zinc-700 transition-colors">Simulate Incoming</button>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Softphone widget */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden" style={{ background: "linear-gradient(160deg, #18181b 0%, #09090b 100%)" }}>

                        {/* Incoming call overlay */}
                        {callState === "incoming" && (
                            <div className="absolute inset-0 z-10 bg-zinc-950/90 flex flex-col items-center justify-center gap-6 rounded-3xl">
                                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center animate-bounce">
                                    <PhoneIncoming className="w-8 h-8 text-emerald-400" />
                                </div>
                                <div className="text-center">
                                    <div className="text-white font-bold text-lg">{incomingName}</div>
                                    <div className="text-zinc-400 text-xs">Incoming Call</div>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => setCallState("idle")} className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-500"><PhoneOff className="w-6 h-6 text-white" /></button>
                                    <button onClick={answerCall} className="w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center hover:bg-emerald-500 animate-pulse"><Phone className="w-6 h-6 text-white" /></button>
                                </div>
                            </div>
                        )}

                        {/* Status bar */}
                        <div className={`px-5 py-3 flex items-center justify-between transition-colors ${callState === "active" ? "bg-emerald-950/40 border-b border-emerald-900/30" : callState === "dialing" || callState === "ringing" ? "bg-zinc-900 border-b border-zinc-800" : "border-b border-zinc-900"}`}>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${callState === "active" ? "bg-emerald-500 animate-pulse" : callState === "dialing" || callState === "ringing" ? "bg-yellow-500 animate-pulse" : "bg-zinc-600"}`} />
                                <span className="text-xs font-bold text-zinc-300">
                                    {callState === "idle" ? "Ready" : callState === "dialing" ? "Dialing..." : callState === "ringing" ? "Ringing..." : callState === "active" ? "On Call" : callState === "held" ? "On Hold" : "Calling..."}
                                </span>
                            </div>
                            {isCallActive && <span className="text-xs font-mono text-emerald-400">{duration}</span>}
                        </div>

                        {/* Display */}
                        <div className="px-5 py-5 text-center">
                            {isCallActive ? (
                                <div>
                                    <div className="text-sm text-zinc-400 mb-0.5">Connected to</div>
                                    <div className="text-xl font-bold font-mono text-white">{dialInput}</div>
                                    {held && <div className="text-xs text-yellow-400 mt-1">⏸ Call Held</div>}
                                    {dtmfSent && <div className="text-2xl font-bold text-cyan-400 mt-1 animate-bounce">{dtmfSent}</div>}
                                </div>
                            ) : (
                                <div className="min-h-[3rem] flex items-center justify-center">
                                    <div className="text-2xl font-mono font-bold tracking-widest text-white">{dialInput || <span className="text-zinc-700">Enter number...</span>}</div>
                                </div>
                            )}
                            {!isCallActive && dialInput && (
                                <button onClick={() => setDialInput(d => d.slice(0, -1))} className="text-zinc-600 hover:text-zinc-200 mt-1">
                                    <X className="w-4 h-4 inline" />
                                </button>
                            )}
                        </div>

                        {/* DTMF keypad */}
                        <div className="px-5 pb-5 space-y-2">
                            {DTMF_KEYS.map((row, r) => (
                                <div key={r} className="grid grid-cols-3 gap-2">
                                    {row.map(key => (
                                        <button key={key} onClick={() => pressKey(key)}
                                            className="h-12 bg-zinc-800/80 hover:bg-zinc-700 active:scale-95 rounded-xl flex flex-col items-center justify-center transition-all">
                                            <span className="text-sm font-bold text-white">{key}</span>
                                            {DTMF_SUB[key] && <span className="text-[7px] text-zinc-500 tracking-widest">{DTMF_SUB[key]}</span>}
                                        </button>
                                    ))}
                                </div>
                            ))}
                        </div>

                        {/* Call controls */}
                        <div className="px-5 pb-6">
                            {!isCallActive && callState !== "incoming" && (
                                <button onClick={() => dial()} disabled={!dialInput || callState === "dialing" || callState === "ringing"}
                                    className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center gap-2 text-white font-bold text-sm transition-all disabled:opacity-40">
                                    {callState === "dialing" ? <RefreshCw className="w-5 h-5 animate-spin" /> : callState === "ringing" ? <Activity className="w-5 h-5 animate-pulse" /> : <Phone className="w-5 h-5" />}
                                    {callState === "idle" ? "Call" : callState === "dialing" ? "Connecting..." : "Ringing..."}
                                </button>
                            )}
                            {isCallActive && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-3 gap-2">
                                        <button onClick={() => setMuted(m => !m)} className={`h-10 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition-all ${muted ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}>
                                            {muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                            <span className="text-[8px]">{muted ? "Unmute" : "Mute"}</span>
                                        </button>
                                        <button onClick={() => setHeld(h => !h)} className={`h-10 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition-all ${held ? "bg-yellow-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}>
                                            <Film className="w-4 h-4" />
                                            <span className="text-[8px]">{held ? "Resume" : "Hold"}</span>
                                        </button>
                                        <button className="h-10 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-0.5">
                                            <UserPlus className="w-4 h-4" />
                                            <span className="text-[8px]">Transfer</span>
                                        </button>
                                    </div>
                                    <button onClick={hangup} className="w-full h-12 rounded-2xl bg-red-600 hover:bg-red-500 flex items-center justify-center gap-2 text-white font-bold text-sm transition-all">
                                        <PhoneOff className="w-5 h-5" /> End Call
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Volume */}
                        <div className="px-5 pb-5 flex items-center gap-3">
                            <Volume2 className="w-3.5 h-3.5 text-zinc-500" />
                            <input type="range" min={0} max={100} value={speakerVolume} onChange={e => setSpeakerVolume(Number(e.target.value))} className="flex-1 accent-emerald-500" />
                            <span className="text-[10px] text-zinc-500 w-6">{speakerVolume}</span>
                        </div>
                    </div>

                    {/* Right panel: recent calls + contacts */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
                            {(["recent", "contacts", "settings"] as const).map(t => (
                                <button key={t} onClick={() => setTab(t)} className={`px-5 py-2 rounded-lg text-xs font-bold capitalize transition-all ${tab === t ? "bg-zinc-600 text-white" : "text-zinc-400 hover:text-zinc-200"}`}>{t}</button>
                            ))}
                        </div>

                        {tab === "recent" && (
                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                                <div className="px-5 py-4 border-b border-zinc-800"><h2 className="text-sm font-bold text-white">Recent Calls</h2></div>
                                <div className="divide-y divide-zinc-800/50">
                                    {RECENT.map((c, i) => (
                                        <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-800/20">
                                            {DIR_ICONS[c.direction]}
                                            <div className="flex-1">
                                                <div className="text-xs font-bold text-zinc-200">{c.name}</div>
                                                <div className="text-[10px] text-zinc-500 font-mono">{c.number}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] text-zinc-400">{c.time}</div>
                                                <div className="text-[10px] text-zinc-500">{c.duration}</div>
                                            </div>
                                            <button onClick={() => { setDialInput(c.number); dial(c.number); }} className="p-1.5 text-zinc-600 hover:text-emerald-400 transition-colors">
                                                <Phone className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {tab === "contacts" && (
                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                                <h2 className="text-sm font-bold text-white mb-4">Quick Dial (Internal)</h2>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { name: "dental-queue", ext: "8001", color: "#06b6d4" },
                                        { name: "sales-queue", ext: "8002", color: "#10b981" },
                                        { name: "emergency-queue", ext: "8003", color: "#ef4444" },
                                        { name: "Reception 1", ext: "1001", color: "#f59e0b" },
                                        { name: "Reception 2", ext: "1002", color: "#8b5cf6" },
                                        { name: "Manager", ext: "1100", color: "#ec4899" },
                                    ].map(c => (
                                        <button key={c.ext} onClick={() => { setDialInput(c.ext); dial(c.ext); }}
                                            className="flex items-center gap-3 p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-all text-left">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: c.color + "20", color: c.color }}>
                                                {c.ext}
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-zinc-200">{c.name}</div>
                                                <div className="text-[10px] text-zinc-500">Ext {c.ext}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {tab === "settings" && (
                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
                                <h2 className="text-sm font-bold text-white">SIP / WebRTC Configuration</h2>
                                <div className="space-y-4">
                                    {[
                                        { label: "SIP Server (WSS)", value: "wss://pbx.globalaccess.ai:8089/ws" },
                                        { label: "SIP Username", value: "sarah_ai_pbx" },
                                        { label: "SIP Domain", value: "globalaccess.ai" },
                                        { label: "STUN Server", value: "stun:stun.l.google.com:19302" },
                                        { label: "Codec Priority", value: "OPUS, G.711u, G.711a" },
                                    ].map(f => (
                                        <div key={f.label} className="flex items-center gap-3 bg-zinc-800 rounded-xl px-4 py-3">
                                            <span className="text-[10px] text-zinc-500 w-32 shrink-0">{f.label}</span>
                                            <span className="text-xs font-mono text-zinc-300">{f.value}</span>
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-bold py-2.5 rounded-xl transition-colors">Save & Reconnect</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
