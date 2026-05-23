"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Terminal, RefreshCw, Copy, Trash2,
    Download, Play, Pause, Search, Filter,
    Info, AlertCircle, CheckCircle2
} from "lucide-react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const MOCK_LOGS: Record<string, string[]> = {
    dashboard: [
        "[2026-03-08 10:45:12] INFO  [Next.js] GET /api/settings/general 200 in 45ms",
        "[2026-03-08 10:45:15] INFO  [Auth] Session validated for user operator@globalaccess.ai",
        "[2026-03-08 10:46:01] DEBUG [Socket] Connection established for room: ROOM_9231",
        "[2026-03-08 10:46:22] INFO  [Next.js] POST /api/agents/update 204 in 12ms",
        "[2026-03-08 10:47:05] WARN  [API] Rate limit approaching for endpoint /tokens",
    ],
    livekit: [
        "[2026-03-08 10:40:00] INFO  Starting LiveKit server v1.7.2...",
        "[2026-03-08 10:40:02] INFO  Listening on :7880",
        "[2026-03-08 10:42:15] DEBUG [RTC] New participant joined: PA_82319",
        "[2026-03-08 10:42:16] INFO  [Room] Room created: test-collaboration",
        "[2026-03-08 10:45:30] DEBUG [RTC] ICE connection state: connected",
    ],
    agent: [
        "[2026-03-08 10:44:00] INFO  Agent worker started. Waiting for jobs...",
        "[2026-03-08 10:45:00] INFO  Job received: job_92831. Initializing pipeline.",
        "[2026-03-08 10:45:02] DEBUG [STT] Using Deepgram plugin (v0.4.2)",
        "[2026-03-08 10:45:05] INFO  [LLM] Requesting completion from gpt-4o",
        "[2026-03-08 10:45:08] DEBUG [TTS] Synthesizing speech for turn 4",
    ]
};

export function SettingsLogs() {
    const [service, setService] = useState("dashboard");
    const [lines, setLines] = useState("100");
    const [refreshing, setRefreshing] = useState(false);
    const [isLive, setIsLive] = useState(true);
    const [logs, setLogs] = useState<string[]>([]);
    const logEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setLogs(MOCK_LOGS[service] || ["No logs available for this service."]);
    }, [service]);

    const handleRefresh = () => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
            setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] INFO  Refreshed log stream...`]);
            toast.success("Logs updated.");
        }, 800);
    };

    const handleCopy = () => {
        if (logs.length > 0) {
            navigator.clipboard.writeText(logs.join('\n'));
            toast.info("Logs copied to clipboard.");
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            {/* Control Panel */}
            <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 space-y-2">
                            <label className="text-xs font-semibold text-zinc-500 uppercase">System Service</label>
                            <Select value={service} onValueChange={(val) => val && setService(val)}>
                                <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white h-10">
                                    <SelectValue placeholder="Select Service" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                    <SelectGroup>
                                        <SelectLabel className="text-zinc-500">Core Engine</SelectLabel>
                                        <SelectItem value="dashboard">Next.js Dashboard</SelectItem>
                                        <SelectItem value="livekit">LiveKit Server</SelectItem>
                                        <SelectItem value="agent">LiveKit Agent Worker</SelectItem>
                                    </SelectGroup>
                                    <SelectGroup>
                                        <SelectLabel className="text-zinc-500">Infrastructure</SelectLabel>
                                        <SelectItem value="redis">Redis Cache</SelectItem>
                                        <SelectItem value="nginx">Nginx Proxy</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-full md:w-32 space-y-2">
                            <label className="text-xs font-semibold text-zinc-500 uppercase">Buffer Size</label>
                            <Select value={lines} onValueChange={(val) => val && setLines(val)}>
                                <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white h-10">
                                    <SelectValue placeholder="Lines" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                    <SelectItem value="50">50 Lines</SelectItem>
                                    <SelectItem value="100">100 Lines</SelectItem>
                                    <SelectItem value="500">500 Lines</SelectItem>
                                    <SelectItem value="1000">1000 Lines</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex gap-2 w-full md:w-auto">
                            <Button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-6 gap-2 flex-1 md:flex-none"
                            >
                                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleCopy}
                                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 h-10 px-4 flex-1 md:flex-none"
                            >
                                <Copy className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Terminal Window */}
            <div className="relative group">
                {/* Terminal Header */}
                <div className="bg-zinc-800/80 border-x border-t border-zinc-700 rounded-t-lg px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-zinc-400" />
                        <span className="text-[11px] font-mono text-zinc-300 uppercase tracking-widest">
                            stdout - {service}.service
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-mono text-green-500 font-bold uppercase">Streaming live</span>
                        </div>
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                        </div>
                    </div>
                </div>

                {/* Log Viewport */}
                <div className="bg-[#0c0c0c] border border-zinc-800 min-h-[500px] max-h-[700px] overflow-y-auto p-4 font-mono text-[13px] leading-relaxed relative scrollbar-thin scrollbar-thumb-zinc-800">
                    <div className="space-y-1">
                        {logs.map((log, i) => {
                            let textColor = "text-zinc-400";
                            if (log.includes("INFO")) textColor = "text-blue-400/80";
                            if (log.includes("DEBUG")) textColor = "text-zinc-500";
                            if (log.includes("WARN")) textColor = "text-orange-400";
                            if (log.includes("ERROR")) textColor = "text-red-400";

                            return (
                                <div key={i} className="flex gap-3 hover:bg-zinc-900/30 -mx-4 px-4 py-0.5 transition-colors">
                                    <span className="text-zinc-700 shrink-0 select-none w-6 text-right">{(i + 1)}</span>
                                    <span className={textColor}>{log}</span>
                                </div>
                            );
                        })}
                        <div ref={logEndRef} />
                    </div>

                    {/* Overlay buttons */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="secondary" className="h-8 w-8 bg-zinc-800/50 hover:bg-zinc-700 border border-zinc-700" onClick={() => setLogs([])}>
                            <Trash2 className="w-4 h-4 text-zinc-400" />
                        </Button>
                        <Button size="icon" variant="secondary" className="h-8 w-8 bg-zinc-800/50 hover:bg-zinc-700 border border-zinc-700">
                            <Download className="w-4 h-4 text-zinc-400" />
                        </Button>
                    </div>
                </div>

                {/* Terminal Footer Info */}
                <div className="bg-zinc-900 border-x border-b border-zinc-800 rounded-b-lg p-3 flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                    <div className="flex gap-4">
                        <span>ENCODING: UTF-8</span>
                        <span>BUFFER: {logs.length}/{lines}</span>
                        <span>PTR: 0x{Math.floor(Math.random() * 0xffffff).toString(16).toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <RefreshCw className="w-3 h-3 text-blue-500" />
                        <span>AUTO-SCROLL ENABLED</span>
                    </div>
                </div>
            </div>

            {/* Help Alert */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 flex items-center gap-3 text-xs text-zinc-400">
                <AlertCircle className="w-4 h-4 text-blue-500" />
                <span>Logs are stored for 7 days. For deep historical analysis, please consult the <code className="text-zinc-300">/var/log/livekit-dashboard</code> directory.</span>
            </div>
        </div>
    );
}
