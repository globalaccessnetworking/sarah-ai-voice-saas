"use client";

import React, { useState, useEffect } from 'react';
import { Network, ServerOff, Activity, ShieldAlert, GitMerge, FileAudio, Save, PhoneCall } from 'lucide-react';
import { toast } from 'sonner';

export default function PTCLTrunkManagement() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Form config
    const [dialectConfig, setDialectConfig] = useState<any>(null);

    const fetchHealth = async () => {
        try {
            const res = await fetch('/api/asterisk/ptcl/health');
            const result = await res.json();
            setData(result.health);
            
            // Only set config on initial load so we don't overwrite user edits
            if (!dialectConfig) {
                setDialectConfig(result.dialectRouting);
            }
            setIsLoading(false);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchHealth();
        const interval = setInterval(fetchHealth, 3000);
        return () => clearInterval(interval);
    }, [dialectConfig]);

    const handleSaveDialectRoute = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/asterisk/ptcl/health', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dialectConfig)
            });
            if (res.ok) {
                toast.success("Dialect routing rules updated.");
            }
        } catch (err) {
            toast.error("Network error");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading || !data) {
        return (
            <div className="flex justify-center items-center h-64 text-zinc-500 gap-2">
                <Activity className="w-5 h-5 animate-pulse" /> Scanning PTCL SBC Gateway...
            </div>
        );
    }

    const isHealthy = data.status === "Healthy";

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                        <Network className="w-6 h-6 text-green-400" /> PTCL SIP Management & Routing
                    </h2>
                    <p className="text-zinc-400 text-sm mt-1">
                        Monitor local trunk health and configure IVR dialect routing before calls are bridged to the AI Agent.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* PTCL Health Dashboard */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 shadow-lg">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Activity className="w-5 h-5 text-green-400" /> SIP Trunk Status
                            </h3>
                            <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded flex items-center gap-1.5 ${isHealthy ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isHealthy ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`}></span>
                                {data.status}
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                                <span className="text-sm font-bold text-zinc-500">TRUNK ID</span>
                                <span className="text-sm font-mono text-white bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">{data.trunkName}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                                <span className="text-sm font-bold text-zinc-500">HOST (SBC)</span>
                                <span className="text-sm font-mono text-zinc-300">{data.host}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                                <span className="text-sm font-bold text-zinc-500">PING / LATENCY</span>
                                <div className="flex items-center gap-2 text-sm font-mono">
                                    <span className={data.pingMs < 30 ? 'text-green-400' : 'text-yellow-400'}>{data.pingMs}ms</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                                <span className="text-sm font-bold text-zinc-500">PACKET LOSS</span>
                                <div className="flex items-center gap-2 text-sm font-mono">
                                    {data.packetLoss > 0.5 && <ShieldAlert className="w-4 h-4 text-orange-500" />}
                                    <span className={data.packetLoss === 0 ? 'text-green-400' : 'text-orange-400'}>{data.packetLoss}%</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                                <span className="text-sm font-bold text-zinc-500">UPTIME</span>
                                <span className="text-sm font-mono text-zinc-400">{data.uptime}</span>
                            </div>
                        </div>

                        {/* Active Calls Gauge */}
                        <div className="mt-8">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-zinc-400 uppercase">Active Sessions</span>
                                <span className="text-xs font-mono text-zinc-300">{data.activeCalls} <span className="text-zinc-600">/ {data.maxCalls}</span></span>
                            </div>
                            <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800">
                                <div 
                                    className="h-full bg-green-500 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${(data.activeCalls / data.maxCalls) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-5">
                            <h4 className="font-bold text-red-400 flex items-center gap-2 mb-2 text-sm">
                                <ServerOff className="w-4 h-4" /> Failover Action
                            </h4>
                            <p className="text-xs text-red-200/60 leading-relaxed mb-4">
                                If PTCL Ping &gt; 200ms or Packet Loss &gt; 2%, Asterisk will automatically route incoming calls to a backup Jazz SIP Trunk.
                            </p>
                            <button className="w-full bg-red-600/10 text-red-400 border border-red-600/30 hover:bg-red-600 hover:text-white font-bold py-2 rounded text-xs transition-colors">
                                Force Manual Failover
                            </button>
                    </div>
                </div>

                {/* Dialect Routing Configuration */}
                <div className="lg:col-span-2">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 shadow-lg h-full flex flex-col">
                        <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <GitMerge className="w-5 h-5 text-indigo-400" /> Dialect Routing (IVR)
                                </h3>
                                <p className="text-xs text-zinc-500 mt-1">Prompt callers to select their preferred regional dialect before the AI picks up.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-zinc-400 uppercase">Enable IVR</span>
                                <button 
                                    onClick={() => setDialectConfig({...dialectConfig, enabled: !dialectConfig.enabled})}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${dialectConfig.enabled ? 'bg-indigo-500' : 'bg-zinc-700'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${dialectConfig.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>

                        <div className={`space-y-6 flex-1 ${!dialectConfig.enabled ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                            
                            {/* IVR Prompt */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-zinc-400 mb-2">
                                    <FileAudio className="w-4 h-4 text-zinc-500" /> IVR Audio Prompt (TTS)
                                </label>
                                <textarea 
                                    value={dialectConfig.ivrPrompt}
                                    onChange={(e) => setDialectConfig({...dialectConfig, ivrPrompt: e.target.value})}
                                    className="w-full h-20 bg-black border border-zinc-800 rounded-lg p-3 text-sm font-mono text-indigo-200 focus:outline-none focus:border-indigo-500 resize-none"
                                />
                            </div>

                            {/* Routing Table */}
                            <div>
                                <label className="text-sm font-bold text-zinc-400 mb-2 block">Dialect Routing Map</label>
                                <div className="border border-zinc-800 rounded-lg overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-zinc-950/80 border-b border-zinc-800">
                                            <tr>
                                                <th className="p-3 text-xs font-bold text-zinc-500 uppercase">DTMF Input</th>
                                                <th className="p-3 text-xs font-bold text-zinc-500 uppercase">Dialect</th>
                                                <th className="p-3 text-xs font-bold text-zinc-500 uppercase">LiveKit Details</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-800 bg-black/30">
                                            {dialectConfig.routes.map((route: any, index: number) => (
                                                <tr key={index}>
                                                    <td className="p-3">
                                                        <span className="bg-zinc-800 border border-zinc-700 text-white px-2 py-1 rounded font-mono font-bold">Press {route.dtmf}</span>
                                                    </td>
                                                    <td className="p-3 font-bold text-white">
                                                        {route.dialect}
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="text-xs text-zinc-400"><span className="text-zinc-600">Sys Prompt:</span> {route.agentProfile}</div>
                                                            <div className="text-xs text-zinc-400"><span className="text-zinc-600">ElevenLabs Voice:</span> {route.voice}</div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <p className="text-xs text-zinc-500 mt-3 flex items-center gap-2">
                                    <PhoneCall className="w-3 h-3" /> Asterisk will bridge the call to LiveKit with a specific SIP Header (e.g., <code className="bg-zinc-800 px-1 rounded">X-Dialect: Punjabi</code>)
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button 
                                onClick={handleSaveDialectRoute}
                                disabled={isSaving || !dialectConfig.enabled}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" /> Save Routing Configuration
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
