"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Play, Pause, Square, Trash2, Megaphone, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Campaign {
    id: string;
    name: string;
    status: string;
    campaignType: string;
    sipTrunkId: string;
    agentId: string;
    concurrency: number;
    callDelaySeconds: number;
    stats: {
        total: number;
        completed: number;
        failed: number;
    };
    createdAt: string;
}

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [pageError, setPageError] = useState("");

    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                const res = await fetch("/api/campaigns");
                if (res.ok) {
                    const data = await res.json();
                    setCampaigns(data);
                }
            } catch (error) {
                console.error("Error fetching campaigns:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCampaigns();
    }, []);

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        setPageError("");
        try {
            let endpoint = `/api/campaigns/${id}`;
            let method = "PUT";
            let mappedStatus = newStatus;
            
            if (newStatus === "running") {
                endpoint = `/api/campaigns/${id}/start`;
                method = "POST";
            } else if (newStatus === "paused") {
                endpoint = `/api/campaigns/${id}/pause`;
                method = "POST";
            } else if (newStatus === "cancelled") {
                endpoint = `/api/campaigns/${id}/stop`;
                method = "POST";
            } else if (newStatus === "resume") {
                endpoint = `/api/campaigns/${id}/resume`;
                method = "POST";
                mappedStatus = "running";
            }
            
            const res = await fetch(endpoint, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: method === "PUT" ? JSON.stringify({ status: newStatus }) : undefined,
            });

            if (res.ok) {
                setCampaigns(campaigns.map(c => c.id === id ? { ...c, status: mappedStatus } : c));
            } else {
                const err = await res.json();
                setPageError(`Failed to update campaign: ${err.error || err.details || "Unknown error"}`);
            }
        } catch (error: any) {
            console.error("Error updating campaign status", error);
            setPageError(`Failed to update campaign: ${error.message || "Network error"}`);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this campaign? All associated numbers will also be deleted.")) return;
        setPageError("");

        try {
            const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
            if (res.ok) {
                setCampaigns(campaigns.filter(c => c.id !== id));
            } else {
                const err = await res.json();
                setPageError(`Failed to delete campaign: ${err.error || "Unknown error"}`);
            }
        } catch (error: any) {
            console.error("Error deleting campaign", error);
            setPageError(`Failed to delete campaign: ${error.message || "Network error"}`);
        }
    };

    const filteredCampaigns = campaigns.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalCampaigns = campaigns.length;
    const runningCampaigns = campaigns.filter(c => c.status === "running").length;
    const pausedCampaigns = campaigns.filter(c => c.status === "paused").length;
    const completedCampaigns = campaigns.filter(c => c.status === "completed").length;

    return (
        <div className="w-full h-full overflow-y-auto bg-zinc-950 p-8 md:p-10">
            <div className="max-w-[1600px] mx-auto flex flex-col gap-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                            <Megaphone className="h-8 w-8 text-blue-500" />
                            Outbound Campaigns
                        </h1>
                        <p className="text-zinc-400 mt-1">Manage bulk automated dialing and concurrent lead engagement.</p>
                    </div>
                    <Link
                        href="/telephony/campaigns/create"
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Create Campaign
                    </Link>
                </div>

                {pageError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-3 text-red-400">
                        <AlertCircle size={18} />
                        <span className="text-sm font-medium">{pageError}</span>
                    </div>
                )}

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex flex-col gap-3">
                        <div className="flex items-center justify-between text-zinc-400">
                            <span className="text-sm font-medium tracking-wide uppercase">Total Campaigns</span>
                            <Megaphone size={16} />
                        </div>
                        <div className="text-3xl font-bold text-white">{totalCampaigns}</div>
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex flex-col gap-3">
                        <div className="flex items-center justify-between text-zinc-400">
                            <span className="text-sm font-medium tracking-wide uppercase">Running</span>
                            <Play size={16} className="text-green-500" />
                        </div>
                        <div className="text-3xl font-bold text-white">{runningCampaigns}</div>
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex flex-col gap-3">
                        <div className="flex items-center justify-between text-zinc-400">
                            <span className="text-sm font-medium tracking-wide uppercase">Paused</span>
                            <Pause size={16} className="text-amber-500" />
                        </div>
                        <div className="text-3xl font-bold text-white">{pausedCampaigns}</div>
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex flex-col gap-3">
                        <div className="flex items-center justify-between text-zinc-400">
                            <span className="text-sm font-medium tracking-wide uppercase">Completed</span>
                            <CheckCircle2 size={16} className="text-blue-500" />
                        </div>
                        <div className="text-3xl font-bold text-white">{completedCampaigns}</div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="card p-4 flex gap-4 mt-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                        <input
                            type="text"
                            placeholder="Find campaign by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field pl-10 w-full"
                        />
                    </div>
                </div>

                {/* Data Table */}
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="data-table w-full">
                            <thead>
                                <tr>
                                    <th>Campaign Name</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Progress</th>
                                    <th>Concurrency</th>
                                    <th>Created</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-8 text-zinc-500">
                                            Loading campaigns...
                                        </td>
                                    </tr>
                                ) : filteredCampaigns.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-8 text-zinc-500">
                                            {searchTerm ? "No campaigns match your search." : "No outbound campaigns configured yet."}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCampaigns.map((campaign) => {
                                        const { total, completed, failed } = campaign.stats || { total: 0, completed: 0, failed: 0 };
                                        const pending = total - (completed + failed);

                                        // Calculate percentages for stacked bar
                                        const totalValid = total > 0 ? total : 1;
                                        const completedPct = (completed / totalValid) * 100;
                                        const failedPct = (failed / totalValid) * 100;
                                        const pendingPct = (pending / totalValid) * 100;
                                        
                                        const isPreview = campaign.campaignType === 'preview' || campaign.campaignType === 'vicidial';

                                        return (
                                            <tr key={campaign.id}>
                                                <td className="font-medium text-white">
                                                    {campaign.name}
                                                </td>
                                                <td>
                                                    <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 bg-zinc-900 px-2 py-1 rounded">
                                                        {campaign.campaignType || 'progressive'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`badge ${campaign.status === "running" ? "badge-success" :
                                                            campaign.status === "paused" ? "badge-warning" :
                                                                campaign.status === "completed" ? "badge-info" :
                                                                    campaign.status === "cancelled" || campaign.status === "stopped" ? "badge-danger" :
                                                                        "badge-neutral"
                                                        }`}>
                                                        {campaign.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="w-full max-w-[200px] flex flex-col gap-2">
                                                        <div className="flex justify-between text-xs text-zinc-500">
                                                            <span>{completed + failed} / {total}</span>
                                                            <span className="text-zinc-400">{Math.round(((completed + failed) / totalValid) * 100)}%</span>
                                                        </div>
                                                        <div className="h-2 w-full bg-zinc-800 rounded-full flex overflow-hidden">
                                                            <div className="bg-emerald-500 h-full" style={{ width: `${completedPct}%` }} title={`Completed: ${completed}`} />
                                                            <div className="bg-red-500 h-full" style={{ width: `${failedPct}%` }} title={`Failed: ${failed}`} />
                                                            <div className="bg-zinc-700 h-full" style={{ width: `${pendingPct}%` }} title={`Pending: ${pending}`} />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-zinc-400">
                                                    {campaign.concurrency} calls
                                                </td>
                                                <td className="text-zinc-400 whitespace-nowrap">
                                                    {new Date(campaign.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Link href={`/telephony/campaigns/edit/${campaign.id}`} className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 rounded-md transition-colors" title="Edit Campaign">
                                                                <Megaphone size={16} />
                                                            </Link>
                                                            
                                                            {(campaign.status === "idle" || campaign.status === "draft" || campaign.status === "stopped") ? (
                                                                <button 
                                                                    onClick={() => handleUpdateStatus(campaign.id, "running")} 
                                                                    className={`p-2 rounded-md transition-colors ${isPreview ? "text-zinc-600 cursor-not-allowed" : "text-zinc-400 hover:text-green-400 hover:bg-zinc-800"}`} 
                                                                    title={isPreview ? "Manual/ViciDial campaigns cannot be auto-started" : "Start Campaign"}
                                                                    disabled={isPreview}
                                                                >
                                                                    <Play size={16} />
                                                                </button>
                                                            ) : campaign.status === "paused" ? (
                                                                <button 
                                                                    onClick={() => handleUpdateStatus(campaign.id, "resume")} 
                                                                    className={`p-2 rounded-md transition-colors ${isPreview ? "text-zinc-600 cursor-not-allowed" : "text-zinc-400 hover:text-green-400 hover:bg-zinc-800"}`} 
                                                                    title={isPreview ? "Manual/ViciDial campaigns cannot be auto-started" : "Resume Campaign"}
                                                                    disabled={isPreview}
                                                                >
                                                                    <Play size={16} />
                                                                </button>
                                                            ) : campaign.status === "running" ? (
                                                                <button onClick={() => handleUpdateStatus(campaign.id, "paused")} className="p-2 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded-md transition-colors" title="Pause Campaign">
                                                                    <Pause size={16} />
                                                                </button>
                                                            ) : null}

                                                            {campaign.status === "running" || campaign.status === "paused" ? (
                                                                <button onClick={() => handleUpdateStatus(campaign.id, "cancelled")} className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition-colors" title="Stop Campaign">
                                                                    <Square size={16} />
                                                                </button>
                                                            ) : null}

                                                            <button onClick={() => handleDelete(campaign.id)} className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-md transition-colors" title="Delete Campaign">
                                                                <Trash2 size={16} />
                                                            </button>
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
            </div>
        </div>
    );
}
