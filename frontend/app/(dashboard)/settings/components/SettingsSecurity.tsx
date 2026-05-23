"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { ShieldCheck, Lock, AlertTriangle, AlertCircle } from "lucide-react";

export function SettingsSecurity() {

    // Helper to render IPS tables
    const renderIpTable = (type: "banned" | "whitelist") => (
        <div className="mt-4 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 p-3 bg-zinc-950 border-b border-zinc-800">
                <Input placeholder={type === "banned" ? "Ban IP address..." : "Whitelist IP address..."} className="bg-zinc-900 border-zinc-700 h-8 text-white" />
                <Button size="sm" className={type === "banned" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}>Add</Button>
            </div>
            <table className="w-full text-sm text-left text-zinc-300">
                <thead className="text-xs uppercase bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                    <tr>
                        <th className="px-4 py-2">IP Address</th>
                        <th className="px-4 py-2">Date Added</th>
                        <th className="px-4 py-2 text-right">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Placeholder no data row for UI */}
                    <tr>
                        <td colSpan={3} className="px-4 py-4 text-center text-zinc-500 italic">No {type} IPs found.</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Account Security Card */}
            <div className="bg-[#1e1e1e] border border-zinc-800 rounded-lg shadow-sm flex flex-col">
                <div className="px-5 py-3 border-b border-zinc-800 bg-[#252525] flex justify-between items-center rounded-t-lg">
                    <h3 className="text-md font-semibold text-gray-100 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-blue-500" /> Account Security
                    </h3>
                    <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                </div>

                <div className="p-5 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 bg-zinc-950/50 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors">
                            <div className="space-y-1">
                                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                                    Enforce 2FA
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                </h4>
                                <p className="text-[11px] text-zinc-500 max-w-[200px]">Require all users to setup 2FA for system access.</p>
                            </div>
                            <Switch defaultChecked />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-zinc-950/50 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors">
                            <div className="space-y-1">
                                <h4 className="text-sm font-semibold text-white">CSRF Protection</h4>
                                <p className="text-[11px] text-zinc-500 max-w-[200px]">Block cross-site request forgery attacks.</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-zinc-800">
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Credentials Management</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs text-gray-400">Current Password</Label>
                                <Input type="password" placeholder="••••••••" className="bg-zinc-950 border-zinc-800 text-white h-9" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-gray-400">New Password</Label>
                                <Input type="password" placeholder="••••••••" className="bg-zinc-950 border-zinc-800 text-white h-9" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-gray-400">Confirm Password</Label>
                                <Input type="password" placeholder="••••••••" className="bg-zinc-950 border-zinc-800 text-white h-9" />
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">Update Master Key</Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fail2Ban Card */}
            <div className="bg-[#1e1e1e] border border-zinc-800 rounded-lg shadow-sm flex flex-col">
                <div className="px-5 py-3 border-b border-zinc-800 bg-[#252525] flex justify-between items-center rounded-t-lg">
                    <h3 className="text-md font-semibold text-gray-100 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" /> Intrusion Prevention (Fail2Ban)
                    </h3>
                    <div className="flex gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            Service Active
                        </span>
                    </div>
                </div>

                <div className="p-5">
                    {/* Status Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {[
                            { label: "Active Jails", value: "6", color: "text-blue-400" },
                            { label: "Banned IPs", value: "14", color: "text-red-500" },
                            { label: "Failed Attempts", value: "1,242", color: "text-amber-500" },
                            { label: "Total Uptime", value: "8d 4h", color: "text-emerald-500" }
                        ].map((stat) => (
                            <div key={stat.label} className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-center">
                                <h3 className={`text-xl font-bold ${stat.color} font-mono`}>{stat.value}</h3>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Jail Configurations</h4>

                    <Accordion className="w-full space-y-2">
                        {[
                            { id: "auth", name: "Authentication Failures", retries: "5", findTime: "600", banTime: "3600" },
                            { id: "emails", name: "Invalid Emails (SMTP)", retries: "3", findTime: "300", banTime: "7200" },
                            { id: "scanner", name: "Scanner Detection (404s)", retries: "20", findTime: "60", banTime: "86400" },
                            { id: "rate", name: "API Rate Limiting", retries: "100", findTime: "60", banTime: "600" }
                        ].map((jail) => (
                            <AccordionItem key={jail.id} value={jail.id} className="border-zinc-800 border rounded-lg px-4 bg-zinc-950/30 overflow-hidden shadow-sm">
                                <AccordionTrigger className="text-sm font-medium text-gray-300 hover:no-underline hover:text-white py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]"></div>
                                        {jail.name}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4 pt-1">
                                    <div className="grid grid-cols-3 gap-4 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] text-zinc-500 uppercase font-bold">Max Retries</Label>
                                            <Input type="number" defaultValue={jail.retries} className="bg-zinc-950 border-zinc-800 text-white font-mono h-8 text-xs" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] text-zinc-500 uppercase font-bold">Find Time (s)</Label>
                                            <Input type="number" defaultValue={jail.findTime} className="bg-zinc-950 border-zinc-800 text-white font-mono h-8 text-xs" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] text-zinc-500 uppercase font-bold">Ban Time (s)</Label>
                                            <Input type="number" defaultValue={jail.banTime} className="bg-zinc-950 border-zinc-800 text-white font-mono h-8 text-xs" />
                                        </div>
                                    </div>
                                    <div className="mt-3 flex justify-end">
                                        <Button size="sm" variant="ghost" className="text-[10px] font-bold uppercase tracking-tighter text-blue-500 hover:text-blue-400">
                                            Update Parameters
                                        </Button>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#1e1e1e] border border-zinc-800 rounded-lg shadow-sm flex flex-col">
                    <div className="px-5 py-3 border-b border-zinc-800 bg-[#252525] flex justify-between items-center rounded-t-lg">
                        <h3 className="text-md font-semibold text-gray-100 flex items-center gap-2">IP Exclusion (Whitelist)</h3>
                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    </div>
                    <div className="p-5">
                        <div className="flex gap-2 mb-4">
                            <Input placeholder="192.168.1.1" className="bg-zinc-950 border-zinc-800 h-9" />
                            <Button className="bg-zinc-800 hover:bg-zinc-700 text-white h-9 px-4">Add IP</Button>
                        </div>
                        <div className="border border-zinc-800 rounded-lg bg-zinc-950 overflow-hidden">
                            <table className="w-full text-[11px] text-left">
                                <thead className="bg-[#1a1a1a] text-zinc-500 uppercase tracking-widest border-b border-zinc-800">
                                    <tr>
                                        <th className="px-4 py-2 font-semibold">Address</th>
                                        <th className="px-4 py-2 font-semibold">Origin</th>
                                        <th className="px-4 py-2 font-semibold text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td colSpan={3} className="px-4 py-4 text-center text-zinc-600 italic">No whitelisted endpoints defined.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
