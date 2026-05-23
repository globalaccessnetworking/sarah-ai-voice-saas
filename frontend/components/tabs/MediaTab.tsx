"use client";
import React from "react";
import { Volume2, Wifi, Activity, TrendingDown, Mic } from "lucide-react";

const CALL_QUALITY = [
    { id: "REC-001", agent: "Receptionist AI", codec: "Opus 48kHz", mos: 4.4, jitter: 1.2, packetLoss: 0.01, bitrate: "32kbps", duration: "3m 22s" },
    { id: "REC-002", agent: "Sales Agent", codec: "Opus 48kHz", mos: 4.2, jitter: 2.8, packetLoss: 0.04, bitrate: "32kbps", duration: "5m 48s" },
    { id: "REC-003", agent: "Support Bot", codec: "Opus 48kHz", mos: 3.6, jitter: 8.4, packetLoss: 0.12, bitrate: "24kbps", duration: "1m 14s" },
    { id: "REC-004", agent: "Receptionist AI", codec: "Opus 48kHz", mos: 4.5, jitter: 0.9, packetLoss: 0.00, bitrate: "32kbps", duration: "2m 55s" },
    { id: "REC-005", agent: "Outbound AI", codec: "Opus 48kHz", mos: 4.1, jitter: 3.5, packetLoss: 0.06, bitrate: "32kbps", duration: "4m 10s" },
];

function MosScore({ score }: { score: number }) {
    const color = score >= 4.0 ? "#10b981" : score >= 3.5 ? "#f59e0b" : "#ef4444";
    const label = score >= 4.0 ? "Excellent" : score >= 3.5 ? "Good" : "Poor";
    return (
        <div className="flex items-center gap-2">
            <span className="text-sm font-bold" style={{ color }}>{score.toFixed(1)}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ color, background: color + "20" }}>{label}</span>
        </div>
    );
}

export default function MediaTab() {
    const avgMos = (CALL_QUALITY.reduce((s, c) => s + c.mos, 0) / CALL_QUALITY.length).toFixed(2);
    const avgJitter = (CALL_QUALITY.reduce((s, c) => s + c.jitter, 0) / CALL_QUALITY.length).toFixed(1);
    const avgLoss = (CALL_QUALITY.reduce((s, c) => s + c.packetLoss, 0) / CALL_QUALITY.length * 100).toFixed(2);

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-cyan-950/40 to-blue-950/30 border border-cyan-900/30 rounded-2xl p-5 flex items-center gap-4">
                <Volume2 className="w-8 h-8 text-cyan-400" />
                <div>
                    <h2 className="text-base font-bold text-white">Media Quality Observatory</h2>
                    <p className="text-xs text-zinc-400">WebRTC audio quality metrics — MOS score, jitter, packet loss, and codec usage per call.</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Avg MOS Score", value: avgMos, sub: "4.0+ = Excellent", color: "#10b981", icon: <Mic className="w-4 h-4" /> },
                    { label: "Avg Jitter", value: `${avgJitter}ms`, sub: "<10ms = Good", color: "#06b6d4", icon: <Activity className="w-4 h-4" /> },
                    { label: "Avg Packet Loss", value: `${avgLoss}%`, sub: "<0.5% = Acceptable", color: "#6366f1", icon: <Wifi className="w-4 h-4" /> },
                ].map(s => (
                    <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.color + "15", color: s.color }}>{s.icon}</div>
                        <div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-widest">{s.label}</div>
                            <div className="text-2xl font-bold text-white">{s.value}</div>
                            <div className="text-[10px] text-zinc-600">{s.sub}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-zinc-800 bg-black/20">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Per-Call Audio Quality Report</h3>
                </div>
                <div className="grid grid-cols-7 text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-5 py-2.5 border-b border-zinc-800/50">
                    <div>Call ID</div><div className="col-span-2">Agent</div><div>MOS Score</div><div>Jitter</div><div>Packet Loss</div><div>Codec</div>
                </div>
                {CALL_QUALITY.map((c, i) => (
                    <div key={c.id} className="grid grid-cols-7 px-5 py-3.5 items-center text-xs border-b border-zinc-800/40 hover:bg-zinc-800/20">
                        <div className="font-mono text-zinc-500">{c.id}</div>
                        <div className="col-span-2 text-zinc-300 font-medium">{c.agent}</div>
                        <div><MosScore score={c.mos} /></div>
                        <div className={`font-mono font-bold ${c.jitter > 5 ? "text-yellow-400" : "text-emerald-400"}`}>{c.jitter}ms</div>
                        <div className={`font-mono font-bold ${c.packetLoss > 0.05 ? "text-red-400" : "text-emerald-400"}`}>{(c.packetLoss * 100).toFixed(2)}%</div>
                        <div className="text-zinc-500 text-[10px]">{c.codec}</div>
                    </div>
                ))}
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-start gap-3">
                <TrendingDown className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                <div>
                    <div className="text-xs font-bold text-yellow-300 mb-1">Quality Alert: REC-003 below MOS 4.0</div>
                    <p className="text-xs text-zinc-500">Call REC-003 showed higher jitter (8.4ms) and packet loss (0.12%). This may indicate a network issue on the caller's end or LiveKit relay path congestion. Consider enabling TURN server fallback.</p>
                </div>
            </div>
        </div>
    );
}
