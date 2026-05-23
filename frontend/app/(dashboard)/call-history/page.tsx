"use client";

import React, { useState, useEffect } from "react";
import { 
    Search, 
    Download, 
    Eye, 
    PhoneCall, 
    Clock, 
    DollarSign, 
    Bot,
    Filter,
    ArrowUpDown,
    CheckCircle2,
    XCircle,
    Loader2
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface CallLog {
    id: string;
    agentName: string;
    callerNumber: string;
    recipientNumber: string;
    duration: number;
    totalCost: string;
    status: string;
    recordingUrl: string | null;
    startedAt: string;
    endedAt: string | null;
    model?: string;
    sipTrunk?: string;
}

export default function CallHistoryPage() {
    const [logs, setLogs] = useState<CallLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await fetch("/api/telephony/logs");
                const data = await res.json();
                if (data.logs) {
                    setLogs(data.logs);
                }
            } catch (err) {
                console.error("Failed to load call logs:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const filteredLogs = logs.filter(log => {
        const matchesSearch = 
            log.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.callerNumber.includes(searchTerm) ||
            log.recipientNumber.includes(searchTerm);
        
        const matchesStatus = statusFilter === "all" || log.status.toLowerCase() === statusFilter.toLowerCase();
        
        return matchesSearch && matchesStatus;
    });

    const handleViewDetails = (log: CallLog) => {
        setSelectedCall(log);
        setIsModalOpen(true);
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold text-white tracking-tight">Call History & Billing Ledger</h1>
                <p className="text-zinc-500 text-sm">
                    Granular audit ledger for all AI agent transmissions, egress recordings, and LLM token costs.
                </p>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-zinc-900/40 border border-zinc-800/60 p-4 rounded-xl backdrop-blur-sm">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                        <Input 
                            placeholder="Search phone numbers or Call IDs..." 
                            className="bg-zinc-950/50 border-zinc-800 pl-10 h-10 ring-offset-zinc-950"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "all")}>
                        <SelectTrigger className="w-full md:w-40 bg-zinc-950/50 border-zinc-800 h-10">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                            <SelectItem value="in progress">In Progress</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button variant="outline" className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 h-10 w-full md:w-auto">
                    <Download className="w-4 h-4 mr-2" /> Export CSV
                </Button>
            </div>

            {/* Data Grid */}
            <div className="w-full bg-zinc-900/40 border border-zinc-800/60 rounded-xl overflow-hidden backdrop-blur-sm">
                <Table>
                    <TableHeader className="bg-zinc-950/40">
                        <TableRow className="border-zinc-800 hover:bg-transparent">
                            <TableHead className="text-zinc-500 font-bold uppercase tracking-wider text-[10px] py-4">Timestamp</TableHead>
                            <TableHead className="text-zinc-500 font-bold uppercase tracking-wider text-[10px] py-4">Call ID</TableHead>
                            <TableHead className="text-zinc-500 font-bold uppercase tracking-wider text-[10px] py-4">Agent</TableHead>
                            <TableHead className="text-zinc-500 font-bold uppercase tracking-wider text-[10px] py-4">Target Number</TableHead>
                            <TableHead className="text-zinc-500 font-bold uppercase tracking-wider text-[10px] py-4">Duration</TableHead>
                            <TableHead className="text-zinc-500 font-bold uppercase tracking-wider text-[10px] py-4">Cost</TableHead>
                            <TableHead className="text-zinc-500 font-bold uppercase tracking-wider text-[10px] py-4">Status</TableHead>
                            <TableHead className="text-zinc-500 font-bold uppercase tracking-wider text-[10px] py-4 text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                        <p className="text-zinc-500 text-sm">Syncing ledger records...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredLogs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-64 text-center">
                                    <p className="text-zinc-600">No matching call logs found.</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredLogs.map((log) => (
                                <TableRow key={log.id} className="border-zinc-800/50 hover:bg-zinc-800/20 group transition-colors">
                                    <TableCell className="text-xs text-zinc-500 font-mono py-4">
                                        {new Date(log.startedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                    </TableCell>
                                    <TableCell className="font-mono text-blue-400/80 text-xs">{log.id.slice(0, 8)}</TableCell>
                                    <TableCell className="font-medium text-zinc-200">{log.agentName || "Unknown Agent"}</TableCell>
                                    <TableCell className="font-mono text-zinc-300 text-xs">{log.recipientNumber}</TableCell>
                                    <TableCell className="text-zinc-500 font-medium">{formatDuration(log.duration)}</TableCell>
                                    <TableCell className="text-red-400 font-mono font-medium">${parseFloat(log.totalCost).toFixed(3)}</TableCell>
                                    <TableCell>
                                        <Badge 
                                            className={cn(
                                                "capitalize font-bold text-[9px] px-2 py-0 border-transparent transition-all",
                                                log.status.toLowerCase() === 'completed' && "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20",
                                                log.status.toLowerCase() === 'in progress' && "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
                                                log.status.toLowerCase() === 'failed' && "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                                            )}
                                        >
                                            {log.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="text-zinc-500 hover:text-white hover:bg-zinc-800"
                                            onClick={() => handleViewDetails(log)}
                                        >
                                            <Eye className="w-4 h-4 mr-2" /> View Details
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Diagnostics Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-300 sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                            Call Diagnostics: <span className="font-mono text-blue-400">{selectedCall?.id.slice(0, 8)}</span>
                        </DialogTitle>
                        <DialogDescription className="text-zinc-500">
                            Full telemetry and synchronization state for the selected transmission.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedCall && (
                        <div className="space-y-6 py-4">
                            {/* Player */}
                            <div className="bg-black/40 border border-zinc-900 rounded-lg p-4">
                                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2 block">Audio Egress Recording</span>
                                {selectedCall.recordingUrl ? (
                                    <audio controls className="w-full mt-2 rounded-md">
                                        <source src={selectedCall.recordingUrl} type="audio/mpeg" />
                                        Your browser does not support the audio element.
                                    </audio>
                                ) : (
                                    <div className="h-10 flex items-center justify-center bg-zinc-900/50 rounded-md border border-dashed border-zinc-800">
                                        <p className="text-xs text-zinc-600 italic">No recording available for this session</p>
                                    </div>
                                )}
                            </div>

                            {/* Metadata Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-zinc-900/30 border border-zinc-800/50 p-3 rounded-lg">
                                    <span className="text-[9px] font-bold text-zinc-600 uppercase block mb-1">LLM Model Used</span>
                                    <span className="text-sm font-medium text-zinc-300">{selectedCall.model || "GPT-4o (Standard)"}</span>
                                </div>
                                <div className="bg-zinc-900/30 border border-zinc-800/50 p-3 rounded-lg">
                                    <span className="text-[9px] font-bold text-zinc-600 uppercase block mb-1">SIP Trunk Provider</span>
                                    <span className="text-sm font-medium text-zinc-300">{selectedCall.sipTrunk || "Twilio-US-East-Primary"}</span>
                                </div>
                                <div className="bg-zinc-900/30 border border-zinc-800/50 p-3 rounded-lg">
                                    <span className="text-[9px] font-bold text-zinc-600 uppercase block mb-1">Start Time</span>
                                    <span className="text-xs font-mono text-zinc-400">{new Date(selectedCall.startedAt).toLocaleString()}</span>
                                </div>
                                <div className="bg-zinc-900/30 border border-zinc-800/50 p-3 rounded-lg">
                                    <span className="text-[9px] font-bold text-zinc-600 uppercase block mb-1">End Time</span>
                                    <span className="text-xs font-mono text-zinc-400">
                                        {selectedCall.endedAt ? new Date(selectedCall.endedAt).toLocaleString() : "Active Session"}
                                    </span>
                                </div>
                            </div>

                            {/* Transcript Area */}
                            <div className="bg-black/60 border border-zinc-800 p-4 rounded-md font-mono text-sm space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest block mb-1">Deepgram Transcript Feed</span>
                                <div className="text-zinc-500 italic text-xs leading-relaxed">
                                    [SYSTEM] Transcript data will sync from Deepgram/LiveKit once the pipeline is finalized for live production. 
                                    Currently viewing synthetic simulation logs for this session.
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
