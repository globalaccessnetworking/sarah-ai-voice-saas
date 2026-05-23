"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Cpu, Info, RefreshCw, Sliders, RotateCcw, Database, Save } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function SystemResourcesPage() {
    const [systemStats, setSystemStats] = useState<any>(null);
    const [swapStats, setSwapStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [swappinessInput, setSwappinessInput] = useState<number>(60);
    const [isSavingSwap, setIsSavingSwap] = useState(false);

    const fetchStats = useCallback(async () => {
        try {
            const [sysRes, swapRes] = await Promise.all([
                fetch('/api/settings/system-resources/stats'),
                fetch('/api/settings/system-resources/swap')
            ]);
            
            if (!sysRes.ok || !swapRes.ok) throw new Error("Failed to fetch system stats");
            
            const sysData = await sysRes.json();
            const swapData = await swapRes.json();
            
            setSystemStats(sysData);
            setSwapStats(swapData);
            
            // Only update local input if not actively sliding
            if (swapData.swappiness !== undefined) {
                // To avoid jumping while user drags, we might only set this on initial load
                // but for simplicity we'll just set it. 
                // Better: only set if we don't have a value yet, or if they match.
            }
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to load system resources", { description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleSaveSwappiness = async () => {
        setIsSavingSwap(true);
        const toastId = toast.loading("Saving swappiness...");
        try {
            const res = await fetch('/api/settings/system-resources/swap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ swappiness: swappinessInput })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to save swap configuration");
            
            toast.success("Swappiness updated successfully");
            fetchStats();
        } catch (error: any) {
            toast.error("Error", { description: error.message });
        } finally {
            toast.dismiss(toastId);
            setIsSavingSwap(false);
        }
    };

    // Live Polling Engine
    useEffect(() => {
        fetchStats();
        const interval = setInterval(() => {
            fetchStats();
        }, 5000);
        return () => clearInterval(interval);
    }, [fetchStats]);

    const handleManualRefresh = () => {
        setIsLoading(true);
        fetchStats();
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                        <Cpu className="w-6 h-6" /> System Resources
                    </h2>
                    <p className="text-zinc-500 text-sm mt-1">
                        Monitor and manage system services. Resource limits can be adjusted for services marked as editable.
                    </p>
                </div>
                <button
                    onClick={handleManualRefresh}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 border border-zinc-700 bg-zinc-900 text-zinc-300 rounded-md hover:bg-zinc-800 transition-colors disabled:opacity-50 font-medium text-sm"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading && !systemStats ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Recommended Minimum Resources Banner */}
            <div className="bg-green-900/10 border border-green-800/50 rounded-lg p-6 my-6">
                <div className="flex items-center gap-2 text-green-500 font-bold mb-4">
                    <Info className="w-5 h-5" /> Recommended Minimum Resources
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                    {/* Column 1 (Dashboard/Agent) */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center border-b border-green-900/30 pb-2">
                            <span className="text-zinc-300 font-medium">Dashboard</span>
                            <span className="text-zinc-400 font-mono text-xs">384MB bg: (required for pip operations)</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-green-900/30 pb-2">
                            <span className="text-zinc-300 font-medium">Agent</span>
                            <span className="text-zinc-400 font-mono text-xs">768MB (for STT/TTS/LLM models)</span>
                        </div>
                        <div className="flex justify-between items-center pb-1">
                            <span className="text-zinc-300 font-medium">Agent (Realtime)</span>
                            <span className="text-zinc-400 font-mono text-xs">1024MB+ (for Realtime audio-to-audio models)</span>
                        </div>
                    </div>
                    
                    {/* Column 2 (LiveKit/Redis) */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center border-b border-green-900/30 pb-2">
                            <span className="text-zinc-300 font-medium">LiveKit Server</span>
                            <span className="text-zinc-400 font-mono text-xs">256MB+ (scales with rooms)</span>
                        </div>
                        <div className="flex justify-between items-center pb-2">
                            <span className="text-zinc-300 font-medium">Redis</span>
                            <span className="text-zinc-400 font-mono text-xs">128MB (for caching)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Service Matrix */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden mt-6">
                {/* Header Row */}
                <div className="grid grid-cols-12 gap-4 px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-800/50 bg-black/50">
                    <div className="col-span-3">SERVICE</div>
                    <div className="col-span-2">STATUS</div>
                    <div className="col-span-4">MEMORY</div>
                    <div className="col-span-2">CPU LIMIT</div>
                    <div className="col-span-1 text-right">ACTIONS</div>
                </div>

                {/* Body Rows */}
                <div className="divide-y divide-zinc-800/50">
                    {systemStats === null ? (
                        <div className="p-12 text-center text-zinc-500 animate-pulse font-medium">
                            Scanning infrastructure...
                        </div>
                    ) : systemStats.services && systemStats.services.length > 0 ? (
                        systemStats.services.map((service: any, idx: number) => {
                            const isRunning = service.status === "RUNNING";
                            const memoryPercent = service.totalLimit > 0 ? Math.min(100, (service.usedMem / service.totalLimit) * 100) : 0;
                            
                            // Map sub-labels based on service name
                            let subLabel = "";
                            if (service.name.includes("Agent")) subLabel = "Handles AI voice calls";
                            if (service.name.includes("Dashboard")) subLabel = "Web interface & API";
                            if (service.name.includes("LiveKit")) subLabel = "WebRTC media server";
                            if (service.name.includes("Postgre")) subLabel = "Core database";
                            if (service.name.includes("Redis")) subLabel = "Ephemeral caching";

                            return (
                                <div key={idx} className="grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-zinc-800/20 transition-colors">
                                    {/* Service Info */}
                                    <div className="col-span-3 flex flex-col justify-center">
                                        <div className="font-bold text-white text-sm tracking-tight">{service.name}</div>
                                        {subLabel && <div className="text-zinc-500 text-xs mt-0.5">{subLabel}</div>}
                                    </div>

                                    {/* Status Badge */}
                                    <div className="col-span-2 flex flex-col justify-center items-start">
                                        {isRunning ? (
                                            <>
                                                <div className="border border-green-500/30 bg-green-500/10 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                                    RUNNING
                                                </div>
                                                <div className="text-zinc-500 font-mono text-[10px] mt-1.5 px-0.5">
                                                    PID: {service.pid}
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="border border-zinc-700 bg-zinc-800 text-zinc-400 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
                                                    STOPPED
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Memory Visualization */}
                                    <div className="col-span-4 flex flex-col justify-center pr-4">
                                        <div className="flex justify-between items-end mb-1.5">
                                            <div className="text-xs font-semibold text-zinc-300">
                                                {memoryPercent.toFixed(1)}% <span className="text-zinc-500 font-normal ml-1">Utilization</span>
                                            </div>
                                            <div className="text-xs font-mono text-zinc-400">
                                                {service.usedMem.toFixed(1)} <span className="text-zinc-600">/</span> {service.totalLimit} MB
                                            </div>
                                        </div>
                                        <div className="w-full bg-zinc-950 border border-zinc-800 h-2 rounded-full overflow-hidden">
                                            <motion.div 
                                                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${memoryPercent}%` }}
                                                transition={{ duration: 0.8, ease: "easeOut" }}
                                            />
                                        </div>
                                    </div>

                                    {/* CPU Limit */}
                                    <div className="col-span-2 flex items-center gap-2">
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                defaultValue="100" 
                                                className="w-16 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm text-zinc-300 font-mono focus:outline-none focus:border-zinc-700 transition-colors"
                                            />
                                            <span className="absolute right-2 top-1.5 text-zinc-600 text-sm">%</span>
                                        </div>
                                        <div className="text-[10px] font-medium text-zinc-500 bg-zinc-800/50 px-1.5 py-0.5 rounded">
                                            UNLIMITED
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="col-span-1 flex justify-end items-center gap-2">
                                        <button 
                                            onClick={() => toast.loading(`Restarting ${service.name}...`)}
                                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                                            title="Restart Service"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                        </button>
                                        <button 
                                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                                            title="Configure Service"
                                        >
                                            <Sliders className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-12 text-center text-zinc-500">
                            No services found.
                        </div>
                    )}
                </div>
            </div>


            {/* Swap Memory Section */}
            <div className="pt-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                            <Database className="w-5 h-5 text-zinc-400" /> Swap Memory
                        </h3>
                        <p className="text-zinc-500 text-sm mt-1">
                            Swap provides virtual memory when physical RAM is full. Swappiness controls how aggressively the system uses swap.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Left Column: Stats */}
                    <div className="col-span-1 md:col-span-7 bg-zinc-900 border border-zinc-800 rounded-lg p-6 flex flex-col justify-center">
                        {swapStats ? (
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                <div>
                                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">STATUS</div>
                                    <div className={`text-xs font-bold px-2 py-1 rounded inline-flex border ${swapStats.status === 'ENABLED' ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-orange-500/30 bg-orange-500/10 text-orange-400'}`}>
                                        {swapStats.status}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">SWAP FILE</div>
                                    <div className="text-zinc-300 font-mono text-sm">{swapStats.swapFile}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">TOTAL</div>
                                    <div className="text-zinc-300 text-sm font-semibold">{swapStats.total} GB</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">USED</div>
                                    <div className="text-zinc-300 text-sm font-semibold">{swapStats.used} MB</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">FREE</div>
                                    <div className="text-zinc-300 text-sm font-semibold">{swapStats.free} GB</div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-zinc-500 py-8 animate-pulse text-sm">Loading swap configuration...</div>
                        )}
                    </div>

                    {/* Right Column: Controller */}
                    <div className="col-span-1 md:col-span-5 bg-zinc-900 border border-zinc-800 rounded-lg p-6 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-sm font-bold text-zinc-300">Swappiness</div>
                            <div className="bg-zinc-800 text-zinc-300 text-xs font-mono px-2 py-1 rounded border border-zinc-700">
                                {swappinessInput} / 100
                            </div>
                        </div>

                        {/* Usage Bar equivalent (using swap used/total for scale) */}
                        <div className="w-full bg-zinc-950 border border-zinc-800 h-2 rounded-full overflow-hidden mb-6">
                            <motion.div 
                                className="h-full bg-zinc-500 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: swapStats && swapStats.total > 0 ? `${Math.min(100, (swapStats.used / (swapStats.total * 1024)) * 100)}%` : '0%' }}
                                transition={{ duration: 0.8 }}
                            />
                        </div>

                        <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={swappinessInput} 
                            onChange={(e) => setSwappinessInput(parseInt(e.target.value))}
                            className="w-full accent-green-500 bg-zinc-800 h-2 rounded-lg appearance-none cursor-pointer"
                        />
                        
                        <div className="text-xs text-green-500 mt-3 mb-6 font-medium">
                            Current: {swapStats?.swappiness ?? '--'} {swapStats?.swappiness === 60 ? '(Balanced)' : swapStats?.swappiness < 60 ? '(Conservative)' : '(Aggressive)'}
                        </div>

                        <div className="mt-auto flex justify-end">
                            <button 
                                onClick={handleSaveSwappiness}
                                disabled={isSavingSwap || !swapStats}
                                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded flex items-center gap-2 font-medium transition-colors disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Expert Logic Banner */}
            <div className="bg-blue-900/10 border border-blue-800/50 rounded-lg p-8 mt-8">
                <div className="flex items-center gap-2 text-blue-400 font-bold mb-6 text-lg">
                    <Info className="w-5 h-5" /> Recommended Swap Settings for LiveKit
                </div>
                
                {/* Performance Scale */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-sm">
                    <div className="bg-blue-950/50 border border-blue-900/50 p-4 rounded-lg">
                        <div className="font-bold text-blue-300 mb-2">0-10 (Minimal swap)</div>
                        <div className="text-blue-100/70">Only use when RAM is critical. Best for systems with plenty of RAM.</div>
                    </div>
                    <div className="bg-blue-950/50 border border-blue-900/50 p-4 rounded-lg">
                        <div className="font-bold text-blue-300 mb-2">30-60 (Balanced - Default)</div>
                        <div className="text-blue-100/70">Good for most workloads. 60 is the Linux default.</div>
                    </div>
                    <div className="bg-blue-950/50 border border-blue-900/50 p-4 rounded-lg">
                        <div className="font-bold text-blue-300 mb-2">80-100 (Aggressive swap)</div>
                        <div className="text-blue-100/70">Use swap more freely. May help on very low RAM systems.</div>
                    </div>
                </div>

                {/* Deep-Dive Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm border-t border-blue-800/30 pt-8">
                    <div className="space-y-4">
                        <h4 className="font-bold text-blue-200 text-base mb-4">Why RAM is preferred over Swap:</h4>
                        <div className="flex gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div>
                            <div><span className="font-bold text-blue-300">Latency:</span> <span className="text-blue-100/70">RAM operates at nanosecond speeds; swap uses disk I/O (milliseconds), causing audio/video delays.</span></div>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div>
                            <div><span className="font-bold text-blue-300">Real-time processing:</span> <span className="text-blue-100/70">STT, TTS, and LLM inference require instant memory access for smooth call quality.</span></div>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div>
                            <div><span className="font-bold text-blue-300">Consistency:</span> <span className="text-blue-100/70">Swap causes unpredictable pauses when pages are loaded from disk mid-call.</span></div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h4 className="font-bold text-blue-200 text-base mb-4">Recommended Settings:</h4>
                        <div className="flex gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div>
                            <div><span className="font-bold text-blue-300">Swappiness:</span> <span className="text-blue-100/70">10 (only use swap as last resort)</span></div>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div>
                            <div><span className="font-bold text-blue-300">Swap Size:</span> <span className="text-blue-100/70">1-2GB minimum (safety net for memory spikes)</span></div>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div>
                            <div><span className="font-bold text-blue-300">Best Practice:</span> <span className="text-blue-100/70">Provision adequate RAM rather than relying on swap.</span></div>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div>
                            <div><span className="font-bold text-blue-300">Monitoring:</span> <span className="text-blue-100/70">If swap usage is consistently high, add more RAM.</span></div>
                        </div>
                    </div>
                </div>

                <div className="mt-10 flex justify-center">
                    <button 
                        onClick={() => toast.success("Kernel parameters safely committed to /etc/sysctl.conf")}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-md font-bold text-lg transition-colors shadow-lg shadow-blue-900/20"
                    >
                        Commit Kernel Parameter &rarr;
                    </button>
                </div>
            </div>

        </div>
    );
}
