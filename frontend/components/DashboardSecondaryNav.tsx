"use client";

import React from 'react';
import { cn } from "@/lib/utils";
import {
    Gauge,
    TrendingUp,
    Activity,
    Wand2,
    Users,
    PlaySquare,
    Phone,
    DollarSign,
    Clock,
    Server
} from "lucide-react";

const tabs = [
    { name: "Overview", icon: <Gauge className="w-4 h-4" /> },
    { name: "Calls & Rooms", icon: <TrendingUp className="w-4 h-4" /> },
    { name: "Latency", icon: <Activity className="w-4 h-4" /> },
    { name: "AI Insights", icon: <Wand2 className="w-4 h-4" /> },
    { name: "Agents", icon: <Users className="w-4 h-4" /> },
    { name: "Media", icon: <PlaySquare className="w-4 h-4" /> },
    { name: "Telephony", icon: <Phone className="w-4 h-4" /> },
    { name: "Price/Cost", icon: <DollarSign className="w-4 h-4" /> },
    { name: "Customer Usage", icon: <Clock className="w-4 h-4" /> },
    { name: "Server Stats", icon: <Server className="w-4 h-4" /> }
];

interface NavProps {
    activeTab: string;
    onTabChange: (name: string) => void;
}

export default function DashboardSecondaryNav({ activeTab, onTabChange }: NavProps) {
    return (
        <div className="w-full bg-black/50 backdrop-blur-md overflow-hidden">
            <div className="max-w-[1600px] mx-auto px-8 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-8 pt-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab.name}
                            onClick={() => onTabChange(tab.name)}
                            className={cn(
                                "flex items-center gap-2 text-sm font-medium whitespace-nowrap transition-all pb-3 border-b-2",
                                activeTab === tab.name
                                    ? "text-white border-white"
                                    : "text-zinc-400 border-transparent hover:text-zinc-200"
                            )}
                        >
                            {tab.icon}
                            {tab.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
