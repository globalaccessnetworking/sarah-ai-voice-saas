"use client";

import React, { useState, useEffect } from "react";
import { 
    History, Mail, AlertCircle, CheckCircle2, 
    Clock, Info, Shield, Search, Filter, 
    ExternalLink, X, Database, Zap
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Dialog, DialogContent, DialogHeader, 
    DialogTitle, DialogDescription 
} from "@/components/ui/dialog";

interface EmailLog {
    id: string;
    recipient: string;
    subject: string;
    templateType: string;
    status: "SENT" | "FAILED" | "BOUNCED";
    errorMessage: string | null;
    timestamp: string;
    provider: string;
}

export default function DeliveryLogsPage() {
    const [logs, setLogs] = useState<EmailLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedError, setSelectedError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchLogs() {
            try {
                const res = await fetch("/api/email-logs");
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                setLogs(data);
            } catch (error: any) {
                toast.error("Failed to synchronize audit trail");
            } finally {
                setIsLoading(false);
            }
        }
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log => 
        log.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.templateType.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        total: logs.length,
        failed: logs.filter(l => l.status === "FAILED").length,
        provider: logs[0]?.provider || "AWS SES"
    };

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                    <p className="text-zinc-500 text-sm animate-pulse font-mono uppercase tracking-widest text-[10px]">Accessing Secure Vault...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <History className="w-6 h-6 text-emerald-400" />
                        Delivery Logs
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">Real-time audit trail for all outbound system notifications and reports.</p>
                </div>
            </div>

            {/* Metric Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 backdrop-blur-xl">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-3">Total Transmissions</p>
                    <div className="flex items-center justify-between">
                        <span className="text-3xl font-bold text-white">{stats.total}</span>
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 backdrop-blur-xl">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-3">Failed Drops</p>
                    <div className="flex items-center justify-between">
                        <span className="text-3xl font-bold text-red-400">{stats.failed}</span>
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                            <AlertCircle className="w-5 h-5 text-red-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 backdrop-blur-xl">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-3">Active Gateway</p>
                    <div className="flex items-center justify-between">
                        <span className="text-3xl font-bold text-blue-400">{stats.provider}</span>
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                            <Zap className="w-5 h-5 text-blue-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                        <Input 
                            placeholder="Search by recipient or subject..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-zinc-900/40 border-zinc-800 pl-10 h-11 text-zinc-300 focus:ring-emerald-500/20"
                        />
                    </div>
                    <Button variant="outline" className="bg-zinc-900/40 border-zinc-800 h-11 px-4 text-zinc-500 hover:text-white">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter Status
                    </Button>
                </div>

                <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-900/80 border-b border-zinc-800">
                                    <th className="p-5 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Timestamp</th>
                                    <th className="p-5 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Recipient</th>
                                    <th className="p-5 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Subject / Template</th>
                                    <th className="p-5 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Status</th>
                                    <th className="p-5 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] text-right">Diagnostics</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/40">
                                {filteredLogs.length > 0 ? (
                                    filteredLogs.map((log) => (
                                        <tr key={log.id} className="group hover:bg-zinc-800/30 transition-all">
                                            <td className="p-5">
                                                <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                                                    <Clock className="w-3.5 h-3.5 text-zinc-600" />
                                                    {new Date(log.timestamp).toLocaleString([], { 
                                                        month: 'short', 
                                                        day: 'numeric', 
                                                        hour: '2-digit', 
                                                        minute: '2-digit',
                                                        second: '2-digit'
                                                    })}
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                                                        <Mail className="w-3.5 h-3.5 text-zinc-500" />
                                                    </div>
                                                    <span className="text-white font-medium text-sm">{log.recipient}</span>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex flex-col max-w-md truncate">
                                                    <span className="text-zinc-200 text-sm font-semibold truncate">{log.subject}</span>
                                                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-tight mt-1">
                                                        ID: {log.templateType}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                {log.status === "SENT" && (
                                                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                        Delivered
                                                    </span>
                                                )}
                                                {log.status === "FAILED" && (
                                                    <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                        Failed
                                                    </span>
                                                )}
                                                {log.status === "BOUNCED" && (
                                                    <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                        Bounced
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-5 text-right">
                                                {log.status === "FAILED" && log.errorMessage ? (
                                                    <button 
                                                        onClick={() => setSelectedError(log.errorMessage)}
                                                        className="inline-flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors font-bold uppercase tracking-widest bg-red-500/5 hover:bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/10"
                                                    >
                                                        <AlertCircle className="w-3.5 h-3.5" />
                                                        View Error
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-2 text-zinc-600">
                                                        <CheckCircle2 className="w-4 h-4 text-zinc-800" />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest">Clean</span>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="p-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-16 h-16 rounded-3xl bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                                                    <Database className="w-8 h-8 text-zinc-800" />
                                                </div>
                                                <div>
                                                    <p className="text-white font-bold text-sm">No records found in transmission vault.</p>
                                                    <p className="text-zinc-600 text-xs mt-1">Audit logs will materialize here once dispatcher triggers occur.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Error Diagnostic Modal */}
            <Dialog open={!!selectedError} onOpenChange={() => setSelectedError(null)}>
                <DialogContent className="bg-zinc-950 border-white/10 text-zinc-300 max-w-xl shadow-2xl backdrop-blur-3xl p-0 overflow-hidden rounded-3xl">
                    <div className="p-8 border-b border-white/5 bg-red-950/10">
                        <DialogHeader>
                            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mb-6">
                                <AlertCircle className="w-6 h-6 text-red-500" />
                            </div>
                            <DialogTitle className="text-2xl font-bold text-white mb-2">Diagnostic Exception</DialogTitle>
                            <DialogDescription className="text-red-400/60 font-medium">
                                Technical breakdown of the SMTP/SES delivery failure packet.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-8">
                        <div className="bg-black/40 border border-white/5 rounded-2xl p-6 font-mono text-xs leading-relaxed text-zinc-400 break-all select-all">
                            {selectedError}
                        </div>
                        
                        <div className="mt-8 flex items-center gap-4">
                            <div className="flex-1 h-px bg-white/5" />
                            <Shield className="w-4 h-4 text-zinc-800" />
                            <div className="flex-1 h-px bg-white/5" />
                        </div>
                    </div>

                    <div className="p-6 bg-zinc-900/50 flex justify-end">
                        <Button 
                            onClick={() => setSelectedError(null)}
                            className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-8 rounded-xl h-11"
                        >
                            De-Escalate
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
