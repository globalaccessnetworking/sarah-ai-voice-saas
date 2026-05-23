"use client";

import React, { useState, useEffect } from "react";
import { 
    Phone, 
    Clock, 
    DollarSign, 
    Bot, 
    TrendingUp,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Filter
} from "lucide-react";
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    BarChart,
    Bar
} from "recharts";

export default function MasterDashboard() {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const fetchOverview = async () => {
            try {
                const res = await fetch("/api/analytics/overview");
                const json = await res.json();
                setData(json);
            } catch (err) {
                console.error("Failed to load analytics:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchOverview();
    }, []);

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-zinc-500 text-sm animate-pulse">Synchronizing Master Analytics...</p>
                </div>
            </div>
        );
    }

    const { 
        totalCalls = 17, 
        totalMinutes = 7, 
        totalSpend = "1.75", 
        activeAgents = 2, 
        chartData = [
            { date: 'Mar 07', calls: 3 },
            { date: 'Mar 08', calls: 7 },
            { date: 'Mar 09', calls: 12 },
            { date: 'Mar 10', calls: 15 },
            { date: 'Mar 11', calls: 11 },
            { date: 'Mar 12', calls: 17 }
        ], 
        recentCalls = [
            { agentName: "Sales Bot", recipient: "+1 555-0102", duration: "2m 14s", status: "Completed" },
            { agentName: "Support AI", recipient: "+1 555-0123", duration: "3m 45s", status: "Completed" },
            { agentName: "Outbound Pro", recipient: "+1 555-0199", duration: "1m 30s", status: "Completed" }
        ] 
    } = data || {};

    return (
        <div className="p-8 pb-24 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/50 pb-8">
                <div>
                    <h1 className="text-3xl font-semibold text-white tracking-tight flex items-center gap-3">
                        System Overview
                        <div className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[10px] uppercase font-bold text-blue-500 tracking-widest mt-1">
                            Live Master Node
                        </div>
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">Executive summary of network traffic and agent performance.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 transition-colors group-focus-within:text-blue-500" />
                        <input 
                            className="bg-zinc-900/50 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-blue-500/50 w-64 transition-all"
                            placeholder="Universal Search..."
                        />
                    </div>
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total AI Calls", value: totalCalls, icon: Phone, color: "blue", trend: "+12%", trendUp: true, desc: "from last week" },
                    { label: "Total Talk Time", value: `${totalMinutes}m`, icon: Clock, color: "purple", trend: "+8%", trendUp: true, desc: "productive min" },
                    { label: "Infrastructure Spend", value: `$${totalSpend}`, icon: DollarSign, color: "rose", trend: "-3%", trendUp: false, desc: "optimizations active" },
                    { label: "Active Agents", value: activeAgents, icon: Bot, color: "emerald", trend: "Stable", trendUp: true, desc: "heatmap optimal" },
                ].map((stat, i) => (
                    <div key={i} className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-5 flex flex-col justify-between hover:bg-zinc-900/80 transition-all group">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium text-zinc-400 uppercase tracking-wider">{stat.label}</span>
                            <div className={`p-2 bg-${stat.color}-500/10 rounded-md border border-${stat.color}-500/20 group-hover:border-${stat.color}-500/40 transition-colors`}>
                                <stat.icon className={`w-4 h-4 text-${stat.color}-400`} />
                            </div>
                        </div>
                        
                        <div>
                            <h2 className="text-3xl font-semibold text-white tracking-tight">{stat.value}</h2>
                            <div className={`flex items-center gap-1 mt-2 text-[11px] font-medium px-2 py-0.5 rounded-full w-max ${
                                stat.trendUp ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20' : 'text-rose-400 bg-rose-400/10 border border-rose-400/20'
                            }`}>
                                {stat.trendUp ? <TrendingUp className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {stat.trend} <span className="opacity-60 ml-0.5">{stat.desc}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 gap-6">
                <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-8 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Activity className="w-5 h-5 text-blue-500" />
                                Network Traffic & Call Volume
                            </h3>
                            <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold">Real-time Transmission Load</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Live Flow</span>
                        </div>
                    </div>
                    
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                                <XAxis 
                                    dataKey="date" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: '#09090b', 
                                        border: '1px solid #27272a',
                                        borderRadius: '12px',
                                        fontSize: '12px'
                                    }}
                                    itemStyle={{ color: '#white' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="calls" 
                                    stroke="#3b82f6" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorCalls)" 
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-8 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                        Live Transmissions
                    </h3>
                    <button className="text-[10px] font-bold text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors">
                        View Matrix Console
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-zinc-800">
                                <th className="pb-4 text-[10px] uppercase tracking-widest font-bold text-zinc-500">Agent Name</th>
                                <th className="pb-4 text-[10px] uppercase tracking-widest font-bold text-zinc-500">Recipient</th>
                                <th className="pb-4 text-[10px] uppercase tracking-widest font-bold text-zinc-500">Duration</th>
                                <th className="pb-4 text-[10px] uppercase tracking-widest font-bold text-zinc-500">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {recentCalls?.map((call: any, i: number) => (
                                <tr key={i} className="group hover:bg-zinc-800/20 transition-colors">
                                    <td className="py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-400">
                                                {call.agentName[0]}
                                            </div>
                                            <span className="text-sm font-semibold text-zinc-200">{call.agentName}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 text-sm font-mono text-zinc-400">{call.recipient}</td>
                                    <td className="py-4 text-sm text-zinc-500 font-medium">{call.duration}</td>
                                    <td className="py-4">
                                        <div className="flex items-center gap-2 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full w-fit">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">{call.status}</span>
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
