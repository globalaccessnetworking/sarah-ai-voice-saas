"use client";

import { useEffect, useState } from "react";
import { 
    Zap, 
    PhoneCall, 
    CheckCircle2, 
    AlertCircle, 
    Clock, 
    TrendingUp, 
    Activity,
    User,
    RefreshCw,
    PieChart as PieIcon,
    ArrowUpRight
} from "lucide-react";
import { 
    PieChart, 
    Pie, 
    Cell, 
    ResponsiveContainer, 
    Tooltip, 
    Legend 
} from "recharts";
import { format } from "date-fns";

interface OutboundStats {
    attempts: number;
    answered: number;
    verified: number;
    stillIssue: number;
    avgDuration: number;
    successRate: number;
    resolutionRate: number;
}

interface Distribution {
    name: string;
    value: number;
    percent: number;
    color: string;
}

interface CallLog {
    id: string;
    ticketId: string;
    citizenName: string;
    phoneNumber: string;
    outcome: string;
    duration: number;
    timestamp: string;
    agentName: string;
}

export default function OutboundAnalyticsPage() {
    const [data, setData] = useState<{ stats: OutboundStats; distribution: Distribution[]; logs: CallLog[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPolling, setIsPolling] = useState(false);

    const fetchData = async (silent = false) => {
        if (!silent) setLoading(true);
        else setIsPolling(true);
        
        try {
            const res = await fetch("/api/analytics/outbound");
            const json = await res.json();
            if (res.ok) setData(json);
        } catch (err) {
            console.error("Failed to fetch outbound analytics:", err);
        } finally {
            setLoading(false);
            setIsPolling(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => fetchData(true), 10000); // 10s Poll
        return () => clearInterval(interval);
    }, []);

    const renderOutcomeBadge = (outcome: string) => {
        switch (outcome) {
            case "verified":
                return <span className="badge badge-success flex items-center gap-1"><CheckCircle2 size={12} /> Verified</span>;
            case "still_issue":
                return <span className="badge badge-danger flex items-center gap-1"><AlertCircle size={12} /> Still Issue</span>;
            case "no_response":
            case "no_feedback":
                return <span className="badge badge-secondary">Abandoned</span>;
            default:
                return <span className="badge badge-secondary">{outcome}</span>;
        }
    };

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
                <div className="w-12 h-12 border-4 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400 font-medium animate-pulse">Initializing HUD Telemetry...</p>
            </div>
        );
    }

    if (!data) return <div className="p-8 text-red-500">Failed to load HUD data. Check API logs.</div>;

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <Zap className="text-[var(--brand-primary)]" /> Sarah AI: Outbound HUD
                    </h1>
                    <p className="text-[var(--text-tertiary)] text-sm">Real-time resolution verify performance & Digital Ear feedback.</p>
                </div>
                <div className="flex items-center gap-3">
                    {isPolling && (
                        <div className="flex items-center gap-2 text-xs text-[var(--brand-primary)]">
                            <RefreshCw size={12} className="animate-spin" /> Fetching Live Edge...
                        </div>
                    )}
                    <button onClick={() => fetchData()} className="btn btn-secondary btn-sm flex items-center gap-2">
                        <RefreshCw size={14} /> Refresh HUD
                    </button>
                    <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500 rounded-full text-emerald-500 text-xs font-bold flex items-center gap-1.5">
                        <Activity size={12} className="animate-pulse" /> LIVE TELEMETRY
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stat-card">
                    <div className="stat-icon bg-blue-500/10 text-blue-500"><PhoneCall size={18} /></div>
                    <div className="stat-info">
                        <span className="stat-label">Total Attempts</span>
                        <span className="stat-value">{data.stats.attempts}</span>
                        <span className="stat-trend text-blue-500/80">Dispatched via SIP</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon bg-indigo-500/10 text-indigo-500"><TrendingUp size={18} /></div>
                    <div className="stat-info">
                        <span className="stat-label">Answered Rate</span>
                        <span className="stat-value">{data.stats.successRate}%</span>
                        <span className="stat-trend text-indigo-500/80">{data.stats.answered} Citizens Connected</span>
                    </div>
                </div>
                <div className="stat-card border-[var(--brand-primary)]/30 bg-[var(--brand-primary)]/5">
                    <div className="stat-icon bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]"><CheckCircle2 size={18} /></div>
                    <div className="stat-info">
                        <span className="stat-label">Resolution Rate</span>
                        <span className="stat-value text-[var(--brand-primary)]">{data.stats.resolutionRate}%</span>
                        <span className="stat-trend text-[var(--brand-primary)]/80">{data.stats.verified} Verified Closures</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon bg-orange-500/10 text-orange-500"><Clock size={18} /></div>
                    <div className="stat-info">
                        <span className="stat-label">Avg. Engagement</span>
                        <span className="stat-value">{data.stats.avgDuration}s</span>
                        <span className="stat-trend text-orange-500/80">Seconds per session</span>
                    </div>
                </div>
            </div>

            {/* Middle Section: Distribution & Live Monitor */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Distribution Chart */}
                <div className="card lg:col-span-1">
                    <div className="card-header">
                        <h3 className="card-title flex items-center gap-2"><PieIcon size={16} /> Resolution Distribution</h3>
                    </div>
                    <div className="card-body flex flex-col items-center justify-center p-6 h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.distribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.distribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="mt-4 grid grid-cols-1 gap-2 w-full">
                            {data.distribution.map((item) => (
                                <div key={item.name} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                        <span className="text-[var(--text-secondary)]">{item.name}</span>
                                    </div>
                                    <span className="font-bold">{item.percent}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Live HUD Monitor */}
                <div className="card lg:col-span-2 overflow-hidden flex flex-col">
                    <div className="card-header flex justify-between items-center bg-zinc-900">
                        <h3 className="card-title flex items-center gap-2"><Activity size={16} /> Live Outcome HUD Feed</h3>
                        <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Streaming Latest 20 Events</span>
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[400px]">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
                                <tr>
                                    <th className="text-left p-3 font-semibold text-xs text-[var(--text-muted)]">Citizen</th>
                                    <th className="text-left p-3 font-semibold text-xs text-[var(--text-muted)]">Ticket</th>
                                    <th className="text-left p-3 font-semibold text-xs text-[var(--text-muted)]">Outcome</th>
                                    <th className="text-center p-3 font-semibold text-xs text-[var(--text-muted)]">Dur.</th>
                                    <th className="text-right p-3 font-semibold text-xs text-[var(--text-muted)]">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                                {data.logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors group">
                                        <td className="p-3">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-[var(--text-primary)] flex items-center gap-1.5">
                                                    <User size={12} className="text-[var(--text-muted)]" /> {log.citizenName}
                                                </span>
                                                <span className="text-[10px] text-[var(--text-muted)]">{log.phoneNumber}</span>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <code className="px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[10px] text-[var(--brand-primary)] font-bold">
                                                {log.ticketId}
                                            </code>
                                        </td>
                                        <td className="p-3">
                                            {renderOutcomeBadge(log.outcome)}
                                        </td>
                                        <td className="p-3 text-center text-xs text-[var(--text-tertiary)]">
                                            {log.duration}s
                                        </td>
                                        <td className="p-3 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs">{format(new Date(log.timestamp), "h:mm a")}</span>
                                                <span className="text-[10px] text-[var(--text-muted)]">{format(new Date(log.timestamp), "MMM dd")}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Bottom Section: System Intelligence */}
            <div className="card bg-emerald-500/5 border-emerald-500/20">
                <div className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#22c55e]/10 rounded-xl flex items-center justify-center text-[#22c55e]">
                        <TrendingUp size={24} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-[#22c55e] flex items-center gap-2">
                             Digital Ear: Automated resolution verification is online.
                        </h4>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Sarah is currently processing Urdu and Punjabi intents. {data.stats.verified} tickets closed this cycle without human agent interaction.
                        </p>
                    </div>
                    <button className="btn btn-sm btn-primary flex items-center gap-1 font-bold">
                        View Detailed Audit <ArrowUpRight size={14} />
                    </button>
                </div>
            </div>

            <style jsx>{`
                .stat-card {
                    background: var(--card-bg);
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-lg);
                    padding: 1.25rem;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .stat-card:hover {
                    box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
                    transform: translateY(-2px);
                    border-color: var(--brand-primary);
                }
                .stat-icon {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-center;
                }
                .stat-info {
                    display: flex;
                    flex-direction: column;
                }
                .stat-label {
                    font-size: 0.75rem;
                    color: var(--text-tertiary);
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .stat-value {
                    font-size: 1.5rem;
                    font-weight: 800;
                    line-height: 1.2;
                    margin: 0.1rem 0;
                }
                .stat-trend {
                    font-size: 10px;
                    font-weight: 600;
                }
            `}</style>
        </div>
    );
}
