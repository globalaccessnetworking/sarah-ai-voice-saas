"use client";

import React, { useState, useEffect } from "react";
import { 
    BarChart, 
    Clock, 
    Users, 
    Save, 
    Globe, 
    Mail, 
    CheckCircle2, 
    AlertCircle,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Automated Reporting Configuration Dashboard
 * High-fidelity "Tronic" aesthetic for managing Daily Summary reports.
 */

export default function ReportingSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState({
        enableDailySummary: true,
        executionTime: "23:59",
        timezone: "UTC",
        recipientEmails: ""
    });

    // 1. Fetch Configuration on Load
    useEffect(() => {
        async function fetchConfig() {
            try {
                const res = await fetch("/api/settings/reporting");
                if (!res.ok) throw new Error("Failed to load configuration");
                const data = await res.json();
                setConfig({
                    enableDailySummary: data.enableDailySummary ?? false,
                    executionTime: data.executionTime ?? "23:59",
                    timezone: data.timezone ?? "UTC",
                    recipientEmails: data.recipientEmails ?? ""
                });
            } catch (error: any) {
                toast.error(error.message);
            } finally {
                setLoading(false);
            }
        }
        fetchConfig();
    }, []);

    // 2. Handle Save
    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/settings/reporting", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config)
            });

            if (!res.ok) throw new Error("Failed to save configuration");
            
            toast.success("Reporting schedule updated successfully", {
                icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            });
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-zinc-500 text-sm font-medium animate-pulse">Syncing reporting engine...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-300 p-8 pt-12 animate-in fade-in duration-700">
            {/* Header */}
            <div className="max-w-4xl mx-auto mb-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <BarChart className="w-6 h-6 text-blue-500" />
                    </div>
                    <h1 className="text-2xl font-semibold text-white tracking-tight">Automated Reporting</h1>
                </div>
                <p className="text-zinc-500 text-sm">
                    Configure high-integrity metric aggregation and automated email distribution schedules.
                </p>
            </div>

            {/* Configuration Card */}
            <div className="w-full max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-1000">
                <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-8 backdrop-blur-md shadow-2xl relative overflow-hidden group">
                    
                    {/* Section 1: Master Toggle */}
                    <div className="flex items-center justify-between pb-8 border-b border-zinc-800/50">
                        <div className="space-y-1">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-white">Daily Aggregation Report</h3>
                            <p className="text-xs text-zinc-500">Automatically calculate and dispatch daily system performance summaries.</p>
                        </div>
                        <button 
                            onClick={() => setConfig({ ...config, enableDailySummary: !config.enableDailySummary })}
                            className={cn(
                                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                                config.enableDailySummary ? "bg-green-500" : "bg-zinc-700"
                            )}
                        >
                            <span
                                className={cn(
                                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                    config.enableDailySummary ? "translate-x-6" : "translate-x-1"
                                )}
                            />
                        </button>
                    </div>

                    <div className={cn("space-y-8 pt-8 transition-all duration-500", !config.enableDailySummary && "opacity-40 grayscale pointer-events-none")}>
                        
                        {/* Section 2: Execution Schedule */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                                    <Clock className="w-3 h-3" /> Execution Time
                                </label>
                                <input 
                                    type="time" 
                                    value={config.executionTime}
                                    onChange={(e) => setConfig({ ...config, executionTime: e.target.value })}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-3 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50 transition-all"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                                    <Globe className="w-3 h-3" /> System Timezone
                                </label>
                                <select 
                                    value={config.timezone}
                                    onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-3 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50 appearance-none transition-all cursor-pointer"
                                >
                                    <option value="UTC">Universal Coordinated (UTC)</option>
                                    <option value="Asia/Karachi">Karachi, Pakistan (GMT+5)</option>
                                    <option value="America/New_York">New York, USA (EST)</option>
                                    <option value="Europe/London">London, UK (GMT)</option>
                                    <option value="Asia/Dubai">Dubai, UAE (GST)</option>
                                </select>
                            </div>
                        </div>

                        {/* Section 3: Distribution List */}
                        <div className="space-y-3">
                            <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                                <Users className="w-3 h-3" /> Report Recipients
                            </label>
                            <div className="relative group/input">
                                <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-600 group-focus-within/input:text-blue-500 transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="admin@globalaccess.ai, reports@globalaccess.ai"
                                    value={config.recipientEmails}
                                    onChange={(e) => setConfig({ ...config, recipientEmails: e.target.value })}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md pl-10 pr-3 py-3 text-sm text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-mono"
                                />
                            </div>
                            <p className="text-[10px] text-zinc-600 italic">Separate multiple email addresses with a comma.</p>
                        </div>

                        {/* Verification Notice */}
                        <div className="p-4 bg-zinc-950/20 border border-zinc-800/40 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                            <p className="text-[10px] text-zinc-500 leading-relaxed">
                                Configuration changes are synchronized with the Scheduled Summary Aggregation Engine. 
                                The engine reads this record precisely 60 seconds before execution to ensure high-integrity dispatch.
                            </p>
                        </div>
                    </div>

                    {/* Section 4: Action Footer */}
                    <div className="border-t border-zinc-800/50 mt-10 pt-8 flex justify-end">
                        <Button 
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2.5 rounded-lg font-bold uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-blue-600/10 active:scale-[0.98]"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Synchronizing...
                                </>
                            ) : (
                                <>
                                    <Save className="w-3.5 h-3.5 mr-2" />
                                    Save Reporting Schedule
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Decorative Background Glow */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none" />
                </div>
            </div>
        </div>
    );
}
