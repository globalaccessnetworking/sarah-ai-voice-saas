"use client";

import React, { useState, useEffect } from 'react';
import { 
    Phone, 
    Clock, 
    Calendar, 
    ChevronRight, 
    CheckCircle2, 
    XCircle, 
    Loader2, 
    ArrowUpRight, 
    ArrowDownLeft, 
    FileText, 
    Headphones,
    DollarSign,
    Layers,
    User,
    Search,
    Filter,
    ArrowUpDown,
    Download
} from "lucide-react";
import { format } from 'date-fns';

interface HistoricalCall {
    id: string;
    date: string;
    agentId: string;
    agentName: string;
    userName: string;
    userPhone: string;
    durationSeconds: number;
    tokens: {
        llmInput: number;
        llmOutput: number;
        ttsChars: number;
    };
    status: 'completed' | 'failed' | 'in-progress';
    cost: number;
    costBreakdown: {
        total: number;
        ai: number;
        telephony: number;
    };
}

export default function CallsHistoryPage() {
    const [calls, setCalls] = useState<HistoricalCall[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchCalls = async () => {
            try {
                const res = await fetch('/api/calls/history');
                const data = await res.json();
                setCalls(data.calls);
            } catch (error) {
                console.error("Error fetching calls:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCalls();
    }, []);

    const filteredCalls = calls.filter(call => 
        call.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.userPhone.includes(searchTerm) ||
        call.userName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalSpend = calls.reduce((acc, call) => acc + (call.cost || 0), 0);
    const avgDuration = calls.length > 0 
        ? Math.round(calls.reduce((acc, call) => acc + call.durationSeconds, 0) / calls.length) 
        : 0;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Clock className="w-6 h-6 text-zinc-400" />
                        Call History & Billing
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">Audit log of all AI interactions and real-time cost calculation.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-md hover:bg-zinc-800 transition-colors text-sm font-medium">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                </div>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
                    <div className="flex items-center gap-2 text-zinc-500 mb-3">
                        <DollarSign className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-bold uppercase tracking-wider">Total Spend (USD)</span>
                    </div>
                    <div className="text-2xl font-mono font-bold text-white">${totalSpend.toFixed(2)}</div>
                    <div className="text-[10px] text-zinc-600 mt-1">Based on active pricing matrix</div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
                    <div className="flex items-center gap-2 text-zinc-500 mb-3">
                        <Phone className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-bold uppercase tracking-wider">Total Calls</span>
                    </div>
                    <div className="text-2xl font-mono font-bold text-white">{calls.length}</div>
                    <div className="text-[10px] text-zinc-600 mt-1">50 records loaded</div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
                    <div className="flex items-center gap-2 text-zinc-500 mb-3">
                        <Clock className="w-4 h-4 text-purple-500" />
                        <span className="text-xs font-bold uppercase tracking-wider">Avg Duration</span>
                    </div>
                    <div className="text-2xl font-mono font-bold text-white">{avgDuration}s</div>
                    <div className="text-[10px] text-zinc-600 mt-1">Seconds per session</div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
                    <div className="flex items-center gap-2 text-zinc-500 mb-3">
                        <Layers className="w-4 h-4 text-orange-500" />
                        <span className="text-xs font-bold uppercase tracking-wider">Success Rate</span>
                    </div>
                    <div className="text-2xl font-mono font-bold text-white">
                        {calls.length > 0 ? Math.round((calls.filter(c => c.status === 'completed').length / calls.length) * 100) : 0}%
                    </div>
                    <div className="text-[10px] text-zinc-600 mt-1">Completed vs Failed</div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 justify-between bg-zinc-900/50 p-4 rounded-lg border border-zinc-800/50">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                    <input 
                        type="text"
                        placeholder="Search agent, phone, or name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 pl-9 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600 transition-colors"
                    />
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 bg-zinc-950 border border-zinc-800 text-zinc-400 rounded-md hover:text-zinc-200 transition-colors text-sm">
                        <Filter className="w-4 h-4" /> Filter
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 bg-zinc-950 border border-zinc-800 text-zinc-400 rounded-md hover:text-zinc-200 transition-colors text-sm">
                        <ArrowUpDown className="w-4 h-4" /> Sort
                    </button>
                </div>
            </div>

            {/* Calls Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead className="bg-black/50 border-b border-zinc-800/50">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Date & Time</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Agent / ID</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Participant</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Duration</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Tokens (I/O)</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Cost (USD)</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={8} className="px-6 py-4 h-16 bg-zinc-900/10"></td>
                                    </tr>
                                ))
                            ) : filteredCalls.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-20 text-center text-zinc-600">
                                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-10" />
                                        <p>No call records found matching your search</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredCalls.map((call) => (
                                    <tr key={call.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="text-zinc-200 text-sm font-medium">
                                                {format(new Date(call.date), 'MMM dd, h:mm a')}
                                            </div>
                                            <div className="text-zinc-500 text-[10px] font-mono mt-0.5 uppercase">
                                                {format(new Date(call.date), 'EEEE')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                                                <span className="text-white font-bold text-sm">{call.agentName}</span>
                                            </div>
                                            <div className="text-zinc-600 text-[10px] font-mono mt-0.5">{call.agentId}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-zinc-300 text-sm">
                                                <User className="w-3.5 h-3.5 text-zinc-600" />
                                                {call.userName}
                                            </div>
                                            <div className="text-zinc-500 text-[10px] font-mono mt-0.5">{call.userPhone}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-zinc-400 font-mono text-sm">{call.durationSeconds}s</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-zinc-400 font-mono text-xs">{call.tokens.llmInput} / {call.tokens.llmOutput}</span>
                                                <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-tighter">Tokens</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-emerald-400 font-mono font-bold">$ {call.cost.toFixed(4)}</span>
                                                <div className="flex gap-2 mt-0.5">
                                                    <span className="text-[9px] text-zinc-600 font-mono">AI: ${call.costBreakdown.ai.toFixed(4)}</span>
                                                    <span className="text-[9px] text-zinc-600 font-mono">SIP: ${call.costBreakdown.telephony.toFixed(4)}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {call.status === 'completed' ? (
                                                <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] font-bold text-emerald-500">
                                                    <CheckCircle2 className="w-3 h-3" /> COMPLETED
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-rose-500/10 border border-rose-500/20 rounded text-[10px] font-bold text-rose-500">
                                                    <XCircle className="w-3 h-3" /> FAILED
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 text-zinc-600 hover:text-white hover:bg-zinc-800 rounded-md transition-all">
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
