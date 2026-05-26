"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Search, Megaphone, CheckCircle2, XCircle, Clock, FileText, Phone, User, Building, Info, AlertCircle, Download, Activity, Play, Check } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface CallLog {
    id: string;
    status: string;
    durationSeconds: number;
    transcript: any;
    summary: string;
    recordingUrl: string | null;
}

interface Lead {
    id: string;
    phone: string;
    name: string | null;
    companyName: string | null;
    status: string;
    leadData: any;
    calledAt: string | null;
    attemptCount?: number;
    lastAttemptAt?: string | null;
    nextRetryAt?: string | null;
    failureReason?: string | null;
    disposition?: string | null;
    lastCallDurationSeconds?: number | null;
    callLog: CallLog | null;
    qa?: any;
}

interface CampaignStats {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    progress: number;
    retry_scheduled: number;
    no_answer: number;
    busy: number;
    rejected: number;
    no_conversation: number;
    disconnected_before_greeting: number;
    invalid_number: number;
    other_failures: number;
    average_attempts: number;
    average_duration: number;
    connect_rate: number;
    completion_rate: number;
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
    
    // Core search & filtering state
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [dispositionSearch, setDispositionSearch] = useState("");
    const [attemptsFilter, setAttemptsFilter] = useState("all");
    
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

    // Upgraded multi-criteria lead filters
    const filteredLeads = leads.filter(lead => {
        const matchesSearch = 
            lead.phone.includes(searchTerm) || 
            (lead.name && lead.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (lead.companyName && lead.companyName.toLowerCase().includes(searchTerm.toLowerCase()));
            
        const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
        
        const matchesDisposition = 
            !dispositionSearch || 
            (lead.disposition && lead.disposition.toLowerCase().includes(dispositionSearch.toLowerCase()));

        const matchesAttempts = 
            attemptsFilter === "all" ? true :
            attemptsFilter === "0" ? (lead.attemptCount || 0) === 0 :
            attemptsFilter === "1" ? (lead.attemptCount || 0) === 1 :
            attemptsFilter === "2" ? (lead.attemptCount || 0) === 2 :
            attemptsFilter === "3+" ? (lead.attemptCount || 0) >= 3 : true;
        
        return matchesSearch && matchesStatus && matchesDisposition && matchesAttempts;
    });

    const formatDuration = (seconds: number | null | undefined) => {
        if (!seconds) return "-";
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Safe QA Scanners (Read-Only Heuristic Labels)
    const scanAnswered = (lead: Lead) => {
        const duration = lead.callLog?.durationSeconds || lead.lastCallDurationSeconds || 0;
        return duration > 0;
    };

    const scanInterested = (lead: Lead) => {
        const summaryText = lead.callLog?.summary?.toLowerCase() || "";
        const dispText = lead.disposition?.toLowerCase() || "";
        
        // Scan transcript if available
        let transcriptText = "";
        if (lead.callLog?.transcript && Array.isArray(lead.callLog.transcript)) {
            transcriptText = lead.callLog.transcript.map((m: any) => m.content || "").join(" ").toLowerCase();
        }

        const keywords = ["interested", "yes", "sure", "sign me up", "want to", "callback", "call back"];
        return keywords.some(k => dispText.includes(k) || summaryText.includes(k) || transcriptText.includes(k));
    };

    const scanAppointment = (lead: Lead) => {
        const summaryText = lead.callLog?.summary?.toLowerCase() || "";
        const dispText = lead.disposition?.toLowerCase() || "";

        let transcriptText = "";
        if (lead.callLog?.transcript && Array.isArray(lead.callLog.transcript)) {
            transcriptText = lead.callLog.transcript.map((m: any) => m.content || "").join(" ").toLowerCase();
        }

        const keywords = ["appt", "appointment", "schedule", "book", "meeting", "meet", "time"];
        return keywords.some(k => dispText.includes(k) || summaryText.includes(k) || transcriptText.includes(k));
    };

    return (
        <div className="w-full h-full overflow-y-auto bg-zinc-950 p-8 md:p-10 relative">
            <div className="max-w-[1600px] mx-auto flex flex-col gap-6">

                {/* Header Section */}
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
                        
                        {/* CSV Export Action Button */}
                        <button
                            onClick={() => window.open(`/api/campaigns/${id}/export`, '_blank')}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors self-start md:self-auto shadow-lg"
                        >
                            <Download size={16} />
                            Export CSV Results
                        </button>
                    </div>
                </div>

                {/* KPI Metrics Summary Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-1.5 shadow-sm">
                        <div className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">Total Leads</div>
                        <div className="text-2xl font-bold text-white">{stats.total}</div>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-1.5 shadow-sm">
                        <div className="text-xs font-semibold tracking-wide text-zinc-500 uppercase flex items-center justify-between">
                            Pending <Clock size={14} className="text-zinc-500" />
                        </div>
                        <div className="text-2xl font-bold text-white">{stats.pending}</div>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-1.5 shadow-sm">
                        <div className="text-xs font-semibold tracking-wide text-zinc-500 uppercase flex items-center justify-between">
                            Processing <Activity size={14} className="text-amber-500 animate-pulse" />
                        </div>
                        <div className="text-2xl font-bold text-white">{stats.processing}</div>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-1.5 shadow-sm">
                        <div className="text-xs font-semibold tracking-wide text-zinc-500 uppercase flex items-center justify-between">
                            Completed <CheckCircle2 size={14} className="text-emerald-500" />
                        </div>
                        <div className="text-2xl font-bold text-white">{stats.completed}</div>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-1.5 shadow-sm">
                        <div className="text-xs font-semibold tracking-wide text-zinc-500 uppercase flex items-center justify-between">
                            Failed <XCircle size={14} className="text-red-500" />
                        </div>
                        <div className="text-2xl font-bold text-white">{stats.failed}</div>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-1.5 shadow-sm">
                        <div className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">Connect Rate</div>
                        <div className="text-2xl font-bold text-white">{stats.connect_rate}%</div>
                    </div>
                </div>

                {/* Progress Segmented Bar */}
                {stats.total > 0 && (
                    <div className="w-full bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex flex-col gap-2 shadow-sm">
                        <div className="flex justify-between text-xs font-medium text-zinc-400 mb-0.5">
                            <span>
                                Dialed Progress ({stats.completed + stats.failed} / {stats.total} leads)
                                {stats.retry_scheduled > 0 && (
                                    <span className="text-blue-400 ml-1.5" title={`${stats.retry_scheduled} leads currently scheduled for retry`}>
                                        ({stats.retry_scheduled} retry scheduled)
                                    </span>
                                )}
                            </span>
                            <span className="font-semibold text-zinc-200">{stats.completion_rate}% Completion</span>
                        </div>
                        <div className="h-3 w-full bg-zinc-800/80 rounded-full flex overflow-hidden">
                            <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${(stats.completed / stats.total) * 100}%` }} title={`Completed: ${stats.completed}`} />
                            <div className="bg-red-500 h-full transition-all duration-500" style={{ width: `${(stats.failed / stats.total) * 100}%` }} title={`Failed: ${stats.failed}`} />
                            <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${(stats.retry_scheduled / stats.total) * 100}%` }} title={`Retry Scheduled: ${stats.retry_scheduled}`} />
                            <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${(stats.processing / stats.total) * 100}%` }} title={`Processing: ${stats.processing}`} />
                            <div className="bg-zinc-700 h-full transition-all duration-500" style={{ width: `${(stats.pending / stats.total) * 100}%` }} title={`Pending: ${stats.pending}`} />
                        </div>
                    </div>
                )}

                {/* Campaign Summary & Outcomes Performance Report Card */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Outcome Breakdown List */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4 shadow-sm">
                        <h2 className="text-base font-bold text-white border-b border-zinc-800 pb-2.5 flex items-center gap-2">
                            <Megaphone size={16} className="text-blue-400" />
                            Campaign Outcome Breakdown
                        </h2>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 text-sm">
                            <div className="flex justify-between py-1 border-b border-zinc-800/60">
                                <span className="text-zinc-500">Completed Success</span>
                                <span className="text-emerald-400 font-bold">{stats.completed}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-zinc-800/60">
                                <span className="text-zinc-500">No Answer</span>
                                <span className="text-zinc-300 font-semibold">{stats.no_answer}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-zinc-800/60">
                                <span className="text-zinc-500">Line Busy</span>
                                <span className="text-zinc-300 font-semibold">{stats.busy}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-zinc-800/60">
                                <span className="text-zinc-500">Rejected / DNC</span>
                                <span className="text-zinc-300 font-semibold">{stats.rejected}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-zinc-800/60">
                                <span className="text-zinc-500">No Conversation</span>
                                <span className="text-zinc-300 font-semibold">{stats.no_conversation}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-zinc-800/60">
                                <span className="text-zinc-500">Early Disconnect</span>
                                <span className="text-zinc-300 font-semibold">{stats.disconnected_before_greeting}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-zinc-800/60">
                                <span className="text-zinc-500">Invalid Number</span>
                                <span className="text-zinc-300 font-semibold">{stats.invalid_number}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-zinc-800/60">
                                <span className="text-zinc-500">Other Failures</span>
                                <span className="text-zinc-300 font-semibold">{stats.other_failures}</span>
                            </div>
                        </div>
                    </div>

                    {/* Campaign Performance Metrics */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4 shadow-sm">
                        <h2 className="text-base font-bold text-white border-b border-zinc-800 pb-2.5 flex items-center gap-2">
                            <FileText size={16} className="text-blue-400" />
                            Business Intelligence Metrics
                        </h2>
                        <div className="grid grid-cols-2 gap-4 flex-1">
                            <div className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-850 flex flex-col justify-center">
                                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">Avg Attempts / Lead</span>
                                <span className="text-2xl font-bold text-zinc-100 block mt-1">{stats.average_attempts}</span>
                            </div>
                            <div className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-850 flex flex-col justify-center">
                                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">Avg Conversation Time</span>
                                <span className="text-2xl font-bold text-zinc-100 block mt-1">{formatDuration(stats.average_duration)}</span>
                            </div>
                            <div className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-850 flex flex-col justify-center">
                                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">Prospect Connect Rate</span>
                                <span className="text-2xl font-bold text-emerald-400 block mt-1">{stats.connect_rate}%</span>
                            </div>
                            <div className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-850 flex flex-col justify-center">
                                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">Campaign Completion</span>
                                <span className="text-2xl font-bold text-blue-400 block mt-1">{stats.completion_rate}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters Interface Grid */}
                <div className="card p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2 shadow-sm">
                    {/* General Text Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                        <input
                            type="text"
                            placeholder="Name, phone, or company..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field pl-9 w-full text-sm"
                        />
                    </div>
                    
                    {/* Status Dropdown */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="input-field w-full text-sm"
                    >
                        <option value="all">All Campaign Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="retry_scheduled">Retry Scheduled</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                        <option value="no_answer">No Answer</option>
                        <option value="busy">Busy</option>
                        <option value="no_conversation">No Conversation</option>
                        <option value="disconnected_before_greeting">Early Disconnect</option>
                    </select>

                    {/* Dynamic Disposition Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                        <input
                            type="text"
                            placeholder="Filter by disposition..."
                            value={dispositionSearch}
                            onChange={(e) => setDispositionSearch(e.target.value)}
                            className="input-field pl-9 w-full text-sm"
                        />
                    </div>

                    {/* Attempts Dropdown */}
                    <select
                        value={attemptsFilter}
                        onChange={(e) => setAttemptsFilter(e.target.value)}
                        className="input-field w-full text-sm"
                    >
                        <option value="all">All Attempt Counts</option>
                        <option value="0">0 attempts (Not dialed)</option>
                        <option value="1">1 attempt</option>
                        <option value="2">2 attempts</option>
                        <option value="3+">3+ attempts</option>
                    </select>
                </div>

                {/* Lead Outcomes Listings Data Table */}
                <div className="card overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="data-table w-full">
                            <thead>
                                <tr>
                                    <th>Phone</th>
                                    <th>Name</th>
                                    <th>Company</th>
                                    <th>Status</th>
                                    <th className="text-center">Attempts</th>
                                    <th>Disposition</th>
                                    <th>Next Retry</th>
                                    <th>Duration</th>
                                    <th>Called At</th>
                                    <th className="text-right">Transcript</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLeads.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="text-center py-10 text-zinc-500 italic">
                                            No leads match the selected search & reporting filters.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLeads.map((lead) => (
                                        <tr key={lead.id} className="hover:bg-zinc-800/30 transition-colors">
                                            <td className="font-mono text-zinc-300 font-medium">{lead.phone}</td>
                                            <td className="text-zinc-400">{lead.name || '-'}</td>
                                            <td className="text-zinc-400">{lead.companyName || '-'}</td>
                                            <td>
                                                <span className={`badge ${
                                                    lead.status === 'completed' ? 'badge-success' :
                                                    lead.status === 'pending' ? 'badge-neutral' :
                                                    lead.status === 'processing' ? 'badge-warning' :
                                                    lead.status === 'retry_scheduled' ? 'badge-info' :
                                                    'badge-danger'
                                                }`}>
                                                    {lead.status.replace(/_/g, ' ').toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="text-zinc-400 text-center">{lead.attemptCount || 0}</td>
                                            <td className="text-zinc-300 font-medium">{lead.disposition || '-'}</td>
                                            <td className="text-zinc-400">
                                                {lead.status === 'retry_scheduled' && lead.nextRetryAt ? new Date(lead.nextRetryAt).toLocaleString() : '-'}
                                            </td>
                                            <td className="text-zinc-400">
                                                {formatDuration(lead.callLog?.durationSeconds || lead.lastCallDurationSeconds)}
                                            </td>
                                            <td className="text-zinc-400 whitespace-nowrap">
                                                {lead.calledAt ? new Date(lead.calledAt).toLocaleString() : '-'}
                                            </td>
                                            <td className="text-right">
                                                <button 
                                                    onClick={() => setSelectedLead(lead)}
                                                    className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                    disabled={!lead.callLog}
                                                    title={lead.callLog ? "Review Call Details" : "No call log database entry"}
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

            {/* Interactive Lead Details slide-over drawer */}
            {selectedLead && (
                <div className="fixed inset-0 z-50 bg-black/70 flex justify-end transition-opacity">
                    {/* Drawer panel container */}
                    <div className="w-full max-w-lg bg-zinc-950 border-l border-zinc-800 h-full flex flex-col animate-in slide-in-from-right duration-200 shadow-2xl">
                        
                        {/* Drawer Header */}
                        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Info className="text-blue-500" size={18} />
                                Call Outcome & Transcript
                            </h2>
                            <button 
                                onClick={() => setSelectedLead(null)}
                                className="p-2 text-zinc-400 hover:text-white rounded-md bg-zinc-900 hover:bg-zinc-800 transition-colors"
                            >
                                <XCircle size={18} />
                            </button>
                        </div>

                        {/* Drawer scrollable content */}
                        <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-5">
                            
                            {/* Heuristic QA Insights (Read-Only) */}
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3.5 shadow-sm">
                                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800/80 pb-2">Heuristic QA Insights</h3>
                                <div className="grid grid-cols-3 gap-2.5 text-center">
                                    <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-850/80">
                                        <span className="text-[9px] text-zinc-500 uppercase tracking-widest block font-medium">Likely Answered</span>
                                        <span className={`text-xs font-bold block mt-1.5 ${
                                            (selectedLead.qa ? selectedLead.qa.likely_answered : scanAnswered(selectedLead)) ? "text-emerald-400" : "text-zinc-500"
                                        }`}>
                                            {(selectedLead.qa ? selectedLead.qa.likely_answered : scanAnswered(selectedLead)) ? "YES" : "NO"}
                                        </span>
                                    </div>
                                    <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-850/80">
                                        <span className="text-[9px] text-zinc-500 uppercase tracking-widest block font-medium">Likely Interested</span>
                                        <span className={`text-xs font-bold block mt-1.5 ${
                                            (selectedLead.qa ? selectedLead.qa.likely_interested : scanInterested(selectedLead)) ? "text-emerald-400" : "text-zinc-500"
                                        }`}>
                                            {(selectedLead.qa ? selectedLead.qa.likely_interested : scanInterested(selectedLead)) ? "YES" : "NO"}
                                        </span>
                                    </div>
                                    <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-850/80">
                                        <span className="text-[9px] text-zinc-500 uppercase tracking-widest block font-medium">Appt Mentioned</span>
                                        <span className={`text-xs font-bold block mt-1.5 ${
                                            (selectedLead.qa ? selectedLead.qa.appointment_mentioned : scanAppointment(selectedLead)) ? "text-blue-400" : "text-zinc-500"
                                        }`}>
                                            {(selectedLead.qa ? selectedLead.qa.appointment_mentioned : scanAppointment(selectedLead)) ? "YES" : "NO"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Post-Call Intelligence Card */}
                            {selectedLead.qa && selectedLead.qa.likely_answered && (
                                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3.5 shadow-sm">
                                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800/80 pb-2">Post-Call Intelligence</h3>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-850/80 flex flex-col justify-center">
                                            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block">Lead Quality Score</span>
                                            <div className="flex items-baseline gap-1 mt-1">
                                                <span className={`text-2xl font-bold ${
                                                    selectedLead.qa.lead_quality_score >= 70 ? 'text-emerald-400' :
                                                    selectedLead.qa.lead_quality_score >= 40 ? 'text-amber-400' :
                                                    'text-red-400'
                                                }`}>{selectedLead.qa.lead_quality_score}</span>
                                                <span className="text-[10px] text-zinc-500">/ 100</span>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-850/80 flex flex-col justify-center">
                                            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block">Follow-up Needed</span>
                                            <span className={`text-xs font-bold block mt-1.5 ${
                                                (selectedLead.qa.appointment_mentioned || selectedLead.qa.likely_interested || selectedLead.qa.callback_requested) ? "text-emerald-400" : "text-zinc-500"
                                            }`}>
                                                {(selectedLead.qa.appointment_mentioned || selectedLead.qa.likely_interested || selectedLead.qa.callback_requested) ? "YES (Priority)" : "NO"}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3.5 text-sm">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[9px] text-zinc-500 uppercase font-semibold">Objection Detected</span>
                                            <span className={`text-xs font-semibold ${selectedLead.qa.objection_detected ? "text-amber-400" : "text-zinc-400"}`}>
                                                {selectedLead.qa.objection_detected ? "YES" : "NO"}
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[9px] text-zinc-500 uppercase font-semibold">Callback Requested</span>
                                            <span className={`text-xs font-semibold ${selectedLead.qa.callback_requested ? "text-emerald-400" : "text-zinc-400"}`}>
                                                {selectedLead.qa.callback_requested ? "YES" : "NO"}
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-0.5 col-span-2">
                                            <span className="text-[9px] text-zinc-500 uppercase font-semibold">DNC Requested</span>
                                            <span className={`text-xs font-semibold ${selectedLead.qa.do_not_call_requested ? "text-red-400" : "text-zinc-400"}`}>
                                                {selectedLead.qa.do_not_call_requested ? "YES (Add to Do-Not-Call)" : "NO"}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col gap-1 text-sm border-t border-zinc-800/60 pt-3">
                                        <span className="text-[9px] text-zinc-500 uppercase font-semibold">Recommended Next Action</span>
                                        <span className="text-blue-400 font-medium text-xs bg-blue-500/5 border border-blue-500/10 p-2.5 rounded-lg">
                                            {selectedLead.qa.recommended_next_action}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Call Recording Player */}
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3 shadow-sm">
                                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800/80 pb-2">Call Recording</h3>
                                {selectedLead.callLog?.recordingUrl ? (
                                    <div className="flex flex-col gap-2 mt-1">
                                        <audio src={selectedLead.callLog.recordingUrl} controls className="w-full h-9" />
                                        <a 
                                            href={selectedLead.callLog.recordingUrl} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            className="text-xs text-blue-400 hover:text-blue-300 underline self-end font-medium"
                                        >
                                            Open in new tab
                                        </a>
                                    </div>
                                ) : (
                                    <span className="text-sm text-zinc-500 italic mt-1">No recording available.</span>
                                )}
                            </div>

                            {/* Lead Information */}
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3 shadow-sm">
                                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800/80 pb-2">Lead Information</h3>
                                
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] text-zinc-500 uppercase font-semibold">Phone</span>
                                        <span className="font-mono text-zinc-200">{selectedLead.phone}</span>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] text-zinc-500 uppercase font-semibold">Status</span>
                                        <span className="text-zinc-200 capitalize">{selectedLead.status.replace(/_/g, ' ')}</span>
                                    </div>
                                    {selectedLead.name && (
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Name</span>
                                            <span className="text-zinc-200">{selectedLead.name}</span>
                                        </div>
                                    )}
                                    {selectedLead.companyName && (
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Company</span>
                                            <span className="text-zinc-200">{selectedLead.companyName}</span>
                                        </div>
                                    )}
                                    {selectedLead.disposition && (
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Disposition</span>
                                            <span className="text-zinc-100 font-medium">{selectedLead.disposition}</span>
                                        </div>
                                    )}
                                    {selectedLead.failureReason && (
                                        <div className="flex flex-col gap-0.5 col-span-2">
                                            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Failure Reason</span>
                                            <span className="text-red-400">{selectedLead.failureReason}</span>
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] text-zinc-500 uppercase font-semibold">Attempts</span>
                                        <span className="text-zinc-200">{selectedLead.attemptCount || 0} attempts</span>
                                    </div>
                                    {(selectedLead.callLog?.durationSeconds || selectedLead.lastCallDurationSeconds) ? (
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Call Duration</span>
                                            <span className="text-zinc-200">{formatDuration(selectedLead.callLog?.durationSeconds || selectedLead.lastCallDurationSeconds)}</span>
                                        </div>
                                    ) : null}
                                    {selectedLead.calledAt && (
                                        <div className="flex flex-col gap-0.5 col-span-2">
                                            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Dial Time</span>
                                            <span className="text-zinc-300">{new Date(selectedLead.calledAt).toLocaleString()}</span>
                                        </div>
                                    )}
                                    {selectedLead.status === 'retry_scheduled' && selectedLead.nextRetryAt && (
                                        <div className="flex flex-col gap-0.5 col-span-2">
                                            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Next Retry At</span>
                                            <span className="text-blue-400">{new Date(selectedLead.nextRetryAt).toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Dynamically Flattened custom leadData block */}
                            {selectedLead.leadData && typeof selectedLead.leadData === 'object' && Object.keys(selectedLead.leadData).length > 0 && (
                                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3 shadow-sm">
                                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800/80 pb-2">Custom Lead Data Fields</h3>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        {Object.entries(selectedLead.leadData).map(([key, val]) => (
                                            <div key={key} className="flex flex-col gap-0.5">
                                                <span className="text-[10px] text-zinc-500 uppercase font-medium">{key.replace(/_/g, ' ')}</span>
                                                <span className="text-zinc-200 font-mono text-xs">{String(val)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Text Summary */}
                            {selectedLead.callLog?.summary && (
                                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2.5 shadow-sm">
                                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800/80 pb-2">Call Summary</h3>
                                    <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                                        {selectedLead.callLog.summary}
                                    </p>
                                </div>
                            )}

                            {/* Full Chat Transcript bubbles */}
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col min-h-[350px] shadow-sm">
                                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800/80 p-4 pb-2.5">Call Conversation Transcript</h3>
                                <div className="p-4 flex flex-col gap-3.5">
                                    {selectedLead.callLog?.transcript ? (
                                        (() => {
                                            let segments = [];
                                            if (Array.isArray(selectedLead.callLog.transcript)) {
                                                segments = selectedLead.callLog.transcript;
                                            } else if (typeof selectedLead.callLog.transcript === 'string') {
                                                try {
                                                    const parsed = JSON.parse(selectedLead.callLog.transcript);
                                                    if (Array.isArray(parsed)) segments = parsed;
                                                } catch(e) {}
                                            }
                                            
                                            if (segments.length === 0) {
                                                return (
                                                    <div className="text-zinc-500 italic text-center py-10 text-sm">
                                                        No chat transcription available for this call.
                                                    </div>
                                                );
                                            }

                                            return segments.map((msg: any, i: number) => {
                                                const rawSpeaker = String(msg?.speaker || msg?.role || 'system').toLowerCase();
                                                
                                                // Standardize speaker labels
                                                let isAgent = false;
                                                let isUser = false;
                                                let isTool = false;
                                                let isHandoff = false;
                                                let isSystem = false;
                                                
                                                if (rawSpeaker === 'assistant' || rawSpeaker === 'agent' || rawSpeaker === 'ai') {
                                                    isAgent = true;
                                                } else if (rawSpeaker === 'user' || rawSpeaker === 'caller' || rawSpeaker === 'customer' || rawSpeaker === 'human') {
                                                    isUser = true;
                                                } else if (rawSpeaker === 'tool' || rawSpeaker === 'function') {
                                                    isTool = true;
                                                } else if (rawSpeaker === 'handoff') {
                                                    isHandoff = true;
                                                } else {
                                                    isSystem = true;
                                                }
                                                
                                                let label = "System";
                                                if (isAgent) label = "Agent";
                                                else if (isUser) label = "Caller";
                                                else if (isTool) label = "System / Tool";
                                                
                                                // Parse content defensively
                                                let content = "";
                                                if (msg.text) {
                                                    content = msg.text;
                                                } else if (typeof msg.content === 'string') {
                                                    content = msg.content;
                                                } else if (msg.content && typeof msg.content === 'object' && msg.content.text) {
                                                    content = msg.content.text;
                                                } else {
                                                    content = JSON.stringify(msg.content || msg);
                                                }

                                                // Format timestamp
                                                let timeStr = "";
                                                if (msg.timestamp) {
                                                    try {
                                                        timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                                                    } catch(e) {}
                                                }

                                                if (isTool) {
                                                    return (
                                                        <div key={i} className="bg-zinc-950 border border-zinc-850 rounded-xl p-3.5 text-xs text-left">
                                                            <div className="flex justify-between items-center mb-1.5">
                                                                <span className="font-bold text-blue-400 uppercase tracking-widest text-[10px]">Tool Execution: {msg.tool_name}</span>
                                                                {timeStr && <span className="text-[9px] text-zinc-500 font-mono">{timeStr}</span>}
                                                            </div>
                                                            <div className="grid grid-cols-1 gap-2">
                                                                <div className="bg-zinc-900/50 p-2 rounded-lg border border-zinc-850">
                                                                    <span className="text-[9px] text-zinc-500 uppercase font-bold block mb-0.5">Arguments</span>
                                                                    <pre className="text-[10px] text-zinc-300 font-mono overflow-x-auto whitespace-pre-wrap">{JSON.stringify(msg.args || {}, null, 2)}</pre>
                                                                </div>
                                                                <div className="bg-zinc-900/50 p-2 rounded-lg border border-zinc-850">
                                                                    <span className="text-[9px] text-zinc-500 uppercase font-bold block mb-0.5">Result</span>
                                                                    <pre className="text-[10px] text-zinc-300 font-mono overflow-x-auto whitespace-pre-wrap">{JSON.stringify(msg.result || {}, null, 2)}</pre>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                if (isHandoff) {
                                                    return (
                                                        <div key={i} className="flex justify-center my-1">
                                                            <div className="bg-amber-500/5 border border-amber-500/10 rounded-full px-4 py-1.5 flex items-center gap-2 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                                                                Call Transfer: {msg.from_agent} → {msg.to_agent}
                                                                {msg.reason && <span className="text-[9px] text-amber-400/60 lowercase italic font-normal">({msg.reason})</span>}
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div key={i} className={`flex flex-col gap-1 max-w-[85%] ${isAgent ? 'self-start text-left' : isUser ? 'self-end text-right' : 'self-center w-full text-center'}`}>
                                                        <div className={`flex items-baseline gap-2 ${isAgent ? 'flex-row' : 'flex-row-reverse'}`}>
                                                            <span className={`text-[9px] uppercase font-bold tracking-wider ${isAgent ? 'text-blue-500' : isUser ? 'text-emerald-500' : 'text-zinc-500'}`}>
                                                                {label}
                                                            </span>
                                                            {timeStr && <span className="text-[8px] text-zinc-500 font-mono">{timeStr}</span>}
                                                        </div>
                                                        <div className={`p-3 rounded-2xl text-sm leading-relaxed text-left ${
                                                            isAgent ? 'bg-blue-600/10 border border-blue-500/25 text-zinc-200 rounded-tl-sm' :
                                                            isUser ? 'bg-emerald-600/10 border border-emerald-500/25 text-zinc-200 rounded-tr-sm' :
                                                            'bg-zinc-800/60 text-zinc-400 italic text-center w-full rounded-lg'
                                                        }`}>
                                                            {content}
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()
                                    ) : (
                                        <div className="text-zinc-500 italic text-center py-10 text-sm">
                                            {selectedLead.callLog ? "No chat transcription available for this call." : "Call hasn't been placed yet."}
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
