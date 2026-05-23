"use client";

import React from "react";
import { 
    Webhook, 
    Copy, 
    ExternalLink, 
    ShieldCheck, 
    Key, 
    Zap,
    RefreshCw,
    Code
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * API & Webhooks Command Center
 * High-fidelity interface for managing system integrations and secure endpoints.
 */

export default function APIDashboard() {
    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    const webhooks = [
        {
            id: "call-ended",
            name: "Post-Call Summary Trigger",
            method: "POST",
            endpoint: "/api/webhooks/call-ended",
            description: "Propagates call metadata for instant AI summarization.",
            status: "Active"
        },
        {
            id: "trigger-summary",
            name: "Manual Daily Summary Trigger",
            method: "GET",
            endpoint: "/api/webhooks/trigger-summary",
            description: "Manually executes the Scheduled Summary Aggregation Engine.",
            status: "Active"
        }
    ];

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-300 p-8 pt-12 animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="mb-12">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Webhook className="w-6 h-6 text-blue-500" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent tracking-tight">
                        API & Webhooks
                    </h1>
                </div>
                <p className="text-zinc-500 text-sm max-w-2xl leading-relaxed">
                    Manage your system integration endpoints and secure access keys. Connect third-party services to the Global Access AI pipeline.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-[1400px]">
                
                {/* CARD 1: ACTIVE WEBHOOK ENDPOINTS */}
                <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 backdrop-blur-md hover:border-zinc-700/60 transition-all group overflow-hidden relative">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <Zap className="w-5 h-5 text-emerald-500" />
                            <h2 className="text-sm font-bold uppercase tracking-widest text-white">Active Webhook Endpoints</h2>
                        </div>
                        <div className="text-[10px] font-mono bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded border border-emerald-500/20">
                            LIVE GATEWAY
                        </div>
                    </div>

                    <div className="space-y-6">
                        {webhooks.map((hook) => (
                            <div key={hook.id} className="space-y-3 pb-6 border-b border-zinc-800/50 last:border-0 last:pb-0">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-zinc-200">{hook.name}</h3>
                                    <span className="text-[10px] text-zinc-500 italic">{hook.description}</span>
                                </div>
                                
                                <div className="flex items-center gap-2 group/code">
                                    <div className="flex-1 font-mono text-xs bg-black p-3 rounded-lg border border-zinc-800 text-emerald-400 flex items-center justify-between">
                                        <span>
                                            <span className="text-zinc-600 mr-2">{hook.method}</span>
                                            {hook.endpoint}
                                        </span>
                                        <button 
                                            onClick={() => copyToClipboard(hook.endpoint, "Endpoint URL")}
                                            className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-white transition-all opacity-0 group-hover/code:opacity-100"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Decorative Background Glow */}
                    <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none" />
                </div>

                {/* CARD 2: SECURITY & API KEYS */}
                <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 backdrop-blur-md hover:border-zinc-700/60 transition-all group overflow-hidden relative">
                    <div className="flex items-center gap-3 mb-8">
                        <ShieldCheck className="w-5 h-5 text-blue-500" />
                        <h2 className="text-sm font-bold uppercase tracking-widest text-white">Authentication Keys</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 ml-1">Internal Webhook Secret</Label>
                            <div className="flex items-center gap-2 group/key">
                                <div className="flex-1 font-mono text-xs bg-black/60 p-3 rounded-lg border border-white/5 text-zinc-500 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Key className="w-3 h-3" />
                                        <span>sk_live_*******************6893</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-600 hover:text-white transition-all">
                                            <RefreshCw className="w-3.5 h-3.5" />
                                        </button>
                                        <button className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-600 hover:text-white transition-all">
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-zinc-950/20 border border-zinc-800/50 rounded-xl space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                                    <Code className="w-4 h-4 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-zinc-200">Developer Documentation</p>
                                    <p className="text-[10px] text-zinc-500">Read our guides to implement custom integrations.</p>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full border-zinc-800 hover:bg-zinc-900 text-xs text-zinc-400 font-medium h-9 rounded-md transition-all">
                                Open API Docs
                            </Button>
                        </div>
                    </div>

                    <div className="mt-8">
                        <Button 
                            disabled 
                            className="w-full bg-zinc-800 text-zinc-500 cursor-not-allowed h-11 rounded-lg font-bold uppercase tracking-widest text-[10px]"
                        >
                            Generate New Environment Key
                        </Button>
                        <p className="text-center text-[9px] text-zinc-600 mt-3 italic uppercase tracking-tighter">
                            Restricted: Primary root access only.
                        </p>
                    </div>

                    {/* Decorative Background Glow */}
                    <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none" />
                </div>

            </div>
        </div>
    );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
    return <label className={cn("block", className)}>{children}</label>;
}
