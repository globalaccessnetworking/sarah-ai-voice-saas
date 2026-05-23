"use client";

import React from 'react';
import { Server, Activity, WifiOff, PhoneCall } from "lucide-react";

export default function TelephonyTab() {
  const metrics = [
    { label: "SIP Trunk Health", value: "99.98%", icon: Server, color: "text-emerald-400", bgColor: "bg-emerald-400/10", borderColor: "border-emerald-400/20" },
    { label: "Global Latency", value: "42ms", icon: Activity, color: "text-blue-400", bgColor: "bg-blue-400/10", borderColor: "border-blue-400/20" },
    { label: "Packet Loss", value: "0.01%", icon: WifiOff, color: "text-yellow-400", bgColor: "bg-yellow-400/10", borderColor: "border-yellow-400/20" },
    { label: "Active SIP Channels", value: "14 / 50", icon: PhoneCall, color: "text-purple-400", bgColor: "bg-purple-400/10", borderColor: "border-purple-400/20" },
  ];

  const diagnostics = [
    { timestamp: "2026-03-12 09:15:22", gateway: "US-EAST-1 (Twilio)", error: "486 Busy Here", resolution: "Auto-Retried" },
    { timestamp: "2026-03-12 09:08:45", gateway: "EU-WEST-1 (SIP-A)", error: "503 Service Unavailable", resolution: "Failover to SIP-B" },
    { timestamp: "2026-03-12 08:42:10", gateway: "US-WEST-2 (Twilio)", error: "None", resolution: "Heartbeat Success" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <div key={i} className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-6 hover:bg-zinc-900/60 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{m.label}</span>
              <div className={`p-2 ${m.bgColor} rounded-lg border ${m.borderColor}`}>
                <m.icon className={`w-4 h-4 ${m.color}`} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">{m.value}</h2>
          </div>
        ))}
      </div>

      {/* SIP Diagnostics Table */}
      <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          Recent SIP Diagnostics
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="pb-4 text-[10px] uppercase tracking-widest font-bold text-zinc-500">Timestamp</th>
                <th className="pb-4 text-[10px] uppercase tracking-widest font-bold text-zinc-500">Gateway</th>
                <th className="pb-4 text-[10px] uppercase tracking-widest font-bold text-zinc-500">Error Code</th>
                <th className="pb-4 text-[10px] uppercase tracking-widest font-bold text-zinc-500">Resolution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {diagnostics.map((d, i) => (
                <tr key={i} className="group hover:bg-zinc-800/20 transition-colors">
                  <td className="py-4 text-xs font-mono text-zinc-400">{d.timestamp}</td>
                  <td className="py-4 text-xs font-semibold text-zinc-300">{d.gateway}</td>
                  <td className="py-4 text-xs">
                    <span className={d.error === "None" ? "text-emerald-400" : "text-rose-400"}>{d.error}</span>
                  </td>
                  <td className="py-4 text-xs text-zinc-500">{d.resolution}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
