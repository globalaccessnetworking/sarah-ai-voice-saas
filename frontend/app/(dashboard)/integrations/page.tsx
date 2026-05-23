"use client";
import React, { useState } from "react";
import {
    Link2, CheckCircle2, XCircle, Clock, AlertTriangle, Settings,
    Activity, RefreshCw, ChevronRight, Eye, EyeOff, Copy, Plus,
    Webhook, Zap, Calendar, CreditCard, Mail, MessageSquare, X
} from "lucide-react";

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

    const cfg = configuring ? integrations.find(i => i.id === configuring) : null;

    const handleTest = async (id: string) => {
        setTesting(id);
        await new Promise(r => setTimeout(r, 1000));
        const ok = Math.random() > 0.3;
        setTestResult(p => ({ ...p, [id]: ok ? "success" : "error" }));
        if (ok) {
            setIntegrations(p => p.map(i => i.id === id ? { ...i, status: "connected", lastSync: "just now" } : i));
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
                            {integrations.map(integ => {
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
                                                disabled={testing === integ.id}
                                                className="flex-1 py-2 text-xs font-bold rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1.5"
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

            {/* Config Drawer */}
            {cfg && (
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
                            {cfg.configFields.map(field => (
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
        </div>
    );
}
