"use client";
import React, { useState } from "react";
import {
    Terminal, Key, Webhook, Code2, Globe, Copy, CheckCircle,
    Plus, Trash2, Eye, EyeOff, Activity, ExternalLink, Book,
    ChevronDown, ChevronUp, Package, RefreshCw
} from "lucide-react";

type DevTab = "api-docs" | "webhooks" | "sdk" | "embed";

const ENDPOINTS = [
    { method: "GET", path: "/api/rooms", desc: "List all active rooms", auth: true },
    { method: "GET", path: "/api/rooms/:name", desc: "Get room details and participants", auth: true },
    { method: "POST", path: "/api/rooms/:name/close", desc: "Force-close a room", auth: true },
    { method: "GET", path: "/api/agents", desc: "List all agents with their config", auth: true },
    { method: "POST", path: "/api/agents", desc: "Create a new agent", auth: true },
    { method: "PATCH", path: "/api/agents/:id", desc: "Update agent configuration", auth: true },
    { method: "DELETE", path: "/api/agents/:id", desc: "Delete an agent", auth: true },
    { method: "GET", path: "/api/calls", desc: "List call logs with filtering", auth: true },
    { method: "GET", path: "/api/calls/:id", desc: "Get single call with transcript", auth: true },
    { method: "GET", path: "/api/recordings", desc: "List all recordings", auth: true },
    { method: "DELETE", path: "/api/recordings/:id", desc: "Delete a recording", auth: true },
    { method: "GET", path: "/api/knowledge-base", desc: "List knowledge bases", auth: true },
    { method: "POST", path: "/api/knowledge-base", desc: "Create a new knowledge base", auth: true },
    { method: "POST", path: "/api/sip-trunks", desc: "Create a SIP trunk", auth: true },
    { method: "GET", path: "/api/sip-trunks", desc: "List SIP trunks", auth: true },
    { method: "GET", path: "/api/users", desc: "List users (admin only)", auth: true },
    { method: "GET", path: "/api/settings", desc: "Get system configuration", auth: true },
];

const WEBHOOK_EVENTS = [
    { event: "call.started", desc: "Fired when a new call begins", payload: '{"call_id": "...", "agent_id": "...", "from": "+61...", "to": "+61..."}' },
    { event: "call.ended", desc: "Fired when a call ends with summary", payload: '{"call_id": "...", "duration_seconds": 120, "outcome": "resolved", "summary": "..."}' },
    { event: "transcript.ready", desc: "Full transcript available after call", payload: '{"call_id": "...", "transcript": [...], "word_count": 342}' },
    { event: "recording.ready", desc: "MP3/WAV recording file is ready", payload: '{"recording_id": "...", "url": "https://...", "duration_seconds": 120}' },
    { event: "agent.status_changed", desc: "Agent started, stopped, or restarted", payload: '{"agent_id": "...", "status": "running", "previous_status": "stopped"}' },
    { event: "booking.created", desc: "AI agent booked an appointment", payload: '{"call_id": "...", "datetime": "2026-03-15T09:00:00Z", "patient_name": "..."}' },
];

const METHOD_COLOR: Record<string, string> = {
    GET: "#10b981",
    POST: "#6366f1",
    PATCH: "#f59e0b",
    DELETE: "#ef4444",
};

interface WebhookSubscription {
    id: string;
    url: string;
    events: string[];
    active: boolean;
    lastFired: string;
}

const INITIAL_SUBS: WebhookSubscription[] = [
    { id: "wh1", url: "https://hooks.zapier.com/hooks/catch/12345/abcdef/", events: ["call.ended", "transcript.ready"], active: true, lastFired: "2m ago" },
    { id: "wh2", url: "https://app.gohighlevel.com/hooks/inbound/...", events: ["call.started", "call.ended"], active: true, lastFired: "15m ago" },
];

const SDK_INSTALLS: Record<string, string> = {
    python: `pip install globalaccess-sdk\n\n# Usage:\nfrom globalaccess import Client\n\nclient = Client(api_key="your_api_key")\nagents = client.agents.list()\nprint(agents)`,
    node: `npm install @globalaccess/sdk\n\n// Usage:\nimport { GlobalAccessClient } from '@globalaccess/sdk';\n\nconst client = new GlobalAccessClient({ apiKey: 'your_api_key' });\nconst agents = await client.agents.list();\nconsole.log(agents);`,
    php: `composer require globalaccess/sdk\n\n// Usage:\nuse GlobalAccess\\Client;\n\n$client = new Client(['api_key' => 'your_api_key']);\n$agents = $client->agents()->list();\nvar_dump($agents);`,
};

export default function DeveloperPage() {
    const [activeTab, setActiveTab] = useState<DevTab>("api-docs");
    const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);
    const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
    const [showApiKey, setShowApiKey] = useState(false);
    const [subscriptions, setSubscriptions] = useState(INITIAL_SUBS);
    const [sdkLang, setSdkLang] = useState<"python" | "node" | "php">("python");
    const [copiedSdk, setCopiedSdk] = useState(false);
    const [embedCopied, setEmbedCopied] = useState(false);
    const [selectedEvents, setSelectedEvents] = useState<Record<string, string[]>>({});

    const apiKey = "gax_live_5a8f2c91b4e73d0a1f6b9c2e4d7a8b3c";
    const maskedApiKey = "gax_live_" + "•".repeat(32);

    const copyEndpoint = (path: string) => {
        navigator.clipboard.writeText(`https://your-domain.com${path}`);
        setCopiedEndpoint(path);
        setTimeout(() => setCopiedEndpoint(null), 2000);
    };

    const deleteSub = (id: string) => setSubscriptions(p => p.filter(s => s.id !== id));
    const toggleSub = (id: string) => setSubscriptions(p => p.map(s => s.id === id ? { ...s, active: !s.active } : s));

    const embedCode = `<script src="https://your-domain.com/widget.js" data-agent-id="YOUR_AGENT_ID"></script>`;

    return (
        <div className="min-h-screen bg-black text-zinc-200">
            <div className="w-full overflow-y-auto bg-zinc-950 p-8 md:p-10">
                <div className="max-w-[1600px] mx-auto space-y-8">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-violet-950/40 to-indigo-950/30 border border-violet-900/30 rounded-2xl p-6 flex items-center gap-5">
                        <div className="w-14 h-14 bg-violet-500/10 border border-violet-500/20 rounded-2xl flex items-center justify-center">
                            <Terminal className="w-7 h-7 text-violet-400" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold text-white mb-1">Developer Platform</h1>
                            <p className="text-xs text-zinc-400">Full REST API access, webhook subscriptions, SDK libraries for Python/Node/PHP, and an embed widget. Build your own integrations.</p>
                        </div>
                        <div className="text-right">
                            <div className="text-xl font-bold text-violet-400">{ENDPOINTS.length} Endpoints</div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Public REST API</div>
                        </div>
                    </div>

                    {/* API Key */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center gap-4">
                        <Key className="w-5 h-5 text-amber-400 shrink-0" />
                        <div className="flex-1">
                            <div className="text-xs font-bold text-zinc-400 mb-1">Your API Key</div>
                            <div className="font-mono text-sm text-zinc-100">{showApiKey ? apiKey : maskedApiKey}</div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setShowApiKey(p => !p)} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors">
                                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button onClick={() => { navigator.clipboard.writeText(apiKey); }} className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors">
                                <Copy className="w-3.5 h-3.5" /> Copy
                            </button>
                            <button className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors">
                                <RefreshCw className="w-3.5 h-3.5" /> Rotate
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit flex-wrap">
                        {(["api-docs", "webhooks", "sdk", "embed"] as DevTab[]).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
                                {tab === "api-docs" ? "📋 API Docs" : tab === "webhooks" ? "⚡ Webhooks" : tab === "sdk" ? "📦 SDKs" : "🌐 Embed"}
                            </button>
                        ))}
                    </div>

                    {activeTab === "api-docs" && (
                        <div className="space-y-2">
                            <div className="grid grid-cols-12 text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-4 py-2">
                                <div className="col-span-1">Method</div>
                                <div className="col-span-4">Endpoint</div>
                                <div className="col-span-5">Description</div>
                                <div className="col-span-2">Actions</div>
                            </div>
                            {ENDPOINTS.map(ep => (
                                <div key={ep.path} className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl px-4 py-3 grid grid-cols-12 items-center gap-2 transition-colors">
                                    <div className="col-span-1">
                                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded" style={{ color: METHOD_COLOR[ep.method], background: METHOD_COLOR[ep.method] + "20" }}>{ep.method}</span>
                                    </div>
                                    <div className="col-span-4 font-mono text-xs text-zinc-300">{ep.path}</div>
                                    <div className="col-span-5 text-xs text-zinc-500">{ep.desc}</div>
                                    <div className="col-span-2 flex gap-2">
                                        <button onClick={() => copyEndpoint(ep.path)} className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors">
                                            {copiedEndpoint === ep.path ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>
                                        <span className="text-[10px] text-amber-500 flex items-center gap-1"><Key className="w-3 h-3" /> Auth</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === "webhooks" && (
                        <div className="space-y-6">
                            {/* Existing subscriptions */}
                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                                <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
                                    <h2 className="text-sm font-bold text-white">Active Subscriptions</h2>
                                    <button className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-lg transition-colors">
                                        <Plus className="w-3.5 h-3.5" /> Add Webhook
                                    </button>
                                </div>
                                <div className="divide-y divide-zinc-800/50">
                                    {subscriptions.map(sub => (
                                        <div key={sub.id} className="px-6 py-4 flex items-center gap-4">
                                            <div className={`w-2 h-2 rounded-full shrink-0 ${sub.active ? "bg-emerald-400" : "bg-zinc-600"}`} />
                                            <div className="flex-1">
                                                <div className="font-mono text-xs text-zinc-200 mb-1 truncate">{sub.url}</div>
                                                <div className="flex gap-2 flex-wrap">
                                                    {sub.events.map(ev => (
                                                        <span key={ev} className="text-[10px] font-mono bg-violet-500/10 text-violet-300 border border-violet-500/20 px-1.5 py-0.5 rounded">{ev}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="text-[10px] text-zinc-500 shrink-0">Last: {sub.lastFired}</div>
                                            <button onClick={() => toggleSub(sub.id)} className={`w-9 h-5 rounded-full relative transition-all ${sub.active ? "bg-emerald-600" : "bg-zinc-700"}`}>
                                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${sub.active ? "right-0.5" : "left-0.5"}`} />
                                            </button>
                                            <button onClick={() => deleteSub(sub.id)} className="text-zinc-600 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Event reference */}
                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                                <div className="px-6 py-4 border-b border-zinc-800"><h2 className="text-sm font-bold text-white">Event Reference</h2></div>
                                <div className="divide-y divide-zinc-800/50">
                                    {WEBHOOK_EVENTS.map(ev => (
                                        <div key={ev.event} className="px-6 py-4">
                                            <div className="flex items-center gap-3 mb-2">
                                                <code className="text-xs font-bold text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded">{ev.event}</code>
                                                <span className="text-xs text-zinc-500">{ev.desc}</span>
                                            </div>
                                            <code className="text-[11px] font-mono text-zinc-400 bg-zinc-800 rounded px-3 py-2 block">{ev.payload}</code>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "sdk" && (
                        <div className="space-y-5">
                            <div className="flex gap-2">
                                {(["python", "node", "php"] as const).map(lang => (
                                    <button key={lang} onClick={() => setSdkLang(lang)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${sdkLang === lang ? "bg-indigo-600 border-indigo-500 text-white" : "border-zinc-700 text-zinc-400 hover:text-zinc-200"}`}>
                                        {lang === "python" ? "🐍 Python" : lang === "node" ? "🟨 Node.js" : "🐘 PHP"}
                                    </button>
                                ))}
                            </div>
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                                <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
                                    <span className="text-xs font-bold text-zinc-300 font-mono capitalize">{sdkLang} SDK Installation</span>
                                    <button onClick={() => { navigator.clipboard.writeText(SDK_INSTALLS[sdkLang]); setCopiedSdk(true); setTimeout(() => setCopiedSdk(false), 2000); }}
                                        className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all ${copiedSdk ? "text-emerald-400 bg-emerald-500/10" : "text-zinc-400 hover:text-zinc-200 bg-zinc-800"}`}>
                                        {copiedSdk ? <><CheckCircle className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                                    </button>
                                </div>
                                <pre className="p-5 text-[12px] font-mono text-zinc-200 leading-relaxed overflow-x-auto">{SDK_INSTALLS[sdkLang]}</pre>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { label: "Rate Limit", value: "1,000 req/min" },
                                    { label: "Response Format", value: "JSON" },
                                    { label: "Auth Header", value: "Authorization: Bearer" },
                                ].map(m => (
                                    <div key={m.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                                        <div className="text-xs font-bold font-mono text-white">{m.value}</div>
                                        <div className="text-[10px] text-zinc-500 mt-1">{m.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "embed" && (
                        <div className="max-w-2xl space-y-6">
                            <div className="bg-gradient-to-r from-indigo-950/30 to-violet-950/20 border border-indigo-900/30 rounded-xl p-5">
                                <h3 className="text-sm font-bold text-white mb-2">One-Line Embed Widget</h3>
                                <p className="text-xs text-zinc-400 leading-relaxed">Add one &lt;script&gt; tag to any website to embed a live AI voice chat widget. Callers can click-to-call your AI agent directly from the webpage.</p>
                            </div>
                            <div>
                                <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Your Embed Code</div>
                                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                                    <div className="flex justify-between items-center px-4 py-3 border-b border-zinc-800">
                                        <span className="text-xs text-zinc-500">HTML</span>
                                        <button onClick={() => { navigator.clipboard.writeText(embedCode); setEmbedCopied(true); setTimeout(() => setEmbedCopied(false), 2000); }} className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg ${embedCopied ? "text-emerald-400 bg-emerald-500/10" : "text-zinc-400 bg-zinc-800 hover:text-zinc-200"}`}>
                                            {embedCopied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {embedCopied ? "Copied!" : "Copy"}
                                        </button>
                                    </div>
                                    <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">{embedCode}</pre>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Widget Configuration</div>
                                {[
                                    { label: "Agent ID", placeholder: "agt_abc123", desc: "The agent to handle widget calls" },
                                    { label: "Primary Color", placeholder: "#6366f1", desc: "Widget brand color" },
                                    { label: "Position", placeholder: "bottom-right", desc: "Widget position on page" },
                                    { label: "Greeting Text", placeholder: "Hi! Click to speak with our AI assistant", desc: "Shown before click" },
                                ].map(config => (
                                    <div key={config.label} className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                                        <div className="w-28">
                                            <div className="text-xs font-bold text-zinc-300">{config.label}</div>
                                            <div className="text-[10px] text-zinc-600">{config.desc}</div>
                                        </div>
                                        <input type="text" placeholder={config.placeholder} className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
