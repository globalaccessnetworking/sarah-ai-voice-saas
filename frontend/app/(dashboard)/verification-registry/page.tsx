"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Search, Phone, Calendar, Filter, RefreshCw, Loader2, 
    CheckCircle2, Clock, XCircle, ArrowUpDown, ExternalLink,
    ShieldCheck, AlertCircle, History, PhoneCall, BarChart2
} from "lucide-react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import Link from "next/link";

// --- Types ---
interface VerificationLog {
    id: string;
    timestamp: string;
    ticketId: string;
    phone: string;
    duration: number;
    status: string;
    outcome: 'verified' | 'still_issue' | 'no_feedback';
}

// --- Helper Components ---
function OutcomeBadge({ outcome }: { outcome: string }) {
    switch (outcome) {
        case 'verified':
            return (
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-bold gap-1.5 px-2.5 py-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified (Press 1)
                </Badge>
            );
        case 'still_issue':
            return (
                <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[10px] font-bold gap-1.5 px-2.5 py-1 animate-pulse">
                    <AlertCircle className="w-3 h-3" />
                    Re-Opened (Press 2)
                </Badge>
            );
        case 'no_feedback':
        default:
            return (
                <Badge className="bg-zinc-800/40 text-zinc-500 border-zinc-700 text-[10px] font-bold gap-1.5 px-2.5 py-1">
                    <Clock className="w-3 h-3" />
                    No Response
                </Badge>
            );
    }
}

function formatDate(dateStr: string) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("en-PK", {
        day: "2-digit", 
        month: "short", 
        hour: "2-digit", 
        minute: "2-digit", 
        hour12: true,
    });
}

export default function VerificationRegistryPage() {
    const [logs, setLogs] = useState<VerificationLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [failedOnly, setFailedOnly] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (failedOnly) params.set('failedOnly', 'true');
            
            const res = await fetch(`/api/verification-registry?${params}`);
            const data = await res.json();
            if (data.logs) {
                setLogs(data.logs);
            }
        } catch (err) {
            console.error("Failed to load verification logs:", err);
        } finally {
            setIsLoading(false);
        }
    }, [failedOnly]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // Client-side search filtering
    const filteredLogs = logs.filter(log => 
        log.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) || 
        log.phone.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
    });

    const stats = {
        total: logs.length,
        verified: logs.filter(l => l.outcome === 'verified').length,
        failed: logs.filter(l => l.outcome === 'still_issue').length,
        noResponse: logs.filter(l => l.outcome === 'no_feedback').length,
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
            
            {/* --- Header --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-900/40">
                            <ShieldCheck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Verification Registry</h1>
                            <p className="text-zinc-500 text-xs">Citizen Audit Log: Validating resolution quality via Sarah Robocall Engine.</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className={cn(
                            "h-9 font-bold text-[11px] gap-2 transition-all",
                            failedOnly 
                                ? "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20" 
                                : "bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-white"
                        )}
                        onClick={() => setFailedOnly(!failedOnly)}
                    >
                        <AlertCircle className="w-3.5 h-3.5" />
                        {failedOnly ? "Showing Failed Only" : "Filter by Failed"}
                    </Button>

                    <Button variant="outline" size="sm" className="bg-zinc-900 border border-zinc-800 h-9 text-zinc-400 hover:text-white" onClick={fetchLogs} disabled={isLoading}>
                        <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* --- Stats Summary --- */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Audits", value: stats.total, icon: <PhoneCall className="w-4 h-4 text-blue-400" /> },
                    { label: "Successfully Verified", value: stats.verified, icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
                    { label: "Re-Opened by Citizen", value: stats.failed, icon: <AlertCircle className="w-4 h-4 text-rose-400" /> },
                    { label: "No Citizen Response", value: stats.noResponse, icon: <Clock className="w-4 h-4 text-zinc-400" /> },
                ].map((stat, i) => (
                    <div key={i} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
                        <div>
                            <p className="text-xs text-zinc-500 font-medium mb-1">{stat.label}</p>
                            <p className="text-2xl font-bold text-white tabular-nums">{stat.value}</p>
                        </div>
                        <div className="p-2.5 bg-zinc-800/60 rounded-lg">{stat.icon}</div>
                    </div>
                ))}
            </div>

            {/* --- Toolbar --- */}
            <div className="flex flex-col md:flex-row items-center gap-4 bg-zinc-900 border border-zinc-800 p-3 rounded-xl shadow-sm">
                <div className="relative w-full md:w-96 flex-shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <Input 
                        placeholder="Search Ticket ID or Citizen Phone..." 
                        className="bg-zinc-950/50 border-zinc-800 pl-10 h-10 text-sm focus:ring-emerald-500/20"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="flex items-center gap-2 ml-auto">
                    <button
                        onClick={() => setSortOrder(v => v === "desc" ? "asc" : "desc")}
                        className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-3 py-2 rounded-lg bg-zinc-800/40 border border-zinc-800/60"
                    >
                        <ArrowUpDown className="w-3.5 h-3.5" />
                        {sortOrder === "desc" ? "Newest First" : "Oldest First"}
                    </button>
                    
                    <span className="text-[10px] text-zinc-600 font-mono hidden md:block uppercase tracking-wider bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
                        {filteredLogs.length} Records Found
                    </span>
                </div>
            </div>

            {/* --- Table --- */}
            <div className="w-full bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-zinc-950/70 border-b border-zinc-800">
                            <TableRow className="border-zinc-800 hover:bg-transparent">
                                {["Call Timestamp", "Ticket ID", "Citizen Phone", "Contact Duration", "Sarah Feedback", "Action"].map(h => (
                                    <TableHead key={h} className="text-zinc-500 font-bold uppercase tracking-widest text-[9px] py-4 px-4 whitespace-nowrap">
                                        {h}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="relative">
                                                <div className="w-12 h-12 rounded-full border-t-2 border-emerald-500 animate-spin" />
                                                <History className="w-5 h-5 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                            </div>
                                            <p className="text-zinc-500 text-sm font-medium">Syncing Verification Audit Logs...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="flex flex-col items-center gap-4 text-zinc-600">
                                            <div className="w-16 h-16 rounded-full bg-zinc-800/30 flex items-center justify-center">
                                                <PhoneCall className="w-8 h-8 opacity-20" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-zinc-400">No verification calls found</p>
                                                <p className="text-xs text-zinc-500">Sarah has not yet reached these citizens for audit.</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredLogs.map(log => (
                                <TableRow key={log.id} className="border-zinc-800/40 hover:bg-zinc-800/30 group transition-all">
                                    <TableCell className="px-4 py-4">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-zinc-800/60 flex items-center justify-center">
                                                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                                            </div>
                                            <span className="text-[11px] font-mono text-zinc-300">{formatDate(log.timestamp)}</span>
                                        </div>
                                    </TableCell>
                                    
                                    <TableCell className="px-4 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-mono text-[11px] font-bold text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-2 py-1 rounded-md w-fit">
                                                {log.ticketId}
                                            </span>
                                            <span className="text-[9px] text-zinc-600 mt-1 uppercase font-bold px-0.5">Complaint Ref</span>
                                        </div>
                                    </TableCell>
                                    
                                    <TableCell className="px-4 py-4 font-mono text-[11px] text-zinc-400">
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-3 h-3 text-zinc-600" />
                                            {log.phone || "—"}
                                        </div>
                                    </TableCell>
                                    
                                    <TableCell className="px-4 py-4 font-mono text-[11px]">
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400",
                                            log.duration > 30 ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" : ""
                                        )}>
                                            {log.duration}s
                                        </span>
                                    </TableCell>
                                    
                                    <TableCell className="px-4 py-4">
                                        <OutcomeBadge outcome={log.outcome} />
                                    </TableCell>
                                    
                                    <TableCell className="px-4 py-4">
                                        <Link href={`/complaints?search=${log.ticketId}`}>
                                            <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold gap-2 text-zinc-500 hover:text-white hover:bg-zinc-800 border border-transparent hover:border-zinc-700">
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                View Original
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                
                {/* --- Footer Note --- */}
                <div className="bg-zinc-950/40 px-6 py-3 border-t border-zinc-800/40 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Live Audit Connector Active</span>
                </div>
            </div>
            
            {/* --- Insight Grid --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-gradient-to-br from-indigo-500/5 to-transparent border border-indigo-500/10 rounded-2xl p-5 space-y-3 backdrop-blur-md">
                     <h3 className="text-sm font-bold text-white flex items-center gap-2">
                         <BarChart2 className="w-4 h-4 text-indigo-400" />
                         Resolution Quality Benchmarks
                     </h3>
                     <p className="text-xs text-zinc-500 leading-relaxed">
                         Sarah performs automated post-resolution audits 1-2 hours after an officer marks a complaint as 'Resolved'. 
                         Tickets that appear as <span className="text-rose-400 font-bold">Re-Opened</span> have been explicitly rejected by the citizen.
                     </p>
                 </div>
                 
                 <div className="bg-gradient-to-br from-emerald-500/5 to-transparent border border-emerald-500/10 rounded-2xl p-5 space-y-3 backdrop-blur-md">
                     <h3 className="text-sm font-bold text-white flex items-center gap-2">
                         <ShieldCheck className="w-4 h-4 text-emerald-400" />
                         Anti-Corruption Governance
                     </h3>
                     <p className="text-xs text-zinc-500 leading-relaxed">
                         Call durations exceeding 20 seconds with a 'Verified' status indicate a high-fidelity confirmation. 
                         Short calls resulting in 'No Response' are automatically scheduled for retry by the Sarah Governor engine.
                     </p>
                 </div>
            </div>

        </div>
    );
}
