"use client";

import React from 'react';
import { Info, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
    title: string;
    value: string | number;
    unit?: string;
    trend?: {
        value: string;
        direction: 'up' | 'down' | 'neutral';
        label?: string;
    };
    icon?: React.ReactNode;
    status?: 'success' | 'warning' | 'error' | 'neutral';
    description?: string;
}

export default function MetricCard({
    title,
    value,
    unit,
    trend,
    icon,
    status = 'neutral',
    description
}: MetricCardProps) {
    return (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 shadow-sm flex flex-col justify-between min-h-[140px]">
            <div className="text-sm font-medium text-zinc-400 mb-4 flex justify-between items-center">
                <span className="flex items-center gap-2">
                    {title}
                    <Info className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-opacity cursor-help" />
                </span>
                {icon && <div className="text-zinc-600 transition-colors">{icon}</div>}
            </div>

            <div>
                <div className="flex items-baseline gap-1.5">
                    <span className={cn(
                        "text-4xl font-bold text-white tracking-tight",
                        status === 'success' ? 'text-emerald-400' :
                            status === 'warning' ? 'text-amber-400' :
                                status === 'error' ? 'text-rose-400' : ''
                    )}>
                        {value}
                    </span>
                    {unit && <span className="text-sm font-medium text-zinc-500">{unit}</span>}
                </div>

                {trend && (
                    <div className={cn(
                        "text-sm font-medium flex items-center gap-1.5 mt-2",
                        trend.direction === 'up' ? "text-emerald-500" :
                            trend.direction === 'down' ? "text-red-500" : "text-zinc-500"
                    )}>
                        {trend.direction === 'up' ? <TrendingUp className="w-4 h-4" /> :
                            trend.direction === 'down' ? <TrendingDown className="w-4 h-4" /> :
                                <Minus className="w-4 h-4" />}
                        <span>{trend.value}</span>
                        {trend.label && <span className="text-zinc-500 font-normal ml-0.5">{trend.label}</span>}
                    </div>
                )}

                {!trend && description && (
                    <div className="text-sm font-medium text-zinc-500 flex items-center gap-1.5 mt-2">
                        {description}
                    </div>
                )}
            </div>
        </div>
    );
}
