"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Search, Megaphone, CheckCircle2, XCircle, Clock, FileText, Phone, User, Building, Info, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface CallLog {
    id: string;
    status: string;
    durationSeconds: number;
    transcript: any;
    summary: string;
}

interface Lead {
    id: string;
    phone: string;
    name: string | null;
    companyName: string | null;
    status: string;
    calledAt: string | null;
    callLog: CallLog | null;
}

interface CampaignStats {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    progress: number;
}

interface CampaignDetails {
    campaign: {
        id: string;
        name: string;
        status: string;
        concurrency: number;
        createdAt: string;
    };
    stats: CampaignStats;
    leads: Lead[];
}

export default function CampaignDetailsPage() {
    const { id } = useParams();
    const [data, setData] = useState<CampaignDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    
    // Drawer state
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

    const fetchDetails = async () => {
        try {
            const res = await fetch(`/api/campaigns/${id}/details`);
            if (!res.ok) throw new Error("Failed to fetch campaign details");
            const json = await res.json();
            setData(json);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
        
        // Poll every 5s if campaign is running
        const interval = setInterval(() => {
            if (data?.campaign?.status === 'running') {
                fetchDetails();
            }
        }, 5000);
        
        return () => clearInterval(interval);
    }, [id, data?.campaign?.status]);

    if (loading && !data) {
        return (
            <div className="w-full h-full bg-zinc-950 p-8 flex items-center justify-center">
                <div className="text-zinc-500 animate-pulse">Loading campaign details...</div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="w-full h-full bg-zinc-950 p-8 flex flex-col items-center justify-center gap-4">
                <AlertCircle className="text-red-500 w-12 h-12" />
                <h2 className="text-xl text-white">Error Loading Campaign</h2>
                <p className="text-zinc-400">{error}</p>
                <Link href="/telephony/campaigns" className="btn-secondary">Back to Campaigns</Link>
            </div>
        );
    }

    const { campaign, stats, leads } = data;

    const filteredLeads = leads.filter(lead => {
        const matchesSearch = 
            lead.phone.includes(searchTerm) || 
            (lead.name && lead.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (lead.companyName && lead.companyName.toLowerCase().includes(searchTerm.toLowerCase()));
            
        const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const formatDuration = (seconds: number | undefined) => {
        if (!seconds) return "-";
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full h-full overflow-y-auto bg-zinc-950 p-8 md:p-10 relative">
            <div className="max-w-[1600px] mx-auto flex flex-col gap-8">

                {/* Header */}
                <div className="flex flex-col gap-4">
                    <Link href="/telephony/campaigns" className="text-zinc-400 hover:text-white flex items-center gap-2 text-sm w-fit transition-colors">
                        <ArrowLeft size={16} />
                        Back to Campaigns
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                                {campaign.name}
                            </h1>
                            <div className="flex items-center gap-3 mt-2">
                                <span className={`badge ${
                                    campaign.status === "running" ? "badge-success" :
                                    campaign.status === "paused" ? "badge-warning" :
                                    campaign.status === "completed" ? "badge-info" :
                                    "badge-neutral"
                                }`}>
                                    {campaign.status.toUpperCase()}
                                </span>
                                <span className="text-sm text-zinc-500">Concurrency: {campaign.concurrency}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2">
                        <div className="text-sm font-medium tracking-wide text-zinc-400 uppercase">Total Leads</div>
                        <div className="text-2xl font-bold text-white">{stats.total}</div>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2">
                        <div className="text-sm font-medium tracking-wide text-zinc-400 uppercase flex items-center justify-between">
                            Pending <Clock size={14} />
                        </div>
                        <div className="text-2xl font-bold text-white">{stats.pending}</div>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2">
                        <div className="text-sm font-medium tracking-wide text-zinc-400 uppercase flex items-center justify-between">
                            Processing <Megaphone size={14} className="text-amber-500" />
                        </div>
                        <div className="text-2xl font-bold text-white">{stats.processing}</div>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2">
                        <div className="text-sm font-medium tracking-wide text-zinc-400 uppercase flex items-center justify-between">
                            Completed <CheckCircle2 size={14} className="text-emerald-500" />
                        </div>
                        <div className="text-2xl font-bold text-white">{stats.completed}</div>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2">
                        <div className="text-sm font-medium tracking-wide text-zinc-400 uppercase flex items-center justify-between">
                            Failed <XCircle size={14} className="text-red-500" />
                        </div>
                        <div className="text-2xl font-bold text-white">{stats.failed}</div>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2">
                        <div className="text-sm font-medium tracking-wide text-zinc-400 uppercase">Progress</div>
                        <div className="text-2xl font-bold text-white">{stats.progress}%</div>
                    </div>
                </div>

                {/* Progress Bar Segmented */}
                {stats.total > 0 && (
                    <div className="w-full bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex flex-col gap-2">
                        <div className="flex justify-between text-xs font-medium text-zinc-400 mb-1">
                            <span>Campaign Progress ({stats.completed + stats.failed} / {stats.total})</span>
                            <span>{stats.progress}%</span>
                        </div>
                        <div className="h-4 w-full bg-zinc-800 rounded-full flex overflow-hidden">
                            <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${(stats.completed / stats.total) * 100}%` }} title={`Completed: ${stats.completed}`} />
                            <div className="bg-red-500 h-full transition-all duration-500" style={{ width: `${(stats.failed / stats.total) * 100}%` }} title={`Failed: ${stats.failed}`} />
                            <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${(stats.processing / stats.total) * 100}%` }} title={`Processing: ${stats.processing}`} />
                            <div className="bg-zinc-700 h-full transition-all duration-500" style={{ width: `${(stats.pending / stats.total) * 100}%` }} title={`Pending: ${stats.pending}`} />
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="card p-4 flex flex-col md:flex-row gap-4 mt-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search leads by name, phone, or company..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field pl-10 w-full"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="input-field md:w-48"
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                        <option value="no_answer">No Answer</option>
                        <option value="busy">Busy</option>
                    </select>
                </div>

                {/* Lead Table */}
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="data-table w-full">
                            <thead>
                                <tr>
                                    <th>Phone</th>
                                    <th>Name</th>
                                    <th>Company</th>
                                    <th>Status</th>
                                    <th>Duration</th>
                                    <th>Called At</th>
                                    <th className="text-right">Transcript</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLeads.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-8 text-zinc-500">
                                            No leads match the current filters.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLeads.map((lead) => (
                                        <tr key={lead.id} className="hover:bg-zinc-800/30">
                                            <td className="font-medium text-zinc-300">{lead.phone}</td>
                                            <td className="text-zinc-400">{lead.name || '-'}</td>
                                            <td className="text-zinc-400">{lead.companyName || '-'}</td>
                                            <td>
                                                <span className={`badge ${
                                                    lead.status === 'completed' ? 'badge-success' :
                                                    lead.status === 'pending' ? 'badge-neutral' :
                                                    lead.status === 'processing' ? 'badge-warning' :
                                                    'badge-danger'
                                                }`}>
                                                    {lead.status.replace(/_/g, ' ').toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="text-zinc-400">
                                                {formatDuration(lead.callLog?.durationSeconds)}
                                            </td>
                                            <td className="text-zinc-400 whitespace-nowrap">
                                                {lead.calledAt ? new Date(lead.calledAt).toLocaleString() : '-'}
                                            </td>
                                            <td className="text-right">
                                                <button 
                                                    onClick={() => setSelectedLead(lead)}
                                                    className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    disabled={!lead.callLog}
                                                    title={lead.callLog ? "View Details" : "No call log available"}
                                                >
                                                    <FileText size={16} />
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

            {/* Lead Details Drawer Overlay */}
            {selectedLead && (
                <div className="fixed inset-0 z-50 bg-black/60 flex justify-end">
                    {/* Drawer container */}
                    <div className="w-full max-w-lg bg-zinc-950 border-l border-zinc-800 h-full flex flex-col animate-in slide-in-from-right shadow-2xl">
                        
                        {/* Drawer Header */}
                        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                <Info className="text-blue-500" size={20} />
                                Lead Details
                            </h2>
                            <button 
                                onClick={() => setSelectedLead(null)}
                                className="p-2 text-zinc-400 hover:text-white rounded-md bg-zinc-900 hover:bg-zinc-800 transition-colors"
                            >
                                <XCircle size={20} />
                            </button>
                        </div>

                        {/* Drawer Body */}
                        <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-6">
                            
                            {/* Lead Data section */}
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
                                <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide border-b border-zinc-800 pb-2">Lead Information</h3>
                                
                                <div className="flex items-center gap-3 text-zinc-400">
                                    <Phone size={16} className="text-zinc-500" />
                                    <span className="font-mono text-zinc-200">{selectedLead.phone}</span>
                                </div>
                                {selectedLead.name && (
                                    <div className="flex items-center gap-3 text-zinc-400">
                                        <User size={16} className="text-zinc-500" />
                                        <span className="text-zinc-200">{selectedLead.name}</span>
                                    </div>
                                )}
                                {selectedLead.companyName && (
                                    <div className="flex items-center gap-3 text-zinc-400">
                                        <Building size={16} className="text-zinc-500" />
                                        <span className="text-zinc-200">{selectedLead.companyName}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 mt-1">
                                    <span className={`badge ${
                                        selectedLead.status === 'completed' ? 'badge-success' :
                                        selectedLead.status === 'pending' ? 'badge-neutral' :
                                        selectedLead.status === 'processing' ? 'badge-warning' :
                                        'badge-danger'
                                    }`}>
                                        {selectedLead.status.replace(/_/g, ' ').toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            {/* Call Summary */}
                            {selectedLead.callLog?.summary && (
                                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex flex-col gap-3">
                                    <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide border-b border-zinc-800 pb-2">Call Summary</h3>
                                    <p className="text-zinc-300 text-sm leading-relaxed">
                                        {selectedLead.callLog.summary}
                                    </p>
                                </div>
                            )}

                            {/* Transcript */}
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col flex-1 min-h-[300px]">
                                <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide border-b border-zinc-800 p-5 pb-3">Transcript</h3>
                                <div className="p-5 pt-2 flex flex-col gap-4">
                                    {selectedLead.callLog?.transcript && Array.isArray(selectedLead.callLog.transcript) && selectedLead.callLog.transcript.length > 0 ? (
                                        selectedLead.callLog.transcript.map((msg: any, i: number) => {
                                            const role = msg?.role || 'system';
                                            const isAgent = role === 'agent' || role === 'assistant';
                                            const isUser = role === 'user';
                                            
                                            // Handle defensive checking for message content
                                            let content = "";
                                            if (typeof msg.content === 'string') {
                                                content = msg.content;
                                            } else if (msg.content && typeof msg.content === 'object' && msg.content.text) {
                                                content = msg.content.text;
                                            } else {
                                                content = JSON.stringify(msg.content || msg);
                                            }

                                            return (
                                                <div key={i} className={`flex flex-col gap-1 max-w-[90%] ${isAgent ? 'self-start' : isUser ? 'self-end' : 'self-center w-full'}`}>
                                                    <span className={`text-[10px] uppercase font-semibold tracking-wider ${isAgent ? 'text-blue-500' : isUser ? 'text-emerald-500 self-end' : 'text-zinc-500 text-center'}`}>
                                                        {role}
                                                    </span>
                                                    <div className={`p-3 rounded-xl text-sm ${
                                                        isAgent ? 'bg-blue-500/10 border border-blue-500/20 text-zinc-200 rounded-tl-sm' :
                                                        isUser ? 'bg-emerald-500/10 border border-emerald-500/20 text-zinc-200 rounded-tr-sm' :
                                                        'bg-zinc-800/50 text-zinc-400 italic text-center w-full'
                                                    }`}>
                                                        {content}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-zinc-500 italic text-center py-8">
                                            {selectedLead.callLog ? "No transcript available for this call." : "Call hasn't been made yet."}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
