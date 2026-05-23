"use client";

import React, { useState, useEffect, useRef } from 'react';
import { PlayCircle, PauseCircle, FastForward, Rewind, FileText, CheckCircle2, ShieldCheck, Star, Activity, Mic, Bot } from 'lucide-react';
import { toast } from 'sonner';

export default function QAAuditPlayer() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Audio Sync State
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/qa-audit/sync');
            const result = await res.json();
            setData(result);
            setIsLoading(false);
        } catch (err) {
            console.error("Failed to load audit data");
        }
    };

    useEffect(() => {
        fetchData();
        // Since we don't have a real audio file in this mock, we will simulate playback time
        let interval: any;
        if (isPlaying) {
            interval = setInterval(() => {
                setCurrentTime(prev => {
                    if (prev >= 17) {
                        setIsPlaying(false);
                        return 0; // stop after 17 seconds
                    }
                    return prev + 0.1;
                });
            }, 100);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (time: number) => {
        setCurrentTime(time);
    };

    if (isLoading || !data) {
        return (
            <div className="flex justify-center items-center h-64 text-zinc-500 gap-2">
                <Activity className="w-5 h-5 animate-pulse" /> Loading Word-Level Timestamps...
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                        <ShieldCheck className="w-6 h-6 text-purple-400" /> AI QA & Audit Trail
                    </h2>
                    <p className="text-zinc-400 text-sm mt-1">
                        Review past calls with word-level phonetic syncing and view Claude's automatic behavioral grading.
                    </p>
                </div>
                
                <div className="flex items-center gap-4 text-sm font-bold bg-zinc-900 border border-zinc-800 p-2 rounded-lg px-4 shadow-lg">
                    <span className="text-zinc-500">CALL ID:</span>
                    <span className="text-zinc-300 font-mono">{data.id}</span>
                    <div className="w-px h-4 bg-zinc-700 mx-2"></div>
                    <span className="text-zinc-500">DURATION:</span>
                    <span className="text-zinc-300 font-mono">00:45</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left/Main Column: Audio Player & Sync Transcript */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Media Player Control */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 shadow-lg">
                        <div className="flex items-center gap-6">
                            <button 
                                onClick={togglePlay}
                                className="w-16 h-16 rounded-full bg-purple-500 hover:bg-purple-400 flex justify-center items-center text-white transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                            >
                                {isPlaying ? <PauseCircle className="w-10 h-10" /> : <PlayCircle className="w-10 h-10" />}
                            </button>
                            
                            <div className="flex-1">
                                <div className="flex justify-between text-xs font-mono font-bold text-zinc-400 mb-2">
                                    <span className="text-purple-400">00:{(currentTime).toFixed(1).padStart(4, '0')}</span>
                                    <span>00:17.0</span>
                                </div>
                                <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden border border-zinc-800 relative cursor-pointer" onClick={(e) => {
                                    const bounds = e.currentTarget.getBoundingClientRect();
                                    const percent = (e.clientX - bounds.left) / bounds.width;
                                    handleSeek(percent * 17);
                                }}>
                                    <div 
                                        className="h-full bg-purple-500 rounded-full transition-all duration-75 relative"
                                        style={{ width: `${(currentTime / 17) * 100}%` }}
                                    >
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow translate-x-1/2"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Karaoke Transcript View */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 shadow-lg min-h-[400px]">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6 border-b border-zinc-800 pb-4">
                            <FileText className="w-5 h-5 text-purple-400" /> Live Phonetic Sync Transcript
                        </h3>

                        <div className="space-y-8 font-mono">
                            {data.transcript.map((line: any, index: number) => {
                                const isLineActive = currentTime >= line.startTime && currentTime <= line.endTime + 1;
                                
                                return (
                                    <div key={index} className={`flex gap-4 p-4 rounded-lg transition-colors ${isLineActive ? 'bg-zinc-800 border border-zinc-700' : 'opacity-70'}`}>
                                        <div className="w-10 h-10 rounded bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
                                            {line.speaker === 'user' ? <Mic className="w-5 h-5 text-blue-400" /> : <Bot className="w-5 h-5 text-green-400" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-[10px] uppercase font-bold ${line.speaker === 'user' ? 'text-blue-400' : 'text-green-400'}`}>
                                                    {line.speaker === 'user' ? 'Caller' : 'AI Agent'}
                                                </span>
                                                <span className="text-[10px] text-zinc-600">
                                                    00:{(line.startTime).toFixed(1).padStart(4, '0')} - 00:{(line.endTime).toFixed(1).padStart(4, '0')}
                                                </span>
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-x-1.5 gap-y-2 text-lg">
                                                {line.words.map((word: any, wIndex: number) => {
                                                    const isWordSpoken = currentTime >= word.start;
                                                    const isWordActive = currentTime >= word.start && currentTime <= word.end;
                                                    
                                                    return (
                                                        <span 
                                                            key={wIndex}
                                                            onClick={() => handleSeek(word.start)}
                                                            className={`cursor-pointer px-1 rounded transition-colors ${
                                                                isWordActive ? 'bg-purple-500/20 text-purple-300 font-bold border-b-2 border-purple-500' : 
                                                                isWordSpoken ? 'text-zinc-200' : 'text-zinc-600'
                                                            }`}
                                                        >
                                                            {word.text}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Column: Claude QA Analyzer */}
                <div className="space-y-6">
                    <div className="bg-zinc-900 border stroke-zinc-800 border-zinc-800 rounded-lg p-6 shadow-lg flex flex-col items-center">
                        <div className="w-full flex justify-between items-center mb-6">
                            <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-orange-400" /> Claude 3.5 Score
                            </span>
                            <div className="flex items-center text-yellow-500">
                                {[1,2,3,4,5].map((i) => (
                                    <Star key={i} className={`w-4 h-4 ${i <= 4 ? "fill-current" : "opacity-30"}`} />
                                ))}
                            </div>
                        </div>

                        {/* Big Ring Score */}
                        <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                            <svg className="absolute w-full h-full transform -rotate-90">
                                <circle cx="80" cy="80" r="70" className="stroke-zinc-800" strokeWidth="12" fill="none" />
                                <circle 
                                    cx="80" cy="80" r="70" 
                                    className="stroke-orange-500" 
                                    strokeWidth="12" 
                                    fill="none" 
                                    strokeDasharray="440" 
                                    strokeDashoffset={440 - (440 * (data.claudeGrade.score / 10))}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="text-center">
                                <span className="text-5xl font-black text-white">{data.claudeGrade.score}</span>
                                <span className="text-xl font-bold text-zinc-500">/10</span>
                            </div>
                        </div>

                        {/* Breakdown Metrics */}
                        <div className="w-full space-y-4 border-t border-zinc-800 pt-6">
                            <div>
                                <div className="flex justify-between text-xs font-bold text-zinc-400 mb-1">
                                    <span>Dialect Understanding</span>
                                    <span className="text-white">{data.claudeGrade.breakdown.understanding}/10</span>
                                </div>
                                <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${(data.claudeGrade.breakdown.understanding / 10) * 100}%` }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs font-bold text-zinc-400 mb-1">
                                    <span>Latency & Cadence</span>
                                    <span className="text-white">{data.claudeGrade.breakdown.latency}/10</span>
                                </div>
                                <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden">
                                    <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${(data.claudeGrade.breakdown.latency / 10) * 100}%` }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs font-bold text-zinc-400 mb-1">
                                    <span>Empathy & Tone</span>
                                    <span className="text-white">{data.claudeGrade.breakdown.politeness}/10</span>
                                </div>
                                <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden">
                                    <div className="h-full bg-pink-400 rounded-full" style={{ width: `${(data.claudeGrade.breakdown.politeness / 10) * 100}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-orange-950/20 border border-orange-900/40 rounded-lg p-5">
                        <h4 className="font-bold text-orange-400 text-sm mb-2 uppercase tracking-wide">AI Auditor Feedback</h4>
                        <p className="text-sm text-orange-200/80 leading-relaxed italic border-l-2 border-orange-500/50 pl-3">
                            "{data.claudeGrade.feedback}"
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
