"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Mail, Send, Settings, Bell, 
    Save, RefreshCw, Zap, Activity, ShieldCheck, 
    Terminal, User, Globe
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function SettingsEmail() {
    const [enabled, setEnabled] = useState(true);
    const [provider, setProvider] = useState("smtp");
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [selectedServices, setSelectedServices] = useState(['Agent Engine', 'LiveKit Server', 'SIP Gateway']);

    const toggleService = (svc: string) => {
        if (selectedServices.includes(svc)) {
            setSelectedServices(selectedServices.filter(s => s !== svc));
        } else {
            setSelectedServices([...selectedServices, svc]);
        }
    };

    const handleSave = () => {
        setSaving(true);
        setTimeout(() => {
            setSaving(false);
            toast.success("Email configuration updated successfully.");
        }, 1500);
    };

    const handleTestEmail = () => {
        setTesting(true);
        setTimeout(() => {
            setTesting(false);
            toast.success("Test email dispatched to administrator.");
        }, 2000);
    };

    return (
        <div className="bg-zinc-950 min-h-screen text-slate-200 animate-in fade-in duration-700">
            {/* Header / Sticky Action Bar */}
            <div className="sticky top-0 z-50 flex flex-col md:flex-row justify-between items-center gap-4 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/40 p-6 mb-8">
                <div>
                    <h1 className="text-2xl font-semibold text-white tracking-tight">
                        Email Gateway Engine
                    </h1>
                    <p className="text-zinc-500 text-xs font-medium tracking-wide">Manage core notification infrastructure and deliverability IQ.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-zinc-900/80 px-4 py-2 rounded-xl border border-zinc-800">
                        <div className={cn("w-2 h-2 rounded-full animate-pulse", enabled ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-zinc-700")} />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">System Outbound</span>
                        <Switch checked={enabled} onCheckedChange={setEnabled} className="data-[state=checked]:bg-emerald-500" />
                    </div>
                    <Button 
                        onClick={handleSave} 
                        disabled={saving} 
                        className="bg-zinc-100 hover:bg-white text-zinc-950 font-medium px-6 rounded-md transition-all active:scale-95"
                    >
                        {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            <div className="px-6 pb-20 max-w-[1600px] mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* CORE ENGINE (COL 1 & 2) */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* SMTP GATEWAY ENGINE */}
                        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-8 hover:border-zinc-700/60 transition-all group backdrop-blur-sm">
                            <h2 className="text-sm font-medium text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-zinc-400" />
                                SMTP Gateway Engine
                            </h2>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 ml-1">Delivery Provider</Label>
                                    <Select value={provider} onValueChange={(val: any) => {
                                        if (val) setProvider(val);
                                    }}>
                                        <SelectTrigger className="h-10 bg-zinc-950 border-zinc-800 text-slate-200 rounded-md focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50">
                                            <SelectValue placeholder="Select provider" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-zinc-800 text-slate-200">
                                            <SelectItem value="smtp">Standard SMTP Gateway</SelectItem>
                                            <SelectItem value="ses">Amazon SES Engine</SelectItem>
                                            <SelectItem value="sendgrid">SendGrid Dynamic API</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {provider === "smtp" && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 ml-1">SMTP Host</Label>
                                            <input 
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-mono" 
                                                placeholder="smtp.relay.service" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 ml-1">Port</Label>
                                            <input 
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-mono" 
                                                placeholder="587" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 ml-1">Auth Username</Label>
                                            <input 
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all" 
                                                placeholder="service_account" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 ml-1">Gateway Key</Label>
                                            <input 
                                                type="password" 
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all" 
                                                placeholder="••••••••••••••••" 
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* AUTOMATED NOC ALERTS */}
                        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-8 hover:border-zinc-700/60 transition-all group">
                            <h2 className="text-sm font-medium text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-zinc-400" />
                                Automated NOC Alerts
                            </h2>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {['Agent Engine', 'LiveKit Server', 'SIP Gateway', 'Redis Cache', 'Egress Service', 'Web Node'].map(svc => (
                                    <div 
                                        key={svc} 
                                        onClick={() => toggleService(svc)}
                                        className={cn(
                                            "relative p-4 rounded-lg border transition-all cursor-pointer",
                                            selectedServices.includes(svc) 
                                                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" 
                                                : "border-zinc-800 bg-zinc-900/50 text-zinc-500"
                                        )}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <ShieldCheck className={cn("w-3.5 h-3.5", selectedServices.includes(svc) ? "text-emerald-500" : "text-zinc-600")} />
                                            {selectedServices.includes(svc) && (
                                                <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                            )}
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider leading-none">
                                            {svc}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* IDENTITY & VALIDATION (COL 3) */}
                    <div className="lg:col-span-1 space-y-8">
                        
                        {/* OUTBOUND IDENTITY */}
                        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-6 hover:border-zinc-700/60 transition-all group">
                            <h2 className="text-sm font-medium text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                                <User className="w-4 h-4 text-zinc-400" />
                                Outbound Identity
                            </h2>
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block mb-1">Author Name</Label>
                                    <input 
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all" 
                                        placeholder="Global Access AI" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block mb-1">Reply-To Email</Label>
                                    <input 
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-mono" 
                                        placeholder="no-reply@globalaccess.ai" 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* DIAGNOSTIC DISPATCH */}
                        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-6 hover:border-zinc-700/60 transition-all group">
                            <h2 className="text-sm font-medium text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-zinc-400" />
                                Diagnostic Dispatch
                            </h2>
                            <div className="space-y-4">
                                <div className="font-mono text-xs text-zinc-500 bg-black p-3 rounded-md border border-zinc-800 mb-4 h-24 overflow-hidden relative">
                                    <div className="text-[9px] text-zinc-700 mb-2 border-b border-zinc-900 pb-1">HANDSHAKE // STDOUT</div>
                                    <div className="text-emerald-900/50 animate-pulse">Waiting for command input...</div>
                                    <div className="absolute bottom-3 left-3 flex items-center gap-1">
                                        <span className="text-emerald-500 opacity-50">&gt;</span>
                                        <input 
                                            className="bg-transparent border-none text-emerald-500 focus:ring-0 p-0 w-32 placeholder:text-emerald-900/30"
                                            placeholder="enter address"
                                        />
                                    </div>
                                </div>
                                <Button 
                                    onClick={handleTestEmail} 
                                    disabled={testing}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium h-10 rounded-md transition-all active:scale-95"
                                >
                                    {testing ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                    Dispatch Test
                                </Button>
                            </div>
                        </div>

                        {/* STATUS MATRIX */}
                        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-6 opacity-80">
                            <div className="flex items-center gap-3 mb-4">
                                <Globe className="w-3.5 h-3.5 text-zinc-500" />
                                <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Gateway Node</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-mono text-white">SYD_01</span>
                                <div className="flex-1 h-px bg-zinc-800 mx-2" />
                                <span className="text-[10px] text-emerald-500 font-medium">OPTIMIZED</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
