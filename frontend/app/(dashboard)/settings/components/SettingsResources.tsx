"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Cpu, Server, Activity, ArrowRight, RotateCw, Settings2 } from "lucide-react";

export function SettingsResources() {
    const services = [
        { name: "LiveKit Server", status: "Running", memUsage: 45, limit: "150%", pid: "1423" },
        { name: "Agent Worker", status: "Running", memUsage: 82, limit: "200%", pid: "8891" },
        { name: "Next.js Dashboard", status: "Running", memUsage: 15, limit: "100%", pid: "231" },
        { name: "PostgreSQL Database", status: "Running", memUsage: 35, limit: "Unlimited", pid: "99" },
        { name: "Redis Cache", status: "Running", memUsage: 8, limit: "Unlimited", pid: "102" }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Orchestration Card */}
            <div className="bg-[#1e1e1e] border border-zinc-800 rounded-lg shadow-sm flex flex-col">
                <div className="px-5 py-3 border-b border-zinc-800 bg-[#252525] flex justify-between items-center rounded-t-lg">
                    <h3 className="text-md font-semibold text-gray-100 flex items-center gap-2">
                        <Server className="w-5 h-5 text-blue-500" /> Container Orchestration
                    </h3>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-8 border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white">
                            <RotateCw className="w-3.5 h-3.5 mr-2" /> Refresh Status
                        </Button>
                    </div>
                </div>

                <div className="p-0 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#1a1a1a] text-zinc-500 text-[10px] uppercase tracking-widest border-b border-zinc-800">
                            <tr>
                                <th className="px-6 py-3 font-semibold">Service Name</th>
                                <th className="px-6 py-3 font-semibold">Status</th>
                                <th className="px-6 py-3 font-semibold w-64">Memory Usage</th>
                                <th className="px-6 py-3 font-semibold">CPU Limit</th>
                                <th className="px-6 py-3 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {services.map((svc) => (
                                <tr key={svc.name} className="hover:bg-zinc-900/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-200">{svc.name}</div>
                                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">PID: {svc.pid}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                            {svc.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex justify-between text-[10px] font-mono">
                                                <span className="text-zinc-500">Utilization</span>
                                                <span className={svc.memUsage > 80 ? 'text-red-400' : 'text-blue-400'}>{svc.memUsage}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-zinc-950 rounded-full border border-zinc-800/50 overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-500 ${svc.memUsage > 80 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]'}`}
                                                    style={{ width: `${svc.memUsage}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-zinc-400 text-xs">{svc.limit}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-zinc-800">
                                                <Settings2 className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-orange-500/70 hover:text-orange-400 hover:bg-orange-500/10">
                                                <RotateCw className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#1e1e1e] border border-zinc-800 rounded-lg shadow-sm flex flex-col">
                    <div className="px-5 py-3 border-b border-zinc-800 bg-[#252525] flex justify-between items-center rounded-t-lg">
                        <h3 className="text-md font-semibold text-gray-100 flex items-center gap-2">
                            <Cpu className="w-5 h-5 text-purple-500" /> Kernel Optimization
                        </h3>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
                                <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">Total RAM</span>
                                <span className="text-lg font-bold text-white font-mono">32.0 GB</span>
                            </div>
                            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
                                <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">Swap Space</span>
                                <span className="text-lg font-bold text-white font-mono">8.0 GB</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-300 font-medium">Swappiness Policy</span>
                                <span className="text-blue-400 font-mono font-bold">60%</span>
                            </div>
                            <Slider defaultValue={[60]} max={100} step={1} className="py-2" />
                            <p className="text-[11px] text-zinc-500 bg-zinc-900/50 p-2 border border-zinc-800/50 rounded leading-relaxed">
                                Controls the kernel's preference to swap memory pages. High values attempt to save RAM, lower values optimize for I/O bounds. <strong className="text-orange-400">System restart required to apply kernel tunable.</strong>
                            </p>
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center">
                                Commit Kernel Parameter <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
