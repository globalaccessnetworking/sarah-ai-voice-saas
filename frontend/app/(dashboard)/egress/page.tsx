"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    Search, Filter, HardDrive, Cloud, Play, Download, CloudUpload, Trash2,
    X, CheckSquare, Square, FileAudio, FileVideo, Clock, Activity
} from 'lucide-react';
import MetricCard from '@/components/MetricCard';

interface Recording {
    id: string;
    filename: string;
    agentName: string | null;
    roomName: string;
    sizeBytes: number;
    durationSeconds: number;
    storageLocation: 'local' | 's3' | 'gcs';
    objectKey: string | null;
    createdAt: string;
}

function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatDuration(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function EgressPage() {
    const [recordings, setRecordings] = useState<Recording[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [agentFilter, setAgentFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Playback Modal
    const [playingRecording, setPlayingRecording] = useState<Recording | null>(null);

    const fetchRecordings = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);
            if (agentFilter) params.append('agent', agentFilter);
            if (dateFrom) params.append('date_from', new Date(dateFrom).toISOString());
            if (dateTo) params.append('date_to', new Date(dateTo).toISOString());

            const res = await fetch(`/api/recordings?${params.toString()}`);
            if (res.ok) {
                const data: Recording[] = await res.json();
                setRecordings(data);
                // Clear selections that no longer exist
                setSelectedIds(prev => {
                    const next = new Set<string>();
                    data.forEach(r => { if (prev.has(r.id)) next.add(r.id); });
                    return next;
                });
            }
        } catch (error) {
            console.error('Failed to fetch recordings', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, agentFilter, dateFrom, dateTo]);

    useEffect(() => {
        fetchRecordings();
    }, [fetchRecordings]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchRecordings();
    };

    const toggleSelectAll = (storageType: 'local' | 'cloud', currentItems: Recording[]) => {
        const allSelected = currentItems.every(r => selectedIds.has(r.id));
        const newSelected = new Set(selectedIds);

        if (allSelected) {
            currentItems.forEach(r => newSelected.delete(r.id));
        } else {
            currentItems.forEach(r => newSelected.add(r.id));
        }

        setSelectedIds(newSelected);
    };

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleDeleteSelected = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedIds.size} recordings? This cannot be undone.`)) return;

        try {
            const res = await fetch('/api/recordings', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: Array.from(selectedIds) })
            });

            if (res.ok) {
                setSelectedIds(new Set());
                fetchRecordings();
            } else {
                alert('Failed to delete recordings');
            }
        } catch (error) {
            console.error('Failed to delete recordings', error);
        }
    };

    const localRecordings = recordings.filter(r => r.storageLocation === 'local');
    const cloudRecordings = recordings.filter(r => r.storageLocation !== 'local');

    const totalLocalSize = localRecordings.reduce((acc, r) => acc + r.sizeBytes, 0);
    const totalCloudSize = cloudRecordings.reduce((acc, r) => acc + r.sizeBytes, 0);

    const renderTable = (items: Recording[], title: string, icon: React.ReactNode, type: 'local' | 'cloud') => {
        const isAllSelected = items.length > 0 && items.every(r => selectedIds.has(r.id));

        return (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm flex flex-col w-full mb-8">
                <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {icon}
                        <h3 className="font-bold text-zinc-100">{title}</h3>
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-xs font-bold font-mono">
                            {items.length} files
                        </span>
                    </div>
                    {selectedIds.size > 0 && items.some(r => selectedIds.has(r.id)) && (
                        <button
                            onClick={handleDeleteSelected}
                            className="text-xs font-bold flex items-center gap-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white px-3 py-1.5 rounded-lg border border-rose-500/20 transition-all"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete Selected ({Array.from(selectedIds).filter(id => items.find(i => i.id === id)).length})
                        </button>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-zinc-900/50 border-b border-zinc-800 text-xs uppercase font-bold text-zinc-500 tracking-wider">
                            <tr>
                                <th className="px-6 py-4 w-12">
                                    <button onClick={() => toggleSelectAll(type, items)} className="text-zinc-500 hover:text-zinc-300">
                                        {isAllSelected && items.length > 0 ? <CheckSquare className="w-4 h-4 text-emerald-500" /> : <Square className="w-4 h-4" />}
                                    </button>
                                </th>
                                <th className="px-6 py-4">Filename</th>
                                <th className="px-6 py-4">Agent</th>
                                <th className="px-6 py-4">Size</th>
                                <th className="px-6 py-4">Duration</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-zinc-500 font-medium">Loading recordings...</td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-zinc-500 font-medium">No {title.toLowerCase()} found.</td>
                                </tr>
                            ) : (
                                items.map((rec) => {
                                    const isSelected = selectedIds.has(rec.id);
                                    const isVideo = rec.filename.endsWith('.mp4') || rec.filename.endsWith('.webm');
                                    return (
                                        <tr key={rec.id} className={`hover:bg-zinc-800/30 transition-colors ${isSelected ? 'bg-zinc-800/50' : ''}`}>
                                            <td className="px-6 py-4">
                                                <button onClick={() => toggleSelect(rec.id)} className="text-zinc-500 hover:text-zinc-300">
                                                    {isSelected ? <CheckSquare className="w-4 h-4 text-emerald-500" /> : <Square className="w-4 h-4" />}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {isVideo ? <FileVideo className="w-4 h-4 text-zinc-500" /> : <FileAudio className="w-4 h-4 text-zinc-500" />}
                                                    <div className="flex flex-col">
                                                        <span className="font-mono text-xs font-bold bg-zinc-800 text-zinc-300 px-2 py-1 rounded-md border border-zinc-700 w-max max-w-[200px] truncate">
                                                            {rec.filename}
                                                        </span>
                                                        <span className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">{rec.roomName}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-zinc-300 font-medium">{rec.agentName || '-'}</td>
                                            <td className="px-6 py-4 font-mono text-zinc-400">{formatBytes(rec.sizeBytes)}</td>
                                            <td className="px-6 py-4 font-mono text-zinc-400">{formatDuration(rec.durationSeconds)}</td>
                                            <td className="px-6 py-4 text-zinc-400">{new Date(rec.createdAt).toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => setPlayingRecording(rec)} className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all" title="Play Stream">
                                                        <Play className="w-4 h-4" />
                                                    </button>
                                                    <button className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all" title="Download File">
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                    {type === 'local' && (
                                                        <button className="p-2 text-zinc-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all" title="Upload to Cloud">
                                                            <CloudUpload className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-black text-zinc-200 selection:bg-zinc-800">
            <div className="w-full h-full overflow-y-auto bg-zinc-950 p-8 md:p-10">
                <div className="max-w-[1600px] mx-auto flex flex-col gap-8">

                    {/* Header */}
                    <div>
                        <h1 className="text-2xl font-bold font-mono tracking-tight text-zinc-50 mb-1.5 flex items-center gap-3">
                            Recording & Egress
                            <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-full uppercase tracking-widest">
                                Storage Manager
                            </span>
                        </h1>
                        <p className="text-sm text-zinc-500 font-medium">
                            Manage local disk recordings and cloud archive synchronization.
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                        <MetricCard
                            title="Local Storage"
                            value={formatBytes(totalLocalSize)}
                            description={`${localRecordings.length} Indexed Files`}
                            icon={<HardDrive className="w-4 h-4" />}
                            status={totalLocalSize > 10 * 1024 * 1024 * 1024 ? 'warning' : 'success'}
                        />
                        <MetricCard
                            title="Cloud Archive"
                            value={formatBytes(totalCloudSize)}
                            description={`${cloudRecordings.length} Synced Objects`}
                            icon={<Cloud className="w-4 h-4" />}
                        />
                        <MetricCard
                            title="Total Egress Traffic"
                            value="-"
                            description="Last 30 days"
                            icon={<Activity className="w-4 h-4" />}
                        />
                        <MetricCard
                            title="Retention Policy"
                            value="Manual"
                            description="Auto-delete off"
                            icon={<Clock className="w-4 h-4" />}
                        />
                    </div>

                    {/* Filter Bar */}
                    <form onSubmit={handleSearch} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-wrap lg:flex-nowrap items-center gap-4">
                        <div className="flex-1 min-w-[200px] relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search filename or room..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700 transition-all font-medium"
                            />
                        </div>
                        <select
                            value={agentFilter}
                            onChange={(e) => setAgentFilter(e.target.value)}
                            className="bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-4 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                        >
                            <option value="">All Agents</option>
                            <option value="Global_Entry_IVR">Global_Entry_IVR</option>
                            <option value="Customer_Support">Customer_Support</option>
                        </select>
                        <input
                            type="datetime-local"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-4 text-sm text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-700 [color-scheme:dark]"
                        />
                        <input
                            type="datetime-local"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-4 text-sm text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-700 [color-scheme:dark]"
                        />
                        <button type="submit" className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
                            <Filter className="w-4 h-4" /> Filter
                        </button>
                    </form>

                    {/* Dual Tables */}
                    <div className="flex flex-col gap-8 w-full">
                        {renderTable(localRecordings, "Local Disk Recordings", <HardDrive className="w-5 h-5 text-emerald-500" />, 'local')}
                        {renderTable(cloudRecordings, "Cloud Storage Archive", <Cloud className="w-5 h-5 text-blue-500" />, 'cloud')}
                    </div>

                </div>
            </div>

            {/* Playback Modal */}
            {playingRecording && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-zinc-950 border border-zinc-800 w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col slide-in-from-bottom-4 animate-in duration-300">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900">
                            <div className="flex flex-col">
                                <h3 className="font-bold text-lg text-white font-mono tracking-tight">{playingRecording.filename}</h3>
                                <div className="flex items-center gap-3 mt-1 text-xs font-medium text-zinc-500">
                                    <span className="flex items-center gap-1"><HardDrive className="w-3.5 h-3.5" /> {playingRecording.storageLocation.toUpperCase()}</span>
                                    <span>•</span>
                                    <span>{formatBytes(playingRecording.sizeBytes)}</span>
                                    <span>•</span>
                                    <span>{new Date(playingRecording.createdAt).toLocaleString()}</span>
                                </div>
                            </div>
                            <button onClick={() => setPlayingRecording(null)} className="p-2 text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 bg-black aspect-video flex items-center justify-center relative">
                            {/* In a real scenario, this would be an actual video tag linked to a streaming route. We use a placeholder here as requested. */}
                            <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center text-zinc-500">
                                {(playingRecording.filename.endsWith('.mp4') || playingRecording.filename.endsWith('.webm')) ? (
                                    <FileVideo className="w-20 h-20 mb-4 opacity-20" />
                                ) : (
                                    <FileAudio className="w-20 h-20 mb-4 opacity-20" />
                                )}
                                <p className="font-mono text-sm tracking-widest uppercase">Stream Proxy Unavailable</p>
                                <p className="text-xs mt-2 max-w-md text-center">
                                    The physical media proxy is currently offline. In production, this modal implements an HTML5 media player parsing byte-ranges from endpoint <code>/api/recordings/{playingRecording.id}/stream</code>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
