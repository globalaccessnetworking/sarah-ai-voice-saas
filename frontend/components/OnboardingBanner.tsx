"use client";

import React from 'react';
import { X, Bot, Mic, Phone, BookOpen, ExternalLink, ArrowUpRight } from "lucide-react";

export default function OnboardingBanner() {
    const [isVisible, setIsVisible] = React.useState(true);

    if (!isVisible) return null;

    const cards = [
        {
            title: "AI Agents",
            desc: "Build and deploy multimodal and voice AI agents",
            icon: <Bot className="w-5 h-5 text-zinc-400" />,
            link: "#"
        },
        {
            title: "Voice AI quickstart",
            desc: "Build your first voice AI agent in under 10 minutes",
            icon: <Mic className="w-5 h-5 text-zinc-400" />,
            link: "#"
        },
        {
            title: "Telephony integrations",
            desc: "Connect LiveKit to a telephone system using SIP",
            icon: <Phone className="w-5 h-5 text-zinc-400" />,
            link: "#"
        },
        {
            title: "AI Agent Recipes",
            desc: "A collection of examples, demos, and recipes for voice AI",
            icon: <BookOpen className="w-5 h-5 text-zinc-400" />,
            link: "#"
        }
    ];

    return (
        <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Get started</h2>
                <button
                    onClick={() => setIsVisible(false)}
                    className="text-zinc-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
                >
                    Dismiss
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card, i) => (
                    <div
                        key={i}
                        className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition-colors cursor-pointer group flex gap-4 items-start"
                    >
                        <div className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-800 group-hover:bg-zinc-700 transition-colors">
                            {card.icon}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-zinc-100 font-bold text-sm mb-1 flex items-center justify-between">
                                {card.title}
                                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </h3>
                            <p className="text-zinc-500 text-[11px] leading-relaxed group-hover:text-zinc-400 transition-colors">
                                {card.desc}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
