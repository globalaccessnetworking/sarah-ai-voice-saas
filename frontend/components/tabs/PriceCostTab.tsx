"use client";

import React from 'react';
import { DollarSign, PieChart, Cpu } from "lucide-react";

export default function PriceCostTab() {
  const metrics = [
    { label: "Total Pipeline Spend", value: "$142.50", icon: DollarSign, color: "text-blue-400", bgColor: "bg-blue-400/10", borderColor: "border-blue-400/20" },
    { label: "Avg Cost Per Minute", value: "$0.14", icon: PieChart, color: "text-purple-400", bgColor: "bg-purple-400/10", borderColor: "border-purple-400/20" },
    { label: "LLM Token Usage", value: "1.2M Tokens", icon: Cpu, color: "text-emerald-400", bgColor: "bg-emerald-400/10", borderColor: "border-emerald-400/20" },
  ];

  const distribution = [
    { name: "Voice/STT Engine (Deepgram)", percentage: 30, color: "bg-blue-500" },
    { name: "LLM Engine (OpenAI)", percentage: 55, color: "bg-emerald-500" },
    { name: "Telephony (Twilio/SIP)", percentage: 15, color: "bg-zinc-500" },
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

      {/* Spend Distribution */}
      <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-8">
        <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-purple-400" />
          Spend Distribution Breakdown
        </h3>
        <div className="space-y-6">
          {distribution.map((d, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{d.name}</span>
                <span className="text-sm font-bold text-white tracking-tighter">{d.percentage}%</span>
              </div>
              <div className="h-2 w-full bg-zinc-800/50 rounded-full overflow-hidden border border-zinc-800/50">
                <div 
                  className={`h-full ${d.color} transition-all duration-1000`} 
                  style={{ width: `${d.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
