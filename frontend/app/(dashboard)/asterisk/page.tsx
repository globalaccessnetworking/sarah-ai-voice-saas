"use client";
import React, { useState, useEffect } from "react";
import {
    Phone, Activity, Cpu, HardDrive, Wifi, WifiOff, AlertCircle,
    CheckCircle2, XCircle, Users, Mic, Radio, Zap, BarChart3,
    PhoneCall, PhoneOff, PhoneIncoming, TrendingUp, Globe,
    Clock, Terminal, Settings, ExternalLink, RefreshCw, Shield
} from "lucide-react";

interface Channel {
    id: string;
    name: string;
    state: "Up" | "Ringing" | "Down";
    callerIdNum: string;
    callerIdName: string;
    duration: number;
    extension: string;
    context: string;
}

interface Trunk {
    name: string;
    host: string;
    status: "Registered" | "Unregistered" | "Rejected" | "Request Sent";
    latencyMs: number;
    callsActive: number;
}

const MOCK_CHANNELS: Channel[] = [
    { id: "c1", name: "PJSIP/vonex-00000001", state: "Up", callerIdNum: "+61412345678", callerIdName: "John Smith", duration: 142, extension: "1001", context: "from-trunk" },
    { id: "c2", name: "PJSIP/mynetfone-00000002", state: "Up", callerIdNum: "+61298765432", callerIdName: "Sarah Johnson", duration: 68, extension: "1002", context: "from-trunk" },
    { id: "c3", name: "PJSIP/symbio-00000003", state: "Ringing", callerIdNum: "+61387654321", callerIdName: "Unknown", duration: 5, extension: "1003", context: "from-trunk" },
    { id: "c4", name: "Local/agent-ai@default", state: "Up", callerIdNum: "+61411222333", callerIdName: "Robert Chen", duration: 210, extension: "9001", context: "ai-agents" },
];

const MOCK_TRUNKS: Trunk[] = [
    { name: "Vonex-AU-Primary", host: "sip.vonex.com.au", status: "Registered", latencyMs: 12, callsActive: 2 },
    { name: "MyNetFone-AU", host: "au1.mynetfone.com.au", status: "Registered", latencyMs: 18, callsActive: 1 },
    { name: "Symbio-AU-Backup", host: "sip.symbionetworks.com", status: "Registered", latencyMs: 24, callsActive: 0 },
    { name: "Twilio-Fallback", host: "sip.twilio.com", status: "Unregistered", latencyMs: 0, callsActive: 0 },
];

const STATUS_CONFIG = {
    Registered: { color: "#10b981", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    Unregistered: { color: "#ef4444", icon: <XCircle className="w-3.5 h-3.5" /> },
    Rejected: { color: "#ef4444", icon: <XCircle className="w-3.5 h-3.5" /> },
    "Request Sent": { color: "#f59e0b", icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" /> },
};

function formatDuration(s: number): string {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function AsteriskPage() {
    const [channels, setChannels] = useState(MOCK_CHANNELS);
    const [trunks] = useState(MOCK_TRUNKS);
    const [connected, setConnected] = useState(true);
    const [uptime] = useState("14d 6h 22m");
    const [asteriskVersion] = useState("20.8.1");
    const [cpu] = useState(12);
    const [mem] = useState(38);
    const [mos] = useState(4.3);
    const [tab, setTab] = useState<"channels" | "trunks" | "events">("channels");
    const [events] = useState([
        { time: "06:42:11", event: "FullyBooted", detail: "Asterisk PBX started, 3 trunks registered" },
        { time: "06:41:08", event: "PeerStatus", detail: "Vonex-AU-Primary REGISTERED (latency 12ms)" },
        { time: "06:40:55", event: "PeerStatus", detail: "MyNetFone-AU REGISTERED (latency 18ms)" },
        { time: "06:39:12", event: "Hangup", detail: "Channel PJSIP/vonex-000000005 call ended (180s)" },
        { time: "06:38:43", event: "AgentLogin", detail: "AI Agent sarah-dental logged into queue dental-queue" },
        { time: "06:22:01", event: "QueueCallerAbandon", detail: "Caller +61411000001 left queue after 42s" },
    ]);

    // Simulate duration ticking
    useEffect(() => {
        const timer = setInterval(() => {
            setChannels(prev => prev.map(ch => ch.state === "Up" ? { ...ch, duration: ch.duration + 1 } : ch));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const activeChannels = channels.filter(c => c.state === "Up").length;
    const ringingChannels = channels.filter(c => c.state === "Ringing").length;
    const registeredTrunks = trunks.filter(t => t.status === "Registered").length;

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200 p-8 md:p-10">
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* Header */}
                <div className="bg-gradient-to-r from-orange-950/40 to-red-950/30 border border-orange-900/30 rounded-2xl p-6 flex items-center gap-5">
                    <div className="w-14 h-14 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center">
                        <Terminal className="w-7 h-7 text-orange-400" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-xl font-bold text-white">Asterisk PBX Dashboard</h1>
                            <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${connected ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" : "text-red-400 border-red-500/30 bg-red-500/10"}`}>
                                {connected ? <><Wifi className="w-3 h-3" /> AMI Connected</> : <><WifiOff className="w-3 h-3" /> AMI Offline</>}
                            </span>
                            <span className="text-[10px] font-bold text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">v{asteriskVersion}</span>
                        </div>
                        <p className="text-xs text-zinc-400">Asterisk PBX control centre. Monitor channels, SIP trunks, call quality, and server health in real time.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-400">{activeChannels}</div>
                            <div className="text-[10px] text-zinc-500">Active</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-400">{ringingChannels}</div>
                            <div className="text-[10px] text-zinc-500">Ringing</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-emerald-400">{registeredTrunks}</div>
                            <div className="text-[10px] text-zinc-500">Trunks</div>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    {[
                        { label: "Uptime", value: uptime, icon: <Clock className="w-4 h-4 text-emerald-400" />, color: "emerald" },
                        { label: "CPU Usage", value: `${cpu}%`, icon: <Cpu className="w-4 h-4 text-blue-400" />, color: "blue" },
                        { label: "Memory", value: `${mem}%`, icon: <HardDrive className="w-4 h-4 text-violet-400" />, color: "violet" },
                        { label: "MOS Score", value: mos.toFixed(1), icon: <Activity className="w-4 h-4 text-green-400" />, color: "green" },
                        { label: "Total Channels", value: channels.length, icon: <PhoneCall className="w-4 h-4 text-orange-400" />, color: "orange" },
                        { label: "SIP Trunks", value: `${registeredTrunks}/${trunks.length}`, icon: <Globe className="w-4 h-4 text-cyan-400" />, color: "cyan" },
                        { label: "Queues", value: "3 Active", icon: <Users className="w-4 h-4 text-pink-400" />, color: "pink" },
                    ].map(stat => (
                        <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">{stat.icon}</div>
                            <div className="text-lg font-bold text-white font-mono">{stat.value}</div>
                            <div className="text-[10px] text-zinc-500 mt-0.5">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* CPU / Memory bars */}
                <div className="grid md:grid-cols-3 gap-4">
                    {[
                        { label: "CPU", value: cpu, color: "#3b82f6" },
                        { label: "Memory", value: mem, color: "#8b5cf6" },
                        { label: "Voice Quality (MOS)", value: mos * 20, color: "#10b981", display: mos.toFixed(1) + "/5.0" },
                    ].map(bar => (
                        <div key={bar.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                            <div className="flex justify-between mb-2">
                                <span className="text-xs font-bold text-zinc-400">{bar.label}</span>
                                <span className="text-xs font-bold font-mono" style={{ color: bar.color }}>{bar.display || `${bar.value}%`}</span>
                            </div>
                            <div className="w-full bg-zinc-800 rounded-full h-2">
                                <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${bar.value}%`, background: bar.color }} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="flex border-b border-zinc-800">
                        {([["channels", "📞 Active Channels"], ["trunks", "🌐 SIP Trunks"], ["events", "📋 AMI Events"]] as const).map(([key, label]) => (
                            <button key={key} onClick={() => setTab(key)} className={`px-5 py-3 text-xs font-bold tracking-widest uppercase transition-all ${tab === key ? "text-white border-b-2 border-orange-500 bg-orange-500/5" : "text-zinc-500 hover:text-zinc-300"}`}>
                                {label}
                            </button>
                        ))}
                    </div>

                    {tab === "channels" && (
                        <div className="divide-y divide-zinc-800/50">
                            <div className="grid grid-cols-12 px-5 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                <div className="col-span-4">Channel</div>
                                <div className="col-span-2">Caller</div>
                                <div className="col-span-2">State</div>
                                <div className="col-span-2">Duration</div>
                                <div className="col-span-2">Actions</div>
                            </div>
                            {channels.map(ch => (
                                <div key={ch.id} className="grid grid-cols-12 items-center px-5 py-3.5 hover:bg-zinc-800/30 transition-colors">
                                    <div className="col-span-4">
                                        <div className="text-xs font-mono text-zinc-300 truncate">{ch.name}</div>
                                        <div className="text-[10px] text-zinc-600">{ch.context}</div>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="text-xs text-zinc-200 font-bold">{ch.callerIdName}</div>
                                        <div className="text-[10px] text-zinc-500 font-mono">{ch.callerIdNum}</div>
                                    </div>
                                    <div className="col-span-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ch.state === "Up" ? "bg-emerald-500/10 text-emerald-400" : ch.state === "Ringing" ? "bg-yellow-500/10 text-yellow-400" : "bg-zinc-800 text-zinc-500"}`}>
                                            {ch.state === "Ringing" && <span className="inline-block w-1.5 h-1.5 bg-yellow-400 rounded-full mr-1 animate-pulse" />}
                                            {ch.state}
                                        </span>
                                    </div>
                                    <div className="col-span-2 font-mono text-sm text-zinc-300">{formatDuration(ch.duration)}</div>
                                    <div className="col-span-2 flex gap-2">
                                        <button className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-[10px] font-bold transition-colors">Barge</button>
                                        <button className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-[10px] font-bold transition-colors">Hangup</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {tab === "trunks" && (
                        <div className="divide-y divide-zinc-800/50">
                            <div className="grid grid-cols-12 px-5 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                <div className="col-span-3">Trunk</div>
                                <div className="col-span-3">Host</div>
                                <div className="col-span-2">Status</div>
                                <div className="col-span-2">Latency</div>
                                <div className="col-span-2">Active Calls</div>
                            </div>
                            {trunks.map(trunk => {
                                const sc = STATUS_CONFIG[trunk.status];
                                return (
                                    <div key={trunk.name} className="grid grid-cols-12 items-center px-5 py-4 hover:bg-zinc-800/30 transition-colors">
                                        <div className="col-span-3 font-bold text-sm text-zinc-200">{trunk.name}</div>
                                        <div className="col-span-3 font-mono text-xs text-zinc-400">{trunk.host}</div>
                                        <div className="col-span-2">
                                            <span className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: sc.color }}>
                                                {sc.icon} {trunk.status}
                                            </span>
                                        </div>
                                        <div className="col-span-2 font-mono text-xs" style={{ color: trunk.latencyMs > 0 ? (trunk.latencyMs < 50 ? "#10b981" : "#f59e0b") : "#6b7280" }}>
                                            {trunk.latencyMs > 0 ? `${trunk.latencyMs} ms` : "—"}
                                        </div>
                                        <div className="col-span-2">
                                            <span className={`text-sm font-bold ${trunk.callsActive > 0 ? "text-orange-400" : "text-zinc-600"}`}>{trunk.callsActive}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {tab === "events" && (
                        <div className="divide-y divide-zinc-800/50">
                            {events.map((ev, i) => (
                                <div key={i} className="flex items-start gap-4 px-5 py-3">
                                    <span className="font-mono text-[11px] text-zinc-500 w-16 shrink-0">{ev.time}</span>
                                    <span className="text-[10px] font-bold text-orange-400 w-32 shrink-0">{ev.event}</span>
                                    <span className="text-xs text-zinc-400">{ev.detail}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Originate Call", desc: "Dial a number via AMI", icon: <PhoneCall className="w-5 h-5" />, color: "#10b981" },
                        { label: "Reload Config", desc: "Reload dialplan & SIP", icon: <RefreshCw className="w-5 h-5" />, color: "#6366f1" },
                        { label: "Core Show Channels", desc: "Refresh channel list", icon: <Activity className="w-5 h-5" />, color: "#f59e0b" },
                        { label: "Asterisk Health", desc: "View full health report", icon: <Shield className="w-5 h-5" />, color: "#06b6d4" },
                    ].map(action => (
                        <button key={action.label} className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded-xl p-4 text-left transition-all flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: action.color + "15", color: action.color }}>
                                {action.icon}
                            </div>
                            <div>
                                <div className="text-sm font-bold text-zinc-200">{action.label}</div>
                                <div className="text-[10px] text-zinc-500">{action.desc}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
