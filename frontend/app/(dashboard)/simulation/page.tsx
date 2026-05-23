"use client";

import React, { useState } from "react";
import { 
    CheckCircle2, 
    Clock, 
    Target, 
    ShieldCheck, 
    Play, 
    TrendingUp, 
    Activity,
    History,
    Search,
    RefreshCcw,
    Zap,
    AlertCircle
} from "lucide-react";
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer 
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const mockBenchmarkData = [
    { run: 'Run 1', success: 88, latency: 450 },
    { run: 'Run 2', success: 92, latency: 420 },
    { run: 'Run 3', success: 90, latency: 435 },
    { run: 'Run 4', success: 95, latency: 390 },
    { run: 'Run 5', success: 94, latency: 405 },
    { run: 'Run 6', success: 98, latency: 380 },
];

const mockTestLogs = [
    { id: "SIM-882", name: "Outbound Sales Script v4", status: "Success", accuracy: "98.5%", latency: "380ms", timestamp: "2024-03-12 10:15" },
    { id: "SIM-881", name: "Cold Caller Handling - Objections", status: "Success", accuracy: "96.2%", latency: "405ms", timestamp: "2024-03-12 09:30" },
    { id: "SIM-880", name: "Customer Support - Technical FAQ", status: "Partial", accuracy: "92.0%", latency: "435ms", timestamp: "2024-03-12 08:45" },
    { id: "SIM-879", name: "Billing Inquiry - Dispute Flow", status: "Success", accuracy: "99.1%", latency: "390ms", timestamp: "2024-03-11 16:20" },
    { id: "SIM-878", name: "Lead Qualification - Real Estate", status: "Failed", accuracy: "75.4%", latency: "650ms", timestamp: "2024-03-11 14:10" },
];

export default function SimulationDashboard() {
    const [isBenchmarking, setIsBenchmarking] = useState(false);

    const runBenchmark = () => {
        setIsBenchmarking(true);
        setTimeout(() => setIsBenchmarking(false), 2000);
    };

    return (
        <div className="p-8 pb-24 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/50 pb-8">
                <div>
                    <h1 className="text-3xl font-semibold text-white tracking-tight flex items-center gap-3">
                        Automated Simulation Hub
                        <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5">
                            High-Level Benchmarking
                        </Badge>
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">High-fidelity automated testing, performance indexing, and script benchmarking.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        onClick={runBenchmark}
                        disabled={isBenchmarking}
                        className="bg-blue-600 hover:bg-blue-500 text-white border-blue-400/20 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                    >
                        {isBenchmarking ? (
                            <>
                                <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                                Benchmarking...
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4 mr-2" />
                                Run New Benchmark
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Success Rate", value: "98.2%", icon: CheckCircle2, color: "emerald", trend: "+2.4%", trendUp: true, desc: "scenario compliance" },
                    { label: "Avg. Latency", value: "382ms", icon: Zap, color: "blue", trend: "-45ms", trendUp: true, desc: "response time" },
                    { label: "AI Logic Accuracy", value: "96.8%", icon: Target, color: "purple", trend: "+1.2%", trendUp: true, desc: "model inference" },
                    { label: "Compliance Score", value: "100%", icon: ShieldCheck, color: "rose", trend: "Steady", trendUp: true, desc: "policy adherence" },
                ].map((stat, i) => (
                    <div key={i} className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-5 flex flex-col justify-between hover:bg-zinc-900/80 transition-all group">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium text-zinc-400 uppercase tracking-wider">{stat.label}</span>
                            <div className={`p-2 bg-${stat.color}-500/10 rounded-md border border-${stat.color}-500/20 group-hover:border-${stat.color}-500/40 transition-colors`}>
                                <stat.icon className={`w-4 h-4 text-${stat.color}-400`} />
                            </div>
                        </div>
                        
                        <div>
                            <h2 className="text-3xl font-semibold text-white tracking-tight">{stat.value}</h2>
                            <div className={`flex items-center gap-1 mt-2 text-[11px] font-medium px-2 py-0.5 rounded-full w-max ${
                                stat.trendUp ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20' : 'text-rose-400 bg-rose-400/10 border border-rose-400/20'
                            }`}>
                                <TrendingUp className="w-3 h-3" />
                                {stat.trend} <span className="opacity-60 ml-0.5">{stat.desc}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Benchmark Graph */}
                <Card className="lg:col-span-2 bg-zinc-900/40 border-zinc-800/60 backdrop-blur-sm">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-white flex items-center gap-2 text-lg">
                                    <Activity className="w-5 h-5 text-blue-500" />
                                    Performance Stability Index
                                </CardTitle>
                                <CardDescription className="text-zinc-500 uppercase text-[10px] tracking-widest font-bold mt-1">
                                    Rolling 12-Hour Automated Compliance
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Success Rate</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Latency (ms)</span>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={mockBenchmarkData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                                <XAxis 
                                    dataKey="run" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: '#09090b', 
                                        border: '1px solid #27272a',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        color: '#fff'
                                    }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="success" 
                                    stroke="#3b82f6" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorSuccess)" 
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="latency" 
                                    stroke="#a855f7" 
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    fill="transparent" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Scenario Summary */}
                <Card className="bg-zinc-900/40 border-zinc-800/60 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2 text-lg">
                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            Security & Policy
                        </CardTitle>
                        <CardDescription className="text-zinc-500 text-xs mt-1">
                            Real-time AI Guardrail Auditing
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {[
                            { label: "PII Scrubbing", value: "Verified", color: "emerald", icon: CheckCircle2 },
                            { label: "Toxicity Filter", value: "Active", color: "emerald", icon: CheckCircle2 },
                            { label: "Competitor Guard", value: "Active", color: "emerald", icon: CheckCircle2 },
                            { label: "Hallucination Check", value: "Warning", color: "amber", icon: AlertCircle },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                                <div className="flex items-center gap-3">
                                    <item.icon className={`w-4 h-4 text-${item.color}-500`} />
                                    <span className="text-sm font-medium text-zinc-300">{item.label}</span>
                                </div>
                                <Badge variant="outline" className={`border-${item.color}-500/20 text-${item.color}-400 text-[10px]`}>
                                    {item.value}
                                </Badge>
                            </div>
                        ))}
                        <div className="pt-4 mt-6 border-t border-zinc-800 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Last Audit: 2 mins ago</span>
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-2 py-0 text-[10px]">Secure</Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Test Run History */}
            <Card className="bg-zinc-900/40 border-zinc-800/60 backdrop-blur-sm overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-white flex items-center gap-2 text-lg">
                            <History className="w-5 h-5 text-blue-500" />
                            Automated Scenario Logs
                        </CardTitle>
                        <CardDescription className="text-zinc-500 text-xs">
                            Individual benchmark results for all script versions.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500" />
                            <input 
                                className="bg-zinc-900/50 border border-zinc-800 rounded-lg pl-8 pr-4 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500/50 w-48 transition-all"
                                placeholder="Search Logs..."
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-zinc-900/60 border-y border-zinc-800/60">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[100px] text-zinc-400 font-bold uppercase text-[10px] tracking-widest pl-8">ID</TableHead>
                                <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Scenario Name</TableHead>
                                <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
                                <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Accuracy</TableHead>
                                <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Latency</TableHead>
                                <TableHead className="text-right text-zinc-400 font-bold uppercase text-[10px] tracking-widest pr-8">Timestamp</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockTestLogs.map((log) => (
                                <TableRow key={log.id} className="border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                                    <TableCell className="font-mono text-xs text-blue-400 pl-8">{log.id}</TableCell>
                                    <TableCell className="font-medium text-zinc-200">{log.name}</TableCell>
                                    <TableCell>
                                        <Badge 
                                            variant="outline" 
                                            className={
                                                log.status === "Success" 
                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                                : log.status === "Partial"
                                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                            }
                                        >
                                            {log.status === "Success" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                            {log.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-zinc-300">{log.accuracy}</TableCell>
                                    <TableCell className="font-mono text-xs text-zinc-500">{log.latency}</TableCell>
                                    <TableCell className="text-right text-xs text-zinc-500 pr-8 tracking-tighter">{log.timestamp}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
