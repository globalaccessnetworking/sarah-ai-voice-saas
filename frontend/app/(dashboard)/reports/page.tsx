"use client";

import React, { useState, useEffect } from 'react';
import {
    FileText, Plus, Search, Filter, Play, Edit3, Trash2,
    ToggleLeft, ToggleRight, Clock, CheckCircle2, XCircle, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import MetricCard from '@/components/MetricCard';

interface ReportRule {
    id: string;
    name: string;
    enabled: boolean;
    triggerType: 'post_call' | 'post_analysis' | 'scheduled';
    recipients: string[];
    createdAt: string;
}

interface ReportHistory {
    id: string;
    ruleId: string;
    ruleName: string | null;
    status: 'sent' | 'failed';
    errorMessage: string | null;
    executedAt: string;
}

export default function ReportsPage() {
    const [rules, setRules] = useState<ReportRule[]>([]);
    const [history, setHistory] = useState<ReportHistory[]>([]);
    const [loading, setLoading] = useState(true);

    const [mockEmailConfigured] = useState(false); // Used to display the warning banner

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [rulesRes, historyRes] = await Promise.all([
                fetch('/api/reports'),
                fetch('/api/reports/history')
            ]);

            if (rulesRes.ok) setRules(await rulesRes.json());
            if (historyRes.ok) setHistory(await historyRes.json());
        } catch (error) {
            console.error('Failed to fetch reports data', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleRule = async (rule: ReportRule) => {
        try {
            const res = await fetch(`/api/reports/${rule.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...rule, enabled: !rule.enabled })
            });
            if (res.ok) {
                fetchData();
            }
        } catch (error) {
            console.error('Failed to toggle rule', error);
        }
    };

    const deleteRule = async (id: string) => {
        if (!confirm('Are you sure you want to delete this report rule?')) return;
        try {
            const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
            if (res.ok) fetchData();
        } catch (error) {
            console.error('Failed to delete rule', error);
        }
    };

    const runNow = async (id: string) => {
        // In a real implementation, this would trigger the backend job runner manually
        alert(`Triggering report ${id}... Note: SMTP depends on Phase 13.`);
    };

    const activeCount = rules.filter(r => r.enabled).length;
    const disabledCount = rules.length - activeCount;

    return (
        <div className="min-h-screen bg-black text-zinc-200 selection:bg-zinc-800">
            <div className="w-full h-full overflow-y-auto bg-zinc-950 p-8 md:p-10">
                <div className="max-w-[1600px] mx-auto flex flex-col gap-8">

                    {/* Environment Warning Banner */}
                    {!mockEmailConfigured && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-amber-500">SMTP Not Configured</h4>
                                <p className="text-xs text-amber-500/80 mt-1">
                                    Report rules can be created, but emails will not be sent until a valid SMTP configuration is added in Settings.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold font-mono tracking-tight text-zinc-50 mb-1.5 flex items-center gap-3">
                                Automated Reports
                                <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-full uppercase tracking-widest">
                                    Event Engine
                                </span>
                            </h1>
                            <p className="text-sm text-zinc-500 font-medium">
                                Configure event-driven triggers and scheduled delivery rules for conversational intelligence.
                            </p>
                        </div>
                        <Link
                            href="/reports/create"
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
                        >
                            <Plus className="w-4 h-4" /> Create Rule
                        </Link>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                        <MetricCard
                            title="Total Rules"
                            value={rules.length.toString()}
                            icon={<FileText className="w-4 h-4" />}
                        />
                        <MetricCard
                            title="Active Rules"
                            value={activeCount.toString()}
                            icon={<CheckCircle2 className="w-4 h-4" />}
                            status="success"
                        />
                        <MetricCard
                            title="Disabled Rules"
                            value={disabledCount.toString()}
                            icon={<XCircle className="w-4 h-4" />}
                            status={disabledCount > 0 ? "warning" : "neutral"}
                        />
                        <MetricCard
                            title="Recent Executions"
                            value={history.length.toString()}
                            description="Last 24 hours"
                            icon={<Clock className="w-4 h-4" />}
                        />
                    </div>

                    {/* Main Rules Table */}
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm flex flex-col w-full">
                        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
                            <h3 className="font-bold text-zinc-100 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-emerald-500" />
                                Reporting Rules
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-zinc-900/50 border-b border-zinc-800 text-xs uppercase font-bold text-zinc-500 tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Rule Name</th>
                                        <th className="px-6 py-4">Trigger Event</th>
                                        <th className="px-6 py-4">Recipients</th>
                                        <th className="px-6 py-4">Created</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50">
                                    {loading ? (
                                        <tr><td colSpan={6} className="px-6 py-12 text-center text-zinc-500 font-medium">Loading rules...</td></tr>
                                    ) : rules.length === 0 ? (
                                        <tr><td colSpan={6} className="px-6 py-12 text-center text-zinc-500 font-medium">No reporting rules configured.</td></tr>
                                    ) : (
                                        rules.map((rule) => (
                                            <tr key={rule.id} className="hover:bg-zinc-800/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <button onClick={() => toggleRule(rule)} className={`p-1 rounded-full transition-colors ${rule.enabled ? 'text-emerald-500 bg-emerald-500/10' : 'text-zinc-500 bg-zinc-800'}`}>
                                                        {rule.enabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-zinc-200">{rule.name}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${rule.triggerType === 'post_call' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                        rule.triggerType === 'post_analysis' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                            'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                        }`}>
                                                        {rule.triggerType.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-zinc-400 font-mono text-xs">{rule.recipients.length} configured</td>
                                                <td className="px-6 py-4 text-zinc-400">{new Date(rule.createdAt).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => runNow(rule.id)} className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all" title="Run Now">
                                                            <Play className="w-4 h-4" />
                                                        </button>
                                                        <Link href={`/reports/create?id=${rule.id}`} className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all" title="Edit Rule">
                                                            <Edit3 className="w-4 h-4" />
                                                        </Link>
                                                        <button onClick={() => deleteRule(rule.id)} className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all" title="Delete Rule">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Execution History */}
                    <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl overflow-hidden flex flex-col w-full">
                        <div className="px-6 py-4 border-b border-zinc-800/50 bg-zinc-900/50 flex items-center justify-between">
                            <h3 className="font-bold text-zinc-400 flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4" />
                                Recent Executions
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-zinc-900/20 border-b border-zinc-800/50 text-[10px] uppercase font-bold text-zinc-600 tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3">Rule Name</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Timestamp</th>
                                        <th className="px-6 py-3">Diagnostics</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/30">
                                    {loading ? (
                                        <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-600">Loading history...</td></tr>
                                    ) : history.length === 0 ? (
                                        <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-600">No execution history found.</td></tr>
                                    ) : (
                                        history.map((log) => (
                                            <tr key={log.id} className="hover:bg-zinc-800/20 transition-colors text-xs">
                                                <td className="px-6 py-3 text-zinc-300">{log.ruleName || log.ruleId}</td>
                                                <td className="px-6 py-3">
                                                    {log.status === 'sent' ? (
                                                        <span className="flex items-center gap-1.5 text-emerald-500"><CheckCircle2 className="w-3.5 h-3.5" /> Sent</span>
                                                    ) : (
                                                        <span className="flex items-center gap-1.5 text-rose-500"><XCircle className="w-3.5 h-3.5" /> Failed</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-3 text-zinc-500 font-mono">{new Date(log.executedAt).toLocaleString()}</td>
                                                <td className="px-6 py-3 text-zinc-500 truncate max-w-xs">{log.errorMessage || 'Success'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
