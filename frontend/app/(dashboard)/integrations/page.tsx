"use client";
import React, { useState, useEffect } from "react";
import {
    Link2, CheckCircle2, XCircle, Clock, AlertTriangle, Settings,
    Activity, RefreshCw, ChevronRight, Eye, EyeOff, Copy, Plus,
    Webhook, Zap, Calendar, CreditCard, Mail, MessageSquare, X,
    Trash2, Edit2, Play, Info, Check, AlertCircle
} from "lucide-react";
import { toast } from "sonner";

interface Integration {
    id: string;
    name: string;
    category: string;
    description: string;
    icon: string;
    color: string;
    status: "connected" | "disconnected" | "error";
    apiKeyPlaceholder: string;
    webhookUrl?: string;
    configFields: { label: string; key: string; type?: string; placeholder: string }[];
    lastSync?: string;
    eventsToday?: number;
}

const INTEGRATIONS: Integration[] = [
    {
        id: "hubspot",
        name: "HubSpot",
        category: "CRM",
        description: "Log calls, create contacts, and update deal stages automatically after each call.",
        icon: "🟠",
        color: "#f97316",
        status: "connected",
        apiKeyPlaceholder: "pat-na1-xxxx",
        configFields: [
            { label: "API Key", key: "apiKey", type: "password", placeholder: "pat-na1-xxxxxxxx-xxxx" },
            { label: "Portal ID", key: "portalId", placeholder: "12345678" },
        ],
        lastSync: "2m ago",
        eventsToday: 42,
    },
    {
        id: "salesforce",
        name: "Salesforce",
        category: "CRM",
        description: "Push call summaries and AI insights to Salesforce opportunities and contacts.",
        icon: "🔵",
        color: "#2563eb",
        status: "disconnected",
        apiKeyPlaceholder: "00Dxxxxxx...",
        configFields: [
            { label: "Access Token", key: "accessToken", type: "password", placeholder: "00Dxx0000000xxx!..." },
            { label: "Instance URL", key: "instanceUrl", placeholder: "https://yourorg.salesforce.com" },
        ],
    },
    {
        id: "gohighlevel",
        name: "GoHighLevel",
        category: "CRM",
        description: "Trigger GHL workflows, create contacts, and update pipeline stages after AI calls.",
        icon: "🔶",
        color: "#d97706",
        status: "connected",
        apiKeyPlaceholder: "ghl_xxx...",
        configFields: [
            { label: "API Key", key: "apiKey", type: "password", placeholder: "ghl_xxxxxxxxxxxxxxxxxxxxxxxx" },
            { label: "Location ID", key: "locationId", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxx" },
        ],
        lastSync: "8m ago",
        eventsToday: 18,
    },
    {
        id: "vicidial",
        name: "ViciDial Predictive",
        category: "Telephony Mappings",
        description: "Map ViciDial predictive campaigns, ingroups, and list IDs directly to dynamic AI voice agents.",
        icon: "📞",
        color: "#10b981",
        status: "connected",
        apiKeyPlaceholder: "N/A",
        configFields: [],
        lastSync: "Active",
        eventsToday: 142
    },
    {
        id: "zapier",
        name: "Zapier",
        category: "Automation",
        description: "Send full call payloads to any Zapier workflow with one webhook trigger.",
        icon: "⚡",
        color: "#f59e0b",
        status: "connected",
        apiKeyPlaceholder: "Webhook URL",
        configFields: [
            { label: "Webhook URL", key: "webhookUrl", placeholder: "https://hooks.zapier.com/hooks/catch/..." },
        ],
        lastSync: "5m ago",
        eventsToday: 67,
    },
    {
        id: "calendly",
        name: "Calendly",
        category: "Scheduling",
        description: "Book meetings during live calls — agent checks availability and creates bookings in real-time.",
        icon: "📅",
        color: "#6366f1",
        status: "error",
        apiKeyPlaceholder: "eyJhbGci...",
        configFields: [
            { label: "Personal Access Token", key: "accessToken", type: "password", placeholder: "eyJhbGciOiJIUzI1NiJ9..." },
            { label: "Event Type URL", key: "eventTypeUrl", placeholder: "https://calendly.com/yourname/30min" },
        ],
        lastSync: "Error",
    },
    {
        id: "stripe",
        name: "Stripe",
        category: "Payments",
        description: "Collect one-time payments during calls via DTMF keypad entry — PCI compliant.",
        icon: "💳",
        color: "#8b5cf6",
        status: "disconnected",
        apiKeyPlaceholder: "sk_live_...",
        configFields: [
            { label: "Secret Key", key: "secretKey", type: "password", placeholder: "sk_live_xxxxxxxxxxxxxxxxxxx" },
            { label: "Webhook Secret", key: "webhookSecret", type: "password", placeholder: "whsec_xxxxxxxxxxxxxxxxx" },
        ],
    },
    {
        id: "sendgrid",
        name: "SendGrid",
        category: "Email",
        description: "Trigger transactional emails after calls — summaries, follow-ups, booking confirmations.",
        icon: "📧",
        color: "#06b6d4",
        status: "connected",
        apiKeyPlaceholder: "SG.xxx...",
        configFields: [
            { label: "API Key", key: "apiKey", type: "password", placeholder: "SG.xxxxxxxxxxxxxxxxxxxxxx" },
            { label: "From Email", key: "fromEmail", placeholder: "noreply@yourdomain.com" },
        ],
        lastSync: "1h ago",
        eventsToday: 31,
    },
    {
        id: "twilio-sms",
        name: "Twilio SMS",
        category: "SMS",
        description: "Send automated SMS follow-ups after calls with summaries, booking confirmations, or reminders.",
        icon: "💬",
        color: "#dc2626",
        status: "connected",
        apiKeyPlaceholder: "ACxxxxx...",
        configFields: [
            { label: "Account SID", key: "accountSid", placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" },
            { label: "Auth Token", key: "authToken", type: "password", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" },
            { label: "From Number", key: "fromNumber", placeholder: "+61400000000" },
        ],
        lastSync: "14m ago",
        eventsToday: 24,
    },
    {
        id: "make",
        name: "Make (Integromat)",
        category: "Automation",
        description: "Connect to 1000+ apps through Make's visual automation platform.",
        icon: "🔗",
        color: "#a855f7",
        status: "disconnected",
        apiKeyPlaceholder: "Webhook URL",
        configFields: [
            { label: "Webhook URL", key: "webhookUrl", placeholder: "https://hook.eu1.make.com/..." },
        ],
    },
];

const statusConfig = {
    connected: { color: "#10b981", label: "Connected", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    disconnected: { color: "#6b7280", label: "Not Connected", icon: <XCircle className="w-3.5 h-3.5" /> },
    error: { color: "#ef4444", label: "Error", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
};

const ACTIVITY_LOG = [
    { time: "17:04", integration: "HubSpot", event: "Contact created", status: "success", payload: '{"id": "124839283", "email": "john@acme.com"}' },
    { time: "17:02", integration: "Zapier", event: "Webhook fired (call.ended)", status: "success", payload: '{"call_id": "REC-042", "duration": 182}' },
    { time: "16:58", integration: "GoHighLevel", event: "Pipeline stage updated", status: "success", payload: '{"contactId": "abc123", "stage": "Qualified"}' },
    { time: "16:51", integration: "Calendly", event: "Booking failed — invalid token", status: "error", payload: '{"error": "401 Unauthorized"}' },
    { time: "16:44", integration: "SendGrid", event: "Follow-up email sent", status: "success", payload: '{"messageId": "sg-2984", "to": "jane@dental.com"}' },
    { time: "16:39", integration: "Twilio SMS", event: "SMS confirmation sent", status: "success", payload: '{"to": "+614xx", "status": "delivered"}' },
];

export default function IntegrationsPage() {
    const [integrations, setIntegrations] = useState(INTEGRATIONS);
    const [activeTab, setActiveTab] = useState<"connectors" | "log">("connectors");
    const [configuring, setConfiguring] = useState<string | null>(null);
    const [showKey, setShowKey] = useState(false);
    const [testing, setTesting] = useState<string | null>(null);
    const [testResult, setTestResult] = useState<Record<string, "success" | "error">>({});

    // ViciDial Mappings & Dynamic Agent State
    const [mappings, setMappings] = useState<any[]>([]);
    const [agents, setAgents] = useState<any[]>([]);
    const [loadingMappings, setLoadingMappings] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingMappingId, setEditingMappingId] = useState<string | null>(null);

    // Form inputs state
    const [formName, setFormName] = useState("");
    const [formCampaignId, setFormCampaignId] = useState("");
    const [formListId, setFormListId] = useState("");
    const [formIngroup, setFormIngroup] = useState("");
    const [formAgentId, setFormAgentId] = useState("");
    const [formGreeting, setFormGreeting] = useState("");
    const [formGoal, setFormGoal] = useState("");
    const [formScript, setFormScript] = useState("");
    const [formActive, setFormActive] = useState(true);

    // Sandbox Simulation Mocks
    const [simPhone, setSimPhone] = useState("15551234567");
    const [simCampaign, setSimCampaign] = useState("CAMP01");
    const [simList, setSimList] = useState("101");
    const [simIngroup, setSimIngroup] = useState("SALES_IN");
    const [simLeadId, setSimLeadId] = useState("888777");
    const [simFirstName, setSimFirstName] = useState("John");
    const [simLastName, setSimLastName] = useState("Doe");
    const [simulating, setSimulating] = useState(false);
    const [simResult, setSimResult] = useState<any>(null);

    // Fetch mappings and active agents
    useEffect(() => {
        if (configuring === "vicidial") {
            fetchMappings();
            fetchAgents();
        }
    }, [configuring]);

    const fetchMappings = async () => {
        setLoadingMappings(true);
        try {
            const res = await fetch("/api/integrations/vicidial/mappings");
            if (res.ok) {
                const data = await res.json();
                const mappingsArray = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.mappings)
                    ? data.mappings
                    : Array.isArray(data?.data)
                    ? data.data
                    : [];
                setMappings(mappingsArray);
            } else {
                setMappings([]);
            }
        } catch (err) {
            console.error("Failed to load mappings", err);
            setMappings([]);
        } finally {
            setLoadingMappings(false);
        }
    };

    const fetchAgents = async () => {
        try {
            const res = await fetch("/api/agents");
            if (res.ok) {
                const data = await res.json();
                const agentsArray = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.agents)
                    ? data.agents
                    : Array.isArray(data?.data)
                    ? data.data
                    : [];
                setAgents(agentsArray);
            } else {
                setAgents([]);
            }
        } catch (err) {
            console.error("Failed to load agents", err);
            setAgents([]);
        }
    };

    const handleSaveMapping = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName || !formAgentId) {
            toast.error("Please fill in Mapping Name and select a Target AI Agent.");
            return;
        }

        if (!formCampaignId && !formListId && !formIngroup) {
            toast.error("You must specify at least one criteria (Campaign ID, List ID, or Ingroup).");
            return;
        }

        const payload = {
            name: formName,
            vicidialCampaignId: formCampaignId,
            vicidialListId: formListId,
            vicidialIngroup: formIngroup,
            agentId: formAgentId,
            openingMessage: formGreeting,
            callGoal: formGoal,
            script: formScript,
            isActive: formActive
        };

        try {
            let res;
            if (editingMappingId) {
                res = await fetch(`/api/integrations/vicidial/mappings/${editingMappingId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch("/api/integrations/vicidial/mappings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
            }

            if (res.ok) {
                toast.success(editingMappingId ? "Mapping updated successfully" : "Mapping created successfully");
                resetForm();
                fetchMappings();
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to save mapping");
            }
        } catch (err) {
            toast.error("Failed to save mapping");
        }
    };

    const handleEditMapping = (m: any) => {
        setEditingMappingId(m.id);
        setFormName(m.name || "");
        setFormCampaignId(m.vicidialCampaignId || "");
        setFormListId(m.vicidialListId || "");
        setFormIngroup(m.vicidialIngroup || "");
        setFormAgentId(m.agentId || "");
        setFormGreeting(m.openingMessage || "");
        setFormGoal(m.callGoal || "");
        setFormScript(m.script || "");
        setFormActive(m.isActive);
        setShowAddForm(true);
    };

    const handleDeleteMapping = async (id: string) => {
        if (!confirm("Are you sure you want to delete this mapping?")) return;
        try {
            const res = await fetch(`/api/integrations/vicidial/mappings/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Mapping deleted successfully");
                fetchMappings();
            } else {
                toast.error("Failed to delete mapping");
            }
        } catch (err) {
            toast.error("Failed to delete mapping");
        }
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/integrations/vicidial/mappings/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !currentStatus })
            });
            if (res.ok) {
                toast.success(!currentStatus ? "Mapping activated" : "Mapping deactivated");
                fetchMappings();
            }
        } catch (err) {
            toast.error("Failed to update status");
        }
    };

    const handleRunSimulation = async () => {
        setSimulating(true);
        setSimResult(null);
        try {
            const payload = {
                phone: simPhone,
                vicidialCampaignId: simCampaign,
                vicidialListId: simList,
                vicidialIngroup: simIngroup,
                leadId: simLeadId,
                firstName: simFirstName,
                lastName: simLastName
            };
            const res = await fetch("/api/integrations/vicidial/mappings/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const data = await res.json();
                setSimResult(data);
                toast.success("Simulation completed! Result loaded.");
            } else {
                toast.error("Simulation failed");
            }
        } catch (err) {
            toast.error("Simulation failed");
        } finally {
            setSimulating(false);
        }
    };

    const resetForm = () => {
        setEditingMappingId(null);
        setFormName("");
        setFormCampaignId("");
        setFormListId("");
        setFormIngroup("");
        setFormAgentId("");
        setFormGreeting("");
        setFormGoal("");
        setFormScript("");
        setFormActive(true);
        setShowAddForm(false);
    };

    const cfg = configuring ? integrations.find(i => i.id === configuring) : null;

    const handleTest = async (id: string) => {
        setTesting(id);
        await new Promise(r => setTimeout(r, 1000));
        const ok = Math.random() > 0.3;
        setTestResult(p => ({ ...p, [id]: ok ? "success" : "error" }));
        if (ok) {
            setIntegrations(p => (Array.isArray(p) ? p : []).map(i => i.id === id ? { ...i, status: "connected", lastSync: "just now" } : i));
        }
        setTesting(null);
    };

    const connected = integrations.filter(i => i.status === "connected").length;

    return (
        <div className="min-h-screen bg-black text-zinc-200">
            <div className="w-full overflow-y-auto bg-zinc-950 p-8 md:p-10">
                <div className="max-w-[1600px] mx-auto space-y-8">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-950/40 to-cyan-950/30 border border-blue-900/30 rounded-2xl p-6 flex items-center gap-5">
                        <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center">
                            <Link2 className="w-7 h-7 text-blue-400" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold text-white mb-1">CRM & Integration Hub</h1>
                            <p className="text-xs text-zinc-400">Connect your AI voice agents to CRMs, automation platforms, SMS, email, and payment systems. Every call triggers your workflows.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-right">
                            <div>
                                <div className="text-2xl font-bold text-emerald-400">{connected}</div>
                                <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Connected</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">{ACTIVITY_LOG.length}</div>
                                <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Events Today</div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
                        {(["connectors", "log"] as const).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
                                {tab === "connectors" ? "🔌 Connectors" : "📋 Activity Log"}
                            </button>
                        ))}
                    </div>

                    {activeTab === "connectors" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {(Array.isArray(integrations) ? integrations : []).map(integ => {
                                const sc = statusConfig[integ.status];
                                return (
                                    <div key={integ.id} className={`bg-zinc-900 border rounded-2xl p-5 flex flex-col gap-4 transition-all hover:shadow-lg ${integ.status === "error" ? "border-red-900/40" : integ.status === "connected" ? "border-emerald-900/30" : "border-zinc-800"}`}>
                                        {/* Header */}
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="text-2xl">{integ.icon}</div>
                                                <div>
                                                    <div className="text-sm font-bold text-white">{integ.name}</div>
                                                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{integ.category}</div>
                                                </div>
                                            </div>
                                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: sc.color, background: sc.color + "20" }}>
                                                {sc.icon} {sc.label}
                                            </span>
                                        </div>

                                        {/* Description */}
                                        <p className="text-xs text-zinc-500 leading-relaxed">{integ.description}</p>

                                        {/* Stats */}
                                        {integ.status === "connected" && (
                                            <div className="flex gap-3">
                                                {integ.lastSync && <div className="flex items-center gap-1 text-[10px] text-zinc-500"><Clock className="w-3 h-3" /> Last sync: {integ.lastSync}</div>}
                                                {integ.eventsToday && <div className="flex items-center gap-1 text-[10px] text-zinc-500"><Activity className="w-3 h-3" /> {integ.eventsToday} today</div>}
                                            </div>
                                        )}
                                        {integ.status === "error" && (
                                            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/30 border border-red-900/30 rounded-lg px-3 py-2">
                                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Auth token expired. Reconnect required.
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex gap-2 mt-auto">
                                            <button
                                                onClick={() => handleTest(integ.id)}
                                                disabled={testing === integ.id || integ.id === "vicidial"}
                                                className="flex-1 py-2 text-xs font-bold rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                                            >
                                                {testing === integ.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                                                {testResult[integ.id] === "success" ? "✓ Working!" : testResult[integ.id] === "error" ? "✗ Failed" : "Test"}
                                            </button>
                                            <button
                                                onClick={() => setConfiguring(integ.id)}
                                                className="flex-1 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center justify-center gap-1.5"
                                            >
                                                <Settings className="w-3 h-3" /> Configure
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === "log" && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                                <h2 className="text-sm font-bold text-white">Integration Activity Log</h2>
                                <span className="text-xs text-zinc-500">Last 24 hours</span>
                            </div>
                            <div className="divide-y divide-zinc-800/50">
                                {ACTIVITY_LOG.map((ev, i) => (
                                    <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-800/30 transition-colors">
                                        <div className="font-mono text-xs text-zinc-500 shrink-0 w-12">{ev.time}</div>
                                        <div className="text-xs font-bold text-zinc-300 w-28 shrink-0">{ev.integration}</div>
                                        <div className="flex-1 text-xs text-zinc-400">{ev.event}</div>
                                        <div className="font-mono text-[10px] text-zinc-600 max-w-48 truncate hidden lg:block">{ev.payload}</div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${ev.status === "success" ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"}`}>
                                            {ev.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Config Drawer for Standard CRM Integrations */}
            {cfg && cfg.id !== "vicidial" && (
                <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm" onClick={() => setConfiguring(null)}>
                    <div className="w-full max-w-md bg-zinc-950 border-l border-zinc-800 h-full overflow-y-auto p-8 space-y-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{cfg.icon}</span>
                                <h2 className="text-lg font-bold text-white">{cfg.name} Config</h2>
                            </div>
                            <button onClick={() => setConfiguring(null)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="space-y-4">
                            {(cfg && Array.isArray(cfg.configFields) ? cfg.configFields : []).map(field => (
                                <div key={field.key}>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">{field.label}</label>
                                    <div className="relative">
                                        <input
                                            type={field.type === "password" && !showKey ? "password" : "text"}
                                            placeholder={field.placeholder}
                                            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500 pr-10"
                                        />
                                        {field.type === "password" && (
                                            <button onClick={() => setShowKey(p => !p)} className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300">
                                                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-3">
                            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Trigger Events</div>
                            {["call.started", "call.ended", "transcript.ready", "booking.created"].map(ev => (
                                <div key={ev} className="flex items-center justify-between py-2.5 px-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                                    <span className="text-xs font-mono text-zinc-300">{ev}</span>
                                    <div className="w-8 h-4 bg-emerald-600 rounded-full relative">
                                        <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow" />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-colors">Save & Connect</button>
                            <button onClick={() => setConfiguring(null)} className="py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-bold rounded-xl transition-colors">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Premium Config Drawer for ViciDial Predictive Mappings */}
            {configuring === "vicidial" && (
                <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-md" onClick={() => setConfiguring(null)}>
                    <div className="w-full max-w-4xl bg-zinc-950 border-l border-zinc-850 h-full overflow-y-auto p-8 space-y-8 shadow-2xl transition-all" onClick={e => e.stopPropagation()}>
                        
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-5">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">📞</span>
                                <div>
                                    <h2 className="text-xl font-bold text-white">ViciDial Predictive Mappings</h2>
                                    <p className="text-xs text-zinc-400">Map predictive dialer queues, campaign contexts, and ingroups to dynamic AI agents.</p>
                                </div>
                            </div>
                            <button onClick={() => setConfiguring(null)} className="text-zinc-400 hover:text-white transition-colors bg-zinc-900 hover:bg-zinc-800 p-2 rounded-xl border border-zinc-800"><X className="w-5 h-5" /></button>
                        </div>

                        {/* Split Columns Grid: List & Forms */}
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                            
                            {/* Left Side: Mapping Rules List (Column 1-3) */}
                            <div className="lg:col-span-3 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <Activity className="w-4 h-4 text-emerald-400" /> Active Mapping Rules ({mappings.length})
                                    </h3>
                                    {!showAddForm && (
                                        <button
                                            onClick={() => { resetForm(); setShowAddForm(true); }}
                                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 transition-colors"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Add New Rule
                                        </button>
                                    )}
                                </div>

                                {loadingMappings ? (
                                    <div className="flex items-center justify-center py-12 text-zinc-500 text-xs gap-2">
                                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" /> Loading mapping configurations...
                                    </div>
                                ) : (!Array.isArray(mappings) || mappings.length === 0) ? (
                                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-500 space-y-2">
                                        <Info className="w-8 h-8 text-zinc-600 mx-auto" />
                                        <p className="text-xs">No active ViciDial mappings defined. Incoming calls will use the default inbound fallback agent.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                        {(Array.isArray(mappings) ? mappings : []).map((m) => (
                                            <div
                                                key={m.id}
                                                className={`bg-zinc-900 border rounded-2xl p-5 space-y-4 transition-all hover:bg-zinc-900/80 ${m.isActive ? "border-emerald-950/60" : "border-zinc-800 opacity-60"}`}
                                            >
                                                {/* Header & Toggle */}
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`w-2 h-2 rounded-full ${m.isActive ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"}`} />
                                                            <h4 className="text-sm font-bold text-white">{m.name}</h4>
                                                        </div>
                                                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">ID: {m.id}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {/* Active Status Toggle Button */}
                                                        <button
                                                            onClick={() => handleToggleActive(m.id, m.isActive)}
                                                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all border ${
                                                                m.isActive
                                                                    ? "text-emerald-400 bg-emerald-950/20 border-emerald-800/30"
                                                                    : "text-zinc-400 bg-zinc-850 border-zinc-700"
                                                            }`}
                                                        >
                                                            {m.isActive ? "Active" : "Disabled"}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Match Priority Badges */}
                                                <div className="flex flex-wrap gap-2 text-[10px] font-bold font-mono">
                                                    {m.vicidialCampaignId && (
                                                        <span className="bg-zinc-800 text-blue-400 border border-zinc-700 px-2 py-0.5 rounded-md">
                                                            Campaign: {m.vicidialCampaignId}
                                                        </span>
                                                    )}
                                                    {m.vicidialListId && (
                                                        <span className="bg-zinc-800 text-cyan-400 border border-zinc-700 px-2 py-0.5 rounded-md">
                                                            List: {m.vicidialListId}
                                                        </span>
                                                    )}
                                                    {m.vicidialIngroup && (
                                                        <span className="bg-zinc-800 text-purple-400 border border-zinc-700 px-2 py-0.5 rounded-md">
                                                            Ingroup: {m.vicidialIngroup}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Mapped Agent */}
                                                <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-3.5 flex items-center justify-between">
                                                    <div>
                                                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Target SaaS Agent</div>
                                                        <div className="text-xs font-bold text-white mt-0.5">{m.agentName || "Loading..."}</div>
                                                    </div>
                                                    <span className="bg-blue-950/40 text-blue-400 border border-blue-900/30 text-[10px] font-bold font-mono px-2 py-0.5 rounded-md">
                                                        slug: {m.agentSlug || "N/A"}
                                                    </span>
                                                </div>

                                                {/* Template greeting summary */}
                                                {m.openingMessage && (
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Opening Message greeting template</span>
                                                        <div className="bg-zinc-950/40 text-zinc-400 text-xs rounded-xl p-3 border border-zinc-850/50 italic leading-relaxed truncate max-w-full">
                                                            "{m.openingMessage}"
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Action Buttons */}
                                                <div className="flex gap-2 justify-end pt-1">
                                                    <button
                                                        onClick={() => handleEditMapping(m)}
                                                        className="py-1.5 px-3 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" /> Edit Rule
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteMapping(m.id)}
                                                        className="py-1.5 px-3 border border-red-900/30 text-red-400 hover:bg-red-950/20 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Right Side: Form (Column 4-5) */}
                            <div className="lg:col-span-2 space-y-6">
                                {showAddForm ? (
                                    <form onSubmit={handleSaveMapping} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-5">
                                        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                                            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                                                {editingMappingId ? <Edit2 className="w-4 h-4 text-blue-400" /> : <Plus className="w-4 h-4 text-emerald-400" />}
                                                {editingMappingId ? "Edit Mapping Rule" : "Create New Mapping Rule"}
                                            </h4>
                                            <button type="button" onClick={resetForm} className="text-zinc-500 hover:text-white"><X className="w-4.5 h-4.5" /></button>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Name */}
                                            <div>
                                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Mapping Name</label>
                                                <input
                                                    type="text"
                                                    value={formName}
                                                    onChange={e => setFormName(e.target.value)}
                                                    placeholder="e.g. Sales Queue Agent Map"
                                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                                                    required
                                                />
                                            </div>

                                            {/* Matching parameters */}
                                            <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-3.5 space-y-3">
                                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                                                    <Info className="w-3 h-3 text-blue-400" /> Match Parameters (At least one)
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">ViciDial Campaign ID</label>
                                                        <input
                                                            type="text"
                                                            value={formCampaignId}
                                                            onChange={e => setFormCampaignId(e.target.value)}
                                                            placeholder="e.g. CAMP001"
                                                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">ViciDial List ID</label>
                                                        <input
                                                            type="text"
                                                            value={formListId}
                                                            onChange={e => setFormListId(e.target.value)}
                                                            placeholder="e.g. 1001"
                                                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">ViciDial Ingroup ID</label>
                                                    <input
                                                        type="text"
                                                        value={formIngroup}
                                                        onChange={e => setFormIngroup(e.target.value)}
                                                        placeholder="e.g. SALES_INGROUP"
                                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
                                                    />
                                                </div>
                                            </div>

                                            {/* AI Agent Selection */}
                                            <div>
                                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Target AI Voice Agent</label>
                                                <select
                                                    value={formAgentId}
                                                    onChange={e => setFormAgentId(e.target.value)}
                                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
                                                    required
                                                >
                                                    <option value="">-- Select Target Agent --</option>
                                                    {(Array.isArray(agents) ? agents : []).map(a => (
                                                        <option key={a.id} value={a.id}>{a.name} ({a.slug})</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Custom greeting text */}
                                            <div>
                                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Custom Greeting Template (Optional)</label>
                                                <textarea
                                                    value={formGreeting}
                                                    onChange={e => setFormGreeting(e.target.value)}
                                                    placeholder="Hello {{first_name}}, this is Sarah from global call center. I see you are interested in {{comments}}..."
                                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 h-20 resize-none focus:outline-none focus:border-emerald-500 leading-relaxed font-sans placeholder-zinc-700"
                                                />
                                            </div>

                                            {/* Goals & Script */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Call Goal (Optional)</label>
                                                    <input
                                                        type="text"
                                                        value={formGoal}
                                                        onChange={e => setFormGoal(e.target.value)}
                                                        placeholder="Confirm customer request"
                                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500 font-sans"
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between pt-5 px-1 bg-zinc-950/40 rounded-xl border border-zinc-850 p-2.5">
                                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Status Active</span>
                                                    <input
                                                        type="checkbox"
                                                        checked={formActive}
                                                        onChange={e => setFormActive(e.target.checked)}
                                                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-zinc-900 border-zinc-700"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 border-t border-zinc-800 pt-4">
                                            <button type="submit" className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors">
                                                {editingMappingId ? "Save Changes" : "Create Rule"}
                                            </button>
                                            <button type="button" onClick={resetForm} className="py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition-colors">Cancel</button>
                                        </div>
                                    </form>
                                ) : (
                                    /* Interactive Sandbox Simulator */
                                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-5">
                                        <div className="border-b border-zinc-800 pb-3">
                                            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                                                <Zap className="w-4 h-4 text-emerald-400" /> ViciDial Mapping Sandbox
                                            </h4>
                                            <p className="text-[10px] text-zinc-500 mt-0.5">Simulate and test lead contexts, specificity routing, and greetings locally.</p>
                                        </div>

                                        <div className="space-y-3.5">
                                            {/* Inputs */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Mock Phone</label>
                                                    <input type="text" value={simPhone} onChange={e => setSimPhone(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-300" />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Campaign ID</label>
                                                    <input type="text" value={simCampaign} onChange={e => setSimCampaign(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-300" />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">List ID</label>
                                                    <input type="text" value={simList} onChange={e => setSimList(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-300" />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Ingroup ID</label>
                                                    <input type="text" value={simIngroup} onChange={e => setSimIngroup(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-300" />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">First Name</label>
                                                    <input type="text" value={simFirstName} onChange={e => setSimFirstName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300" />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Last Name</label>
                                                    <input type="text" value={simLastName} onChange={e => setSimLastName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300" />
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={handleRunSimulation}
                                                disabled={simulating}
                                                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                                            >
                                                {simulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                                                Simulate Specificity Mapping
                                            </button>
                                        </div>

                                        {/* Result Section */}
                                        {simResult && (
                                            <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-4 space-y-4 max-h-[30vh] overflow-y-auto pr-1">
                                                <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                                                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Simulation Results
                                                </div>

                                                {simResult.mapping ? (
                                                    <div className="space-y-3 text-xs">
                                                        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 space-y-1">
                                                            <div className="text-[9px] text-zinc-500 font-bold uppercase">Matched Rule</div>
                                                            <div className="font-bold text-white">{simResult.mapping.name}</div>
                                                            <div className="text-[9px] font-mono text-zinc-400 mt-1">Score specificity: {simResult.mapping.score}</div>
                                                        </div>

                                                        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 space-y-1">
                                                            <div className="text-[9px] text-zinc-500 font-bold uppercase">Resolved AI Agent</div>
                                                            <div className="font-bold text-white">{simResult.agent?.name}</div>
                                                            <div className="text-[9px] font-mono text-zinc-400 mt-1">slug: {simResult.agent?.slug}</div>
                                                        </div>

                                                        {simResult.rendered_opening_message && (
                                                            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 space-y-1">
                                                                <div className="text-[9px] text-zinc-500 font-bold uppercase">Rendered Greeting Text</div>
                                                                <div className="text-zinc-300 italic">"{simResult.rendered_opening_message}"</div>
                                                            </div>
                                                        )}

                                                        <div className="space-y-1.5 font-mono text-[9px] text-zinc-500">
                                                            <div className="text-[9px] text-zinc-400 font-bold font-sans uppercase">Redis Keys Generated:</div>
                                                            {Array.isArray(simResult.redis_context?.keys_written) ? simResult.redis_context.keys_written.map((k: string) => (
                                                                <div key={k} className="bg-zinc-900 p-1 px-2 rounded-md break-all">{k}</div>
                                                            )) : null}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-zinc-500 text-xs flex items-center gap-1.5">
                                                        <AlertCircle className="w-4 h-4 text-zinc-500 shrink-0" />
                                                        No active mapping matched this criteria. Fallback agent will be used.
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
