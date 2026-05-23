"use client";

import React, { useState, useEffect } from "react";
import { 
    Bell, 
    Shield, 
    Save, 
    Activity, 
    CheckCircle2, 
    Clock, 
    Server, 
    Zap, 
    ShieldAlert, 
    Terminal, 
    Cpu, 
    Globe 
} from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function ServiceAlertsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [config, setConfig] = useState({
        enableAlerts: false,
        recipientEmails: "",
        monitoredServices: [] as string[],
        alertCooldown: 30,
        checkInterval: 60
    });

    const services = [
        "Agent Worker (Python)",
        "LiveKit WebRTC",
        "Redis Memory",
        "Next.js Dashboard",
        "Egress Engine",
        "SIP Trunk Connectivity"
    ];

    useEffect(() => {
        async function fetchConfig() {
            try {
                const res = await fetch("/api/settings/alerts");
                const data = await res.json();
                if (data && !data.error) {
                    setConfig(prev => ({ ...prev, ...data }));
                }
            } catch (error) {
                console.error("Failed to fetch alert config:", error);
                toast.error("Failed to load monitoring configurations");
            } finally {
                setIsLoading(false);
            }
        }
        fetchConfig();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const toastId = toast.loading("Syncing monitoring protocols...");
        try {
            const res = await fetch("/api/settings/alerts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config)
            });
            
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            
            toast.success("Monitoring configuration updated", { id: toastId });
        } catch (error: any) {
            toast.error(error.message || "Failed to save configuration", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    const toggleService = (service: string) => {
        setConfig(prev => {
            const current = [...prev.monitoredServices];
            if (current.includes(service)) {
                return { ...prev, monitoredServices: current.filter(s => s !== service) };
            } else {
                return { ...prev, monitoredServices: [...current, service] };
            }
        });
    };

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                    <p className="text-zinc-500 text-sm animate-pulse">Synchronizing cron-daemon...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto bg-zinc-950 min-h-screen text-zinc-300">
            <div className="mb-12">
                <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Infrastructure Monitoring & Alerts</h1>
                <p className="text-zinc-500 text-sm font-medium">Configure the automated cron-daemon to monitor your AI Workers and SIP Trunks.</p>
            </div>

            <div className="w-full max-w-4xl mx-auto mt-8">
                <form onSubmit={handleSave} className="space-y-8">
                    {/* Master Configuration Card */}
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 shadow-xl relative overflow-hidden">
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-green-500/5 blur-[100px] pointer-events-none" />
                        
                        {/* Top Row: Master Switch */}
                        <div className="flex items-center justify-between mb-10 pb-6 border-b border-zinc-800/50">
                            <div>
                                <h2 className="text-lg font-bold text-white leading-tight">Enable Active Monitoring</h2>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Global Infrastructure Oversight</p>
                            </div>

                            <div className="flex items-center gap-4">
                                <Switch
                                    checked={config.enableAlerts}
                                    onCheckedChange={(checked) => setConfig({ ...config, enableAlerts: checked })}
                                    className={`scale-125 data-[state=checked]:bg-green-500 ${config.enableAlerts ? 'shadow-[0_0_15px_rgba(34,197,94,0.5)]' : ''}`}
                                />
                            </div>
                        </div>

                        {/* Core Settings Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="md:col-span-2 space-y-3">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 pl-1">Alert Recipients</Label>
                                <Input
                                    placeholder="admin@globalaccess.ai, noc@globalaccess.ai"
                                    value={config.recipientEmails ?? ""}
                                    onChange={(e) => setConfig({ ...config, recipientEmails: e.target.value })}
                                    className="bg-zinc-950 border-zinc-800 focus:border-green-500/50 h-12 rounded-xl text-zinc-200 transition-all"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 pl-1">Check Interval</Label>
                                <Select 
                                    value={(config.checkInterval ?? 60).toString()} 
                                    onValueChange={(val: string | null) => setConfig({ ...config, checkInterval: parseInt(val || "60", 10) })}
                                >
                                    <SelectTrigger className="bg-zinc-950 border-zinc-800 h-12 rounded-xl focus:ring-green-500/50">
                                        <SelectValue placeholder="Select Frequency" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800">
                                        <SelectItem value="30">30 Seconds</SelectItem>
                                        <SelectItem value="60">60 Seconds</SelectItem>
                                        <SelectItem value="120">2 Minutes</SelectItem>
                                        <SelectItem value="300">5 Minutes</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 pl-1">Alert Cooldown</Label>
                                <Select 
                                    value={(config.alertCooldown ?? 30).toString()} 
                                    onValueChange={(val: string | null) => setConfig({ ...config, alertCooldown: parseInt(val || "30", 10) })}
                                >
                                    <SelectTrigger className="bg-zinc-950 border-zinc-800 h-12 rounded-xl focus:ring-green-500/50">
                                        <SelectValue placeholder="Select Cooldown" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800">
                                        <SelectItem value="15">15 Minutes</SelectItem>
                                        <SelectItem value="30">30 Minutes</SelectItem>
                                        <SelectItem value="60">1 Hour</SelectItem>
                                        <SelectItem value="240">4 Hours</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-[10px] text-zinc-600 font-bold mt-1 pl-1">Prevents inbox flooding if a service is flapping.</p>
                            </div>
                        </div>

                        {/* Services Matrix */}
                        <div className="mt-12 pt-10 border-t border-zinc-800/50">
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Monitored Subsystems</h3>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                                {services.map((service) => (
                                    <motion.div
                                        key={service}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => toggleService(service)}
                                        className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                                            config.monitoredServices.includes(service)
                                            ? "border-green-500/50 bg-green-500/5 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                                            : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700"
                                        }`}
                                    >
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                            config.monitoredServices.includes(service)
                                            ? "bg-green-500 border-green-500"
                                            : "border-zinc-700 bg-transparent"
                                        }`}>
                                            {config.monitoredServices.includes(service) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <span className={`text-xs font-bold ${config.monitoredServices.includes(service) ? 'text-zinc-100' : 'text-zinc-500'}`}>
                                            {service}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Action Footer */}
                    <div className="flex justify-center mt-8">
                        <Button 
                            type="submit"
                            disabled={isSaving}
                            className="bg-green-600 hover:bg-green-500 text-white font-black h-14 px-10 rounded-2xl transition-all shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:shadow-[0_0_50px_rgba(34,197,94,0.4)] disabled:opacity-50"
                        >
                            <Zap className={`w-5 h-5 mr-3 ${isSaving ? 'animate-pulse' : ''}`} />
                            {isSaving ? "DEPLOYING PROTOCOLS..." : "DEPLOY MONITOR CONFIGURATION"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
