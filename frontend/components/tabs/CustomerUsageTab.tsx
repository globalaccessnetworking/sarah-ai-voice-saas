"use client";

import React from 'react';
import { Users, MessageSquare, Target, Radio } from "lucide-react";

export default function CustomerUsageTab() {
  const metrics = [
    { label: "Total Unique Callers", value: "1,402", icon: Users, color: "text-blue-400", bgColor: "bg-blue-400/10", borderColor: "border-blue-400/20" },
    { label: "Avg Conversation Turns", value: "14 Turns", icon: MessageSquare, color: "text-purple-400", bgColor: "bg-purple-400/10", borderColor: "border-purple-400/20" },
    { label: "Goal Completion Rate", value: "84%", icon: Target, color: "text-emerald-400", bgColor: "bg-emerald-400/10", borderColor: "border-emerald-400/20" },
  ];

  const campaigns = [
    { name: "Q1 Outbound Sales", calls: 842, status: "Active", trend: "+12%" },
    { name: "Support AI Beta", calls: 310, status: "Active", trend: "+5%" },
    { name: "Survey Node 09", calls: 250, status: "Active", trend: "Stable" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* Top Active Campaigns Table */}
      <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400" />
            Top Active Campaigns
          </h3>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-lg">Real-time Performance</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="pb-4 text-[10px] uppercase tracking-widest font-bold text-zinc-500">Campaign Name</th>
                <th className="pb-4 text-[10px] uppercase tracking-widest font-bold text-zinc-500">Total Calls</th>
                <th className="pb-4 text-[10px] uppercase tracking-widest font-bold text-zinc-500">Growth</th>
                <th className="pb-4 text-[10px] uppercase tracking-widest font-bold text-zinc-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {campaigns.map((c, i) => (
                <tr key={i} className="group hover:bg-zinc-800/10 transition-colors">
                  <td className="py-4">
                    <span className="text-sm font-semibold text-zinc-200">{c.name}</span>
                  </td>
                  <td className="py-4 text-sm font-mono text-zinc-400">{c.calls}</td>
                  <td className="py-4 text-sm font-bold text-emerald-400/80">{c.trend}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-2 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full w-fit">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">{c.status}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
