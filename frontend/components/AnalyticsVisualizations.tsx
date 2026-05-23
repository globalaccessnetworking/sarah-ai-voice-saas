"use client";

import React from 'react';
import { PieChart, LineChart, Info } from "lucide-react";

export default function AnalyticsVisualizations() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            {/* Success Status Breakdown */}
            <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 shadow-sm flex flex-col h-[220px]">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
                        <PieChart className="w-4 h-4 text-emerald-500" />
                        <span className="uppercase tracking-widest text-[10px] font-bold">Success Status Breakdown</span>
                        <Info className="w-3.5 h-3.5 opacity-40 cursor-help" />
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center border border-zinc-800/50 rounded-lg bg-black/20 relative">
                    <div className="w-24 h-24 rounded-full border-[8px] border-zinc-800 relative flex items-center justify-center">
                        <div className="text-center">
                            <span className="text-xl font-bold text-zinc-100 block tracking-tighter">0%</span>
                            <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-widest">Success</span>
                        </div>
                    </div>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">Completed</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-zinc-700"></span>
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">Pending</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Call Trends */}
            <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 shadow-sm flex flex-col h-[220px]">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
                        <LineChart className="w-4 h-4 text-emerald-500" />
                        <span className="uppercase tracking-widest text-[10px] font-bold">Call Trends</span>
                        <Info className="w-3.5 h-3.5 opacity-40 cursor-help" />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-tight">Total</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-tight">Answered</span>
                        </div>
                    </div>
                </div>
                <div className="flex-1 border border-zinc-800/50 rounded-lg bg-black/20 relative overflow-hidden flex items-end px-4 pb-2 gap-1.5">
                    {[45, 65, 35, 85, 55, 95, 40, 75, 25].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group/bar h-full justify-end">
                            <div className="w-full bg-zinc-800/50 rounded-t-[2px] group-hover:bg-zinc-700/50 transition-colors relative" style={{ height: `${h}%` }}>
                                <div className="absolute bottom-0 left-0 right-0 bg-emerald-500/20 rounded-t-[1px]" style={{ height: `${h * 0.6}%` }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
