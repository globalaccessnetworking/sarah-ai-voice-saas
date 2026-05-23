"use client";

import React from 'react';
import MetricCard from "../MetricCard";
import {
    Phone,
    CheckCircle2,
    BarChart3,
    PieChart,
    TrendingUp,
    Info
} from "lucide-react";

export default function CallsRoomsTab() {
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Call Performance Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <MetricCard
                    title="Total Calls"
                    value="1,284"
                    trend={{ value: "+12%", direction: 'up', label: "vs prev period" }}
                    icon={<BarChart3 className="w-5 h-5" />}
                />
                <MetricCard
                    title="Answered Calls"
                    value="1,120"
                    trend={{ value: "+8%", direction: 'up', label: "vs prev period" }}
                    icon={<CheckCircle2 className="w-5 h-5" />}
                />
                <MetricCard
                    title="Answer Rate"
                    value="87.2%"
                    description="Excellent performance"
                    status="success"
                    icon={<TrendingUp className="w-5 h-5" />}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Call Volume Trend */}
                <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800/80 rounded-xl p-8 shadow-sm h-[320px] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3 text-sm font-bold text-zinc-400 uppercase tracking-widest">
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                            Call Volume Trend
                        </div>
                    </div>
                    <div className="flex-1 border border-zinc-800/50 rounded-xl bg-black/20 flex items-end px-8 pb-4 gap-2">
                        {[30, 45, 60, 40, 70, 85, 90, 65, 55, 75, 80, 95].map((h, i) => (
                            <div key={i} className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors rounded-t-sm relative group h-full flex items-end">
                                <div className="w-full bg-emerald-500/40 rounded-t-sm" style={{ height: `${h}%` }}></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Call Outcomes */}
                <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-8 shadow-sm h-[320px] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3 text-sm font-bold text-zinc-400 uppercase tracking-widest">
                            <PieChart className="w-4 h-4 text-indigo-500" />
                            Call Outcomes
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-center gap-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-tight text-zinc-500">
                                <span>Completed</span>
                                <span className="text-zinc-300">82%</span>
                            </div>
                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-[82%]"></div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-tight text-zinc-500">
                                <span>Dropped</span>
                                <span className="text-zinc-300">12%</span>
                            </div>
                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 w-[12%]"></div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-tight text-zinc-500">
                                <span>Failed</span>
                                <span className="text-zinc-300">6%</span>
                            </div>
                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-rose-500 w-[6%]"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
