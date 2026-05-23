"use client";

import React, { useState, useEffect } from 'react';
import { Mic2, Settings, AudioWaveform, SlidersHorizontal, Activity, Save, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function VoicePersonaTuner() {
    const [config, setConfig] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/voice-tuner/settings');
            const data = await res.json();
            setConfig(data);
            setIsLoading(false);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/voice-tuner/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            if (res.ok) {
                toast.success("Voice persona settings updated");
            }
        } catch (err) {
            toast.error("Network error");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading || !config) {
        return (
            <div className="flex justify-center items-center h-64 text-zinc-500 gap-2">
                <Activity className="w-5 h-5 animate-pulse" /> Connecting to ElevenLabs...
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                        <Mic2 className="w-6 h-6 text-pink-400" /> ElevenLabs Voice Tuner
                    </h2>
                    <p className="text-zinc-400 text-sm mt-1">
                        Fine-tune Pakistani voice clones for maximum human realism, emotional range, and SSML code-switching accuracy.
                    </p>
                </div>
                
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-pink-600 hover:bg-pink-500 text-white font-bold py-2 px-6 rounded transition-colors disabled:opacity-50 flex items-center gap-2 justify-center"
                >
                    <Save className="w-4 h-4" /> Save Configuration
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Voice Dynamics */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 shadow-lg shadow-pink-500/5 space-y-8">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                        <SlidersHorizontal className="w-5 h-5 text-pink-400" /> Voice Dynamics
                    </h3>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-bold text-zinc-300">Stability</label>
                            <span className="text-xs font-mono text-pink-400">{config.stability}%</span>
                        </div>
                        <input 
                            type="range" min="0" max="100" value={config.stability}
                            onChange={(e) => setConfig({...config, stability: Number(e.target.value)})}
                            className="w-full accent-pink-500 bg-zinc-800 h-2 rounded-lg appearance-none cursor-pointer"
                        />
                        <p className="text-xs text-zinc-500 mt-2">
                            Lower stability gives the Urdu clone more emotional range (e.g. sounding empathetic to angry callers). Higher stability is more monolithic/robotic.
                        </p>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-bold text-zinc-300">Similarity Boost</label>
                            <span className="text-xs font-mono text-pink-400">{config.similarityBoost}%</span>
                        </div>
                        <input 
                            type="range" min="0" max="100" value={config.similarityBoost}
                            onChange={(e) => setConfig({...config, similarityBoost: Number(e.target.value)})}
                            className="w-full accent-pink-500 bg-zinc-800 h-2 rounded-lg appearance-none cursor-pointer"
                        />
                        <p className="text-xs text-zinc-500 mt-2">
                            Forces the output to match the original Lahori native speaker accent tightly. Warning: Too high can cause audio artifacts.
                        </p>
                    </div>
                </div>

                {/* Grammar & SSML */}
                <div className="space-y-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 shadow-lg shadow-pink-500/5">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                            <AudioWaveform className="w-5 h-5 text-pink-400" /> Natural Language Injection
                        </h3>

                        <div className="space-y-6 text-sm">
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                                <div>
                                    <div className="font-bold text-zinc-200">Auto SSML Injection</div>
                                    <div className="text-xs text-zinc-500 mt-1">Automatically inject structural pauses (break tags) based on GPT-4o's punctuation.</div>
                                </div>
                                <button onClick={() => setConfig({...config, features: {...config.features, ssmlAutoInject: !config.features.ssmlAutoInject}})} 
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.features.ssmlAutoInject ? 'bg-pink-500' : 'bg-zinc-700'}`}>
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.features.ssmlAutoInject ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                                <div>
                                    <div className="font-bold text-zinc-200">Question Pitch Correction</div>
                                    <div className="text-xs text-zinc-500 mt-1">Raise vocal pitch at the end of sentences ending in "?" (Crucial for Urdu inflection).</div>
                                </div>
                                <button onClick={() => setConfig({...config, features: {...config.features, pitchCorrectionOnQuestion: !config.features.pitchCorrectionOnQuestion}})} 
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.features.pitchCorrectionOnQuestion ? 'bg-pink-500' : 'bg-zinc-700'}`}>
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.features.pitchCorrectionOnQuestion ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-bold text-zinc-200">Auto Laugh Insertion</div>
                                    <div className="text-xs text-zinc-500 mt-1">If sentiment is &gt; 85 (Happy), sporadically inject a light chuckle before speaking.</div>
                                </div>
                                <button onClick={() => setConfig({...config, features: {...config.features, laughInsertion: !config.features.laughInsertion}})} 
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.features.laughInsertion ? 'bg-pink-500' : 'bg-zinc-700'}`}>
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.features.laughInsertion ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-pink-950/20 border border-pink-900/30 rounded-lg p-5 flex items-start gap-3">
                        <Zap className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-pink-400 text-sm mb-1">
                                WebRTC Audio Buffering
                            </h4>
                            <p className="text-xs text-pink-200/60 leading-relaxed">
                                Because we are bridging Asterisk with LiveKit, ElevenLabs audio is streamed over WebSockets and buffered directly into the active PJSIP session. Tuning similarity too high can cause buffer underruns.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
