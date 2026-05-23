"use client";

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Users, Trash2, UserMinus, ShieldAlert, MonitorPlay, ActivitySquare, AlertTriangle, RadioTower, Mic, MicOff, Pause, Play, Volume2 } from 'lucide-react';
import { LiveKitRoom, RoomAudioRenderer, useLocalParticipant, useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';
import "@livekit/components-styles";
import MetricCard from '@/components/MetricCard';

interface Participant {
    sid: string;
    identity: string;
    name: string;
    state: number;
    joinedAt: number;
    isPublisher: boolean;
}

interface RoomDetails {
    roomName: string;
    participants: Participant[];
}

export default function RoomCommandCenterPage({ params }: { params: Promise<{ name: string }> }) {
    const resolvedParams = use(params);
    const roomName = resolvedParams.name;
    const router = useRouter();

    const [details, setDetails] = useState<RoomDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [token, setToken] = useState<string>('');
    const [showMonitor, setShowMonitor] = useState(false);

    const fetchToken = useCallback(async () => {
        try {
            const res = await fetch(`/api/rooms/${roomName}/token`);
            if (res.ok) {
                const data = await res.json();
                setToken(data.token);
            }
        } catch (err) {
            console.error('Failed to fetch token', err);
        }
    }, [roomName]);

    const fetchDetails = useCallback(async () => {
        try {
            const res = await fetch(`/api/rooms/${roomName}`);
            if (res.ok) {
                const data = await res.json();
                setDetails(data);
                setError('');
            } else if (res.status === 404) {
                setError('Room has been closed or does not exist.');
            }
        } catch (err) {
            console.error('Failed to fetch room details', err);
        } finally {
            setLoading(false);
        }
    }, [roomName]);

    useEffect(() => {
        fetchDetails();
        fetchToken();
        const interval = setInterval(fetchDetails, 3000);
        return () => clearInterval(interval);
    }, [fetchDetails, fetchToken]);

    const handleCloseRoom = async () => {
        if (!confirm(`CRITICAL ACTION: Are you sure you want to forcibly close room ${roomName}? All connections will drop instantly.`)) return;
        try {
            const res = await fetch(`/api/rooms/${roomName}/close`, { method: 'POST' });
            if (res.ok) {
                router.push('/rooms');
            } else {
                alert('Failed to close room');
            }
        } catch (err) {
            console.error('API Error', err);
        }
    };

    const handleKickParticipant = async (identity: string) => {
        if (!confirm(`Are you sure you want to kick ${identity}?`)) return;
        try {
            const res = await fetch(`/api/rooms/${roomName}/kick`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identity })
            });
            if (res.ok) {
                fetchDetails(); // instant refresh
            } else {
                alert('Failed to kick participant');
            }
        } catch (err) {
            console.error('API Error', err);
        }
    };

    if (loading && !details) {
        return <div className="min-h-screen bg-zinc-950 text-zinc-200 p-10 flex items-center justify-center">Loading Command Center...</div>;
    }

    return (
        <div className="min-h-screen bg-black text-zinc-200 selection:bg-zinc-800">
            <div className="w-full h-full overflow-y-auto bg-zinc-950 p-8 md:p-10">
                <div className="max-w-[1600px] mx-auto flex flex-col gap-8">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                        <div className="flex items-center gap-6">
                            <Link href="/rooms" className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all">
                                <ArrowLeft className="w-4 h-4" />
                            </Link>
                            <div>
                                <div className="flex items-center gap-3 mb-1.5">
                                    <h1 className="text-2xl font-bold font-mono tracking-tight text-zinc-50">{roomName}</h1>
                                    <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 uppercase tracking-widest flex items-center gap-1.5">
                                        <ShieldAlert className="w-3 h-3" /> God Mode
                                    </span>
                                </div>
                                <p className="text-xs text-zinc-500 font-medium tracking-tight">
                                    Live Command & Control Interface.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setShowMonitor(!showMonitor)}
                                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${showMonitor
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                                    }`}
                            >
                                <MonitorPlay className="w-4 h-4" /> {showMonitor ? 'Active Monitoring' : 'Spectate'}
                            </button>
                            <button onClick={handleCloseRoom} className="flex items-center gap-2.5 bg-rose-500/10 border border-rose-500/30 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm shadow-rose-900/20">
                                <Trash2 className="w-4 h-4" /> Nuke Room
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
                            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
                            <h3 className="text-red-400 font-bold text-lg mb-1">{error}</h3>
                            <p className="text-red-400/70 text-sm mb-4">The active call ended or the system reclaimed the room.</p>
                            <Link href="/rooms" className="inline-flex items-center px-4 py-2 bg-red-500 text-white font-bold text-xs rounded-lg uppercase tracking-wider">
                                Return to Rooms
                            </Link>
                        </div>
                    )}

                    {!error && details && (
                        <>
                            {showMonitor && token && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <div className="lg:col-span-2">
                                        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl h-[400px] flex flex-col items-center justify-center relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-emerald-500/[0.02] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none"></div>
                                            <ActivitySquare className="w-16 h-16 text-zinc-800 mb-6 group-hover:text-emerald-500/40 transition-all duration-700" />
                                            <h4 className="text-xl font-bold text-zinc-400 tracking-tight">Active Room Monitor</h4>
                                            <p className="text-sm text-zinc-600 font-mono mt-3 uppercase tracking-widest bg-zinc-950/50 px-4 py-1.5 rounded-full border border-zinc-800">Telemetry Secured</p>

                                            <div className="absolute bottom-8 left-0 right-0 px-8 flex justify-between items-end">
                                                <div className="flex gap-2.5">
                                                    {[40, 70, 30, 90, 50, 80, 45].map((h, i) => (
                                                        <div key={i} className="w-2.5 bg-emerald-500/10 rounded-full overflow-hidden flex items-end h-16">
                                                            <div className="w-full bg-emerald-400/60 animate-pulse" style={{ height: `${h}%`, animationDelay: `${i * 150}ms` }}></div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Room Signal</p>
                                                    <p className="text-xs font-mono text-emerald-500/80">LATENCY: 18MS</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <LiveKitRoom
                                        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || 'ws://localhost:7880'}
                                        token={token}
                                        connect={true}
                                    >
                                        <LiveControlPanel roomName={roomName} />
                                    </LiveKitRoom>
                                </div>
                            )}

                            {/* Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                                <MetricCard
                                    title="Active Subscriptions"
                                    value={details.participants.length}
                                    icon={<Users className="w-4 h-4" />}
                                    status="success"
                                />
                                <MetricCard
                                    title="Capacity Limit"
                                    value="∞"
                                    description="No bounded limit"
                                    icon={<ActivitySquare className="w-4 h-4" />}
                                />
                                <MetricCard
                                    title="Empty Timeout"
                                    value="300s"
                                    description="Reclaims unused rooms"
                                    icon={<Clock className="w-4 h-4" />}
                                />
                                <MetricCard
                                    title="Node Bridge"
                                    value="Local"
                                    status="success"
                                    icon={<RadioTower className="w-4 h-4" />}
                                />
                            </div>

                            {/* Participants List */}
                            <div>
                                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4 ml-2">Active Participants</h3>
                                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-zinc-900/80 border-b border-zinc-800 text-xs uppercase font-bold text-zinc-500 tracking-wider">
                                                <tr>
                                                    <th className="px-6 py-4">Identity</th>
                                                    <th className="px-6 py-4">State</th>
                                                    <th className="px-6 py-4">Roles</th>
                                                    <th className="px-6 py-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-800/50">
                                                {details.participants.length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 font-medium">
                                                            No participants currently inside this room.
                                                        </td>
                                                    </tr>
                                                )}
                                                {details.participants.map((p) => (
                                                    <tr key={p.identity} className="hover:bg-zinc-800/30 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-zinc-200">{p.identity}</span>
                                                                <span className="text-[10px] text-zinc-600 font-mono tracking-tighter mt-1">{p.sid}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                                Active State {p.state}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                {p.isPublisher ? (
                                                                    <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase tracking-widest">Publisher</span>
                                                                ) : (
                                                                    <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] font-bold uppercase tracking-widest">Subscriber</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button onClick={() => handleKickParticipant(p.identity)} className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-rose-500 bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 rounded-lg transition-all" title="Eject Participant">
                                                                <UserMinus className="w-3.5 h-3.5" /> Eject
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* RTC Connection Mockup */}
                            <div>
                                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4 ml-2 mt-8">RTC Connection telemetry</h3>
                                <div className="h-64 rounded-2xl border border-zinc-800 bg-zinc-900/30 flex flex-col justify-center items-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>
                                    <ActivitySquare className="w-12 h-12 text-zinc-700 mb-4 group-hover:text-emerald-500/50 transition-colors" />
                                    <h4 className="text-lg font-bold text-zinc-500 tracking-tight">Telemetry Stream Active</h4>
                                    <p className="text-xs text-zinc-600 font-mono mt-2">JITTER: 12ms | PKT LOSS: 0.01% | RTT: 42ms</p>
                                    <div className="absolute bottom-4 left-4 flex gap-2">
                                        <div className="w-2 h-12 bg-emerald-500/20 rounded-full overflow-hidden flex items-end"><div className="w-full bg-emerald-500" style={{ height: '60%' }}></div></div>
                                        <div className="w-2 h-12 bg-emerald-500/20 rounded-full overflow-hidden flex items-end"><div className="w-full bg-emerald-500" style={{ height: '80%' }}></div></div>
                                        <div className="w-2 h-12 bg-emerald-500/20 rounded-full overflow-hidden flex items-end"><div className="w-full bg-emerald-500" style={{ height: '40%' }}></div></div>
                                        <div className="w-2 h-12 bg-emerald-500/20 rounded-full overflow-hidden flex items-end"><div className="w-full bg-emerald-500" style={{ height: '90%' }}></div></div>
                                        <div className="w-2 h-12 bg-emerald-500/20 rounded-full overflow-hidden flex items-end"><div className="w-full bg-emerald-500" style={{ height: '70%' }}></div></div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function LiveControlPanel({ roomName }: { roomName: string }) {
    const { localParticipant } = useLocalParticipant();
    const [isMuted, setIsMuted] = useState(true);
    const [aiPaused, setAiPaused] = useState(false);

    const toggleBargeIn = async () => {
        const enabled = isMuted; // if muted, we want to enable (not muted)
        await localParticipant.setMicrophoneEnabled(enabled);
        setIsMuted(!enabled);
    };

    const toggleAi = async () => {
        const newState = !aiPaused;
        const command = JSON.stringify({ action: newState ? "pause_ai" : "resume_ai" });
        await localParticipant.publishData(new TextEncoder().encode(command), { reliable: true });
        setAiPaused(newState);
    };

    return (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-6 shadow-xl relative overflow-hidden h-fit">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-2">
                        <RadioTower className="w-4 h-4 text-emerald-500" /> Admin Live Console
                    </h3>
                    <p className="text-[10px] text-zinc-500 mt-1 font-mono uppercase">Discrete Monitoring Active</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${aiPaused ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                        {aiPaused ? 'AI Suspended' : 'AI Routing Active'}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={toggleBargeIn}
                    className={`flex flex-col items-center justify-center gap-3 p-6 rounded-xl border transition-all ${!isMuted
                            ? 'bg-rose-500/10 border-rose-500/50 text-rose-500 shadow-lg shadow-rose-900/20'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-800/50'
                        }`}
                >
                    {!isMuted ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                    <div className="text-center">
                        <span className="text-xs font-bold uppercase tracking-widest block">Barge In</span>
                        <span className="text-[9px] opacity-60 uppercase mt-0.5 block">{!isMuted ? 'Live' : 'Muted'}</span>
                    </div>
                </button>

                <button
                    onClick={toggleAi}
                    className={`flex flex-col items-center justify-center gap-3 p-6 rounded-xl border transition-all ${aiPaused
                            ? 'bg-amber-500/10 border-amber-500/50 text-amber-500 shadow-lg shadow-amber-900/20'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-800/50'
                        }`}
                >
                    {aiPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
                    <div className="text-center">
                        <span className="text-xs font-bold uppercase tracking-widest block">{aiPaused ? 'Resume AI' : 'Pause AI'}</span>
                        <span className="text-[9px] opacity-60 uppercase mt-0.5 block">{aiPaused ? 'Halted' : 'Auto'}</span>
                    </div>
                </button>
            </div>

            <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                    <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Audio Relay Status</span>
                </div>
                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-2/3 animate-pulse"></div>
                </div>
            </div>

            <RoomAudioRenderer />
        </div>
    );
}
