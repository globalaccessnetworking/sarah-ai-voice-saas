"use client";

import React, { useState, useEffect } from "react";
import { 
    Activity, 
    History, 
    Zap, 
    CheckCircle2, 
    AlertCircle, 
    Clock, 
    BarChart3, 
    ArrowUpRight, 
    ArrowDownRight,
    TrendingUp,
    ShieldCheck,
    RefreshCw
} from "lucide-react";
import { toast } from "sonner";

export default function DispatcherMonitorPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const fetchMetrics = async () => {
        try {
            const res = await fetch("/api/monitoring/dispatcher");
            const metrics = await res.json();
            if (metrics.error) throw new Error(metrics.error);
            setData(metrics);
            setLastUpdated(new Date());
        } catch (error) {
            console.error("Failed to fetch dispatcher metrics:", error);
            // Don't toast on every poll failure if it was working before
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
        const interval = setInterval(fetchMetrics, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                    <p className="text-zinc-500 text-sm animate-pulse">Syncing telemetry streams...</p>
                </div>
            </div>
        );
    }

    const { stats, throughputData, recentEvents } = data || { stats: {}, throughputData: [], recentEvents: [] };

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Dispatcher Monitoring</h1>
                    <p className="text-zinc-400 text-sm flex items-center gap-2">
                        Real-time telemetry for outbound system notifications.
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono text-zinc-500 bg-zinc-900/50 p-2 px-4 rounded-xl border border-zinc-800">
                    <Clock className="w-3 h-3" />
                    Last Updated: {lastUpdated.toLocaleTimeString()}
                    <button onClick={fetchMetrics} className="hover:text-emerald-500 transition-colors ml-2">
                        <RefreshCw className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard 
                    title="Success Rate" 
                    value={stats.successRate} 
                    icon={<ShieldCheck className="w-5 h-5 text-emerald-500" />}
                    trend="+0.4%"
                    trendUp={true}
                    subtitle="Last 24 Hours"
                />
                <MetricCard 
                    title="Throughput Velocity" 
                    value={stats.total} 
                    icon={<Zap className="w-5 h-5 text-amber-500" />}
                    trend="Normal"
                    trendUp={true}
                    subtitle="Messages / Day"
                />
                <MetricCard 
                    title="Successful Dispatches" 
                    value={stats.sent} 
                    icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                    trend=""
                    trendUp={true}
                    subtitle="Total Delivered"
                />
                <MetricCard 
                    title="Failed Events" 
                    value={stats.failed} 
                    badge={stats.failed > 0 ? "Check Logs" : null}
                    icon={<AlertCircle className="w-5 h-5 text-red-500" />}
                    trend={stats.failed > 5 ? "+12%" : "Low"}
                    trendUp={false}
                    subtitle="Critical Rejections"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Throughput Velocity Chart (Representational) */}
                <div className="lg:col-span-2 bg-zinc-950/40 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8">
                        <TrendingUp className="w-64 h-64 text-emerald-500/5 absolute -top-12 -right-12 rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-700" />
                    </div>

                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                <Activity className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Throughput Velocity</h2>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Packets / 5 Min Interval</p>
                            </div>
                        </div>
                    </div>

                    <div className="h-[300px] w-full flex items-end justify-between gap-2 px-4">
                        {throughputData.map((d: any, i: number) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group/bar">
                                <div className="text-[9px] font-mono text-zinc-600 opacity-0 group-hover/bar:opacity-100 transition-opacity mb-1">{d.count}</div>
                                <div 
                                    className="w-full bg-emerald-500/20 border-t border-emerald-500/40 rounded-t-lg transition-all duration-1000 group-hover/bar:bg-emerald-500/40 relative"
                                    style={{ height: `${Math.max(10, (d.count / (Math.max(...throughputData.map((x:any) => x.count)) || 1)) * 100)}%` }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-t from-transparent to-emerald-500/10 opacity-0 group-hover/bar:opacity-100 transition-opacity" />
                                </div>
                                <div className="text-[8px] font-mono text-zinc-700 group-hover/bar:text-zinc-400 transition-colors rotate-45 mt-2 origin-left">{d.time}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Real-time Activity Feed */}
                <div className="bg-zinc-950/40 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                            <History className="w-5 h-5 text-zinc-300" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Telemetry Stream</h2>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Latest System Events</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {recentEvents.map((event: any, i: number) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 hover:border-zinc-700/50 transition-colors group">
                                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                                    event.status === 'SENT' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                                }`} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[11px] font-bold text-zinc-200 truncate pr-2">{event.recipient}</span>
                                        <span className="text-[9px] font-mono text-zinc-600 group-hover:text-zinc-400 transition-colors whitespace-nowrap">
                                            {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-zinc-500 font-medium truncate italic opacity-80">"{event.subject}"</div>
                                </div>
                            </div>
                        ))}
                        {recentEvents.length === 0 && (
                            <div className="p-8 text-center bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-800">
                                <BarChart3 className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                                <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest">No Active Telemetry</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, icon, trend, trendUp, subtitle, badge }: any) {
    return (
        <div className="bg-zinc-950/40 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/5 blur-3xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
            
            <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 group-hover:scale-110 transition-transform">
                    {icon}
                </div>
                {badge && (
                    <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-tighter">
                        {badge}
                    </span>
                )}
            </div>

            <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-black text-white">{value}</h3>
                    {trend && (
                        <div className={`flex items-center text-[10px] font-bold ${trendUp ? 'text-emerald-500' : 'text-zinc-500'}`}>
                            {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {trend}
                        </div>
                    )}
                </div>
                <p className="text-[10px] text-zinc-600 font-bold">{subtitle}</p>
            </div>
        </div>
    );
}
