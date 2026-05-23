"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    MessageCircle, Plus, Search, Trash2, Edit, CheckCircle,
    XCircle, Palette, Activity, Download, Settings, Server
} from "lucide-react";
import { WebChatAgent } from "@/db/schema";

function MetricCard({
    title,
    value,
    icon: Icon,
    trend,
    trendUp
}: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    trend?: string;
    trendUp?: boolean;
}) {
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col justify-between hover:border-zinc-700 transition-colors">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-zinc-800 rounded-lg">
                    <Icon className="w-5 h-5 text-zinc-400" />
                </div>
                {trend && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <h3 className="text-3xl font-bold text-zinc-100 mb-1">{value}</h3>
                <p className="text-sm text-zinc-400 font-medium">{title}</p>
            </div>
        </div>
    );
}

export default function WebChatDashboard() {
    const [agents, setAgents] = useState<WebChatAgent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        fetchAgents();
    }, []);

    const fetchAgents = async () => {
        try {
            const res = await fetch("/api/web-chat");
            if (res.ok) {
                const data = await res.json();
                setAgents(data);
            }
        } catch (error) {
            console.error("Failed to fetch web chat agents:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this Web Chat Agent? Any active widget instances on client websites will instantly fail to load.")) return;

        setDeletingId(id);
        try {
            const res = await fetch(`/api/web-chat/${id}`, { method: "DELETE" });
            if (res.ok) {
                setAgents(agents.filter(a => a.id !== id));
            } else {
                alert("Failed to delete agent");
            }
        } catch (error) {
            console.error("Delete failed:", error);
        } finally {
            setDeletingId(null);
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean | null) => {
        try {
            const res = await fetch(`/api/web-chat/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ enabled: !currentStatus })
            });
            if (res.ok) {
                const updated = await res.json();
                setAgents(agents.map(a => a.id === id ? updated : a));
            }
        } catch (error) {
            console.error("Toggle failed:", error);
        }
    };

    const filteredAgents = agents.filter(a =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.description || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalAgents = agents.length;
    const enabledAgents = agents.filter(a => a.enabled).length;
    const disabledAgents = totalAgents - enabledAgents;

    return (
        <div className="w-full h-full overflow-y-auto bg-zinc-950 p-8 md:p-10">
            <div className="max-w-[1600px] mx-auto flex flex-col gap-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                            <MessageCircle className="w-8 h-8 text-blue-500" />
                            Web Chat Agents
                        </h1>
                        <p className="text-zinc-400 mt-2 text-sm max-w-2xl">
                            Configure Omni-Model embeddable Web Chat Widgets for client websites. Manage Voice-Widget properties, whitelist allowed Origins to protect API quotas, and copy injection scripts below.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Link
                            href="/web-chat/create"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20"
                        >
                            <Plus className="w-4 h-4" />
                            Create Chat Agent
                        </Link>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <MetricCard
                        title="Total Active Chatbots"
                        value={totalAgents}
                        icon={Server}
                    />
                    <MetricCard
                        title="Enabled Deployments"
                        value={enabledAgents}
                        icon={CheckCircle}
                        trend="Active" trendUp={true}
                    />
                    <MetricCard
                        title="Disabled Deployments"
                        value={disabledAgents}
                        icon={XCircle}
                        trend="Offline" trendUp={false}
                    />
                </div>

                {/* Command Bar */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-sm">
                    <div className="relative w-full sm:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search web chat agents by name or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-zinc-800 border-none text-white rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-1 focus:ring-blue-500 placeholder:text-zinc-500"
                        />
                    </div>
                    <div className="text-sm font-medium text-zinc-400">
                        Showing {filteredAgents.length} agents
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-800/50 text-zinc-400 border-b border-zinc-800">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Agent Name</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold">LLM Core</th>
                                    <th className="px-6 py-4 font-semibold">Widget UI</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                <p>Loading Web Chat Agents...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredAgents.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center text-zinc-500">
                                            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-zinc-700" />
                                            <p className="text-lg font-medium text-zinc-300">No Web Chat Agents Found</p>
                                            <p className="text-sm mt-1">Create your first embeddable Web Chat Widget to get started.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAgents.map((agent) => {
                                        // Safely extract widget configs
                                        const wc = agent.widgetConfig as { primary_color?: string; theme?: string; position?: string };
                                        const primaryColor = wc?.primary_color || '#3b82f6';
                                        const theme = wc?.theme || 'dark';

                                        return (
                                            <tr key={agent.id} className="hover:bg-zinc-800/30 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-zinc-100">{agent.name}</span>
                                                        <span className="text-xs text-zinc-500 mt-1 max-w-[250px] truncate">
                                                            {agent.description || "No description provided"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => toggleStatus(agent.id, agent.enabled)}
                                                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${agent.enabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                                                            role="switch"
                                                            aria-checked={agent.enabled ?? false}
                                                        >
                                                            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${agent.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                                        </button>
                                                        <span className={`text-xs font-medium px-2 py-1 rounded-md ${agent.enabled
                                                                ? "bg-emerald-500/10 text-emerald-400"
                                                                : "bg-zinc-800 text-zinc-400"
                                                            }`}>
                                                            {agent.enabled ? "Active" : "Disabled"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col items-start gap-1">
                                                        <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded text-[10px] uppercase font-bold tracking-wider border border-zinc-700">
                                                            {agent.llmProvider}
                                                        </span>
                                                        <span className="text-xs font-mono text-zinc-400 bg-zinc-950 px-2 py-1 rounded">
                                                            {agent.llmModel}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="w-5 h-5 rounded-full shadow-inner border border-zinc-800/50"
                                                            style={{ backgroundColor: primaryColor }}
                                                            title={`Primary Color: ${primaryColor}`}
                                                        />
                                                        <span className="text-xs font-medium text-zinc-400 capitalize bg-zinc-800 px-2 py-1 rounded-md">
                                                            {theme} Theme
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Link
                                                            href={`/web-chat/edit/${agent.id}`}
                                                            className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                            title="Edit/Get Embed Code"
                                                        >
                                                            <Settings className="w-4 h-4" />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(agent.id)}
                                                            disabled={deletingId === agent.id}
                                                            className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-50"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
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
