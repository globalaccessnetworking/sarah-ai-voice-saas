"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, Activity, Clock, Users, XCircle, Trash2, Eye, RefreshCw } from 'lucide-react';
import MetricCard from '@/components/MetricCard';

interface Room {
    sid: string;
    name: string;
    emptyTimeout: number;
    maxParticipants: number;
    creationTime: number;
    numParticipants: number;
    numPublishers: number;
    hasPublishedTracks: boolean;
    metadata: string;
    // Added for ghost UI
    isGhost?: boolean;
    ghostSince?: number;
}

export default function RoomsPage() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [ghostRooms, setGhostRooms] = useState<Room[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [latency, setLatency] = useState(0);

    const fetchRooms = useCallback(async () => {
        const start = Date.now();
        try {
            const res = await fetch('/api/rooms');
            if (res.ok) {
                const data: Room[] = await res.json();

                setRooms(prevActive => {
                    const newActiveMap = new Map(data.map(r => [r.name, r]));
                    const newGhostRooms = [...ghostRooms];

                    // Process previously active rooms that are now gone
                    prevActive.forEach(room => {
                        if (!newActiveMap.has(room.name) && !room.isGhost) {
                            // Room just died, make it a ghost
                            newGhostRooms.push({ ...room, isGhost: true, ghostSince: Date.now(), numParticipants: 0 });
                        }
                    });

                    // Update ghost rooms list
                    setGhostRooms(newGhostRooms);
                    return data;
                });
            }
        } catch (error) {
            console.error('Failed to fetch rooms', error);
        } finally {
            setLatency(Date.now() - start);
            setLoading(false);
        }
    }, [ghostRooms]);

    useEffect(() => {
        fetchRooms();
        const interval = setInterval(fetchRooms, 3000);
        return () => clearInterval(interval);
    }, [fetchRooms]);

    // Cleanup ghosts older than 30 seconds
    useEffect(() => {
        const cleanupInterval = setInterval(() => {
            const thirtySecondsAgo = Date.now() - 30000;
            setGhostRooms(prev => prev.filter(r => r.ghostSince && r.ghostSince > thirtySecondsAgo));
        }, 1000);
        return () => clearInterval(cleanupInterval);
    }, []);

    const handleCloseRoom = async (name: string) => {
        if (!confirm(`Are you sure you want to forcibly close room ${name}?`)) return;
        try {
            const res = await fetch(`/api/rooms/${name}/close`, { method: 'POST' });
            if (res.ok) {
                fetchRooms();
            } else {
                alert('Failed to close room');
            }
        } catch (error) {
            console.error('API Error', error);
        }
    };

    const allRooms = [...rooms, ...ghostRooms];
    const filteredRooms = allRooms.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="min-h-screen bg-black text-zinc-200">
            <div className="w-full h-full overflow-y-auto bg-zinc-950 p-8 md:p-10">
                <div className="max-w-[1600px] mx-auto flex flex-col gap-8">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                        <div>
                            <div className="flex items-center gap-3 mb-1.5">
                                <h1 className="text-2xl font-bold text-zinc-50 tracking-tight">Live Rooms</h1>
                                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest flex items-center gap-1.5">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    RTC Active
                                </span>
                            </div>
                            <p className="text-xs text-zinc-500 font-medium tracking-tight">
                                Real-time monitoring of all active WebRTC sessions and SIP bridges.
                            </p>
                        </div>

                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search room identity..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700 transition-all font-medium"
                            />
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                        <MetricCard
                            title="Active Calls"
                            value={rooms.length.toString()}
                            icon={<Activity className="w-4 h-4" />}
                            status="success"
                        />
                        <MetricCard
                            title="Total Participants"
                            value={rooms.reduce((acc, r) => acc + r.numParticipants, 0).toString()}
                            icon={<Users className="w-4 h-4" />}
                        />
                        <MetricCard
                            title="SDK Latency"
                            value={`${latency}ms`}
                            icon={<Clock className="w-4 h-4" />}
                            status={latency < 100 ? 'success' : 'warning'}
                            trend={{ value: "Live", direction: "up", label: "Polling 3s" }}
                        />
                        <MetricCard
                            title="Ghost Retention"
                            value={`${ghostRooms.length}`}
                            description="Recently ended (30s cache)"
                            icon={<XCircle className="w-4 h-4" />}
                        />
                    </div>

                    {/* Table */}
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-zinc-900/80 border-b border-zinc-800 text-xs uppercase font-bold text-zinc-500 tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Room Name</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Participants</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50">
                                    {loading && filteredRooms.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 font-medium">
                                                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-3 text-zinc-600" />
                                                Interrogating LiveKit Server...
                                            </td>
                                        </tr>
                                    )}
                                    {!loading && filteredRooms.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 font-medium">
                                                No active rooms or recent hang-ups matching '{searchQuery}'
                                            </td>
                                        </tr>
                                    )}
                                    {filteredRooms.map((room) => (
                                        <tr key={room.name} className={`hover:bg-zinc-800/30 transition-colors ${room.isGhost ? 'bg-red-500/5 hover:bg-red-500/10' : ''}`}>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className={`font-bold font-mono tracking-tight ${room.isGhost ? 'text-red-400' : 'text-zinc-200'}`}>
                                                        {room.name}
                                                    </span>
                                                    <span className="text-[10px] text-zinc-600 font-mono tracking-tighter mt-1">{room.sid}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {room.isGhost ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-red-500/10 text-red-500 border border-red-500/20">
                                                        Ended
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                        Active
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Users className={`w-4 h-4 ${room.isGhost ? 'text-red-500/40' : 'text-zinc-500'}`} />
                                                    <span className={`font-medium ${room.isGhost ? 'text-red-400/60' : 'text-zinc-300'}`}>
                                                        {room.numParticipants} <span className="text-zinc-600 text-xs">/ {room.maxParticipants === 0 ? '∞' : room.maxParticipants}</span>
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    {!room.isGhost && (
                                                        <>
                                                            <Link href={`/rooms/${room.name}`} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all" title="Command Center">
                                                                <Eye className="w-4 h-4" />
                                                            </Link>
                                                            <button onClick={() => handleCloseRoom(room.name)} className="p-2 text-rose-500/70 hover:text-white hover:bg-rose-500 rounded-lg transition-all" title="Force Close Room">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
