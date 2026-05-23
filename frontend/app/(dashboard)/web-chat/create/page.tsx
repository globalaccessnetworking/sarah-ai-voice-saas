"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Save,
    MessageCircle,
    Info,
    Cpu,
    Palette,
    Clock,
    Globe,
    ChevronRight,
    AlertTriangle
} from "lucide-react";

type Tab = "general" | "llm" | "widget" | "session" | "domains";

const LLM_MODELS: Record<string, { value: string; label: string }[]> = {
    openai: [
        { value: "gpt-4o", label: "GPT-4o (Balanced)" },
        { value: "gpt-4o-mini", label: "GPT-4o Mini (Budget)" },
    ],
    google: [
        { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
        { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    ],
    anthropic: [
        { value: "claude-3-7-sonnet", label: "Claude 3.7 Sonnet" },
        { value: "claude-3-5-haiku", label: "Claude 3.5 Haiku" },
    ],
    xai: [
        { value: "grok-4-fast-non-reasoning", label: "Grok-4 Fast" },
    ],
    groq: [
        { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (Versatile)" },
    ]
};

export default function CreateWebChatAgent() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>("general");

    const [form, setForm] = useState({
        name: "",
        enabled: true,
        description: "",
        llmProvider: "openai",
        llmModel: "gpt-4o-mini",
        temperature: 0.7,
        maxTokens: 1024,
        systemPrompt: "You are a helpful customer support assistant. Be concise, friendly, and professional.",
        knowledgeBase: "",
        toolInstructions: "",
        // Widget logic
        primaryColor: "#1a73e8",
        theme: "light",
        position: "bottom-right",
        widgetTitle: "Chat with us",
        displayMode: "popup",
        welcomeMessage: "Hi! How can I help you today?",
        brandingText: "Powered by Global Access AI Engine",
        // Voice Mode
        voiceEnabled: false,
        sttProvider: "",
        sttModel: "",
        ttsProvider: "",
        ttsModel: "",
        ttsVoiceId: "",
        // Session
        autoCloseInactive: true,
        inactivityTimeout: 10,
        inactivityMessage: "This chat has been closed due to inactivity.",
        maxMessages: 100,
        // Domains
        allowedOrigins: ""
    });

    const updateForm = (key: keyof typeof form, value: any) => {
        setForm(prev => {
            const next = { ...prev, [key]: value };
            if (key === "llmProvider") {
                next.llmModel = LLM_MODELS[value as string]?.[0]?.value || "";
            }
            return next;
        });
    };

    const handleSubmit = async () => {
        if (!form.name || !form.systemPrompt) {
            setError("Name and System Prompt are required.");
            setActiveTab("general");
            return;
        }

        setSubmitting(true);
        setError(null);

        const payload = {
            name: form.name,
            enabled: form.enabled,
            description: form.description,
            llmProvider: form.llmProvider,
            llmModel: form.llmModel,
            temperature: form.temperature,
            maxTokens: form.maxTokens,
            systemPrompt: form.systemPrompt,
            knowledgeBase: form.knowledgeBase,
            toolInstructions: form.toolInstructions,
            widgetConfig: {
                primary_color: form.primaryColor,
                theme: form.theme,
                position: form.position,
                title: form.widgetTitle,
                display_mode: form.displayMode,
                welcome_message: form.welcomeMessage,
                branding_text: form.brandingText
            },
            voiceEnabled: form.voiceEnabled,
            voiceConfig: {
                stt_provider: form.sttProvider,
                stt_model: form.sttModel,
                tts_provider: form.ttsProvider,
                tts_model: form.ttsModel,
                tts_voice_id: form.ttsVoiceId
            },
            allowedOrigins: form.allowedOrigins.split('\n').map(o => o.trim()).filter(o => o)
        };

        try {
            const res = await fetch("/api/web-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create web chat agent");
            }

            router.push("/web-chat");
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            setSubmitting(false);
        }
    };

    return (
        <div className="w-full h-full overflow-y-auto bg-zinc-950 p-8 md:p-10">
            <div className="max-w-[1600px] mx-auto flex flex-col gap-8 flex-1">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                            <Link href="/web-chat" className="hover:text-blue-400">Web Chat Agents</Link>
                            <ChevronRight className="w-4 h-4" />
                            <span className="text-zinc-100">Create New</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                            <MessageCircle className="w-8 h-8 text-blue-500" />
                            Create Web Chat Agent
                        </h1>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
                    >
                        {submitting ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {submitting ? "Saving..." : "Save Agent"}
                    </button>
                </div>

                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 p-4 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-medium">Creation Failed</h3>
                            <p className="text-sm opacity-80 mt-1">{error}</p>
                        </div>
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Tabs Sidebar */}
                    <div className="w-full lg:w-64 flex-shrink-0">
                        <nav className="flex flex-col gap-1 p-2 bg-zinc-900 border border-zinc-800 rounded-xl">
                            <button
                                onClick={() => setActiveTab("general")}
                                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === "general" ? "bg-zinc-800 text-blue-400" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                                    }`}
                            >
                                <Info className="w-4 h-4" />
                                General Info
                            </button>
                            <button
                                onClick={() => setActiveTab("llm")}
                                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === "llm" ? "bg-zinc-800 text-emerald-400" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                                    }`}
                            >
                                <Cpu className="w-4 h-4" />
                                LLM & Prompt
                            </button>
                            <button
                                onClick={() => setActiveTab("widget")}
                                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === "widget" ? "bg-zinc-800 text-purple-400" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                                    }`}
                            >
                                <Palette className="w-4 h-4" />
                                Widget Theme
                            </button>
                            <button
                                onClick={() => setActiveTab("session")}
                                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === "session" ? "bg-zinc-800 text-amber-400" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                                    }`}
                            >
                                <Clock className="w-4 h-4" />
                                Session Setup
                            </button>
                            <button
                                onClick={() => setActiveTab("domains")}
                                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === "domains" ? "bg-zinc-800 text-rose-400" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                                    }`}
                            >
                                <Globe className="w-4 h-4" />
                                Security (CORS)
                            </button>
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-8">
                        {/* GENERAL TAB */}
                        {activeTab === "general" && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-semibold text-white mb-1">General Info</h2>
                                    <p className="text-sm text-zinc-400">Basic identification properties for internal use.</p>
                                </div>
                                <div className="space-y-4 max-w-2xl">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">Agent Name *</label>
                                        <input
                                            type="text"
                                            value={form.name}
                                            onChange={(e) => updateForm("name", e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-1 focus:ring-blue-500"
                                            placeholder="e.g. Acme Billing Support"
                                        />
                                    </div>
                                    <div className="flex items-center gap-4 py-2">
                                        <label className="text-sm font-medium text-zinc-300">Status</label>
                                        <button
                                            type="button"
                                            onClick={() => updateForm("enabled", !form.enabled)}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${form.enabled ? 'bg-blue-500' : 'bg-zinc-700'}`}
                                        >
                                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${form.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                        <span className="text-sm text-zinc-400">{form.enabled ? "Active - Accepting connections" : "Disabled - Widget locked"}</span>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">Description</label>
                                        <textarea
                                            value={form.description}
                                            onChange={(e) => updateForm("description", e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-1 focus:ring-blue-500 h-24"
                                            placeholder="Internal notes..."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* LLM & PROMPT TAB */}
                        {activeTab === "llm" && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-semibold text-white mb-1 flex items-center gap-2">
                                        <Cpu className="text-emerald-400 w-5 h-5" />
                                        Omni-Model Orchestration
                                    </h2>
                                    <p className="text-sm text-zinc-400">Select the cognitive engine and define behavioral traits.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">Provider</label>
                                        <select
                                            value={form.llmProvider}
                                            onChange={(e) => updateForm("llmProvider", e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-1 focus:ring-emerald-500"
                                        >
                                            <option value="openai">OpenAI</option>
                                            <option value="google">Google</option>
                                            <option value="anthropic">Anthropic</option>
                                            <option value="xai">xAI</option>
                                            <option value="groq">Groq</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">Model</label>
                                        <select
                                            value={form.llmModel}
                                            onChange={(e) => updateForm("llmModel", e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-1 focus:ring-emerald-500"
                                        >
                                            {LLM_MODELS[form.llmProvider]?.map(m => (
                                                <option key={m.value} value={m.value}>{m.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                                            Temperature: {form.temperature}
                                        </label>
                                        <input
                                            type="range" min="0" max="2" step="0.1"
                                            value={form.temperature}
                                            onChange={(e) => updateForm("temperature", parseFloat(e.target.value))}
                                            className="w-full accent-emerald-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">Max Response Tokens</label>
                                        <input
                                            type="number"
                                            value={form.maxTokens}
                                            onChange={(e) => updateForm("maxTokens", parseInt(e.target.value))}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-1 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">System Prompt *</label>
                                        <textarea
                                            value={form.systemPrompt}
                                            onChange={(e) => updateForm("systemPrompt", e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-300 focus:ring-1 focus:ring-emerald-500 h-48 font-mono text-sm leading-relaxed"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">Knowledge Base Supplement</label>
                                        <textarea
                                            value={form.knowledgeBase}
                                            onChange={(e) => updateForm("knowledgeBase", e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-300 focus:ring-1 focus:ring-emerald-500 h-32"
                                            placeholder="Append factual rules..."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* WIDGET TAB */}
                        {activeTab === "widget" && (
                            <div className="space-y-6 max-w-3xl">
                                <div>
                                    <h2 className="text-xl font-semibold text-white mb-1 flex items-center gap-2">
                                        <Palette className="text-purple-400 w-5 h-5" />
                                        Widget Appearance
                                    </h2>
                                    <p className="text-sm text-zinc-400">Design the UI overlay that clients will inject into their DOM.</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">Primary HEX Color</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={form.primaryColor}
                                                onChange={(e) => updateForm("primaryColor", e.target.value)}
                                                className="h-11 w-11 rounded border border-zinc-800 bg-zinc-950 p-1 cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={form.primaryColor}
                                                onChange={(e) => updateForm("primaryColor", e.target.value)}
                                                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 text-white focus:ring-1 focus:ring-purple-500 uppercase font-mono"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">Color Theme</label>
                                        <select
                                            value={form.theme}
                                            onChange={(e) => updateForm("theme", e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-1 focus:ring-purple-500"
                                        >
                                            <option value="light">Light Mode</option>
                                            <option value="dark">Dark Mode</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">Screen Position</label>
                                        <select
                                            value={form.position}
                                            onChange={(e) => updateForm("position", e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-1 focus:ring-purple-500"
                                        >
                                            <option value="bottom-right">Bottom Right</option>
                                            <option value="bottom-left">Bottom Left</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">Widget Title Header</label>
                                        <input
                                            type="text"
                                            value={form.widgetTitle}
                                            onChange={(e) => updateForm("widgetTitle", e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-1 focus:ring-purple-500"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">Welcome Message</label>
                                        <input
                                            type="text"
                                            value={form.welcomeMessage}
                                            onChange={(e) => updateForm("welcomeMessage", e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-1 focus:ring-purple-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SESSION TAB */}
                        {activeTab === "session" && (
                            <div className="space-y-6 max-w-2xl">
                                <div>
                                    <h2 className="text-xl font-semibold text-white mb-1 flex items-center gap-2">
                                        <Clock className="text-amber-400 w-5 h-5" />
                                        Session Logistics
                                    </h2>
                                    <p className="text-sm text-zinc-400">Manage inactivity thresholds to protect API limits.</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 py-2">
                                        <label className="text-sm font-medium text-zinc-300 w-48">Auto-Close Inactive</label>
                                        <button
                                            type="button"
                                            onClick={() => updateForm("autoCloseInactive", !form.autoCloseInactive)}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${form.autoCloseInactive ? 'bg-amber-500' : 'bg-zinc-700'}`}
                                        >
                                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${form.autoCloseInactive ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">Idle Timeout Threshold (Minutes)</label>
                                        <input
                                            type="number"
                                            value={form.inactivityTimeout}
                                            onChange={(e) => updateForm("inactivityTimeout", parseInt(e.target.value))}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-1 focus:ring-amber-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">Inactivity Auto-Message</label>
                                        <input
                                            type="text"
                                            value={form.inactivityMessage}
                                            onChange={(e) => updateForm("inactivityMessage", e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-1 focus:ring-amber-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* DOMAINS TAB */}
                        {activeTab === "domains" && (
                            <div className="space-y-6 max-w-3xl">
                                <div>
                                    <h2 className="text-xl font-semibold text-white mb-1 flex items-center gap-2">
                                        <Globe className="text-rose-400 w-5 h-5" />
                                        CORS Security Boundaries
                                    </h2>
                                    <p className="text-sm text-zinc-400">Lock down which external websites can load this specific Widget ID.</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-4 rounded-xl text-sm">
                                        <strong>CRITICAL:</strong> Only origins listed here can request WebSocket tokens. If left blank, ANY domain can steal your widget and rack up LLM API bills. Note: Local development `http://localhost:3000` is implicitly permitted during Dev Server runs.
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">Allowed Origins (One URL per line)</label>
                                        <textarea
                                            value={form.allowedOrigins}
                                            onChange={(e) => updateForm("allowedOrigins", e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:ring-1 focus:ring-rose-500 h-48 font-mono placeholder:text-zinc-700"
                                            placeholder={"https://www.example.com\nhttps://portal.example.com"}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </div>
    );
}
