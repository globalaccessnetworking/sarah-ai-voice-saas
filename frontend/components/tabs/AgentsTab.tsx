"use client";
import React, { useState } from "react";
import { Bot, PhoneCall, CheckCircle2, Star, TrendingUp, TrendingDown, Zap, Clock } from "lucide-react";

const AGENTS = [
    { name: "Receptionist AI", calls: 198, resolution: 96, sentiment: 88, avgDuration: "2m 14s", cost: "$8.32", trend: "up", status: "running" },
    { name: "Sales Agent", calls: 142, resolution: 82, sentiment: 91, avgDuration: "4m 38s", cost: "$12.48", trend: "up", status: "running" },
    { name: "Support Bot", calls: 86, resolution: 74, sentiment: 84, avgDuration: "3m 02s", cost: "$5.20", trend: "down", status: "running" },
    { name: "Outbound AI", calls: 74, resolution: 65, sentiment: 77, avgDuration: "5m 11s", cost: "$18.70", trend: "stable", status: "stopped" },
    { name: "Dental Receptionist", calls: 32, resolution: 97, sentiment: 93, avgDuration: "1m 48s", cost: "$2.10", trend: "up", status: "running" },
];

export default function AgentsTab() {
    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-950/40 to-violet-950/30 border border-indigo-900/30 rounded-2xl p-5 flex items-center gap-4">
                <Bot className="w-8 h-8 text-indigo-400" />
                <div>
                    <h2 className="text-base font-bold text-white">Agent Performance Analytics</h2>
                    <p className="text-xs text-zinc-400">Comparative analysis across all deployed voice agents.</p>
                </div>
                <div className="ml-auto text-right">
                    <div className="text-2xl font-bold text-indigo-400">5</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Active Agents</div>
                </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-8 text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-5 py-3 border-b border-zinc-800 bg-black/20">
                    <div className="col-span-2">Agent</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-1">Calls</div>
                    <div className="col-span-1">Resolution</div>
                    <div className="col-span-1">Sentiment</div>
                    <div className="col-span-1">Avg Duration</div>
                    <div className="col-span-1">Total Cost</div>
                </div>
                {AGENTS.map((agent, i) => (
                    <div key={agent.name} className={`grid grid-cols-8 px-5 py-4 items-center hover:bg-zinc-800/30 transition-colors border-b border-zinc-800/50`}>
                        <div className="col-span-2 flex items-center gap-2">
                            <div className="w-8 h-8 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-center justify-center">
                                <Bot className="w-4 h-4 text-indigo-400" />
                            </div>
                            <span className="text-sm font-bold text-white">{agent.name}</span>
                        </div>
                        <div className="col-span-1">
                            <span className={`flex items-center gap-1.5 text-xs font-bold ${agent.status === "running" ? "text-emerald-400" : "text-zinc-500"}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${agent.status === "running" ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"}`} />
                                {agent.status}
                            </span>
                        </div>
                        <div className="col-span-1 text-sm font-bold text-white">{agent.calls}</div>
                        <div className="col-span-1">
                            <div className="flex items-center gap-2">
                                <div className="flex-1 max-w-16 h-1.5 bg-zinc-800 rounded-full"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${agent.resolution}%` }} /></div>
                                <span className="text-xs font-bold text-emerald-400">{agent.resolution}%</span>
                            </div>
                        </div>
                        <div className="col-span-1">
                            <span className={`text-sm font-bold ${agent.sentiment >= 85 ? "text-emerald-400" : agent.sentiment >= 70 ? "text-yellow-400" : "text-red-400"}`}>
                                {agent.sentiment}/100
                            </span>
                        </div>
                        <div className="col-span-1 text-sm text-zinc-300 font-mono">{agent.avgDuration}</div>
                        <div className="col-span-1 text-sm font-bold text-white">{agent.cost}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
