"use client";

import React, { useState, useEffect } from 'react';
import { Clock, Play, Plus, Trash2, Settings2, ShieldCheck, Activity, Volume2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface AudioAsset {
    id: string;
    filename: string;
    phrase: string;
    durationMs: number;
    status: string;
}

export default function LatencyFillersDashboard() {
    const [config, setConfig] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Form state
    const [newPhrase, setNewPhrase] = useState("");
    const [thresholdInput, setThresholdInput] = useState<number>(800);

    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/latency-fillers/config');
            const data = await res.json();
            setConfig(data);
            setThresholdInput(data.triggerThresholdMs || 800);
            setIsLoading(false);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load latency filler configuration.");
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    const handleSaveThreshold = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/latency-fillers/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ triggerThresholdMs: thresholdInput })
            });
            if (res.ok) {
                toast.success(`Threshold updated to ${thresholdInput}ms`);
                fetchConfig();
            } else {
                toast.error("Failed to update threshold");
            }
        } catch (err) {
            toast.error("Network error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleEnabled = async (enabled: boolean) => {
        try {
            const res = await fetch('/api/latency-fillers/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled })
            });
            if (res.ok) {
                toast.success(`Latency Filler module ${enabled ? 'enabled' : 'disabled'}`);
                fetchConfig();
            }
        } catch (err) { }
    };

    const handleAddPhrase = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPhrase) return;

        try {
            const res = await fetch('/api/latency-fillers/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    newAsset: { phrase: newPhrase, durationMs: 1200 + Math.floor(Math.random() * 500) } 
                })
            });
            if (res.ok) {
                toast.success(`Added filler phrase: "${newPhrase}"`);
                setNewPhrase("");
                fetchConfig();
            }
        } catch (err) {
            toast.error("Network error");
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/latency-fillers/config?id=${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                toast.success("Phrase removed");
                fetchConfig();
            }
        } catch (err) {}
    };

    const simulatePlayback = (phrase: string) => {
        toast.info(`Simulating Playback: "${phrase}"`, {
            icon: <Volume2 className="w-4 h-4 text-blue-400" />
        });
    };

    if (isLoading || !config) {
        return (
            <div className="flex justify-center items-center h-64 text-zinc-500 gap-2">
                <Activity className="w-5 h-5 animate-pulse" /> Loading configurations...
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                        <Clock className="w-6 h-6 text-yellow-400" /> Latency Masking ("Wait Fillers")
                    </h2>
                    <p className="text-zinc-400 text-sm mt-1">
                        Automatically play native Urdu/Punjabi audio snippets (e.g., "Acha...", "Ek sec...") to mask LLM processing latency, maintaining the illusion of a human response.
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-zinc-400 uppercase">Module Status</span>
                    <button 
                        onClick={() => handleToggleEnabled(!config.enabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.enabled ? 'bg-green-500' : 'bg-zinc-700'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                
                {/* Left Column: Logic Config */}
                <div className="space-y-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 shadow-lg">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                            <Settings2 className="w-5 h-5 text-yellow-400" /> Trigger Logic
                        </h3>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="flex justify-between text-sm font-bold text-zinc-400 mb-2">
                                    <span>Time-To-First-Token (TTFB) Threshold</span>
                                    <span className="text-yellow-400 font-mono">{thresholdInput}ms</span>
                                </label>
                                <input 
                                    type="range" 
                                    min="200" 
                                    max="2000" 
                                    step="50"
                                    value={thresholdInput}
                                    onChange={(e) => setThresholdInput(Number(e.target.value))}
                                    className="w-full accent-yellow-500 bg-zinc-800 h-2 rounded-lg appearance-none cursor-pointer"
                                />
                                <p className="text-xs text-zinc-500 mt-2">
                                    If GPT-4o takes longer than this threshold to generate a response, LiveKit will instantly play a random filler asset into the SIP stream.
                                </p>
                            </div>

                            <button 
                                onClick={handleSaveThreshold}
                                disabled={isSaving || thresholdInput === config.triggerThresholdMs}
                                className="w-full bg-yellow-600/20 text-yellow-500 border border-yellow-600/50 hover:bg-yellow-600 hover:text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" /> Save Threshold
                            </button>
                        </div>
                    </div>

                    <div className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-5">
                        <h4 className="font-bold text-blue-400 flex items-center gap-2 mb-2 text-sm">
                            <ShieldCheck className="w-4 h-4" /> Zero Perceived Latency
                        </h4>
                        <p className="text-xs text-blue-200/60 leading-relaxed">
                            Because ElevenLabs streams audio chunks asynchronously, the moment the filler asset finishes playing (e.g., 1.5 seconds later), EleventLabs has already buffered the actual LLM response. The caller hears a seamless native human reaction.
                        </p>
                    </div>
                </div>

                {/* Right Column: Audio Assets */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Upload / Add Form */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 shadow-lg flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full space-y-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase">Text Reference</label>
                            <input 
                                type="text"
                                value={newPhrase}
                                onChange={(e) => setNewPhrase(e.target.value)}
                                placeholder='e.g., "Jee abhi check karta hoon..."'
                                className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:border-yellow-500"
                            />
                        </div>
                        <div className="flex-1 w-full space-y-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase">Audio File (.wav)</label>
                            <input 
                                type="file"
                                accept=".wav,.mp3"
                                className="w-full bg-black border border-zinc-800 rounded px-3 py-1.5 text-zinc-400 text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700"
                            />
                        </div>
                        <button 
                            onClick={handleAddPhrase}
                            className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold h-10 px-4 rounded transition-colors flex items-center gap-2 whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" /> Upload Asset
                        </button>
                    </div>

                    {/* Table */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
                            <h3 className="font-bold text-white">Pre-computed Audio Assets</h3>
                            <span className="text-xs font-mono text-zinc-500">{config.audioAssets.length} Total</span>
                        </div>
                        
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-black/50 border-b border-zinc-800 text-xs text-zinc-500 font-bold tracking-wider uppercase">
                                    <th className="p-4">Phrase Reference (Urdu/Punjabi)</th>
                                    <th className="p-4">Filename</th>
                                    <th className="p-4">Duration</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50 text-sm">
                                {config.audioAssets.map((asset: AudioAsset) => (
                                    <tr key={asset.id} className="hover:bg-zinc-800/30 transition-colors">
                                        <td className="p-4 font-medium text-white">
                                            "{asset.phrase}"
                                        </td>
                                        <td className="p-4 font-mono text-xs text-zinc-400">
                                            {asset.filename}
                                        </td>
                                        <td className="p-4 text-zinc-400">
                                            {(asset.durationMs / 1000).toFixed(1)}s
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${
                                                asset.status === 'Active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                                            }`}>
                                                {asset.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => simulatePlayback(asset.phrase)}
                                                className="p-1.5 text-zinc-400 hover:text-blue-400 hover:bg-blue-400/10 rounded transition-colors"
                                                title="Preview Audio"
                                            >
                                                <Play className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(asset.id)}
                                                className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                                title="Delete Asset"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        {config.audioAssets.length === 0 && (
                            <div className="p-12 text-center text-zinc-500">
                                No audio assets uploaded yet.
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
