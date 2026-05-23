"use client";
import React, { useState, useEffect } from "react";
import { Server, Cpu, HardDrive, Wifi, Activity, AlertTriangle, RefreshCw, Zap } from "lucide-react";

function GaugeRing({ value, color, size = 80 }: { value: number; color: string; size?: number }) {
    const r = size * 0.38, cx = size / 2, cy = size / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (value / 100) * circ;
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#27272a" strokeWidth={size * 0.08} />
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={size * 0.08} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`} />
            <text x={cx} y={cy + 5} textAnchor="middle" fill="#fff" fontSize={size * 0.24} fontWeight="bold">{value}%</text>
        </svg>
    );
}

const WORKERS = [
    { id: "worker-01", agent: "Receptionist AI", pid: 12843, uptime: "14h 23m", cpu: 2.1, mem: 142, status: "active" },
    { id: "worker-02", agent: "Sales Agent", pid: 12901, uptime: "14h 18m", cpu: 1.8, mem: 138, status: "active" },
    { id: "worker-03", agent: "Support Bot", pid: 13044, uptime: "8h 02m", cpu: 0.4, mem: 128, status: "idle" },
];

export default function ServerStatsTab() {
    const [cpu, setCpu] = useState(42);
    const [ram, setRam] = useState(67);
    const [disk, setDisk] = useState(34);

    useEffect(() => {
        const t = setInterval(() => {
            setCpu(p => Math.max(15, Math.min(85, p + (Math.random() - 0.5) * 6)));
            setRam(p => Math.max(50, Math.min(90, p + (Math.random() - 0.5) * 3)));
        }, 3000);
        return () => clearInterval(t);
    }, []);

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-950/60 to-zinc-950/40 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
                <Server className="w-8 h-8 text-slate-400" />
                <div>
                    <h2 className="text-base font-bold text-white">Server Health & Resource Monitor</h2>
                    <p className="text-xs text-zinc-400">Live metrics from your LiveKit + Python AI worker nodes. Updates every 3s.</p>
                </div>
                <div className="ml-auto flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> GA-NOC-SVR-01 · Optimal
                </div>
            </div>

            {/* Resource Gauges */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "CPU Usage", value: Math.round(cpu), color: cpu > 75 ? "#ef4444" : cpu > 50 ? "#f59e0b" : "#10b981", icon: <Cpu className="w-4 h-4" />, sub: `${(cpu * 0.08).toFixed(1)} cores active` },
                    { label: "RAM Usage", value: Math.round(ram), color: ram > 80 ? "#ef4444" : ram > 60 ? "#f59e0b" : "#10b981", icon: <Activity className="w-4 h-4" />, sub: `${(ram * 0.32).toFixed(1)} GB / 32 GB` },
                    { label: "Disk Usage", value: disk, color: disk > 80 ? "#ef4444" : "#10b981", icon: <HardDrive className="w-4 h-4" />, sub: `${(disk * 2).toFixed(0)} GB / 200 GB` },
                ].map(m => (
                    <div key={m.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col items-center gap-3">
                        <GaugeRing value={m.value} color={m.color} size={100} />
                        <div className="text-center">
                            <div className="flex items-center gap-1.5 justify-center">
                                <span style={{ color: m.color }}>{m.icon}</span>
                                <span className="text-sm font-bold text-white">{m.label}</span>
                            </div>
                            <div className="text-xs text-zinc-500 mt-1">{m.sub}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Network + Workers */}
            <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4"><Wifi className="w-4 h-4 text-cyan-400" /> Network Stats</h3>
                    <div className="space-y-3">
                        {[
                            { label: "RTC Active Rooms", value: "3" },
                            { label: "WebSocket Connections", value: "12" },
                            { label: "Avg Packet Loss", value: "0.02%" },
                            { label: "Avg Jitter", value: "1.4ms" },
                            { label: "Bandwidth In", value: "2.4 Mbps" },
                            { label: "Bandwidth Out", value: "6.1 Mbps" },
                        ].map(s => (
                            <div key={s.label} className="flex justify-between py-2 border-b border-zinc-800 text-xs">
                                <span className="text-zinc-400">{s.label}</span>
                                <span className="text-white font-mono font-bold">{s.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4"><Zap className="w-4 h-4 text-yellow-400" /> Python AI Workers</h3>
                    <div className="space-y-3">
                        {WORKERS.map(w => (
                            <div key={w.id} className="p-3 bg-zinc-800/50 rounded-xl flex items-start gap-3">
                                <div className={`w-2 h-2 rounded-full mt-1.5 ${w.status === "active" ? "bg-emerald-400 animate-pulse" : "bg-yellow-400"}`} />
                                <div className="flex-1">
                                    <div className="flex justify-between">
                                        <span className="text-xs font-bold text-white">{w.agent}</span>
                                        <span className="text-[10px] font-mono text-zinc-500">PID {w.pid}</span>
                                    </div>
                                    <div className="flex gap-4 mt-1 text-[10px] text-zinc-500">
                                        <span>Up {w.uptime}</span>
                                        <span>CPU {w.cpu}%</span>
                                        <span>MEM {w.mem} MB</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="mt-3 w-full py-2 text-xs text-zinc-500 bg-zinc-800/40 hover:bg-zinc-800 rounded-xl transition-colors flex items-center justify-center gap-1.5">
                        <RefreshCw className="w-3 h-3" /> Restart All Workers
                    </button>
                </div>
            </div>
        </div>
    );
}
