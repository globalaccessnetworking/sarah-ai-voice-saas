"use client";

import React, { useState, useEffect } from "react";
import { 
    BarChart3, 
    PieChart, 
    TrendingUp, 
    TrendingDown, 
    ShieldAlert, 
    UserX, 
    Globe, 
    Mail, 
    History,
    RefreshCw,
    Clock,
    CheckCircle2,
    AlertCircle,
    ArrowUpRight,
    Search
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function EmailAnalyticsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const fetchAnalytics = async () => {
        try {
            const res = await fetch("/api/monitoring/analytics");
            const result = await res.json();
            if (result.error) throw new Error(result.error);
            setData(result);
            setLastUpdated(new Date());
        } catch (error) {
            console.error("Failed to fetch analytics:", error);
            // toast.error("Failed to sync analytics data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
        const interval = setInterval(fetchAnalytics, 60000); // Sync every minute
        return () => clearInterval(interval);
    }, []);

    if (isLoading && !data) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                    <p className="text-zinc-500 text-sm animate-pulse">Aggregating delivery benchmarks...</p>
                </div>
            </div>
        );
    }

    const { metrics, topDomains, trendData, suppressionRecommendations } = data || { 
        metrics: {}, 
        topDomains: [], 
        trendData: [], 
        suppressionRecommendations: [] 
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Delivery Analytics & Bounce IQ</h1>
                    <p className="text-zinc-400 text-sm">Actionable intelligence for your outbound communication engine.</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono text-zinc-500 bg-zinc-900/50 p-2 px-4 rounded-xl border border-zinc-800">
                    <Clock className="w-3 h-3" />
                    Last Sync: {lastUpdated.toLocaleTimeString()}
                    <button onClick={fetchAnalytics} className="hover:text-emerald-500 transition-colors ml-2 font-black">
                        <RefreshCw className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AnalyticsCard 
                    title="Delivery Success" 
                    value={metrics.deliveryRate} 
                    icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    subtitle="Last 30 Days"
                />
                <AnalyticsCard 
                    title="Soft/Hard Bounces" 
                    value={metrics.bounceRate} 
                    icon={<ShieldAlert className="w-5 h-5 text-amber-500" />}
                    subtitle="Throttling Ratio"
                />
                <AnalyticsCard 
                    title="Volume Velocity" 
                    value={metrics.total} 
                    icon={<BarChart3 className="w-5 h-5 text-blue-500" />}
                    subtitle="Total Dispatches"
                />
                <AnalyticsCard 
                    title="Suppression IQ" 
                    value={suppressionRecommendations.length} 
                    icon={<UserX className="w-5 h-5 text-rose-500" />}
                    subtitle="At-Risk Recipients"
                    badge="Attention"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 7-Day Trend Chart */}
                <div className="lg:col-span-2 bg-zinc-950/40 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8">
                        <TrendingUp className="w-64 h-64 text-emerald-500/5 absolute -top-12 -right-12 rotate-12 pointer-events-none" />
                    </div>

                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">7-Day Volume Trend</h2>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">SENT VS FAILED RATIO</p>
                            </div>
                        </div>
                    </div>

                    <div className="h-[300px] w-full flex items-end justify-between gap-4 px-4 relative z-10">
                        {trendData.map((d: any, i: number) => {
                            const total = d.sent + d.failed;
                            const maxVal = Math.max(...trendData.map((x: any) => x.sent + x.failed)) || 1;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group/bar">
                                    <div className="flex flex-col w-full gap-0.5">
                                        <div 
                                            className="w-full bg-emerald-500/30 border-t border-emerald-500/50 rounded-t-md transition-all duration-700" 
                                            style={{ height: `${(d.sent / maxVal) * 200}px` }}
                                        />
                                        <div 
                                            className="w-full bg-rose-500/30 border-t border-rose-500/50 rounded-b-md transition-all duration-700" 
                                            style={{ height: `${(d.failed / maxVal) * 200}px` }}
                                        />
                                    </div>
                                    <div className="text-[8px] font-mono text-zinc-600 rotate-45 origin-left mt-2 whitespace-nowrap">{d.date}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Domain Distribution */}
                <div className="bg-zinc-950/40 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Globe className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Domain IQ</h2>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Top Provider Distribution</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {topDomains.map((domain: any, i: number) => (
                            <div key={i} className="space-y-2">
                                <div className="flex items-center justify-between text-[11px] font-bold">
                                    <span className="text-zinc-300">{domain.name}</span>
                                    <span className="text-zinc-500">{((domain.count / metrics.total) * 100).toFixed(1)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000" 
                                        style={{ width: `${(domain.count / metrics.total) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Suppression Recommendations */}
            <div className="bg-zinc-950/40 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                            <UserX className="w-5 h-5 text-rose-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Suppression IQ</h2>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">High-Risk Delivery Targets Identified</p>
                        </div>
                    </div>
                    <Button variant="outline" className="bg-zinc-900 border-zinc-800 text-xs font-bold uppercase transition-all hover:bg-rose-500 hover:text-white">
                        Bulk Suppress All
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {suppressionRecommendations.map((rec: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl hover:border-rose-500/30 transition-colors group">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 text-[10px] font-black">
                                    {rec.failureCount}x
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-bold text-zinc-200 truncate">{rec.email}</p>
                                    <p className="text-[9px] text-zinc-500 font-medium">Consecutive Failures</p>
                                </div>
                            </div>
                            <button className="p-2 text-zinc-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                                <ShieldAlert className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {suppressionRecommendations.length === 0 && (
                        <div className="col-span-full py-12 text-center border border-dashed border-zinc-800 rounded-3xl">
                            <CheckCircle2 className="w-12 h-12 text-emerald-500/20 mx-auto mb-4" />
                            <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest">Global Deliverability is 100% Healthy</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function AnalyticsCard({ title, value, icon, subtitle, badge }: any) {
    return (
        <div className="bg-zinc-950/40 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/5 blur-3xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
            
            <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 group-hover:scale-110 transition-transform">
                    {icon}
                </div>
                {badge && (
                    <span className="text-[9px] font-bold bg-rose-500/20 text-rose-500 px-2 py-0.5 rounded-full border border-rose-500/20 uppercase tracking-tighter">
                        {badge}
                    </span>
                )}
            </div>

            <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-black text-white">{value}</h3>
                </div>
                <p className="text-[10px] text-zinc-600 font-bold">{subtitle}</p>
            </div>
        </div>
    );
}
