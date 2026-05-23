"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    Search, Download, Eye, MapPin, Phone, User, FileText, Ticket,
    Calendar, Filter, RefreshCw, Loader2, AlertTriangle, CheckCircle2,
    Clock, XCircle, Building2, Landmark, BarChart3, ChevronLeft,
    ChevronRight, CheckCheck, RotateCcw, Wifi, WifiOff, SlidersHorizontal,
    ArrowUpDown, Trash2, Play, Pause, Activity, Smile, Frown, AlertOctagon, Plus, ShieldCheck,
} from "lucide-react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Complaint {
    id: number;
    ticket_id: string | null;
    name: string | null;
    phone: string | null;
    issue: string | null;
    district: string | null;
    address: string | null;
    landmark: string | null;
    status: string;
    priority: string;
    notes: string | null;
    sentiment: string | null;
    recording_id: string | null;
    created_at: string;
    asterisk_number: string | null;
}

interface Stats {
    total: string;
    pending: string;
    resolved: string;
    unresolved: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 15;
const AUTO_REFRESH_INTERVAL = 30_000; // 30 seconds

// ─── Helper Components ────────────────────────────────────────────────────────
function StatCard({ label, value, icon, accent, onClick, active }: {
    label: string; value: string | number; icon: React.ReactNode;
    accent: string; onClick?: () => void; active?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "rounded-xl border p-4 flex items-center gap-4 bg-zinc-900 w-full text-left transition-all",
                "hover:border-opacity-60 hover:bg-zinc-800",
                active ? `${accent} shadow-lg` : "border-zinc-800"
            )}
        >
            <div className="rounded-lg p-2.5 bg-zinc-800/60 flex-shrink-0">{icon}</div>
            <div>
                <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
            </div>
        </button>
    );
}

function StatusBadge({ status }: { status: string }) {
    const s = (status || "pending").toLowerCase();
    if (s === "resolved")
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-bold gap-1"><CheckCircle2 className="w-3 h-3" />Resolved</Badge>;
    if (s === "unresolved")
        return <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[10px] font-bold gap-1"><XCircle className="w-3 h-3" />Unresolved</Badge>;
    return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] font-bold gap-1"><Clock className="w-3 h-3" />Pending</Badge>;
}

function PriorityBadge({ priority }: { priority: string }) {
    const p = (priority || "normal").toLowerCase();
    if (p === "high" || p === "urgent")
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[9px] font-bold">{priority}</Badge>;
    if (p === "low")
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[9px] font-bold">{priority}</Badge>;
    return <Badge className="bg-zinc-700/40 text-zinc-400 border-zinc-700 text-[9px] font-bold">{priority || "Normal"}</Badge>;
}

function SentimentBadge({ sentiment }: { sentiment: string | null }) {
    const s = (sentiment || "").toLowerCase();
    if (s === "frustrated")
        return <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[10px] font-bold gap-1"><Frown className="w-3 h-3 text-orange-500" />Frustrated 🔥</Badge>;
    if (s === "abusive")
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px] font-bold gap-1"><AlertOctagon className="w-3 h-3 text-red-500" />Abusive ⚠️</Badge>;
    if (s === "calm")
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-bold gap-1"><Smile className="w-3 h-3 text-emerald-500" />Calm 😊</Badge>;
    
    return <Badge className="bg-zinc-800/40 text-zinc-500 border-zinc-800 text-[10px] font-bold gap-1"><Activity className="w-3 h-3" />Analyzing...</Badge>;
}

function formatDate(dateStr: string) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("en-PK", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true,
    });
}

function formatDateShort(dateStr: string) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("en-PK", {
        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true,
    });
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ComplaintsPage() {
    const [allComplaints, setAllComplaints] = useState<Complaint[]>([]);
    const [stats, setStats] = useState<Stats>({ total: "0", pending: "0", resolved: "0", unresolved: "0" });
    const [districts, setDistricts] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [districtFilter, setDistrictFilter] = useState("all");
    const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const [selected, setSelected] = useState<Complaint | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateMsg, setUpdateMsg] = useState<string | null>(null);
    const countdownRef = useRef<number>(30);
    const [countdown, setCountdown] = useState(30);
    const timerRef = useRef<any>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioProgress, setAudioProgress] = useState(0);

    // ── Fetch ──────────────────────────────────────────────────────────────────
    const fetchComplaints = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const params = new URLSearchParams({ limit: "500" });
            if (searchTerm) params.set("search", searchTerm);
            if (statusFilter !== "all") params.set("status", statusFilter);
            if (districtFilter !== "all") params.set("district", districtFilter);

            const res = await fetch(`/api/complaints?${params}`);
            const data = await res.json();
            if (data.complaints) {
                const sorted = [...data.complaints].sort((a, b) =>
                    sortOrder === "desc"
                        ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                        : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
                setAllComplaints(sorted);
            }
            if (data.stats) setStats(data.stats);
            if (data.districts) setDistricts(data.districts);
            setLastRefresh(new Date());
            setCurrentPage(1);
        } catch (err) {
            console.error("Failed to load complaints:", err);
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm, statusFilter, districtFilter, sortOrder]);

    // Debounced fetch on filter change
    useEffect(() => {
        const t = setTimeout(() => fetchComplaints(), 350);
        return () => clearTimeout(t);
    }, [fetchComplaints]);

    // Auto-refresh countdown
    useEffect(() => {
        if (!autoRefresh) { if (timerRef.current) clearInterval(timerRef.current); return; }
        countdownRef.current = 30;
        setCountdown(30);
        timerRef.current = setInterval(() => {
            countdownRef.current -= 1;
            setCountdown(countdownRef.current);
            if (countdownRef.current <= 0) {
                fetchComplaints(true);
                countdownRef.current = 30;
                setCountdown(30);
            }
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [autoRefresh, fetchComplaints]);

    // ── Status Update ──────────────────────────────────────────────────────────
    const updateStatus = async (id: number, newStatus: string) => {
        setIsUpdating(true);
        setUpdateMsg(null);
        try {
            const res = await fetch("/api/complaints", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status: newStatus }),
            });
            const data = await res.json();
            if (data.complaint) {
                setAllComplaints(prev =>
                    prev.map(c => c.id === id ? { ...c, status: data.complaint.status } : c)
                );
                if (selected?.id === id) setSelected(s => s ? { ...s, status: data.complaint.status } : s);
                setUpdateMsg(`✓ Status updated to ${newStatus}`);
                // Refresh stats silently
                fetchComplaints(true);
            }
        } catch (e) {
            setUpdateMsg("✗ Failed to update status");
        } finally {
            setIsUpdating(false);
            setTimeout(() => setUpdateMsg(null), 3000);
        }
    };

    const updatePriority = async (id: number, newPriority: string) => {
        setIsUpdating(true);
        try {
            const res = await fetch("/api/complaints", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, priority: newPriority }),
            });
            const data = await res.json();
            if (data.complaint) {
                setAllComplaints(prev =>
                    prev.map(c => c.id === id ? { ...c, priority: data.complaint.priority } : c)
                );
                if (selected?.id === id) setSelected(s => s ? { ...s, priority: data.complaint.priority } : s);
            }
        } finally {
            setIsUpdating(false);
        }
    };

    // ── Export CSV ─────────────────────────────────────────────────────────────
    const handleExportCSV = () => {
        const headers = ["Ticket ID", "Date & Time", "Name", "Phone", "Issue", "District", "Address", "Landmark", "Status", "Priority"];
        const rows = allComplaints.map(c => [
            c.ticket_id || "", formatDate(c.created_at), c.name || "",
            c.phone || "", c.issue || "", c.district || "",
            c.address || "", c.landmark || "", c.status || "", c.priority || "",
        ]);
        const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
        const a = Object.assign(document.createElement("a"), {
            href: URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })),
            download: `complaints_${new Date().toISOString().slice(0, 10)}.csv`,
        });
        a.click();
    };

    // ── Pagination ─────────────────────────────────────────────────────────────
    const totalPages = Math.max(1, Math.ceil(allComplaints.length / PAGE_SIZE));
    const paginated = allComplaints.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="p-6 max-w-[1700px] mx-auto space-y-5 animate-in fade-in duration-500">

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2.5 mb-1">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-900/40 flex-shrink-0">
                            <FileText className="w-4.5 h-4.5 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Complaint Registry</h1>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-bold">
                            🌿 Suthra Punjab
                        </Badge>
                    </div>
                    <p className="text-zinc-500 text-sm pl-12">
                        All complaints registered by Sarah AI · Auto-sync with PostgreSQL every {countdown}s
                    </p>
                </div>

                <div className="flex items-center gap-2 pl-12 md:pl-0">
                    {/* Live indicator */}
                    <button
                        onClick={() => setAutoRefresh(v => !v)}
                        className={cn(
                            "flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-all",
                            autoRefresh
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                                : "bg-zinc-800/40 border-zinc-700 text-zinc-500 hover:bg-zinc-800"
                        )}
                    >
                        {autoRefresh ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                        {autoRefresh ? `LIVE · ${countdown}s` : "AUTO OFF"}
                    </button>

                    <Button size="sm"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white h-8 text-[11px] font-bold gap-1.5 shadow-lg shadow-emerald-900/20"
                        onClick={() => setIsNewModalOpen(true)}>
                        <Plus className="w-3.5 h-3.5" />
                        New Complaint
                    </Button>

                    <Button variant="outline" size="sm"
                        className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 h-8"
                        onClick={() => fetchComplaints()} disabled={isLoading}>
                        <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", isLoading && "animate-spin")} />
                        Refresh
                    </Button>

                    <Button variant="outline" size="sm"
                        className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 h-8"
                        onClick={handleExportCSV}>
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* ── Stats Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Total Complaints" value={stats.total}
                    icon={<BarChart3 className="w-5 h-5 text-violet-400" />}
                    accent="border-violet-500/30 ring-1 ring-violet-500/20"
                    onClick={() => setStatusFilter("all")} active={statusFilter === "all"} />
                <StatCard label="Pending" value={stats.pending}
                    icon={<Clock className="w-5 h-5 text-amber-400" />}
                    accent="border-amber-500/30 ring-1 ring-amber-500/20"
                    onClick={() => setStatusFilter("pending")} active={statusFilter === "pending"} />
                <StatCard label="Resolved" value={stats.resolved}
                    icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                    accent="border-emerald-500/30 ring-1 ring-emerald-500/20"
                    onClick={() => setStatusFilter("resolved")} active={statusFilter === "resolved"} />
                <StatCard label="Unresolved" value={stats.unresolved}
                    icon={<AlertTriangle className="w-5 h-5 text-rose-400" />}
                    accent="border-rose-500/30 ring-1 ring-rose-500/20"
                    onClick={() => setStatusFilter("unresolved")} active={statusFilter === "unresolved"} />
            </div>

            {/* ── Toolbar ── */}
            <div className="flex flex-col md:flex-row items-center gap-3 bg-zinc-900 border border-zinc-800 p-3 rounded-xl shadow-sm">
                <div className="relative w-full md:w-80 flex-shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <Input placeholder="Search name, phone, issue, ticket ID..."
                        className="bg-zinc-950/50 border-zinc-800 pl-10 h-9 text-sm"
                        value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
                </div>

                <Select value={statusFilter} onValueChange={v => { setStatusFilter(v || "all"); setCurrentPage(1); }}>
                    <SelectTrigger className="w-full md:w-40 bg-zinc-950/50 border-zinc-800 h-9 text-sm">
                        <Filter className="w-3.5 h-3.5 mr-1.5 text-zinc-600" />
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">⏳ Pending</SelectItem>
                        <SelectItem value="resolved">✅ Resolved</SelectItem>
                        <SelectItem value="unresolved">❌ Unresolved</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={districtFilter} onValueChange={v => { setDistrictFilter(v || "all"); setCurrentPage(1); }}>
                    <SelectTrigger className="w-full md:w-48 bg-zinc-950/50 border-zinc-800 h-9 text-sm">
                        <Building2 className="w-3.5 h-3.5 mr-1.5 text-zinc-600" />
                        <SelectValue placeholder="All Districts" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                        <SelectItem value="all">All Districts</SelectItem>
                        {districts.map(d => <SelectItem key={d} value={d} dir="rtl">{d}</SelectItem>)}
                    </SelectContent>
                </Select>

                <button
                    onClick={() => { setSortOrder(v => v === "desc" ? "asc" : "desc"); setCurrentPage(1); }}
                    className="flex items-center gap-1.5 ml-auto text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    {sortOrder === "desc" ? "Newest first" : "Oldest first"}
                </button>

                <span className="text-[10px] text-zinc-700 font-mono hidden md:block">
                    {allComplaints.length} records
                </span>
            </div>

            {/* ── Table ── */}
            <div className="w-full bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-zinc-950/70">
                            <TableRow className="border-zinc-800 hover:bg-transparent">
                                {["Ticket ID", "Date & Time", "Citizen", "Phone", "Asterisk ID", "Sentiment", "Issue", "District", "Status", "Priority", "Actions"].map(h => (
                                    <TableHead key={h} className={cn(
                                        "text-zinc-500 font-bold uppercase tracking-widest text-[9px] py-3 px-3 whitespace-nowrap",
                                        h === "Actions" && "text-right"
                                    )}>
                                        {h}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={11} className="h-52 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="w-7 h-7 text-emerald-500 animate-spin" />
                                            <p className="text-zinc-500 text-sm">Syncing complaint registry...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : paginated.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={11} className="h-52 text-center">
                                        <div className="flex flex-col items-center gap-3 text-zinc-600">
                                            <FileText className="w-10 h-10 opacity-20" />
                                            <p className="text-sm">No complaints found matching your filters.</p>
                                            {(statusFilter !== "all" || districtFilter !== "all" || searchTerm) && (
                                                <button onClick={() => { setStatusFilter("all"); setDistrictFilter("all"); setSearchTerm(""); }}
                                                    className="text-xs text-emerald-500 hover:underline">
                                                    Clear all filters
                                                </button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : paginated.map(c => (
                                <TableRow key={c.id}
                                    className="border-zinc-800 hover:bg-zinc-800/40 group transition-colors cursor-pointer"
                                    onClick={() => { setSelected(c); setIsModalOpen(true); }}>

                                    {/* Ticket ID */}
                                    <TableCell className="px-3 py-3">
                                        <span className="font-mono text-[11px] font-bold text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-2 py-1 rounded-md whitespace-nowrap">
                                            {c.ticket_id || `#${c.id}`}
                                        </span>
                                    </TableCell>

                                    {/* Date */}
                                    <TableCell className="px-3 py-3 text-[11px] text-zinc-500 font-mono whitespace-nowrap">
                                        {formatDateShort(c.created_at)}
                                    </TableCell>

                                    {/* Name */}
                                    <TableCell className="px-3 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                                                <User className="w-3 h-3 text-violet-400" />
                                            </div>
                                            <span className="text-[12px] font-medium text-zinc-200 max-w-[100px] truncate" dir="rtl" title={c.name || ""}>
                                                {c.name || "—"}
                                            </span>
                                        </div>
                                    </TableCell>

                                    {/* Phone */}
                                    <TableCell className="px-3 py-3 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                                        {c.phone || "—"}
                                    </TableCell>

                                    {/* Asterisk Number */}
                                    <TableCell className="px-3 py-3 font-mono text-[11px] text-emerald-500/70 whitespace-nowrap">
                                        {c.asterisk_number || "—"}
                                    </TableCell>

                                    {/* Sentiment */}
                                    <TableCell className="px-3 py-3">
                                        <SentimentBadge sentiment={c.sentiment} />
                                    </TableCell>

                                    {/* Issue */}
                                    <TableCell className="px-3 py-3 max-w-[180px]">
                                        <p className="text-[12px] text-zinc-300 truncate" dir="rtl" title={c.issue || ""}>{c.issue || "—"}</p>
                                    </TableCell>

                                    {/* District */}
                                    <TableCell className="px-3 py-3">
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3 text-zinc-600 flex-shrink-0" />
                                            <span className="text-[11px] text-zinc-400 whitespace-nowrap" dir="rtl">{c.district || "—"}</span>
                                        </div>
                                    </TableCell>

                                    {/* Status */}
                                    <TableCell className="px-3 py-3"><StatusBadge status={c.status} /></TableCell>

                                    {/* Priority */}
                                    <TableCell className="px-3 py-3 font-mono text-[11px]"><PriorityBadge priority={c.priority} /></TableCell>

                                    {/* Actions */}
                                    <TableCell className="px-3 py-3 text-right">
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={e => { e.stopPropagation(); setSelected(c); setIsModalOpen(true); }}
                                                className="p-1.5 rounded-md hover:bg-zinc-700 text-zinc-500 hover:text-white transition-colors"
                                                title="View details">
                                                <Eye className="w-3.5 h-3.5" />
                                            </button>
                                            {(c.status || "").toLowerCase() !== "resolved" && (
                                                <button
                                                    onClick={e => { e.stopPropagation(); updateStatus(c.id, "Resolved"); }}
                                                    className="p-1.5 rounded-md hover:bg-emerald-500/20 text-zinc-500 hover:text-emerald-400 transition-colors"
                                                    title="Mark Resolved">
                                                    <CheckCheck className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            {(c.status || "").toLowerCase() !== "unresolved" && (
                                                <button
                                                    onClick={e => { e.stopPropagation(); updateStatus(c.id, "Unresolved"); }}
                                                    className="p-1.5 rounded-md hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 transition-colors"
                                                    title="Mark Unresolved">
                                                    <XCircle className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            {(c.status || "").toLowerCase() !== "pending" && (
                                                <button
                                                    onClick={e => { e.stopPropagation(); updateStatus(c.id, "Pending"); }}
                                                    className="p-1.5 rounded-md hover:bg-amber-500/20 text-zinc-500 hover:text-amber-400 transition-colors"
                                                    title="Reset to Pending">
                                                    <RotateCcw className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* ── Pagination Footer ── */}
                <div className="border-t border-zinc-800/50 px-4 py-2.5 flex items-center justify-between gap-4">
                    <span className="text-xs text-zinc-600">
                        Showing <span className="text-zinc-400 font-medium">{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, allComplaints.length)}</span> of <span className="text-zinc-400 font-medium">{allComplaints.length}</span> complaints
                    </span>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded-md text-zinc-600 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs px-2">
                            First
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded-md text-zinc-600 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                            return start + i;
                        }).map(p => (
                            <button key={p} onClick={() => setCurrentPage(p)}
                                className={cn(
                                    "w-7 h-7 rounded-md text-xs transition-colors",
                                    p === currentPage
                                        ? "bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/20"
                                        : "text-zinc-500 hover:bg-zinc-800 hover:text-white"
                                )}>
                                {p}
                            </button>
                        ))}

                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1.5 rounded-md text-zinc-600 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="p-1.5 rounded-md text-zinc-600 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs px-2">
                            Last
                        </button>
                    </div>

                    <span className="text-[10px] text-zinc-700 font-mono hidden md:block">complaints · live db</span>
                </div>
            </div>

            {/* ── Update Toast ── */}
            {updateMsg && (
                <div className={cn(
                    "fixed bottom-6 right-6 px-4 py-3 rounded-xl border text-sm font-medium shadow-2xl backdrop-blur-md z-50 animate-in slide-in-from-bottom-3 duration-300",
                    updateMsg.startsWith("✓")
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                )}>
                    {updateMsg}
                </div>
            )}

            {/* ── Detail Modal ── */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="bg-zinc-950 border-zinc-800/80 text-zinc-300 sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="pb-4 border-b border-zinc-800/60">
                        <DialogTitle className="text-white flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-900/30">
                                <Ticket className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-base font-bold">Complaint Detail</span>
                                    <span className="font-mono text-emerald-400 text-sm">{selected?.ticket_id || `#${selected?.id}`}</span>
                                </div>
                                <p className="text-[11px] text-zinc-600 font-normal mt-0.5">
                                    Filed via Sarah AI · {selected ? formatDate(selected.created_at) : ""}
                                </p>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    {selected && (
                        <div className="space-y-4 pt-3">

                            {/* Status + Priority + Controls */}
                            <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-4 space-y-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <StatusBadge status={selected.status} />
                                    <PriorityBadge priority={selected.priority} />
                                    <SentimentBadge sentiment={selected.sentiment} />
                                    <span className="ml-auto text-xs text-zinc-700 font-mono">DB ID: {selected.id}</span>
                                </div>
                                
                                {/* Recording Player */}
                                {selected.recording_id && (
                                    <div className="bg-zinc-950/80 border border-zinc-800/60 rounded-lg p-3 flex items-center gap-4">
                                        <button 
                                            onClick={() => {
                                                if (isPlaying) {
                                                    audioRef.current?.pause();
                                                    setIsPlaying(false);
                                                } else {
                                                    if (!audioRef.current) {
                                                        audioRef.current = new Audio(`/api/complaints/recording/${selected.recording_id}`);
                                                        audioRef.current.ontimeupdate = () => {
                                                            setAudioProgress((audioRef.current!.currentTime / audioRef.current!.duration) * 100);
                                                        };
                                                        audioRef.current.onended = () => {
                                                            setIsPlaying(false);
                                                            setAudioProgress(0);
                                                        };
                                                    }
                                                    audioRef.current.play();
                                                    setIsPlaying(true);
                                                }
                                            }}
                                            className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center hover:bg-emerald-500/30 transition-all group flex-shrink-0"
                                        >
                                            {isPlaying ? (
                                                <Pause className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                                            ) : (
                                                <Play className="w-4 h-4 text-emerald-400 fill-emerald-400 ml-0.5" />
                                            )}
                                        </button>
                                        <div className="flex-1 space-y-1.5">
                                            <div className="flex justify-between items-center px-1">
                                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Call Recording</p>
                                                <p className="text-[10px] font-mono text-zinc-500">{isPlaying ? "Playing..." : "Available"}</p>
                                            </div>
                                            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-emerald-500 transition-all duration-300 ease-linear shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                                                    style={{ width: `${audioProgress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Status Action Buttons */}
                                <div className="flex flex-wrap gap-2 pt-1 border-t border-zinc-800/40">
                                    <span className="text-[10px] text-zinc-600 uppercase font-bold self-center mr-1">Change Status:</span>
                                    <button
                                        onClick={() => updateStatus(selected.id, "Resolved")}
                                        disabled={isUpdating || selected.status.toLowerCase() === "resolved"}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                                        {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
                                        Mark Resolved
                                    </button>
                                    <button
                                        onClick={() => updateStatus(selected.id, "Unresolved")}
                                        disabled={isUpdating || selected.status.toLowerCase() === "unresolved"}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                                        {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                                        Mark Unresolved
                                    </button>
                                    <button
                                        onClick={() => updateStatus(selected.id, "Pending")}
                                        disabled={isUpdating || selected.status.toLowerCase() === "pending"}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                                        {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                                        Reset Pending
                                    </button>
                                </div>

                                {/* Priority Action Buttons */}
                                <div className="flex flex-wrap gap-2 pt-1 border-t border-zinc-800/40">
                                    <span className="text-[10px] text-zinc-600 uppercase font-bold self-center mr-1">Set Priority:</span>
                                    {["Normal", "High", "Urgent", "Low"].map(p => (
                                        <button key={p}
                                            onClick={() => updatePriority(selected.id, p)}
                                            disabled={isUpdating || (selected.priority || "Normal") === p}
                                            className="px-2.5 py-1 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 hover:text-white text-[10px] font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Citizen Info */}
                            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 overflow-hidden">
                                <div className="px-4 py-2 border-b border-zinc-800/40 bg-zinc-950/40 flex items-center gap-1.5">
                                    <User className="w-3 h-3 text-zinc-500" />
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Citizen Information</span>
                                </div>
                                <div className="p-4 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] text-zinc-600 uppercase font-bold mb-1.5">Full Name</p>
                                        <p className="text-sm font-semibold text-zinc-200" dir="rtl">{selected.name || "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-zinc-600 uppercase font-bold mb-1.5">Phone Number</p>
                                        <p className="text-sm font-mono text-zinc-200 flex items-center gap-1.5">
                                            <Phone className="w-3.5 h-3.5 text-zinc-600" />
                                            {selected.phone || "—"}
                                        </p>
                                    </div>
                                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-2 col-span-2">
                                        <p className="text-[10px] text-emerald-500/70 uppercase font-bold mb-1">System Verified Asterisk ID (Read-Only)</p>
                                        <p className="text-sm font-mono text-emerald-400 flex items-center gap-1.5">
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                            {selected.asterisk_number || "Not available (Legacy Call)"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Issue */}
                            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 overflow-hidden">
                                <div className="px-4 py-2 border-b border-zinc-800/40 bg-zinc-950/40 flex items-center gap-1.5">
                                    <AlertTriangle className="w-3 h-3 text-zinc-500" />
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Issue Description</span>
                                </div>
                                <div className="p-4">
                                    <p className="text-sm text-zinc-200 leading-relaxed" dir="rtl">
                                        {selected.issue || "No issue description provided."}
                                    </p>
                                </div>
                            </div>

                            {/* Location */}
                            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 overflow-hidden">
                                <div className="px-4 py-2 border-b border-zinc-800/40 bg-zinc-950/40 flex items-center gap-1.5">
                                    <MapPin className="w-3 h-3 text-zinc-500" />
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Location Details</span>
                                </div>
                                <div className="p-4 space-y-3">
                                    {[
                                        { icon: <Building2 className="w-4 h-4 text-zinc-600" />, label: "District", value: selected.district },
                                        { icon: <MapPin className="w-4 h-4 text-zinc-600" />, label: "Address", value: selected.address },
                                        { icon: <Landmark className="w-4 h-4 text-zinc-600" />, label: "Landmark", value: selected.landmark },
                                    ].map(({ icon, label, value }) => (
                                        <div key={label} className="flex gap-3">
                                            <div className="mt-0.5 flex-shrink-0">{icon}</div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] text-zinc-600 uppercase font-bold mb-0.5">{label}</p>
                                                <p className="text-sm text-zinc-200" dir="rtl">{value || "—"}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Notes */}
                            {selected.notes && (
                                <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 overflow-hidden">
                                    <div className="px-4 py-2 border-b border-zinc-800/40 bg-zinc-950/40">
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Operator Notes</span>
                                    </div>
                                    <div className="p-4">
                                        <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{selected.notes}</p>
                                    </div>
                                </div>
                            )}

                            {/* Footer */}
                            <div className="flex items-center gap-2 text-[11px] text-zinc-700 pt-1 border-t border-zinc-800/40">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Registered on {formatDate(selected.created_at)}</span>
                            </div>

                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ── New Complaint Modal ── */}
            <NewComplaintModal
                open={isNewModalOpen}
                onOpenChange={setIsNewModalOpen}
                districts={districts}
                onSuccess={() => {
                    fetchComplaints();
                    setUpdateMsg("✓ New complaint created successfully");
                }}
            />

        </div>
    );
}

function NewComplaintModal({ open, onOpenChange, districts, onSuccess }: {
    open: boolean; onOpenChange: (o: boolean) => void; districts: string[]; onSuccess: () => void;
}) {
    const [form, setForm] = useState({ name: "", phone: "", asterisk_number: "", district: "", issue: "" });
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!form.name || !form.phone || !form.issue) return;
        setIsSaving(true);
        try {
            const res = await fetch("/api/complaints", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                onSuccess();
                onOpenChange(false);
                setForm({ name: "", phone: "", asterisk_number: "", district: "", issue: "" });
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-zinc-950 border-zinc-800/80 text-zinc-300 sm:max-w-md">
                <DialogHeader className="pb-2 border-b border-zinc-800/60">
                    <DialogTitle className="text-white flex items-center gap-2">
                        <Plus className="w-4 h-4 text-emerald-400" />
                        Register New Complaint
                    </DialogTitle>
                    <DialogDescription className="text-zinc-500 text-[11px] pt-1 leading-relaxed">
                        Manually register a citizen issue. This ticket will automatically be queued for Robocall verification once resolved.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Citizen Name</label>
                        <Input
                            placeholder="Enter full name"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            className="bg-zinc-900 border-zinc-800 text-sm h-10"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Phone Number</label>
                        <Input
                            placeholder="03001234567"
                            value={form.phone}
                            onChange={e => setForm({ ...form, phone: e.target.value })}
                            className="bg-zinc-900 border-zinc-800 text-sm h-10 font-mono"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-emerald-500/80">Asterisk ID / Outbound Number</label>
                        <Input
                            placeholder="e.g. 03334221259"
                            value={form.asterisk_number}
                            onChange={e => setForm({ ...form, asterisk_number: e.target.value })}
                            className="bg-zinc-900 border-zinc-800 text-sm h-10 font-mono text-emerald-400 focus:border-emerald-500/50"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">District</label>
                        <div className="relative">
                            <Input
                                placeholder="Type or select district..."
                                list="district-list"
                                value={form.district}
                                onChange={e => setForm({ ...form, district: e.target.value })}
                                className="bg-zinc-900 border-zinc-800 text-sm h-10"
                            />
                            <datalist id="district-list">
                                {districts.map(d => <option key={d} value={d} />)}
                            </datalist>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Issue Description</label>
                        <textarea
                            placeholder="Briefly describe the complaint..."
                            value={form.issue}
                            onChange={e => setForm({ ...form, issue: e.target.value })}
                            className="flex min-h-[100px] w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all resize-none"
                        />
                    </div>

                    <div className="pt-2 flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1 border-zinc-800 text-zinc-400 hover:bg-zinc-900"
                            onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button
                            disabled={isSaving || !form.name || !form.phone || !form.issue}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                            onClick={handleSave}>
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Register Ticket"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
