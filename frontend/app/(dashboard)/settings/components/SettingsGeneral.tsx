"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Server, CloudDownload, Sliders, Bug, RotateCw, Palette, CheckCircle2, Clock
} from "lucide-react";
import { toast } from "sonner";

export function SettingsGeneral() {
    const [checkingUpdates, setCheckingUpdates] = useState(false);
    const [timeSyncing, setTimeSyncing] = useState(false);

    const handleCheckUpdates = () => {
        setCheckingUpdates(true);
        setTimeout(() => {
            setCheckingUpdates(false);
            toast.info("System is up to date (v4.15.2-GA).");
        }, 2000);
    };

    const handleSyncTime = () => {
        setTimeSyncing(true);
        setTimeout(() => {
            setTimeSyncing(false);
            toast.success("Time synchronized with NTP server successfully.");
        }, 1500);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Row 1: Engine & Flags */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-[#1e1e1e] border border-zinc-800 rounded-lg shadow-sm flex flex-col">
                    <div className="px-5 py-3 border-b border-zinc-800 bg-[#252525] flex justify-between items-center rounded-t-lg">
                        <h3 className="text-md font-semibold text-gray-100 flex items-center gap-2">
                            <Server className="w-4 h-4 text-blue-500" /> LiveKit Server Engine
                        </h3>
                        <Button variant="outline" size="sm" onClick={handleCheckUpdates} disabled={checkingUpdates} className="h-8 border-blue-500/30 text-blue-400 bg-blue-500/5 hover:bg-blue-500/10 text-[10px] uppercase font-bold">
                            {checkingUpdates ? <CloudDownload className="w-3.5 h-3.5 mr-2 animate-bounce" /> : <CloudDownload className="w-3.5 h-3.5 mr-2" />}
                            Check OTA
                        </Button>
                    </div>
                    <div className="p-0 border-t border-zinc-800/50">
                        <table className="w-full text-xs text-left">
                            <tbody className="divide-y divide-zinc-800/30 bg-zinc-950/20">
                                <tr>
                                    <th className="px-5 py-3 text-zinc-500 font-bold uppercase tracking-tighter w-40">Gateway URL</th>
                                    <td className="px-5 py-3 font-mono text-zinc-300">wss://livekit.globalaccess.ai</td>
                                </tr>
                                <tr>
                                    <th className="px-5 py-3 text-zinc-500 font-bold uppercase tracking-tighter">Status</th>
                                    <td className="px-5 py-3">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-tight">
                                            HEALTHY
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <th className="px-5 py-3 text-zinc-500 font-bold uppercase tracking-tighter">Server Node</th>
                                    <td className="px-5 py-3 flex items-center gap-2">
                                        <code className="text-zinc-300 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-[10px]">v1.6.2</code>
                                        <span className="text-[10px] text-emerald-500 flex items-center">
                                            <CheckCircle2 className="w-3 h-3 mr-1" /> Latest
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-[#1e1e1e] border border-zinc-800 rounded-lg shadow-sm flex flex-col">
                    <div className="px-5 py-3 border-b border-zinc-800 bg-[#252525] flex justify-between items-center rounded-t-lg">
                        <h3 className="text-md font-semibold text-gray-100 flex items-center gap-2">
                            <Sliders className="w-4 h-4 text-purple-500" /> Feature Flags
                        </h3>
                    </div>
                    <div className="p-5 space-y-3">
                        <div className="flex items-center justify-between p-3 bg-zinc-950/50 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors">
                            <div className="space-y-0.5">
                                <h4 className="text-sm font-semibold text-white">SIP Telephony</h4>
                                <p className="text-[10px] text-zinc-500">Enable PSTN inbound/outbound gateways.</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-zinc-950/50 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors">
                            <div className="space-y-0.5">
                                <h4 className="text-sm font-semibold text-white flex items-center gap-2">Debug Mode <Bug className="w-3 h-3 text-orange-500" /></h4>
                                <p className="text-[10px] text-zinc-500">Capture verbose system-level logs.</p>
                            </div>
                            <Switch />
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 2: Time & Update */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-[#1e1e1e] border border-zinc-800 rounded-lg shadow-sm flex flex-col">
                    <div className="px-5 py-3 border-b border-zinc-800 bg-[#252525] flex justify-between items-center rounded-t-lg">
                        <h3 className="text-md font-semibold text-gray-100 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-orange-400" /> Time Synchronization
                        </h3>
                        <Button variant="ghost" size="sm" onClick={handleSyncTime} disabled={timeSyncing} className="h-8 text-blue-500 hover:text-blue-400 hover:bg-zinc-800 text-[10px] font-bold uppercase">
                            <RotateCw className={`w-3.5 h-3.5 mr-2 ${timeSyncing ? 'animate-spin' : ''}`} /> Sync Now
                        </Button>
                    </div>
                    <div className="p-5 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] text-zinc-500 uppercase font-bold">Timezone</Label>
                                <Select defaultValue="America/New_York">
                                    <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white h-9 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                                        <SelectItem value="America/New_York">America/New York</SelectItem>
                                        <SelectItem value="UTC">UTC (Universal)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] text-zinc-500 uppercase font-bold">NTP Host</Label>
                                <Select defaultValue="time.cloudflare.com">
                                    <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white h-9 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                                        <SelectItem value="time.cloudflare.com">time.cloudflare.com</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg flex justify-between items-center">
                            <span className="text-[10px] text-zinc-500 uppercase font-bold">Local RTC Clock</span>
                            <span className="font-mono text-emerald-500 text-xs">2026-03-08 10:45:22 UTC</span>
                        </div>
                    </div>
                </div>

                <div className="bg-[#1e1e1e] border border-zinc-800 rounded-lg shadow-sm flex flex-col">
                    <div className="px-5 py-3 border-b border-zinc-800 bg-[#252525] flex justify-between items-center rounded-t-lg">
                        <h3 className="text-md font-semibold text-gray-100 flex items-center gap-2">
                            <Palette className="w-4 h-4 text-pink-500" /> Branding Profile
                        </h3>
                    </div>
                    <div className="p-5 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Instance Workspace Name</Label>
                            <Input defaultValue="Global Access AI Engine" className="bg-zinc-950 border-zinc-800 text-white h-9" />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1 space-y-2">
                                <Label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Instance Logo</Label>
                                <Button variant="outline" className="w-full h-9 border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white border-dashed">
                                    Upload SVG/PNG
                                </Button>
                            </div>
                            <div className="flex-1 space-y-2">
                                <Label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Favicon</Label>
                                <Button variant="outline" className="w-full h-9 border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white border-dashed">
                                    Upload .ICO
                                </Button>
                            </div>
                        </div>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-9">
                            Save Branding Parameters
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
