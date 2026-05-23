"use client";
import React, { useState, useEffect } from "react";
import {
    Wifi, Activity, TrendingDown, TrendingUp, AlertTriangle, CheckCircle2,
    RefreshCw, Server, Zap, Signal, Clock
} from "lucide-react";

interface RoomHealth {
    roomName: string;
    participantId: string;
    role: "agent" | "caller";
    packetLoss: number;
    jitter: number;
    rtt: number;
    bitrate: number;
    mos: number;
    codec: string;
    timestamp: number;
}

// Spark bars component
function Sparkbars({ data, color, height = 32 }: { data: number[]; color: string; height?: number }) {
    const max = Math.max(...data, 0.01);
    return (
        <div className="flex items-end gap-0.5" style={{ height }}>
            {data.map((v, i) => (
                <div
                    key={i}
                    className="flex-1 rounded-sm transition-all"
                    style={{ height: `${Math.max((v / max) * 100, 4)}%`, background: i === data.length - 1 ? color : color + "60" }}
                />
            ))}
        </div>
    );
}

function HealthBadge({ value, goodThreshold, warnThreshold, unit }: { value: number; goodThreshold: number; warnThreshold: number; unit: string }) {
    const isGood = value <= goodThreshold;
    const isWarn = value <= warnThreshold;
    const color = isGood ? "#10b981" : isWarn ? "#f59e0b" : "#ef4444";
    const label = isGood ? "Good" : isWarn ? "Warn" : "Poor";
    return (
        <div className="text-center">
            <div className="text-lg font-bold font-mono" style={{ color }}>{value}{unit}</div>
            <div className="text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-block" style={{ color, background: color + "20" }}>{label}</div>
        </div>
    );
}

// Simulate realistic RTC data streams
function generateHistory(base: number, variance: number, length = 20) {
    return Array.from({ length }, (_, i) => Math.max(0, base + (Math.random() - 0.5) * variance * 2));
}

const MOCK_HEALTH: RoomHealth[] = [
    { roomName: "room-dental-ai-001", participantId: "PA-4A2F", role: "agent", packetLoss: 0.02, jitter: 1.4, rtt: 28, bitrate: 32, mos: 4.4, codec: "Opus 48kHz", timestamp: Date.now() },
    { roomName: "room-dental-ai-001", participantId: "PA-7B8D", role: "caller", packetLoss: 0.08, jitter: 3.2, rtt: 44, bitrate: 30, mos: 4.1, codec: "Opus 48kHz", timestamp: Date.now() },
    { roomName: "room-sales-agent-02", participantId: "PB-1C3E", role: "agent", packetLoss: 0.0, jitter: 0.8, rtt: 18, bitrate: 32, mos: 4.5, codec: "Opus 48kHz", timestamp: Date.now() },
    { roomName: "room-sales-agent-02", participantId: "PB-9F2A", role: "caller", packetLoss: 0.15, jitter: 8.4, rtt: 92, bitrate: 24, mos: 3.6, codec: "Opus 24kHz", timestamp: Date.now() },
];

export default function RtcHealthPage() {
    const [health, setHealth] = useState(MOCK_HEALTH);
    const [jitterHistory] = useState(() => MOCK_HEALTH.map(() => generateHistory(3, 4)));
    const [lossHistory] = useState(() => MOCK_HEALTH.map(() => generateHistory(0.05, 0.1)));
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const t = setInterval(() => {
            setHealth(prev => prev.map(h => ({
                ...h,
                jitter: Math.max(0, h.jitter + (Math.random() - 0.5) * 2),
                packetLoss: Math.max(0, Math.min(2, h.packetLoss + (Math.random() - 0.5) * 0.05)),
                rtt: Math.max(10, h.rtt + (Math.random() - 0.5) * 10),
            })));
            setTick(p => p + 1);
        }, 2000);
        return () => clearInterval(t);
    }, []);

    const rooms = [...new Set(health.map(h => h.roomName))];
    const avgMos = (health.reduce((s, h) => s + h.mos, 0) / health.length).toFixed(2);
    const avgJitter = (health.reduce((s, h) => s + h.jitter, 0) / health.length).toFixed(1);
    const maxLoss = Math.max(...health.map(h => h.packetLoss * 100)).toFixed(2);

    return (
        <div className="min-h-screen bg-black text-zinc-200">
            <div className="w-full overflow-y-auto bg-zinc-950 p-8 md:p-10">
                <div className="max-w-[1600px] mx-auto space-y-8">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-950/40 to-cyan-950/30 border border-blue-900/30 rounded-2xl p-6 flex items-center gap-5">
                        <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center">
                            <Signal className="w-7 h-7 text-blue-400" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold text-white mb-1">RTC Connection Health Monitor</h1>
                            <p className="text-xs text-zinc-400">Live WebRTC quality metrics per participant. Tracks packet loss, jitter, RTT, MOS score, and bitrate. Auto-refreshes every 2 seconds.</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-emerald-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live · {health.length} streams
                        </div>
                    </div>

                    {/* Summary KPIs */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: "Active Streams", value: health.length.toString(), color: "#6366f1", icon: <Signal className="w-4 h-4" /> },
                            { label: "Network Quality Score", value: avgMos, color: Number(avgMos) >= 4 ? "#10b981" : "#f59e0b", icon: <Activity className="w-4 h-4" /> },
                            { label: "Avg Jitter", value: `${avgJitter}ms`, color: Number(avgJitter) < 5 ? "#10b981" : "#f59e0b", icon: <Zap className="w-4 h-4" /> },
                            { label: "Max Packet Loss", value: `${maxLoss}%`, color: Number(maxLoss) < 0.5 ? "#10b981" : "#ef4444", icon: <Wifi className="w-4 h-4" /> },
                        ].map(m => (
                            <div key={m.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: m.color + "18", color: m.color }}>{m.icon}</div>
                                <div>
                                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest">{m.label}</div>
                                    <div className="text-2xl font-bold font-mono" style={{ color: m.color }}>{m.value}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Per-Room Panels */}
                    {rooms.map(roomName => {
                        const participants = health.filter(h => h.roomName === roomName);
                        return (
                            <div key={roomName} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                                        <span className="text-sm font-bold text-white font-mono">{roomName}</span>
                                    </div>
                                    <span className="text-xs text-zinc-500">{participants.length} participants · Live</span>
                                </div>
                                <div className="divide-y divide-zinc-800/50">
                                    {participants.map((p, pIdx) => {
                                        const jHist = jitterHistory[health.indexOf(p)] || generateHistory(p.jitter, 3);
                                        const lHist = lossHistory[health.indexOf(p)] || generateHistory(p.packetLoss * 100, 0.1);
                                        const isGood = p.packetLoss < 0.5 && p.jitter < 5;
                                        return (
                                            <div key={p.participantId} className="px-6 py-5">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${p.role === "agent" ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : "bg-zinc-700 text-zinc-300 border border-zinc-600"}`}>
                                                            {p.role === "agent" ? "AI" : "👤"}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-white capitalize">{p.role} · {p.participantId}</div>
                                                            <div className="text-xs text-zinc-500">{p.codec} · {p.bitrate}kbps</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        {isGood ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-yellow-400" />}
                                                        <span className={`text-xs font-bold ${isGood ? "text-emerald-400" : "text-yellow-400"}`}>{isGood ? "Healthy" : "Degraded"}</span>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                                    <div className="bg-zinc-800/50 rounded-xl p-3">
                                                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Packet Loss</div>
                                                        <HealthBadge value={Number((p.packetLoss * 100).toFixed(2))} goodThreshold={0.5} warnThreshold={1.5} unit="%" />
                                                        <div className="mt-2"><Sparkbars data={lHist} color="#ef4444" height={24} /></div>
                                                    </div>
                                                    <div className="bg-zinc-800/50 rounded-xl p-3">
                                                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Jitter</div>
                                                        <HealthBadge value={Number(p.jitter.toFixed(1))} goodThreshold={5} warnThreshold={15} unit="ms" />
                                                        <div className="mt-2"><Sparkbars data={jHist} color="#f59e0b" height={24} /></div>
                                                    </div>
                                                    <div className="bg-zinc-800/50 rounded-xl p-3">
                                                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Round Trip Time</div>
                                                        <HealthBadge value={Math.round(p.rtt)} goodThreshold={50} warnThreshold={150} unit="ms" />
                                                        <div className="mt-2"><Sparkbars data={generateHistory(p.rtt, 20)} color="#6366f1" height={24} /></div>
                                                    </div>
                                                    <div className="bg-zinc-800/50 rounded-xl p-3">
                                                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">MOS Score</div>
                                                        <HealthBadge value={Number(p.mos.toFixed(1))} goodThreshold={0} warnThreshold={0} unit="" />
                                                        <div className="mt-2 text-[10px] text-zinc-600">{p.mos >= 4.0 ? "Excellent quality" : p.mos >= 3.5 ? "Good quality" : "Poor quality"}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
