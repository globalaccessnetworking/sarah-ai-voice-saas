"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, Search, Loader2 } from "lucide-react";

export default function AuditLogPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/audit");
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            }
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(l =>
        l.userEmail.toLowerCase().includes(search.toLowerCase()) ||
        l.action.toLowerCase().includes(search.toLowerCase()) ||
        (l.resourceType && l.resourceType.toLowerCase().includes(search.toLowerCase()))
    );

    const getActionColor = (action: string) => {
        const lower = action.toLowerCase();
        if (['login', 'start', 'create'].includes(lower)) return 'bg-green-500/10 text-green-400 border-green-500/20';
        if (['delete', 'stop', 'login_failed'].includes(lower)) return 'bg-red-500/10 text-red-400 border-red-500/20';
        if (['edit', 'update', 'password_change'].includes(lower)) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    };

    return (
        <div className="w-full h-full overflow-y-auto bg-zinc-950 p-8 md:p-10 text-slate-200">
            <div className="max-w-[1600px] mx-auto flex flex-col gap-8">

                {/* Header Region */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <ShieldAlert className="w-8 h-8 text-blue-500" />
                            System Audit Logs
                        </h1>
                        <p className="text-zinc-400 mt-2">Immutable compliance record of all platform actions across all tenants.</p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                    <div className="relative">
                        <Search className="w-5 h-5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Find action by user email, action type, or resource..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded pl-10 pr-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-zinc-950/50 text-zinc-400 text-xs uppercase font-semibold border-b border-zinc-800">
                                <tr>
                                    <th className="px-6 py-4">Timestamp (UTC)</th>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Action</th>
                                    <th className="px-6 py-4">Resource</th>
                                    <th className="px-6 py-4 w-1/3 text-wrap">Details</th>
                                    <th className="px-6 py-4 text-right">IP Address</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800 font-mono">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-zinc-500 font-sans">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                            Loading audit records...
                                        </td>
                                    </tr>
                                ) : filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-zinc-500 font-sans">
                                            No audit logs found. System is either new or search yielded no results.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-zinc-800/50 transition-colors">
                                            <td className="px-6 py-3 text-zinc-400 text-xs">
                                                {new Date(log.timestamp).toISOString().replace('T', ' ').substring(0, 19)}
                                            </td>
                                            <td className="px-6 py-3 text-blue-400">
                                                {log.userEmail}
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className={`px-2 py-1 rounded text-xs border uppercase tracking-wider ${getActionColor(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="text-zinc-300">{log.resourceType || '-'}</div>
                                                {log.resourceId && <div className="text-xs text-zinc-500 truncate max-w-[150px]">{log.resourceId}</div>}
                                            </td>
                                            <td className="px-6 py-3 text-zinc-400 text-xs text-wrap break-words max-w-sm">
                                                {log.details || '-'}
                                            </td>
                                            <td className="px-6 py-3 text-right text-zinc-500 text-xs">
                                                {log.ipAddress || '127.0.0.1'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
