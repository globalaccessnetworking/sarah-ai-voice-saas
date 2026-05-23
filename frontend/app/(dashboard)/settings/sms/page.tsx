"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
    ShieldCheck, 
    Send, 
    Settings2, 
    Users, 
    MessageSquare, 
    Plus, 
    Save, 
    HelpCircle, 
    Globe, 
    Smartphone, 
    AlertCircle,
    CheckCircle2,
    Database,
    Phone,
    RefreshCw,
    Trash2,
    BarChart3,
    History,
    Search,
    ShieldAlert,
    ExternalLink,
    Filter,
    FileBarChart2
} from "lucide-react";
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    AreaChart,
    Area
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// --- Components (UI) ---
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-sm ${className}`}>
        {children}
    </div>
);

const Badge = ({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "success" | "warning" | "danger" }) => {
    const styles = {
        default: "bg-zinc-800 text-zinc-400",
        success: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        warning: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        danger: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${styles[variant]}`}>
            {children}
        </span>
    );
};

// --- Page Implementation ---
function SMSManagementContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const tabParam = searchParams.get("tab") as any;

    const [activeTab, setActiveTab] = useState<"gateway" | "registry" | "templates" | "analytics" | "logs">("gateway");

    // Modals State
    const [isAddDistrictOpen, setIsAddDistrictOpen] = useState(false);
    const [isAssignSupervisorOpen, setIsAssignSupervisorOpen] = useState(false);

    // Initial Tab Sync
    useEffect(() => {
        if (tabParam && ["gateway", "registry", "templates", "analytics", "logs"].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    const handleTabChange = (tab: any) => {
        setActiveTab(tab);
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", tab);
        router.push(`?${params.toString()}`, { scroll: false });
    };

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [data, setData] = useState<any>({
        configs: [],
        templates: [],
        supervisors: [],
        districts: [],
        logs: [],
        analytics: null,
        reporting: []
    });

    const [logsSearch, setLogsSearch] = useState("");
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [composeData, setComposeData] = useState({ recipient: "", content: "" });
    const [sendingManual, setSendingManual] = useState(false);

    // Gateway Test State
    const [testPhone, setTestPhone] = useState("");
    const [gatewayConfig, setGatewayConfig] = useState({
        apiUrl: "https://sendpk.com/api/sms.php",
        senderId: "SUTHRA PK",
        apiKey: "91a9269ecf08f860a67be018bf4a0d2726ca14144cb1"
    });

    // Template Builder State
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [templateContent, setTemplateContent] = useState("");
    const [useUnicode, setUseUnicode] = useState(false);

    // Manual Registry States
    const [newDistrict, setNewDistrict] = useState({ name: "", slug: "" });
    const [newSupervisor, setNewSupervisor] = useState({ name: "", phoneNumber: "", districtId: "", isPrimary: true });

    const handleSendManualSMS = async () => {
        if (!composeData.recipient || !composeData.content) return;
        setSendingManual(true);
        try {
            const res = await fetch("/api/sms/dispatch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    recipient: composeData.recipient,
                    triggerType: "ADMIN_OVERRIDE",
                    variables: { message: composeData.content },
                    isUrgent: composeData.content.includes("URGENT")
                })
            });
            const result = await res.json();
            if (result.success) {
                toast.success("Message dispatched successfully");
                setIsComposeOpen(false);
                setComposeData({ recipient: "", content: "" });
                fetchData();
            } else {
                toast.error(result.error || "Dispatch failed");
            }
        } catch (error) {
            toast.error("Bridge connection failed");
        } finally {
            setSendingManual(false);
        }
    };

    const handleUpdateGateway = async () => {
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/settings/sms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "config", data: gatewayConfig })
            });
            if (res.ok) {
                toast.success("Gateway configuration synchronized");
                fetchData();
            }
        } catch (err) {
            toast.error("Bridge synchronization failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFireTest = async () => {
        if (!testPhone) {
            toast.error("Please enter a phone number for testing");
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/sms/dispatch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    recipient: testPhone,
                    triggerType: "TEST_PROBE",
                    variables: { message: "Suthra Punjab Connectivity Probe — Bridge is Active." }
                })
            });
            if (res.ok) {
                toast.success("Test probe dispatched to " + testPhone);
            }
        } catch (err) {
            toast.error("Test probe failed to launch");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateTemplate = async () => {
        if (!selectedTemplate) return;
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/settings/sms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    type: "template", 
                    data: { 
                        id: selectedTemplate.id, 
                        content: templateContent,
                        useUnicode
                    } 
                })
            });
            if (res.ok) {
                toast.success("Notification script updated");
                fetchData();
            }
        } catch (err) {
            toast.error("Failed to commit script changes");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddDistrict = async () => {
        if (!newDistrict.name) return;
        setIsSubmitting(true);
        try {
            const slug = newDistrict.slug || newDistrict.name.toLowerCase().replace(/\s+/g, '-');
            const res = await fetch("/api/settings/sms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "district", data: { name: newDistrict.name, slug } })
            });
            if (res.ok) {
                toast.success("District added successfully");
                setIsAddDistrictOpen(false);
                setNewDistrict({ name: "", slug: "" });
                fetchData();
            }
        } catch (err) {
            toast.error("Failed to add district");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAssignSupervisor = async () => {
        if (!newSupervisor.name || !newSupervisor.phoneNumber || !newSupervisor.districtId) {
            toast.error("Please fill all supervisor fields");
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/settings/sms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    type: "supervisor", 
                    data: { 
                        ...newSupervisor, 
                        districtId: parseInt(newSupervisor.districtId) 
                    } 
                })
            });
            const result = await res.json();
            if (result.success) {
                toast.success("Supervisor assigned successfully");
                setIsAssignSupervisorOpen(false);
                setNewSupervisor({ name: "", phoneNumber: "", districtId: "", isPrimary: true });
                fetchData();
            } else {
                toast.error(result.error || "Assignment failed");
            }
        } catch (err) {
            toast.error("Bridge connection failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Fetch Data
    const fetchData = async () => {
        setLoading(true);
        try {
            const [settingsRes, analyticsRes, reportingRes] = await Promise.all([
                fetch("/api/settings/sms"),
                fetch("/api/settings/sms/analytics"),
                fetch("/api/sms/reporting")
            ]);
            
            const [settings, analytics, reporting] = await Promise.all([
                settingsRes.json(),
                analyticsRes.json(),
                reportingRes.json()
            ]);

            if (settings.success) {
                setData((prev: any) => ({ 
                    ...prev, 
                    ...settings.data, 
                    analytics: analytics.stats,
                    reporting: reporting.data
                }));
                if (settings.data.templates.length > 0) {
                    const firstTpl = settings.data.templates[0];
                    setSelectedTemplate(firstTpl);
                    setTemplateContent(firstTpl.content);
                    setUseUnicode(firstTpl.useUnicode);
                }
            }
        } catch (error) {
            toast.error("Failed to load SMS settings");
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = () => {
        const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const end = new Date().toISOString();
        window.open(`/api/sms/reporting?format=csv&start=${start}&end=${end}`, "_blank");
        toast.info("Generating Governance Report...");
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Unicode Budget Stats
    const charCount = templateContent.length;
    const limit = useUnicode ? 70 : 160;
    const progress = Math.min((charCount / limit) * 100, 100);
    const progressColor = charCount > limit ? "bg-rose-500" : charCount > (limit * 0.8) ? "bg-amber-500" : "bg-emerald-500";

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-8">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <Send className="text-emerald-500 w-6 h-6" />
                        </div>
                        SMS Intelligent Notification System
                    </h1>
                    <p className="text-zinc-500 text-sm max-w-2xl">
                        Manage your government-grade SMS infrastructure. Configure gateways, map district-level supervisors, 
                        and customize automated notification scripts for citizens.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleExportCSV}
                        className="px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 transition-all text-xs font-bold flex items-center gap-2"
                    >
                        <FileBarChart2 size={16} className="text-emerald-500" />
                        Export Strategic Report
                    </button>
                    <button 
                        onClick={fetchData}
                        className="p-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 transition-all text-zinc-400"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button 
                        onClick={() => setIsComposeOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20"
                    >
                        <Send size={18} />
                        Direct Dispatch
                    </button>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="flex gap-1 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 w-fit mb-10 overflow-x-auto">
                {[
                    { id: "gateway", label: "Connectivity", icon: Globe },
                    { id: "analytics", label: "Operational 30", icon: BarChart3 },
                    { id: "registry", label: "Registry", icon: Users },
                    { id: "templates", label: "Templates", icon: MessageSquare },
                    { id: "logs", label: "Audit Logs", icon: History },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id as any)}
                        className={`flex items-center gap-2.5 px-6 py-3 rounded-xl transition-all relative ${
                            activeTab === tab.id ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                        }`}
                    >
                        <tab.icon size={18} />
                        <span className="text-sm font-bold">{tab.label}</span>
                        {activeTab === tab.id && (
                            <motion.div 
                                layoutId="active-tab-sms"
                                className="absolute inset-0 bg-zinc-800/80 rounded-xl -z-10 border border-zinc-700/50"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                {activeTab === "gateway" && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                    >
                        {/* Gateway Configuration */}
                        <div className="lg:col-span-2 flex flex-col gap-6">
                            <Card className="flex flex-col gap-8">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <Settings2 className="w-5 h-5 text-emerald-500" />
                                        Active Provider Settings
                                    </h3>
                                    <Badge variant="success">SENDPK - PRIMARY</Badge>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Base API Endpoint</label>
                                        <input 
                                            type="text" 
                                            value={gatewayConfig.apiUrl}
                                            onChange={(e) => setGatewayConfig({ ...gatewayConfig, apiUrl: e.target.value })}
                                            className="bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none transition-all font-mono"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Masking / Sender ID</label>
                                        <input 
                                            type="text" 
                                            value={gatewayConfig.senderId}
                                            onChange={(e) => setGatewayConfig({ ...gatewayConfig, senderId: e.target.value })}
                                            className="bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none transition-all font-bold tracking-widest"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2 md:col-span-2">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Secure API Key</label>
                                        <div className="relative">
                                            <input 
                                                type="password" 
                                                value={gatewayConfig.apiKey}
                                                onChange={(e) => setGatewayConfig({ ...gatewayConfig, apiKey: e.target.value })}
                                                className="bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none transition-all w-full pr-12"
                                            />
                                            <ShieldCheck className="absolute right-4 top-3.5 text-emerald-500 w-5 h-5 opacity-50" />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-zinc-800 flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-zinc-500 text-xs italic">
                                        <Database size={14} />
                                        Encrypted and stored only in local PostgreSQL instance.
                                    </div>
                                    <button 
                                        onClick={handleUpdateGateway}
                                        disabled={isSubmitting}
                                        className="flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-all text-sm disabled:opacity-50"
                                    >
                                        {isSubmitting ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                                        Save Gateway Config
                                    </button>
                                </div>
                            </Card>

                            <Card className="bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 border-indigo-500/20">
                                <h4 className="font-bold flex items-center gap-2 mb-4">
                                    <Smartphone className="w-5 h-5 text-indigo-400" />
                                    Live Connectivity Test
                                </h4>
                                <div className="flex gap-4">
                                    <input 
                                        type="text" 
                                        value={testPhone}
                                        onChange={(e) => setTestPhone(e.target.value)}
                                        placeholder="+92 3XX XXXXXXX"
                                        className="bg-black/80 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none flex-1 font-mono"
                                    />
                                    <button 
                                        onClick={handleFireTest}
                                        disabled={isSubmitting || !testPhone}
                                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all text-sm whitespace-nowrap shadow-xl shadow-indigo-900/20 disabled:opacity-50"
                                    >
                                        {isSubmitting ? <RefreshCw className="animate-spin" size={16} /> : "Fire Test Delivery"}
                                    </button>
                                </div>
                                <p className="text-[10px] text-zinc-500 mt-4 leading-relaxed">
                                    Note: Triggering a test will increment your Sendpk quota. Use sparingly to verify API bridge connectivity.
                                </p>
                            </Card>
                        </div>

                        {/* Stats / Help */}
                        <div className="flex flex-col gap-6">
                            <Card className="flex flex-col gap-4">
                                <h3 className="font-bold text-sm text-zinc-400 uppercase tracking-widest">Gateway Health</h3>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500 text-sm italic">Uptime</span>
                                    <span className="text-emerald-500 font-mono text-sm uppercase">99.98% Healthy</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500 text-sm italic">Latency</span>
                                    <span className="text-emerald-500 font-mono text-sm lowercase">~180ms</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500 text-sm italic">Current Balance</span>
                                    <span className="text-amber-500 font-bold font-mono text-sm uppercase">PKR 4,812.50</span>
                                </div>
                            </Card>
                            
                            <Card className="border-amber-500/20 bg-amber-500/5">
                                <div className="flex gap-4">
                                    <div className="p-2.5 bg-amber-500/10 rounded-xl flex-shrink-0">
                                        <AlertCircle className="text-amber-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-amber-500 mb-1">Government Notification Rules</h4>
                                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                                            Per PTA regulations, automated notifications must include the Ticket ID for reference. 
                                            Attempting to send an SMS without a valid identifier may lead to temporary masking suspension.
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </motion.div>
                )}

                {activeTab === "analytics" && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="flex flex-col gap-8"
                    >
                        {/* Stats Summary Area */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { 
                                    label: "Total Dispatch", 
                                    value: data.analytics?.current.total || 0, 
                                    sub: "Last 30 Days",
                                    trend: (data.analytics?.current.total || 0) > (data.analytics?.previous.total || 0) ? "up" : "down"
                                },
                                { 
                                    label: "Delivery Success", 
                                    value: `${((data.analytics?.current.sent / (data.analytics?.current.total || 1)) * 100).toFixed(1)}%`, 
                                    sub: "Net Reliability",
                                    trend: "stable"
                                },
                                { 
                                    label: "Failed Alerts", 
                                    value: data.analytics?.current.failed || 0, 
                                    sub: "Requiring Attention",
                                    trend: (data.analytics?.current.failed || 0) > 0 ? "danger" : "safe"
                                },
                                { 
                                    label: "Provider Balance", 
                                    value: "PKR 4,812", 
                                    sub: "Est. 12k Messages",
                                    trend: "safe"
                                }
                            ].map((s, i) => (
                                <Card key={i} className="flex flex-col gap-2 group hover:border-emerald-500/30 transition-all">
                                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{s.label}</h4>
                                    <div className="flex items-end justify-between">
                                        <span className="text-2xl font-bold tracking-tight">{s.value}</span>
                                        {s.trend === "up" && <Badge variant="success">+{(((data.analytics?.current.total || 0) - (data.analytics?.previous.total || 0)) / (data.analytics?.previous.total || 1) * 100).toFixed(0)}% MoM</Badge>}
                                        {s.trend === "danger" && <Badge variant="danger">High Risk</Badge>}
                                    </div>
                                    <p className="text-[10px] text-zinc-600 italic mt-1">{s.sub}</p>
                                </Card>
                            ))}
                        </div>

                        {/* Chart Area */}
                        <Card className="flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-emerald-500" />
                                    Operational Trend (Last 30 Days)
                                </h3>
                            </div>
                            <div className="h-[300px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data.analytics?.trends || []}>
                                        <defs>
                                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                        <XAxis 
                                            dataKey="date" 
                                            stroke="#71717a" 
                                            fontSize={10} 
                                            tickLine={false} 
                                            axisLine={false} 
                                            tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                        />
                                        <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                                            itemStyle={{ color: '#10b981', fontSize: '10px' }}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="count" 
                                            stroke="#10b981" 
                                            strokeWidth={2}
                                            fillOpacity={1} 
                                            fill="url(#colorCount)" 
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        {/* District Responsiveness Leaderboard */}
                        <Card className="p-0 overflow-hidden border-emerald-500/10 shadow-2xl shadow-black/50 bg-zinc-900/10">
                            <div className="p-6 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-900/20">
                                <div>
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                        District Responsiveness Leaderboard
                                    </h3>
                                    <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest font-bold">Field Execution Accountability Index</p>
                                </div>
                                <Badge variant="default">Operational 30 Stats</Badge>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-zinc-900/40">
                                            <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800/50">District</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800/50">Total Triggers</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800/50">Sent</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800/50 text-right">Responsiveness Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800/30">
                                        {(data.reporting || []).sort((a: any, b: any) => (b.sent / (b.total || 1)) - (a.sent / (a.total || 1))).map((s: any, idx: number) => {
                                            const rate = s.total > 0 ? (s.sent / s.total) * 100 : 0;
                                            return (
                                                <tr key={idx} className="hover:bg-zinc-800/10 transition-all">
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-bold text-zinc-100">{s.district}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-mono text-zinc-400">{s.total}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant="success">{s.sent}</Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-3 font-mono">
                                                            <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden hidden md:block">
                                                                <div className={cn("h-full transition-all", rate > 90 ? "bg-emerald-500" : rate > 50 ? "bg-amber-500" : "bg-rose-500")} style={{ width: `${rate}%` }} />
                                                            </div>
                                                            <span className={cn("text-sm font-bold", rate > 90 ? "text-emerald-500" : "text-zinc-300")}>{rate.toFixed(1)}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {(!data.reporting || data.reporting.length === 0) && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-zinc-600 text-sm italic">
                                                    No district data available for this period.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </motion.div>
                )}


                {activeTab === "logs" && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="flex flex-col gap-6"
                    >
                        <Card className="p-0 overflow-hidden">
                            <div className="p-6 border-b border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900/30">
                                <div>
                                    <h3 className="text-lg font-bold">Comprehensive Dispatch Logs</h3>
                                    <p className="text-xs text-zinc-500 mt-1">Audit trail of every message sent via the Intelligent Notification System.</p>
                                </div>
                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    <div className="relative flex-1 md:w-64">
                                        <Search className="absolute left-3 top-2.5 text-zinc-500 w-4 h-4" />
                                        <input 
                                            type="text" 
                                            placeholder="Search Ticket ID or Mobile..."
                                            value={logsSearch}
                                            onChange={(e) => setLogsSearch(e.target.value)}
                                            className="w-full bg-black border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm focus:border-emerald-500 outline-none transition-all"
                                        />
                                    </div>
                                    <button className="p-2 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition-all text-zinc-400">
                                        <Filter size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-zinc-900/50">
                                            <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800">Timestamp</th>
                                            <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800">Recipient</th>
                                            <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800">Ticket ID</th>
                                            <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800">Content Snippet</th>
                                            <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 text-center">Status</th>
                                            <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 text-right">Provider</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800/50">
                                        {data.logs.filter((l: any) => 
                                            l.recipient.includes(logsSearch) || (l.ticketId && l.ticketId.includes(logsSearch))
                                        ).map((log: any) => (
                                            <tr key={log.id} className="hover:bg-zinc-800/20 transition-all group">
                                                <td className="px-6 py-4">
                                                    <span className="text-[10px] font-mono text-zinc-500">
                                                        {new Date(log.createdAt).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Phone size={12} className="text-zinc-500 opacity-50" />
                                                        <span className="text-sm font-bold text-zinc-300">{log.recipient}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {log.ticketId ? (
                                                        <Badge variant="default">{log.ticketId}</Badge>
                                                    ) : (
                                                        <span className="text-zinc-700">---</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-xs text-zinc-400 truncate max-w-[200px] italic">
                                                        "{log.content}"
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <Badge variant={log.status === "SENT" ? "success" : "danger"}>
                                                        {log.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="text-zinc-600 hover:text-emerald-500 transition-colors">
                                                        <ExternalLink size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </motion.div>
                )}

                {activeTab === "registry" && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="flex flex-col gap-6"
                    >
                        <Card className="p-0 overflow-hidden">
                            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/30">
                                <div>
                                    <h3 className="text-lg font-bold">District-Supervisor Management</h3>
                                    <p className="text-xs text-zinc-500 mt-1">Map supervisors to specific regions to ensure intelligent alert routing.</p>
                                </div>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setIsAddDistrictOpen(true)}
                                        className="px-4 py-2 border border-zinc-800 hover:bg-zinc-800 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                                    >
                                        <Plus size={14} className="text-emerald-500" />
                                        Add Area
                                    </button>
                                    <button 
                                        onClick={() => setIsAssignSupervisorOpen(true)}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                                    >
                                        <Users size={14} />
                                        Assign Supervisor
                                    </button>
                                </div>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-zinc-900/50">
                                            <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800">District / Area</th>
                                            <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800">Assigned Supervisor</th>
                                            <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800">Phone Number</th>
                                            <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 text-center">Is Primary?</th>
                                            <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800/50">
                                        {data.districts.map((district: any) => {
                                            const staff = data.supervisors.filter((s: any) => s.districtId === district.id);
                                            return (
                                                <tr key={district.id} className="hover:bg-zinc-800/20 transition-all group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-zinc-800 rounded-lg group-hover:bg-zinc-700 transition-all">
                                                                <Globe className="text-zinc-500 w-3.5 h-3.5" />
                                                            </div>
                                                            <span className="text-sm font-bold text-zinc-100">{district.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1.5">
                                                            {staff.length > 0 ? staff.map((s: any, idx: number) => (
                                                                <div key={idx} className="flex items-center gap-2">
                                                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500/20 to-indigo-500/20 flex items-center justify-center text-[8px] font-bold text-emerald-500 border border-emerald-500/20">
                                                                        {s.name?.[0] || "?"}
                                                                    </div>
                                                                    <span className="text-xs text-zinc-400 font-medium">{s.name}</span>
                                                                </div>
                                                            )) : <span className="text-zinc-700 text-xs italic">Unassigned</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1.5">
                                                            {staff.map((s: any, idx: number) => (
                                                                <div key={idx} className="flex items-center gap-2 text-zinc-500 font-mono text-[10px] leading-none">
                                                                    <Phone size={10} className="opacity-40" />
                                                                    {s.phoneNumber}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {staff.length > 0 && <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                            <button className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 transition-all"><Settings2 size={16} /></button>
                                                            <button className="p-2 hover:bg-rose-500/10 hover:text-rose-500 rounded-lg text-zinc-700 transition-all"><Trash2 size={16} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </motion.div>
                )}

                {activeTab === "templates" && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 lg:grid-cols-5 gap-8"
                    >
                        {/* Template List (Sidebar) */}
                        <div className="lg:col-span-1 flex flex-col gap-4">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-2">System Triggers</h3>
                            <div className="flex flex-col gap-2">
                                {data.templates.map((tpl: any) => (
                                    <button 
                                        key={tpl.id}
                                        onClick={() => {
                                            setSelectedTemplate(tpl);
                                            setTemplateContent(tpl.content);
                                            setUseUnicode(tpl.useUnicode);
                                        }}
                                        className={`p-4 rounded-xl text-left border transition-all ${
                                            selectedTemplate?.id === tpl.id 
                                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                                            : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                                        }`}
                                    >
                                        <h4 className="text-xs font-bold truncate leading-tight mb-1">{tpl.name}</h4>
                                        <p className="text-[10px] opacity-60 font-mono tracking-tighter uppercase">{tpl.triggerType}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Editor Area */}
                        <div className="lg:col-span-2 flex flex-col gap-6">
                            <Card className="flex flex-col gap-6 h-full">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold flex items-center gap-2">
                                        <MessageSquare className="w-5 h-5 text-emerald-500" />
                                        Template Logic
                                    </h3>
                                    <button 
                                        onClick={() => setUseUnicode(!useUnicode)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                                            useUnicode ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" : "bg-zinc-800 border-zinc-700 text-zinc-500"
                                        }`}
                                    >
                                        URDU UNICODE
                                        <div className={`w-2 h-2 rounded-full ${useUnicode ? "bg-indigo-400" : "bg-zinc-700"}`} />
                                    </button>
                                </div>

                                <div className="flex flex-col gap-3 flex-1">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Message Script</label>
                                    <textarea 
                                        value={templateContent}
                                        onChange={(e) => setTemplateContent(e.target.value)}
                                        className="bg-black/50 border border-zinc-800 rounded-xl p-4 text-sm focus:border-emerald-500 outline-none flex-1 resize-none leading-relaxed transition-all"
                                        placeholder="Dear Citizen, your Ticket ID: {{ticket_id}}..."
                                    />
                                    <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800 flex flex-wrap gap-2">
                                        {["ticket_id", "district", "citizen_name"].map(p => (
                                            <button 
                                                key={p} 
                                                onClick={() => setTemplateContent(prev => prev + ` {{${p}}}`)}
                                                className="px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-[10px] font-mono text-emerald-500/70 border border-zinc-700 transition-all font-bold uppercase tracking-tight"
                                            >
                                                + {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Budget Monitor */}
                                <div className="space-y-2 pt-2">
                                    <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                        <span>Unicode Budget Monitor</span>
                                        <span className={charCount > limit ? "text-rose-500" : ""}>{charCount} / {limit} CHARS</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            className={`h-full transition-colors duration-500 ${progressColor}`}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] text-zinc-600 italic">
                                        <span>Limit per SMS (Part 1)</span>
                                        {charCount > limit && <span className="text-rose-500 flex items-center gap-1"><AlertCircle size={10} /> Multi-part SMS triggered</span>}
                                    </div>
                                </div>

                                <button 
                                    onClick={handleUpdateTemplate}
                                    disabled={isSubmitting || !selectedTemplate}
                                    className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-emerald-900/20 disabled:opacity-50"
                                >
                                    {isSubmitting ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                                    Save Template Changes
                                </button>
                            </Card>
                        </div>

                        {/* Mobile Preview */}
                        <div className="lg:col-span-2">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-2 mb-4">Official Handset Preview</h3>
                            <div className="relative w-full aspect-[9/18.5] max-w-[280px] mx-auto bg-zinc-900 rounded-[3rem] border-8 border-zinc-800 shadow-2xl p-4">
                                {/* Speaker notch */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-zinc-800 rounded-b-2xl z-10" />
                                
                                {/* Inner Screen */}
                                <div className="w-full h-full bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-[2rem] overflow-hidden p-3 pt-8 relative">
                                    {/* App Bar */}
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="w-8 h-8 rounded-full bg-zinc-700" />
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[10px] font-bold text-white">SUTHRA PK</span>
                                            <span className="text-[8px] text-emerald-500">Official Notification</span>
                                        </div>
                                    </div>

                                    {/* Message Bubble */}
                                    <motion.div 
                                        key={templateContent}
                                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        className="bg-emerald-600 text-white p-3 rounded-2xl rounded-tl-none inline-block max-w-[90%] shadow-lg"
                                    >
                                        <p className={`text-[12px] leading-relaxed break-words ${useUnicode ? "text-right font-nastaleeq leading-[2.2]" : "text-left leading-[1.6] font-medium"}`}>
                                            {templateContent || "Type your message..."}
                                        </p>
                                        <span className="text-[7px] opacity-70 mt-2 block text-right font-sans uppercase tracking-tighter">09:41 AM • Delivered</span>
                                    </motion.div>

                                    {/* Bottom Bar */}
                                    <div className="absolute bottom-6 left-4 right-4 flex gap-2 items-center">
                                        <div className="h-9 flex-1 bg-zinc-800/80 rounded-full border border-zinc-700/50 backdrop-blur-sm shadow-inner" />
                                        <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform">
                                            <Send size={14} />
                                        </div>
                                    </div>
                                </div>

                                {/* Dynamic Shadow Glow */}
                                <div className="absolute inset-0 -z-10 bg-emerald-500/5 blur-[80px] rounded-full opacity-60" />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Compose SMS Modal */}
            <AnimatePresence>
                {isComposeOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-black/60"
                        onClick={() => setIsComposeOpen(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-zinc-800/20">
                                <h3 className="text-xl font-bold flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                                        <Send className="text-emerald-500 w-5 h-5" />
                                    </div>
                                    Direct Dispatch Console
                                </h3>
                                <button onClick={() => setIsComposeOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                                    <Trash2 size={24} />
                                </button>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Recipient Number</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            placeholder="+92 3XX XXXXXXX"
                                            value={composeData.recipient}
                                            onChange={(e) => setComposeData(prev => ({ ...prev, recipient: e.target.value }))}
                                            className="w-full bg-black border border-zinc-800 rounded-2xl px-5 py-4 text-sm focus:border-emerald-500 outline-none transition-all font-mono"
                                        />
                                        <Users className="absolute right-5 top-4 text-zinc-600 w-5 h-5" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Message Body</label>
                                    <textarea 
                                        rows={4}
                                        placeholder="Enter coordination alert..."
                                        value={composeData.content}
                                        onChange={(e) => setComposeData(prev => ({ ...prev, content: e.target.value }))}
                                        className="w-full bg-black border border-zinc-800 rounded-2xl px-5 py-4 text-sm focus:border-emerald-500 outline-none transition-all resize-none leading-relaxed"
                                    />
                                </div>

                                <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                                    <p className="text-[11px] text-emerald-500/70 leading-relaxed italic">
                                        Direct messages are logged under the "ADMIN_OVERRIDE" trigger type for audit transparency.
                                    </p>
                                </div>

                                <button 
                                    onClick={handleSendManualSMS}
                                    disabled={!composeData.recipient || !composeData.content || sendingManual}
                                    className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white rounded-2xl font-bold transition-all shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-3"
                                >
                                    {sendingManual ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
                                    Dispatch Coordination SMS
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {isAddDistrictOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-2xl"
                        >
                            <h2 className="text-xl font-bold mb-2">Register New Area</h2>
                            <p className="text-zinc-500 text-xs mb-6">Add a new district or locality to the mapping registry.</p>
                            
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Area Name</label>
                                    <input 
                                        type="text" value={newDistrict.name}
                                        onChange={(e) => setNewDistrict({ ...newDistrict, name: e.target.value })}
                                        className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm focus:border-emerald-500 outline-none"
                                        placeholder="e.g. Rawalpindi City"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Slug (Link ID)</label>
                                    <input 
                                        type="text" value={newDistrict.slug}
                                        onChange={(e) => setNewDistrict({ ...newDistrict, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                        className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm focus:border-emerald-500 outline-none"
                                        placeholder="rawalpindi-city"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button onClick={() => setIsAddDistrictOpen(false)} className="flex-1 py-3 border border-zinc-800 rounded-xl font-bold text-xs hover:bg-zinc-800 transition-all">Cancel</button>
                                <button 
                                    onClick={handleAddDistrict}
                                    disabled={isSubmitting || !newDistrict.name}
                                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50"
                                >
                                    {isSubmitting ? <RefreshCw className="animate-spin" size={14} /> : "Add Area"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {isAssignSupervisorOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-2xl"
                        >
                            <h2 className="text-xl font-bold mb-2">Assign Field Supervisor</h2>
                            <p className="text-zinc-500 text-xs mb-6">Map a human supervisor to a district for intelligent SMS routing.</p>
                            
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Supervisor Name</label>
                                    <input 
                                        type="text" value={newSupervisor.name}
                                        onChange={(e) => setNewSupervisor({ ...newSupervisor, name: e.target.value })}
                                        className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm focus:border-emerald-500 outline-none"
                                        placeholder="Full Name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Phone Number</label>
                                    <input 
                                        type="text" value={newSupervisor.phoneNumber}
                                        onChange={(e) => setNewSupervisor({ ...newSupervisor, phoneNumber: e.target.value })}
                                        className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm font-mono focus:border-emerald-500 outline-none"
                                        placeholder="+923XXXXXXXXX"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Assign District</label>
                                    <select 
                                        value={newSupervisor.districtId}
                                        onChange={(e) => setNewSupervisor({ ...newSupervisor, districtId: e.target.value })}
                                        className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm focus:border-emerald-500 outline-none"
                                    >
                                        <option value="">Select an Area...</option>
                                        {data.districts.map((d: any) => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                    <button 
                                        onClick={() => setNewSupervisor({ ...newSupervisor, isPrimary: !newSupervisor.isPrimary })}
                                        className={`p-1.5 rounded-lg border transition-all ${newSupervisor.isPrimary ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-zinc-800 border-zinc-700 text-zinc-500"}`}
                                    >
                                        {newSupervisor.isPrimary ? <ShieldCheck size={16} /> : <AlertCircle size={16} />}
                                    </button>
                                    <span className="text-xs font-bold text-zinc-400">Set as Primary Officer</span>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button onClick={() => setIsAssignSupervisorOpen(false)} className="flex-1 py-3 border border-zinc-800 rounded-xl font-bold text-xs hover:bg-zinc-800 transition-all">Cancel</button>
                                <button 
                                    onClick={handleAssignSupervisor}
                                    disabled={isSubmitting || !newSupervisor.name || !newSupervisor.phoneNumber || !newSupervisor.districtId}
                                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50"
                                >
                                    {isSubmitting ? <RefreshCw className="animate-spin" size={14} /> : "Assign Staff"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&family=Outfit:wght@400;500;600;700&display=swap');
                
                :root {
                    --font-outfit: 'Outfit', sans-serif;
                }

                body {
                    font-family: var(--font-outfit);
                }

                .font-nastaleeq {
                    font-family: 'Noto Nastaliq Urdu', serif;
                }
            `}</style>
        </div>
    );
}

export default function SMSManagementPage() {
    return (
        <Suspense fallback={<div className="p-8 text-zinc-500 text-center animate-pulse">Syncing Suthra Punjab Hub...</div>}>
            <SMSManagementContent />
        </Suspense>
    );
}
