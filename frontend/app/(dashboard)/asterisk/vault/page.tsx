"use client";
import React, { useState } from "react";
import {
    HardDrive, Upload, Download, Cloud, CheckCircle2, Clock,
    Play, Pause, Trash2, Search, Filter, Settings, RefreshCw,
    Database, Wifi, AlertCircle, BarChart3, Archive
} from "lucide-react";

interface Recording {
    id: string;
    filename: string;
    channel: string;
    callerNum: string;
    duration: number;
    sizeBytes: number;
    localPath: string;
    storageState: "Local" | "Uploading" | "S3" | "CDN";
    uploadProgress?: number;
    createdAt: string;
    agentName: string;
}

const DEMO_RECORDINGS: Recording[] = [
    { id: "r1", filename: "2026-03-11_06-01-23_dental.wav", channel: "PJSIP/vonex-0001", callerNum: "+61412345678", duration: 180, sizeBytes: 2800000, localPath: "/var/spool/asterisk/monitor/", storageState: "CDN", createdAt: "06:01:23", agentName: "Sarah (Dental)" },
    { id: "r2", filename: "2026-03-11_05-58-10_sales.wav", channel: "PJSIP/mynetfone-0002", callerNum: "+61298765432", duration: 245, sizeBytes: 3920000, localPath: "/var/spool/asterisk/monitor/", storageState: "S3", createdAt: "05:58:10", agentName: "Alex (Sales)" },
    { id: "r3", filename: "2026-03-11_05-45-02_support.wav", channel: "PJSIP/symbio-0003", callerNum: "+61387654321", duration: 92, sizeBytes: 1472000, localPath: "/var/spool/asterisk/monitor/", storageState: "Uploading", uploadProgress: 64, createdAt: "05:45:02", agentName: "Support AI" },
    { id: "r4", filename: "2026-03-11_05-30-41_unknown.wav", channel: "PJSIP/vonex-0004", callerNum: "+61411222333", duration: 54, sizeBytes: 864000, localPath: "/var/spool/asterisk/monitor/", storageState: "Local", createdAt: "05:30:41", agentName: "Night AI" },
    { id: "r5", filename: "2026-03-11_04-55-18_dental.wav", channel: "PJSIP/vonex-0005", callerNum: "+61422111000", duration: 310, sizeBytes: 4960000, localPath: "/var/spool/asterisk/monitor/", storageState: "CDN", createdAt: "04:55:18", agentName: "Sarah (Dental)" },
];

const STORAGE_CONFIG = {
    localPath: "/var/spool/asterisk/monitor/",
    s3Bucket: "voiceai-recordings-prod",
    s3Region: "ap-southeast-2",
    offloadAfterDays: 3,
    cdnDomain: "recordings.yourdomain.com",
    totalLocalGB: 47.2,
    maxLocalGB: 100,
    totalS3GB: 234.8,
};

function formatBytes(bytes: number): string {
    if (bytes > 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
    if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
    return `${(bytes / 1e3).toFixed(0)} KB`;
}

function formatDuration(s: number): string {
    const m = Math.floor(s / 60);
    return `${m}m ${s % 60}s`;
}

const STORAGE_BADGE = {
    Local: { color: "text-zinc-400 bg-zinc-800", dot: "bg-zinc-500" },
    Uploading: { color: "text-yellow-400 bg-yellow-500/10", dot: "bg-yellow-400" },
    S3: { color: "text-blue-400 bg-blue-500/10", dot: "bg-blue-400" },
    CDN: { color: "text-emerald-400 bg-emerald-500/10", dot: "bg-emerald-400" },
};

export default function VaultPage() {
    const [recordings, setRecordings] = useState(DEMO_RECORDINGS);
    const [playing, setPlaying] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [offloadAll, setOffloadAll] = useState(false);

    const filtered = recordings.filter(r =>
        r.filename.includes(search) || r.callerNum.includes(search) || r.agentName.toLowerCase().includes(search.toLowerCase())
    );

    const handleOffload = async (id: string) => {
        setRecordings(prev => prev.map(r => r.id === id ? { ...r, storageState: "Uploading", uploadProgress: 0 } : r));
        let progress = 0;
        const interval = setInterval(() => {
            progress += 15;
            if (progress >= 100) {
                clearInterval(interval);
                setRecordings(prev => prev.map(r => r.id === id ? { ...r, storageState: "S3", uploadProgress: undefined } : r));
            } else {
                setRecordings(prev => prev.map(r => r.id === id ? { ...r, uploadProgress: progress } : r));
            }
        }, 300);
    };

    const totalLocal = DEMO_RECORDINGS.filter(r => r.storageState === "Local" || r.storageState === "Uploading").reduce((s, r) => s + r.sizeBytes, 0);

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200 p-8 md:p-10">
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* Header */}
                <div className="bg-gradient-to-r from-slate-950/60 to-zinc-950/80 border border-slate-800/60 rounded-2xl p-6 flex items-center gap-5">
                    <div className="w-14 h-14 bg-slate-500/10 border border-slate-500/20 rounded-2xl flex items-center justify-center">
                        <Archive className="w-7 h-7 text-slate-400" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-white mb-1">On-Premise Recording Vault</h1>
                        <p className="text-xs text-zinc-400">Asterisk records raw RTP audio to local disk. Auto-offload to AWS S3 after {STORAGE_CONFIG.offloadAfterDays} days. CDN delivery via CloudFront for instant playback.</p>
                    </div>
                    <div className="flex gap-6">
                        <div className="text-right">
                            <div className="text-xl font-bold text-white">{STORAGE_CONFIG.totalLocalGB} GB</div>
                            <div className="text-[10px] text-zinc-500">Local Disk</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xl font-bold text-blue-400">{STORAGE_CONFIG.totalS3GB} GB</div>
                            <div className="text-[10px] text-zinc-500">AWS S3</div>
                        </div>
                        <button onClick={() => setOffloadAll(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-colors">
                            <Cloud className="w-4 h-4" /> Offload All
                        </button>
                    </div>
                </div>

                {/* Storage bars */}
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                        <div className="flex justify-between mb-2">
                            <span className="text-xs font-bold text-zinc-400">Local Disk</span>
                            <span className="text-xs font-mono text-zinc-400">{STORAGE_CONFIG.totalLocalGB} / {STORAGE_CONFIG.maxLocalGB} GB</span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-3">
                            <div className="h-3 rounded-full bg-gradient-to-r from-slate-500 to-slate-400" style={{ width: `${(STORAGE_CONFIG.totalLocalGB / STORAGE_CONFIG.maxLocalGB) * 100}%` }} />
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-2">Auto-offload to S3 after {STORAGE_CONFIG.offloadAfterDays} days · Path: {STORAGE_CONFIG.localPath}</div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                        <div className="flex justify-between mb-2">
                            <span className="text-xs font-bold text-zinc-400">AWS S3 ({STORAGE_CONFIG.s3Region})</span>
                            <span className="text-xs font-mono text-zinc-400">s3://{STORAGE_CONFIG.s3Bucket}</span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-3">
                            <div className="h-3 rounded-full bg-gradient-to-r from-blue-600 to-blue-400" style={{ width: "23%" }} />
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-2">{STORAGE_CONFIG.totalS3GB} GB used · CDN: {STORAGE_CONFIG.cdnDomain}</div>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input type="text" placeholder="Search recordings..." value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-slate-500" />
                </div>

                {/* Recordings table */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-12 px-5 py-3 border-b border-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        <div className="col-span-4">Filename</div>
                        <div className="col-span-2">Caller</div>
                        <div className="col-span-1">Duration</div>
                        <div className="col-span-1">Size</div>
                        <div className="col-span-2">Storage</div>
                        <div className="col-span-2">Actions</div>
                    </div>
                    <div className="divide-y divide-zinc-800/50">
                        {filtered.map(rec => {
                            const badge = STORAGE_BADGE[rec.storageState];
                            return (
                                <div key={rec.id} className="grid grid-cols-12 items-center px-5 py-4 hover:bg-zinc-800/30 transition-colors">
                                    <div className="col-span-4">
                                        <div className="text-xs font-mono text-zinc-200 truncate">{rec.filename}</div>
                                        <div className="text-[10px] text-zinc-500">{rec.agentName}</div>
                                    </div>
                                    <div className="col-span-2 text-xs font-mono text-zinc-400">{rec.callerNum}</div>
                                    <div className="col-span-1 text-xs text-zinc-400">{formatDuration(rec.duration)}</div>
                                    <div className="col-span-1 text-xs text-zinc-500">{formatBytes(rec.sizeBytes)}</div>
                                    <div className="col-span-2">
                                        {rec.storageState === "Uploading" ? (
                                            <div className="space-y-1">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${badge.color}`}>Uploading {rec.uploadProgress}%</span>
                                                <div className="w-full bg-zinc-800 rounded h-1"><div className="h-1 bg-blue-500 rounded transition-all" style={{ width: `${rec.uploadProgress}%` }} /></div>
                                            </div>
                                        ) : (
                                            <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded w-fit ${badge.color}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} /> {rec.storageState}
                                            </span>
                                        )}
                                    </div>
                                    <div className="col-span-2 flex gap-2">
                                        <button onClick={() => setPlaying(p => p === rec.id ? null : rec.id)} className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors">
                                            {playing === rec.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                        </button>
                                        {rec.storageState === "Local" && (
                                            <button onClick={() => handleOffload(rec.id)} className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg text-blue-400 transition-colors" title="Offload to S3">
                                                <Upload className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        {(rec.storageState === "S3" || rec.storageState === "CDN") && (
                                            <button className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg text-emerald-400 transition-colors" title="Download">
                                                <Download className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        <button className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
