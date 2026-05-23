"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import {
    Save,
    Bot,
    User,
    Cpu,
    Mic,
    Volume2,
    Settings2,
    Info,
    Star,
    Sparkles,
    ChevronRight,
    Zap,
    AlertTriangle,
    Wrench,
    Upload,
    Trash2,
    Play,
    Pause,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
type PipelineMode = "standard" | "realtime";
type Tab = "identity" | "behavior" | "stt" | "tts" | "tools" | "advanced";

interface AgentFormState {
    // Identity
    name: string;
    slug: string;
    initialGreeting: string;
    systemPrompt: string;
    knowledgeBase: string;
    toolInstructions: string;

    // Behavior / LLM
    pipelineMode: PipelineMode;
    llmProvider: string;
    llmModel: string;
    llmTemperature: number;
    llmAzureDeployment: string;
    // Realtime
    rtProvider: string;
    rtModel: string;
    rtVoice: string;
    rtLanguage: string;
    rtModalities: string;
    rtProactivity: boolean;
    rtAffectiveDialog: boolean;
    rtNoiseReduction: boolean;
    rtThinkingBudget: string;
    rtMaxOutputTokens: string;
    rtTopP: string;
    rtTemperature: number;
    rtSpeed: string;
    rtTurnDetection: string;
    rtTurnDetectionEagerness: string;
    rtCtxCompression: boolean;
    rtCtxTrigger: string;
    rtCtxTarget: string;
    rtAzureDeployment: string;

    // STT
    sttProvider: string;
    sttModel: string;
    sttLanguage: string;
    sttResponsiveness: number;
    sttDetectLanguage: boolean;
    sttCustomVocab: string;
    sttSmartFormatting: boolean;
    sttRemoveFillers: boolean;
    sttAzureDeployment: string;

    // TTS
    ttsProvider: string;
    ttsModel: string;
    ttsVoiceId: string;
    ttsLanguage: string;
    ttsSpeed: number;
    elevenLabsStability: number;
    elevenLabsSimilarity: number;
    ttsAzureDeployment: string;

    // Tools & Routing
    toolsConfig: {
        escalation_triggers?: string;
        escalation_speech?: string;
        escalation_extension?: string;
        hangup_triggers?: string;
        hangup_speech?: string;
        resolved_speech?: string;
        unresolved_speech?: string;
        returning_caller_prompt?: string;
        ticket_speech?: string;
        greeting_audio_url?: string;
    };
}

interface PricingConfig {
    llmProviders?: any[];
    sttProviders?: any[];
    ttsProviders?: any[];
    realtimeProviders?: any[];
}

// ─── Model Options ────────────────────────────────────────────────────────────
const LLM_MODELS: Record<string, { value: string; label: string }[]> = {
    openai: [
        { value: "gpt-4o", label: "GPT-4o" },
        { value: "gpt-4o-mini", label: "GPT-4o Mini" },
        { value: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
        { value: "gpt-4.1-nano", label: "GPT-4.1 Nano" },
        { value: "o4-mini", label: "o4 Mini (Reasoning)" },
    ],
    google: [
    { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" }, // Move to top
    { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    ],
    google_cloud: [
        { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash (Vertex)" },
        { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash (Vertex)" },
    ],
    anthropic: [
        { value: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
        { value: "claude-sonnet-4-5", label: "Claude Sonnet 4.5" },
        { value: "claude-opus-4", label: "Claude Opus 4" },
    ],
    bedrock: [
        { value: "anthropic.claude-haiku-4-5-v1:0", label: "Claude Haiku 4.5 (Bedrock)" },
        { value: "anthropic.claude-sonnet-4-5-v1:0", label: "Claude Sonnet 4.5 (Bedrock)" },
        { value: "amazon.nova-micro-v1:0", label: "Amazon Nova Micro" },
        { value: "amazon.nova-lite-v1:0", label: "Amazon Nova Lite" },
        { value: "amazon.nova-pro-v1:0", label: "Amazon Nova Pro" },
    ],
    xai: [
        { value: "grok-3-fast", label: "Grok-3 Fast" },
        { value: "grok-3", label: "Grok-3" },
    ],
    groq: [
        { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile" },
        { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant" },
    ],
    azure_openai: [
        { value: "gpt-4o", label: "GPT-4o (Azure)" },
        { value: "gpt-4o-mini", label: "GPT-4o Mini (Azure)" },
    ],
};

const STT_MODELS: Record<string, { value: string; label: string }[]> = {
    deepgram: [
        { value: "nova-3-general", label: "Nova 3 General" },
        { value: "nova-3-medical", label: "Nova 3 Medical" },
        { value: "nova-2-general", label: "Nova 2 General" },
        { value: "nova-2-phone-call", label: "Nova 2 Phone Call" },
        { value: "flux", label: "Flux (Lowest Latency)" },
    ],
    openai: [
        { value: "gpt-4o-transcribe", label: "GPT-4o Transcribe" },
        { value: "gpt-4o-mini-transcribe", label: "GPT-4o Mini Transcribe" },
        { value: "whisper-1", label: "Whisper-1" },
    ],
    google_cloud: [
        { value: "chirp_3", label: "Chirp 3 (125+ languages)" },
        { value: "chirp_2", label: "Chirp 2" },
    ],
    elevenlabs: [
        { value: "scribe_v2_realtime", label: "Scribe v2 Realtime" },
    ],
    aws_transcribe: [
        { value: "streaming", label: "Streaming Transcription" },
    ],
    azure_speech: [
        { value: "neural", label: "Neural STT" },
    ],
    azure_openai: [
        { value: "gpt-4o-transcribe", label: "GPT-4o Transcribe (Azure)" },
        { value: "whisper-1", label: "Whisper (Azure)" },
    ],
    groq: [
        { value: "whisper-large-v3-turbo", label: "Whisper Large v3 Turbo" },
        { value: "whisper-large-v3", label: "Whisper Large v3" },
    ],
};

const TTS_MODELS: Record<string, { value: string; label: string }[]> = {
    cartesia: [
        { value: "sonic-2", label: "Sonic 2" },
        { value: "sonic-3", label: "Sonic 3" },
    ],
    deepgram: [
        { value: "aura-2-asteria-en", label: "Aura-2 Asteria (EN)" },
        { value: "aura-2-luna-en", label: "Aura-2 Luna (EN)" },
        { value: "aura-2-orion-en", label: "Aura-2 Orion (EN-Male)" },
    ],
    elevenlabs: [
        { value: "eleven_flash_v2_5", label: "Flash v2.5 (~75ms)" },
        { value: "eleven_turbo_v2_5", label: "Turbo v2.5 (Best Quality)" },
        { value: "eleven_multilingual_v2", label: "Multilingual v2" },
    ],
    openai: [
        { value: "gpt-4o-mini-tts", label: "GPT-4o Mini TTS" },
        { value: "tts-1", label: "TTS-1" },
        { value: "tts-1-hd", label: "TTS-1 HD" },
    ],
    google_cloud: [
        { value: "neural2", label: "Neural2" },
        { value: "chirp-hd", label: "Chirp 3 HD (Best)" },
    ],
    google_gemini: [
        { value: "gemini-2.5-flash-tts", label: "Gemini 2.5 Flash TTS" },
    ],
    azure_speech: [
        { value: "neural", label: "Azure Neural TTS" },
    ],
    azure_openai: [
        { value: "gpt-4o-mini-tts", label: "GPT-4o Mini TTS (Azure)" },
        { value: "tts-1", label: "TTS-1 (Azure)" },
    ],
    aws_polly: [
        { value: "generative", label: "Generative (en-US/en-GB)" },
        { value: "neural", label: "Neural" },
        { value: "standard", label: "Standard" },
    ],
    groq: [
        { value: "playai-tts", label: "PlayAI Orpheus TTS" },
    ],
    upliftai: [
        { value: "default", label: "Default" },
    ],
};

// ElevenLabs voice presets
const ELEVENLABS_VOICES = [
    { value: "21m00Tcm4TlvDq8ikWAM", label: "Rachel — Calm, young (F)" },
    { value: "EXAVITQu4vr4xnSDxMaL", label: "Sarah — Soft, young (F)" },
    { value: "pNInz6obpgDQGcFmaJgB", label: "Adam — Deep, middle-aged (M)" },
    { value: "onwK4e9ZLuTAKqWW03F9", label: "Daniel — Deep, British (M)" },
    { value: "JBFqnCBsd6RMkjVDRZzb", label: "George — Warm, British (M)" },
    { value: "TX3LPaxmHKxFdv7VOQHJ", label: "Liam — Articulate, young (M)" },
    { value: "Xb7hH8MSUJpSbSDYk0k2", label: "Alice — Confident, British (F)" },
    { value: "t0jbNlBVZ17f02VDIeMI", label: "Lee — Australian, friendly (M)" },
    { value: "cgSgspJ2msm6clMCkdW9", label: "Jessica — Australian, expressive (F)" },
    { value: "custom", label: "Custom Voice ID..." },
];

const CARTESIA_VOICES = [
    { value: "829ccd10-f8b3-43cd-b8a0-4aeaa81f3b30", label: "Customer Support Lady (F-US)" },
    { value: "156fb8d2-335b-4950-9cb3-a2d33befec77", label: "Helpful Woman (F-US)" },
    { value: "694f9389-aac1-45b6-b726-9d9369183238", label: "Sarah (F-US)" },
    { value: "a167e0f3-df7e-4d52-a9c3-f949145efdab", label: "Customer Support Man (M-US)" },
    { value: "63ff761f-c1e8-414b-b969-d1833d1c870c", label: "Confident British Man (M-GB)" },
    { value: "79a125e8-cd45-4c13-8a67-188112f4dd22", label: "British Lady (F-GB)" },
    { value: "043cfc81-d69f-4bee-ae1e-7862cb358650", label: "Australian Woman (F-AU)" },
    { value: "41f3c367-e0a8-4a85-89e0-c27bae9c9b6d", label: "Australian Customer Support Man (M-AU)" },
    { value: "custom", label: "Custom Voice ID..." },
];

const OPENAI_VOICES = [
    { value: "nova", label: "Nova — Female, warm, friendly" },
    { value: "shimmer", label: "Shimmer — Female, bright" },
    { value: "coral", label: "Coral — Female, clear" },
    { value: "sage", label: "Sage — Female, calm" },
    { value: "echo", label: "Echo — Male, deep" },
    { value: "fable", label: "Fable — Male, British" },
    { value: "onyx", label: "Onyx — Male, authoritative" },
    { value: "alloy", label: "Alloy — Neutral" },
];

const RT_MODELS: Record<string, { value: string; label: string }[]> = {
    google: [
        { value: "gemini-2.5-flash-native-audio-preview-12-2025", label: "Gemini 2.5 Flash Native Audio" },
        { value: "gemini-live-2.0-flash-8b", label: "Gemini 2.0 Flash 8B" },
    ],
    google_cloud: [
        { value: "gemini-2.5-flash-native-audio-preview-12-2025", label: "Gemini 2.5 Flash Native Audio (Vertex)" },
    ],
    openai: [
        { value: "gpt-4o-realtime-preview", label: "GPT-4o Realtime Preview" },
        { value: "gpt-4o-mini-realtime-preview", label: "GPT-4o Mini Realtime" },
    ],
    xai: [
        { value: "grok-2-realtime", label: "Grok 2 Realtime" },
    ],
    aws: [
        { value: "amazon.nova-2-sonic-v1:0", label: "Amazon Nova 2 Sonic" },
    ],
    azure: [
        { value: "gpt-4o-realtime-preview", label: "GPT-4o Realtime (Azure)" },
    ],
};

const RT_VOICES: Record<string, { value: string; label: string }[]> = {
    google: [
        { value: "Puck", label: "Puck (M)" }, { value: "Charon", label: "Charon (M)" },
        { value: "Kore", label: "Kore (F)" }, { value: "Fenrir", label: "Fenrir (M)" },
        { value: "Aoede", label: "Aoede (F)" }, { value: "Leda", label: "Leda (F)" },
        { value: "Orus", label: "Orus (M)" }, { value: "Zephyr", label: "Zephyr (F)" },
    ],
    google_cloud: [
        { value: "Puck", label: "Puck (M)" }, { value: "Kore", label: "Kore (F)" },
        { value: "Aoede", label: "Aoede (F)" }, { value: "Charon", label: "Charon (M)" },
    ],
    openai: [
        { value: "alloy", label: "Alloy" }, { value: "echo", label: "Echo" },
        { value: "shimmer", label: "Shimmer" }, { value: "ash", label: "Ash" },
        { value: "ballad", label: "Ballad" }, { value: "coral", label: "Coral" },
        { value: "sage", label: "Sage" }, { value: "verse", label: "Verse" },
    ],
    xai: [
        { value: "default", label: "Default" },
    ],
    aws: [
        { value: "tiffany", label: "Tiffany (F-US)" }, { value: "matthew", label: "Matthew (M-US)" },
    ],
    azure: [
        { value: "alloy", label: "Alloy" }, { value: "echo", label: "Echo" },
        { value: "shimmer", label: "Shimmer" }, { value: "coral", label: "Coral" },
    ],
};

// ─── Default State ────────────────────────────────────────────────────────────
const DEFAULT_STATE: AgentFormState = {
    name: "", slug: "", initialGreeting: "", systemPrompt: "", knowledgeBase: "", toolInstructions: "",
    pipelineMode: "standard",
    llmProvider: "openai", llmModel: "gpt-4o", llmTemperature: 0.8, llmAzureDeployment: "",
    rtProvider: "google", rtModel: "gemini-2.5-flash-native-audio-preview-12-2025",
    rtVoice: "Puck", rtLanguage: "", rtModalities: "text_audio",
    rtProactivity: false, rtAffectiveDialog: false, rtNoiseReduction: false,
    rtThinkingBudget: "auto", rtMaxOutputTokens: "", rtTopP: "", rtTemperature: 0.8,
    rtSpeed: "", rtTurnDetection: "", rtTurnDetectionEagerness: "",
    rtCtxCompression: false, rtCtxTrigger: "", rtCtxTarget: "", rtAzureDeployment: "",
    sttProvider: "deepgram", sttModel: "nova-3-general", sttLanguage: "en-US",
    sttResponsiveness: 0.6, sttDetectLanguage: false, sttCustomVocab: "",
    sttSmartFormatting: true, sttRemoveFillers: true, sttAzureDeployment: "",
    ttsProvider: "cartesia", ttsModel: "sonic-2", ttsVoiceId: "", ttsLanguage: "en-US",
    ttsSpeed: 1.0, elevenLabsStability: 0.5, elevenLabsSimilarity: 0.75, ttsAzureDeployment: "",
    toolsConfig: {},
};

// ─── Shared form field styles ─────────────────────────────────────────────────
const INPUT_STYLE: React.CSSProperties = {
    width: "100%",
    padding: "0.5rem 0.75rem",
    background: "var(--bg-tertiary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    color: "var(--text-primary)",
    fontSize: "0.875rem",
    outline: "none",
    transition: "border-color 0.15s",
};

const LABEL_STYLE: React.CSSProperties = {
    display: "block",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "var(--text-secondary)",
    marginBottom: "0.375rem",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
};

const HELP_STYLE: React.CSSProperties = {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
    marginTop: "0.3rem",
};

const SECTION_TITLE_STYLE: React.CSSProperties = {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "var(--brand-primary)",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    marginBottom: "1rem",
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    paddingBottom: "0.5rem",
    borderBottom: "1px solid var(--border-color)",
};

function PriceBadge({ price, unit, type }: { price?: string | number, unit?: string, type?: 'llm' | 'stt' | 'tts' | 'rt' }) {
    if (price === undefined || price === null) return null;
    
    const colorMap = {
        llm: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/5',
        stt: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
        tts: 'text-pink-400 border-pink-500/30 bg-pink-500/5',
        rt: 'text-orange-400 border-orange-500/30 bg-orange-500/5'
    };

    const colors = colorMap[type || 'llm'] || colorMap.llm;

    return (
        <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.375rem', 
            padding: '0.125rem 0.5rem', 
            borderRadius: '4px', 
            border: '1px solid',
            fontSize: '10px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            marginLeft: '0.5rem',
            verticalAlign: 'middle'
        }} className={colors}>
            ${price} {unit || '/ 1M'}
        </span>
    );
}


// ─── Sub-components ───────────────────────────────────────────────────────────
function FormField({ label, hint, required, children }: {
    label: string; hint?: string; required?: boolean; children: React.ReactNode;
}) {
    return (
        <div>
            <label style={LABEL_STYLE}>
                {label}{required && <span style={{ color: "var(--danger)", marginLeft: 2 }}>*</span>}
            </label>
            {children}
            {hint && <p style={HELP_STYLE}>{hint}</p>}
        </div>
    );
}

function SelectField({ value, onChange, children, style }: {
    value: string; onChange: (v: string) => void; children: React.ReactNode; style?: React.CSSProperties;
}) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ ...INPUT_STYLE, cursor: "pointer", ...style }}
        >
            {children}
        </select>
    );
}

function SliderField({ label, value, min, max, step, onChange, recommended }: {
    label: string; value: number; min: number; max: number; step: number;
    onChange: (v: number) => void; recommended?: number;
}) {
    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.375rem" }}>
                <label style={LABEL_STYLE}>
                    {label}{" "}
                    <span style={{
                        background: "var(--bg-hover)", borderRadius: "9999px",
                        padding: "0.1rem 0.45rem", fontSize: "0.72rem", color: "var(--info)", fontWeight: 700,
                    }}>
                        {value.toFixed(1)}
                    </span>
                </label>
                {recommended !== undefined && (
                    <button
                        type="button"
                        className="btn btn-outline-success btn-sm"
                        onClick={() => onChange(recommended)}
                        style={{ padding: "0.15rem 0.5rem", fontSize: "0.7rem" }}
                    >
                        <Star size={10} /> Recommended: {recommended}
                    </button>
                )}
            </div>
            <input
                type="range" min={min} max={max} step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: "var(--brand-primary)" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={HELP_STYLE}>{min}</span>
                <span style={HELP_STYLE}>{max}</span>
            </div>
        </div>
    );
}

function ToggleField({ label, hint, checked, onChange }: {
    label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.625rem", cursor: "pointer" }}>
                <div
                    role="switch"
                    aria-checked={checked}
                    onClick={() => onChange(!checked)}
                    style={{
                        width: 36, height: 20, borderRadius: 10,
                        background: checked ? "var(--brand-primary)" : "var(--bg-hover)",
                        border: `2px solid ${checked ? "var(--brand-primary)" : "var(--border-color)"}`,
                        position: "relative", cursor: "pointer", transition: "all 0.2s", flexShrink: 0,
                    }}
                >
                    <div style={{
                        width: 12, height: 12, borderRadius: "50%", background: "white",
                        position: "absolute", top: 2, left: checked ? 18 : 2, transition: "left 0.2s",
                    }} />
                </div>
                <span style={{ fontSize: "0.875rem", color: "var(--text-primary)", fontWeight: 500 }}>{label}</span>
            </label>
            {hint && <p style={{ ...HELP_STYLE, marginLeft: 44 }}>{hint}</p>}
        </div>
    );
}

// ─── Tab Components ───────────────────────────────────────────────────────────

function IdentityTab({ form, setForm }: { form: AgentFormState; setForm: (f: AgentFormState) => void }) {
    const set = <K extends keyof AgentFormState>(k: K, v: AgentFormState[K]) =>
        setForm({ ...form, [k]: v });

    const autoSlug = (name: string) =>
        name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    return (
        <div style={{ display: "grid", gap: "1.25rem" }}>
            <div style={SECTION_TITLE_STYLE}><Info size={13} /> Basic Information</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <FormField label="Agent Name" required hint="Human-readable display name">
                    <input
                        style={INPUT_STYLE}
                        type="text"
                        value={form.name}
                        placeholder="Customer Support Agent"
                        onChange={(e) => {
                            set("name", e.target.value);
                            if (!form.slug || form.slug === autoSlug(form.name)) {
                                set("slug", autoSlug(e.target.value));
                            }
                        }}
                    />
                </FormField>
                <FormField label="Slug" required hint="Unique identifier — lowercase, hyphens only">
                    <input
                        style={INPUT_STYLE}
                        type="text"
                        value={form.slug}
                        placeholder="support-agent"
                        pattern="[a-z0-9\-]+"
                        onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    />
                </FormField>
            </div>

            <FormField label="Initial Greeting" hint="What the agent says when answering a call. Leave empty for no automatic greeting.">
                <textarea
                    style={{ ...INPUT_STYLE, resize: "vertical" }}
                    rows={3}
                    value={form.initialGreeting}
                    placeholder="Hello! Thank you for calling. How can I help you today?"
                    onChange={(e) => set("initialGreeting", e.target.value)}
                />
            </FormField>

            <FormField label="Initial Greeting Recording (WAV ONLY)" hint="Upload a professional recording to bypass AI greeting latency.">
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "1rem",
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius)",
                    opacity: 0.7,
                }}>
                    <div style={{ textAlign: "center", width: "100%", padding: "0.5rem 0" }}>
                        <Info size={16} style={{ marginBottom: "0.5rem", color: "var(--brand-primary)" }} />
                        <p style={{ fontSize: "0.8rem", margin: 0 }}>Please <strong>Save Agent</strong> first to enable recording uploads.</p>
                    </div>
                </div>
            </FormField>

            <FormField label="System Prompt" required hint="Instructions defining the agent's personality and behavior. Supports template variables: {{user_number}}, {{Name}}, {{CompanyName}}, {{CompanyDescription}}, {{JobTitle}}, {{CustomField1}}, {{CustomField2}}">
                <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", top: "0.5rem", right: "0.5rem", zIndex: 1 }}>
                        <button type="button" className="btn btn-primary btn-sm"
                            onClick={() => alert("AI enrichment will be wired to the backend in Phase 3.")}
                            style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem" }}>
                            <Sparkles size={10} /> Enrich with AI
                        </button>
                    </div>
                    <textarea
                        style={{ ...INPUT_STYLE, resize: "vertical", paddingTop: "2.5rem" }}
                        rows={16}
                        value={form.systemPrompt}
                        placeholder={`You are a professional customer support agent for {{CompanyName}}.\n\nYour role is to assist callers with their inquiries professionally and helpfully.\n\nKey information:\n{{CompanyDescription}}\n\nAlways:\n- Greet callers warmly\n- Listen carefully to their needs\n- Provide accurate information\n- Offer to transfer to a human agent when appropriate`}
                        onChange={(e) => set("systemPrompt", e.target.value)}
                    />
                </div>
            </FormField>

            <FormField label="Knowledge Base" hint="Factual information: business hours, address, policies, FAQs — always available to the agent.">
                <textarea
                    style={{ ...INPUT_STYLE, resize: "vertical" }}
                    rows={5}
                    value={form.knowledgeBase}
                    placeholder={"Business Hours: Monday-Friday 9am-5pm\nAddress: 123 Main St\nPhone: (03) 1234 5678\n\nPolicies:\n- Returns accepted within 30 days with receipt"}
                    onChange={(e) => set("knowledgeBase", e.target.value)}
                />
            </FormField>

            <FormField label="Tool Usage Instructions" hint="Optional: When and how the agent should use configured tools. Only applied when tools are assigned.">
                <textarea
                    style={{ ...INPUT_STYLE, resize: "vertical" }}
                    rows={4}
                    value={form.toolInstructions}
                    placeholder="When a customer asks about their order status, always use the check_order_status tool before responding."
                    onChange={(e) => set("toolInstructions", e.target.value)}
                />
            </FormField>
        </div>
    );
}

function BehaviorTab({ form, setForm, getPriceFor }: { form: AgentFormState; setForm: (f: AgentFormState) => void, getPriceFor: any }) {
    const set = <K extends keyof AgentFormState>(k: K, v: AgentFormState[K]) =>
        setForm({ ...form, [k]: v });
    const isRealtime = form.pipelineMode === "realtime";
    const rtModels = RT_MODELS[form.rtProvider] ?? [];
    const rtVoices = RT_VOICES[form.rtProvider] ?? [];
    const llmModels = LLM_MODELS[form.llmProvider] ?? [];

    return (
        <div style={{ display: "grid", gap: "1.5rem" }}>
            {/* Pipeline Mode */}
            <div>
                <div style={SECTION_TITLE_STYLE}><Zap size={13} /> Pipeline Mode</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    {(["standard", "realtime"] as const).map((mode) => (
                        <button
                            key={mode}
                            type="button"
                            onClick={() => set("pipelineMode", mode)}
                            style={{
                                padding: "1rem",
                                border: `2px solid ${form.pipelineMode === mode ? "var(--brand-primary)" : "var(--border-color)"}`,
                                borderRadius: "calc(var(--radius) * 1.5)",
                                background: form.pipelineMode === mode ? "var(--brand-glow)" : "var(--bg-tertiary)",
                                cursor: "pointer",
                                textAlign: "left",
                                transition: "all 0.15s",
                            }}
                        >
                            <div style={{ fontWeight: 700, color: form.pipelineMode === mode ? "var(--brand-primary)" : "var(--text-primary)", marginBottom: "0.25rem", fontSize: "0.875rem" }}>
                                {mode === "standard" ? "⚙ Standard Pipeline" : "⚡ Realtime (Audio-to-Audio)"}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                                {mode === "standard"
                                    ? "Separate STT → LLM → TTS providers. Maximum flexibility."
                                    : "Single audio-to-audio stream. Ultra-low latency (<200ms)."}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Realtime Config */}
            {isRealtime && (
                <div>
                    <div style={SECTION_TITLE_STYLE}><Zap size={13} /> Realtime Configuration</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                        <FormField label="Realtime Provider" required>
                            <div className="flex items-center mb-1">
                                {(() => {
                                    const p = getPriceFor('rt', form.rtProvider);
                                    return p && <PriceBadge price={p.price} unit={p.unit} type="rt" />;
                                })()}
                            </div>
                            <SelectField value={form.rtProvider} onChange={(v) => {
                                set("rtProvider", v);
                                set("rtModel", RT_MODELS[v]?.[0]?.value ?? "");
                                set("rtVoice", RT_VOICES[v]?.[0]?.value ?? "");
                            }}>
                                <option value="google">Google (Gemini Live) ⭐</option>
                                <option value="google_cloud">Google Cloud (Vertex AI)</option>
                                <option value="openai">OpenAI</option>
                                <option value="xai">xAI (Grok)</option>
                                <option value="aws">AWS Nova Sonic</option>
                                <option value="azure">Azure OpenAI</option>
                            </SelectField>
                        </FormField>
                        <FormField label="Realtime Model" required>
                            <SelectField value={form.rtModel} onChange={(v) => set("rtModel", v)}>
                                {rtModels.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </SelectField>
                        </FormField>
                        <FormField label="Realtime Voice" required>
                            <SelectField value={form.rtVoice} onChange={(v) => set("rtVoice", v)}>
                                {rtVoices.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                            </SelectField>
                        </FormField>
                        <FormField label="Language">
                            <SelectField value={form.rtLanguage} onChange={(v) => set("rtLanguage", v)}>
                                <option value="">Auto-detect (default)</option>
                                <option value="en">English</option>
                                <option value="es">Spanish</option>
                                <option value="fr">French</option>
                                <option value="de">German</option>
                                <option value="it">Italian</option>
                                <option value="pt">Portuguese</option>
                                <option value="ja">Japanese</option>
                                <option value="ko">Korean</option>
                                <option value="zh">Chinese</option>
                                <option value="ar">Arabic</option>
                                <option value="hi">Hindi</option>
                            </SelectField>
                        </FormField>
                        <FormField label="Output Modalities">
                            <SelectField value={form.rtModalities} onChange={(v) => set("rtModalities", v)}>
                                <option value="text_audio">Text + Audio (default)</option>
                                <option value="text">Text Only (use separate TTS)</option>
                            </SelectField>
                        </FormField>
                        <FormField label="Thinking Budget">
                            <SelectField value={form.rtThinkingBudget} onChange={(v) => set("rtThinkingBudget", v)}>
                                <option value="auto">Auto (default)</option>
                                <option value="0">Off (0)</option>
                                <option value="1024">Light (1024)</option>
                                <option value="2048">Medium (2048)</option>
                                <option value="4096">Deep (4096)</option>
                                <option value="8192">Maximum (8192)</option>
                            </SelectField>
                        </FormField>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                        <ToggleField label="Proactive Audio" hint="Model can decline irrelevant input" checked={form.rtProactivity} onChange={(v) => set("rtProactivity", v)} />
                        <ToggleField label="Affective Dialog" hint="Adapts tone to caller's emotion" checked={form.rtAffectiveDialog} onChange={(v) => set("rtAffectiveDialog", v)} />
                        <ToggleField label="Input Noise Reduction" hint="Reduces background noise" checked={form.rtNoiseReduction} onChange={(v) => set("rtNoiseReduction", v)} />
                    </div>

                    <SliderField
                        label="Temperature"
                        value={form.rtTemperature} min={0} max={2} step={0.1}
                        onChange={(v) => set("rtTemperature", v)}
                        recommended={0.8}
                    />
                </div>
            )}

            {/* Standard LLM Config */}
            {!isRealtime && (
                <div>
                    <div style={SECTION_TITLE_STYLE}><Cpu size={13} /> Language Model (LLM)</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                        <FormField label="LLM Provider" required>
                            <SelectField value={form.llmProvider} onChange={(v) => {
                               setForm({
                                     ...form,
                                     llmProvider: v,
                                     llmModel: LLM_MODELS[v]?.[0]?.value ?? ""
                                     });
                                     }}>
                                 <option value="openai">OpenAI</option>
                                 <option value="google">Google</option>
                                 <option value="xai">xAI / Grok</option>
                                 <option value="google_cloud">Google Cloud Vertex</option>
                                 <option value="bedrock">AWS Bedrock</option>
                                 <option value="anthropic">Anthropic</option>
                                 <option value="groq">Groq</option>
                                 <option value="azure_openai">Azure OpenAI</option>
                                 </SelectField>
                           </FormField>
                        <FormField label="LLM Model" required hint="Model selection updates based on provider">
                            <SelectField value={form.llmModel} onChange={(v) => set("llmModel", v)}>
                                {llmModels.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </SelectField>
                        </FormField>
                        {form.llmProvider === "azure_openai" && (
                            <FormField label="Azure Deployment Name" hint="Your Azure deployment name. Defaults to model name.">
                                <input style={INPUT_STYLE} type="text" value={form.llmAzureDeployment}
                                    placeholder="e.g. gpt-4o" onChange={(e) => set("llmAzureDeployment", e.target.value)} />
                            </FormField>
                        )}
                    </div>

                    <SliderField
                        label="LLM Temperature"
                        value={form.llmTemperature} min={0} max={2} step={0.1}
                        onChange={(v) => set("llmTemperature", v)}
                        recommended={0.8}
                    />
                    <p style={HELP_STYLE}>
                        Controls response creativity. 0.7–1.0 produces natural, conversational speech.
                        Lower = consistent, higher = creative.
                    </p>
                </div>
            )}
        </div>
    );
}

function SttTab({ form, setForm, getPriceFor }: { form: AgentFormState; setForm: (f: AgentFormState) => void, getPriceFor: any }) {
    const set = <K extends keyof AgentFormState>(k: K, v: AgentFormState[K]) =>
        setForm({ ...form, [k]: v });
    const sttModels = STT_MODELS[form.sttProvider] ?? [];

    if (form.pipelineMode === "realtime") {
        return (
            <div className="alert alert-info" style={{ marginTop: "0.5rem" }}>
                <Zap size={14} style={{ flexShrink: 0 }} />
                <span><strong>Realtime Mode Active:</strong> Speech recognition is handled by the realtime model. Configure voice options in the Behavior tab.</span>
            </div>
        );
    }

    return (
        <div style={{ display: "grid", gap: "1.25rem" }}>
            <div style={SECTION_TITLE_STYLE}><Mic size={13} /> Speech-to-Text (STT) Configuration</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <FormField label="STT Provider" required>
                    <div className="flex items-center mb-1">
                        {(() => {
                            const p = getPriceFor('stt', form.sttProvider);
                            return p && <PriceBadge price={p.price} unit={p.unit} type="stt" />;
                        })()}
                    </div>
                    <SelectField value={form.sttProvider} onChange={(v) => {
                        set("sttProvider", v);
                        set("sttModel", STT_MODELS[v]?.[0]?.value ?? "");
                    }}>
                        <option value="deepgram">Deepgram ⭐ Recommended</option>
                        <option value="openai">OpenAI</option>
                        <option value="google_cloud">Google Cloud</option>
                        <option value="elevenlabs">ElevenLabs</option>
                        <option value="aws_transcribe">Amazon Transcribe</option>
                        <option value="azure_speech">Azure Speech</option>
                        <option value="azure_openai">Azure OpenAI (Whisper)</option>
                        <option value="groq">Groq (Whisper)</option>
                    </SelectField>
                </FormField>

                <FormField label="STT Model" required>
                    <SelectField value={form.sttModel} onChange={(v) => set("sttModel", v)}>
                        {sttModels.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </SelectField>
                </FormField>

                <FormField label="Language" hint="Speech recognition language. Available languages depend on provider.">
                    <SelectField value={form.sttLanguage} onChange={(v) => set("sttLanguage", v)}>
                        <optgroup label="English">
                            <option value="en-US">English (US)</option>
                            <option value="en-AU">English (Australia)</option>
                            <option value="en-GB">English (UK)</option>
                            <option value="en-IN">English (India)</option>
                            <option value="en-NZ">English (New Zealand)</option>
                            <option value="en-IE">English (Ireland)</option>
                            <option value="en-CA">English (Canada)</option>
                        </optgroup>
                        <optgroup label="Spanish">
                            <option value="es-ES">Spanish (Spain)</option>
                            <option value="es-US">Spanish (US/Latin America)</option>
                            <option value="es-MX">Spanish (Mexico)</option>
                        </optgroup>
                        <optgroup label="French">
                            <option value="fr-FR">French (France)</option>
                            <option value="fr-CA">French (Canada)</option>
                        </optgroup>
                        <optgroup label="German">
                            <option value="de-DE">German</option>
                            <option value="de-CH">German (Swiss)</option>
                        </optgroup>
                        <optgroup label="Other">
                            <option value="pt-PT">Portuguese (Portugal)</option>
                            <option value="pt-BR">Portuguese (Brazil)</option>
                            <option value="it-IT">Italian</option>
                            <option value="nl-NL">Dutch</option>
                            <option value="pl-PL">Polish</option>
                            <option value="ru-RU">Russian</option>
                            <option value="ja-JP">Japanese</option>
                            <option value="ko-KR">Korean</option>
                            <option value="cmn-Hans-CN">Chinese (Simplified)</option>
                            <option value="ar-XA">Arabic</option>
                            <option value="hi-IN">Hindi</option>
                            <option value="ur">Urdu (Pakistan)</option>
                            <option value="pa">Punjabi (Pakistan)</option>
                        </optgroup>
                    </SelectField>
                </FormField>

                {form.sttProvider === "deepgram" && (
                    <FormField label="Auto-detect Language">
                        <ToggleField
                            label="Automatic Language Detection"
                            hint="Deepgram automatically detects language. Overrides the language selection."
                            checked={form.sttDetectLanguage}
                            onChange={(v) => set("sttDetectLanguage", v)}
                        />
                    </FormField>
                )}

                <FormField label="Custom Vocabulary" hint='Add specialized words separated by commas. E.g., "Dr Abbie Clinics, podiatry, Kirrawee"'>
                    <textarea
                        style={{ ...INPUT_STYLE, resize: "vertical" }}
                        rows={3}
                        value={form.sttCustomVocab}
                        placeholder="Brand names, medical terms, product names..."
                        onChange={(e) => set("sttCustomVocab", e.target.value)}
                    />
                </FormField>
            </div>

            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                <div style={SECTION_TITLE_STYLE}><Settings2 size={13} /> Recognition Settings</div>

                <SliderField
                    label="Interrupt Sensitivity"
                    value={form.sttResponsiveness} min={0} max={1} step={0.1}
                    onChange={(v) => set("sttResponsiveness", v)}
                    recommended={0.6}
                />
                <p style={HELP_STYLE}>
                    Controls how quickly the agent responds to interruptions. 0.5–0.7 is ideal for most voice AI.
                    Higher = faster but may cut callers off. Lower = more patient.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                    <ToggleField label="Smart Formatting" hint='Format dates, times, currency (e.g., "10 dollars" → "$10")' checked={form.sttSmartFormatting} onChange={(v) => set("sttSmartFormatting", v)} />
                    <ToggleField label="Remove Filler Words" hint='Remove "um", "uh", "like" from transcriptions' checked={form.sttRemoveFillers} onChange={(v) => set("sttRemoveFillers", v)} />
                </div>
            </div>
        </div>
    );
}

function TtsTab({ form, setForm, getPriceFor }: { form: AgentFormState; setForm: (f: AgentFormState) => void, getPriceFor: any }) {
    const set = <K extends keyof AgentFormState>(k: K, v: AgentFormState[K]) =>
        setForm({ ...form, [k]: v });
    const ttsModels = TTS_MODELS[form.ttsProvider] ?? [];

    const voiceSelectFor = (provider: string) => {
        if (provider === "elevenlabs") return (
            <FormField label="ElevenLabs Voice" hint="Select a preset or enter a custom Voice ID below.">
                <SelectField value={form.ttsVoiceId} onChange={(v) => set("ttsVoiceId", v === "custom" ? "" : v)}>
                    {ELEVENLABS_VOICES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                </SelectField>
            </FormField>
        );
        if (provider === "cartesia") return (
            <FormField label="Cartesia Voice">
                <SelectField value={form.ttsVoiceId} onChange={(v) => set("ttsVoiceId", v === "custom" ? "" : v)}>
                    {CARTESIA_VOICES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                </SelectField>
            </FormField>
        );
        if (provider === "openai" || provider === "azure_openai") return (
            <FormField label="Voice">
                <SelectField value={form.ttsVoiceId} onChange={(v) => set("ttsVoiceId", v)}>
                    {OPENAI_VOICES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                </SelectField>
            </FormField>
        );
        return null;
    };

    return (
        <div style={{ display: "grid", gap: "1.25rem" }}>
            <div style={SECTION_TITLE_STYLE}><Volume2 size={13} /> Text-to-Speech (TTS) Configuration</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <FormField label="TTS Provider" required>
                    <div className="flex items-center mb-1">
                        {(() => {
                            const p = getPriceFor('tts', form.ttsProvider);
                            return p && <PriceBadge price={p.price} unit={p.unit} type="tts" />;
                        })()}
                    </div>
                    <SelectField value={form.ttsProvider} onChange={(v) => {
                        set("ttsProvider", v);
                        set("ttsModel", TTS_MODELS[v]?.[0]?.value ?? "");
                        set("ttsVoiceId", "");
                    }}>
                        <option value="cartesia">Cartesia ⚡ Lowest Latency</option>
                        <option value="elevenlabs">ElevenLabs ⭐ Best Quality</option>
                        <option value="deepgram">Deepgram (Aura-2)</option>
                        <option value="openai">OpenAI TTS</option>
                        <option value="google_cloud">Google Cloud TTS</option>
                        <option value="google_gemini">Google Cloud Gemini TTS</option>
                        <option value="azure_speech">Azure Speech</option>
                        <option value="azure_openai">Azure OpenAI TTS</option>
                        <option value="aws_polly">Amazon Polly</option>
                        <option value="groq">Groq (Orpheus)</option>
                        <option value="upliftai">Uplift AI</option>
                    </SelectField>
                </FormField>

                <FormField label="TTS Model" required>
                    <SelectField value={form.ttsModel} onChange={(v) => set("ttsModel", v)}>
                        {ttsModels.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </SelectField>
                </FormField>

                {voiceSelectFor(form.ttsProvider)}

                <FormField label="Voice ID (Custom / Override)" hint="Override the voice selection above, or enter a custom voice ID for your provider.">
                    <input
                        style={INPUT_STYLE}
                        type="text"
                        value={form.ttsVoiceId}
                        placeholder="e.g. EXAVITQu4vr4xnSDxMaL (ElevenLabs) or v_meklc281 (Uplift AI)"
                        onChange={(e) => set("ttsVoiceId", e.target.value)}
                    />
                </FormField>
            </div>

            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                <SliderField
                    label="Speech Speed"
                    value={form.ttsSpeed} min={0.5} max={2.0} step={0.05}
                    onChange={(v) => set("ttsSpeed", v)}
                    recommended={1.0}
                />
                <p style={HELP_STYLE}>Controls how fast the agent speaks. 1.0 is normal speed.</p>
            </div>

            {form.ttsProvider === "elevenlabs" && (
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                    <div style={SECTION_TITLE_STYLE}><Settings2 size={13} /> ElevenLabs Voice Settings</div>
                    <div style={{ display: "grid", gap: "1rem" }}>
                        <SliderField
                            label="Voice Stability"
                            value={form.elevenLabsStability} min={0} max={1} step={0.05}
                            onChange={(v) => set("elevenLabsStability", v)}
                            recommended={0.5}
                        />
                        <p style={HELP_STYLE}>Higher = more consistent speech. Lower = more expressive.</p>
                        <SliderField
                            label="Similarity Boost"
                            value={form.elevenLabsSimilarity} min={0} max={1} step={0.05}
                            onChange={(v) => set("elevenLabsSimilarity", v)}
                            recommended={0.75}
                        />
                        <p style={HELP_STYLE}>Higher = closer to original voice. Lower = more variation.</p>
                    </div>
                </div>
            )}
        </div>
    );
}

function ToolsTab({ form, setForm }: { form: AgentFormState; setForm: (f: AgentFormState) => void }) {
    const updateToolConfig = (key: string, value: string) => {
        setForm({
            ...form,
            toolsConfig: {
                ...form.toolsConfig,
                [key]: value
            }
        });
    };

    return (
        <div style={{ display: "grid", gap: "1.25rem" }}>
            <div style={SECTION_TITLE_STYLE}><Wrench size={13} /> Call Routing & Tools Architecture</div>
            <div className="alert alert-info">
                <Info size={14} style={{ flexShrink: 0 }} />
                <span>
                    <strong>Sovereign Mode Enabled:</strong> The agent inherits the 9 Master Connectivity tools natively. Use these fields to inject dynamic JSONB configurations for Escalation and Hangup logic into the database.
                </span>
            </div>

            <div style={{ display: "grid", gap: "1rem", border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "var(--radius)", background: "var(--bg-tertiary)" }}>
                <h6 style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-primary)" }}>🔥 Escalation Protocol (Transfer to Human)</h6>
                <FormField label="Escalation Triggers / Key Phrases" hint="Comma separated phrases that instantly abort AI stream and trigger human handoff.">
                    <textarea style={{ ...INPUT_STYLE, resize: "vertical" }} rows={2} value={form.toolsConfig?.escalation_triggers || ""} placeholder="Billing, Bills, Electricity Bill, excessive charges, frustrated, abusive" onChange={(e) => updateToolConfig("escalation_triggers", e.target.value)} />
                </FormField>
                <FormField label="Apology Speech Prior to Transfer" hint="What the AI says immediately before executing the SIP REFER. Must match STT language (e.g. Urdu).">
                    <textarea style={{ ...INPUT_STYLE, resize: "vertical" }} rows={2} value={form.toolsConfig?.escalation_speech || ""} placeholder="میں سمجھتی ہوں۔ میں آپ کی کال ایک نمائندے کو ٹرانسفر کر رہی ہوں۔" onChange={(e) => updateToolConfig("escalation_speech", e.target.value)} />
                </FormField>
                <FormField label="SIP Extension / Desination URI" hint="SIP route format. Defaults to sip:101@172.29.24.63 if blank.">
                    <input style={INPUT_STYLE} type="text" value={form.toolsConfig?.escalation_extension || ""} placeholder="sip:101@172.29.24.63" onChange={(e) => updateToolConfig("escalation_extension", e.target.value)} />
                </FormField>
            </div>

            <div style={{ display: "grid", gap: "1rem", border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "var(--radius)", background: "var(--bg-tertiary)" }}>
                <h6 style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-primary)" }}>🛑 Hangup Protocol (End Call)</h6>
                <FormField label="Hangup Triggers / Key Phrases" hint="Comma separated phrases indicating the caller wants to terminate the conversation.">
                    <textarea style={{ ...INPUT_STYLE, resize: "vertical" }} rows={2} value={form.toolsConfig?.hangup_triggers || ""} placeholder="Goodbye, Allah Hafiz, Thank you, bye" onChange={(e) => updateToolConfig("hangup_triggers", e.target.value)} />
                </FormField>
                <FormField label="Farewell Speech Prior to Disconnect" hint="What the AI says before hanging up the LiveKit room.">
                    <textarea style={{ ...INPUT_STYLE, resize: "vertical" }} rows={2} value={form.toolsConfig?.hangup_speech || ""} placeholder="پنجاب ہیلپ لائن پر رابطہ کرنے کا شکریہ۔ اللہ حافظ!" onChange={(e) => updateToolConfig("hangup_speech", e.target.value)} />
                </FormField>
            </div>

            <div style={{ display: "grid", gap: "1rem", border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "var(--radius)", background: "var(--bg-tertiary)" }}>
                <h6 style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-primary)" }}>✅ Ticket Resolution Protocol</h6>
                <FormField label="Resolved Speech Prior to Disconnect" hint="What the AI says when a citizen confirms their issue IS resolved.">
                    <textarea style={{ ...INPUT_STYLE, resize: "vertical" }} rows={2} value={form.toolsConfig?.resolved_speech || ""} placeholder="آپ کی تصدیق کا شکریہ۔ اللہ حافظ۔" onChange={(e) => updateToolConfig("resolved_speech", e.target.value)} />
                </FormField>
                <FormField label="Unresolved Speech Prior to Disconnect" hint="What the AI says when a citizen confirms their issue is NOT resolved.">
                    <textarea style={{ ...INPUT_STYLE, resize: "vertical" }} rows={2} value={form.toolsConfig?.unresolved_speech || ""} placeholder="آپ کی شکایت دوبارہ متعلقہ افسران کو بھیج دی گئی ہے۔" onChange={(e) => updateToolConfig("unresolved_speech", e.target.value)} />
                </FormField>
                <FormField label="🔒 Returning Caller Prompt Override" hint="The directive Sarah receives when a caller has a pending ticket. Supports {caller_name}, {ticket_id}, and {phonetic_id} placeholders. Leave blank to use the system default.">
                    <textarea style={{ ...INPUT_STYLE, resize: "vertical" }} rows={4} value={form.toolsConfig?.returning_caller_prompt || ""} placeholder="[CRITICAL DATABASE OVERRIDE]: The system database confirms that this caller, {caller_name}, has an active complaint with Ticket ID: {ticket_id}. Greet them as {caller_name} Sahib/Sahiba and read ticket number slowly: {phonetic_id}." onChange={(e) => updateToolConfig("returning_caller_prompt", e.target.value)} />
                </FormField>
            </div>

            <div style={{ display: "grid", gap: "1rem", border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "var(--radius)", background: "var(--bg-tertiary)" }}>
                <h6 style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-primary)" }}>🎫 Ticket Submission Protocol</h6>
                <div className="alert alert-info" style={{ margin: 0 }}>
                    <Info size={13} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: "0.8rem" }}>Use <code style={{ background: "var(--bg-secondary)", padding: "0 3px", borderRadius: 3 }}>{'{ticket_id}'}</code> as a placeholder — it will be replaced with the real Ticket ID at runtime. Example: <em>آپ کا شکایت نمبر ہے {'{ticket_id}'}۔ اللہ حافظ۔</em></span>
                </div>
                <FormField label="Ticket Confirmation Speech" hint="What Sarah says autonomously after filing the complaint. The {ticket_id} placeholder is replaced with the real ID. Call hangs up automatically after this speech.">
                    <textarea style={{ ...INPUT_STYLE, resize: "vertical" }} rows={3} value={form.toolsConfig?.ticket_speech || ""} placeholder="آپ کی شکایت کامیابی کے ساتھ درج کر لی گئی ہے۔ آپ کا شکایت نمبر ہے {ticket_id}۔ پنجاب ہیلپ لائن پر رابطہ کرنے کا شکریہ، اللہ حافظ۔" onChange={(e) => updateToolConfig("ticket_speech", e.target.value)} />
                </FormField>
            </div>
        </div>
    );
}

function AdvancedTab({ form }: { form: AgentFormState }) {
    return (
        <div style={{ display: "grid", gap: "1.25rem" }}>
            <div style={SECTION_TITLE_STYLE}><Settings2 size={13} /> Advanced Configuration</div>

            <div className="alert alert-info">
                <Info size={14} style={{ flexShrink: 0 }} />
                <span>
                    <strong>Tools & Webhooks</strong> configuration will be available in Phase 3.
                    The agent will store these settings in the <code style={{ background: "var(--bg-tertiary)", padding: "0 3px", borderRadius: 3 }}>tools_config</code> JSONB column.
                </span>
            </div>

            {/* Config summary preview */}
            <div className="card">
                <div className="card-header">
                    <span className="card-title"><ChevronRight size={14} /> Current Configuration Preview</span>
                </div>
                <div className="card-body" style={{ padding: "0.75rem" }}>
                    <div className="code-box" style={{ maxHeight: 280, fontSize: "0.75rem" }}>
                        {JSON.stringify({
                            pipeline_mode: form.pipelineMode,
                            llm: form.pipelineMode === "standard" ? { provider: form.llmProvider, model: form.llmModel, temperature: form.llmTemperature } : null,
                            realtime: form.pipelineMode === "realtime" ? { provider: form.rtProvider, model: form.rtModel, voice: form.rtVoice } : null,
                            stt: form.pipelineMode === "standard" ? { provider: form.sttProvider, model: form.sttModel, language: form.sttLanguage, responsiveness: form.sttResponsiveness } : null,
                            tts: { provider: form.ttsProvider, model: form.ttsModel, voice_id: form.ttsVoiceId, speed: form.ttsSpeed },
                        }, null, 2)}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "identity", label: "Identity", icon: <User size={13} /> },
    { id: "behavior", label: "Behavior / LLM", icon: <Cpu size={13} /> },
    { id: "stt", label: "Speech Recognition", icon: <Mic size={13} /> },
    { id: "tts", label: "Voice / TTS", icon: <Volume2 size={13} /> },
    { id: "tools", label: "Tools & Routing", icon: <Wrench size={13} /> },
    { id: "advanced", label: "Advanced", icon: <Settings2 size={13} /> },
];

export default function CreateAgentPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>("identity");
    const [form, setForm] = useState<AgentFormState>(DEFAULT_STATE);
    const [submitting, setSubmitting] = useState(false);
    const [pricing, setPricing] = useState<PricingConfig | null>(null);

    useEffect(() => {
        fetch('/api/settings/pricing/sync').then(r => r.json()).then(setPricing).catch(console.error);
    }, []);

    const getPriceFor = (type: 'llm' | 'stt' | 'tts' | 'rt', providerId: string) => {
        if (!pricing) return null;
        const list = type === 'llm' ? pricing.llmProviders : 
                     type === 'stt' ? pricing.sttProviders : 
                     type === 'tts' ? pricing.ttsProviders : 
                     pricing.realtimeProviders;
        
        // Find by name or id (since our pricing JSON uses names mostly)
        const item = list?.find((p: any) => 
            p.id?.toLowerCase() === providerId.toLowerCase() || 
            p.name?.toLowerCase().includes(providerId.toLowerCase())
        );

        if (!item) return null;
        
        if (type === 'llm') return { price: item.input, unit: '/ 1M' };
        if (type === 'stt') return { price: item.rate, unit: '/min' };
        if (type === 'tts') return { price: item.rate, unit: '/ 1M' };
        if (type === 'rt') return { price: item.input || item.rate, unit: item.input ? '/ 1M' : '/min' };
        
        return null;
    };

    const handleSave = async () => {
        setSubmitting(true);
        try {
            const res = await fetch('/api/agents/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (data.success) {
                alert("Agent created successfully!");
                router.push('/agents');
            } else {
                alert("Error: " + data.error);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to save agent.");
        } finally {
            setSubmitting(false);
        }
    };
    const [submitError, setSubmitError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.name.trim() || !form.slug || !form.systemPrompt.trim()) {
            setSubmitError("Agent Name, Slug, and System Prompt are required.");
            setActiveTab("identity");
            return;
        }

        setSubmitting(true);
        setSubmitError(null);

        try {
            const res = await fetch("/api/agents/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await res.json();

            if (!res.ok) {
                setSubmitError(data.error ?? `Server error ${res.status}`);
                setSubmitting(false);
                return;
            }

            // Success — navigate back to the agents table
            router.push("/agents");
            router.refresh();
        } catch {
            setSubmitError("Network error — check that the dev server is running.");
            setSubmitting(false);
        }
    }

    const currentTabIdx = TABS.findIndex(t => t.id === activeTab);

    return (
        <>
            <TopBar
                title="Create Agent"
                subtitle="Configure AI voice agent for Global Access AI Engine"
            />

            <main className="page-content">
                <form onSubmit={handleSubmit}>
                    <div className="card">
                        {/* Card Header */}
                        <div className="card-header">
                            <h5 className="card-title"><Bot size={16} /> New Agent Configuration</h5>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <Link href="/agents" className="btn btn-secondary btn-sm">Cancel</Link>
                                <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                                    <Save size={13} />
                                    {submitting ? "Saving…" : "Create Agent"}
                                </button>
                            </div>
                        </div>

                        {/* Warning banner */}
                        <div style={{
                            padding: "0.6rem 1.25rem",
                            background: "var(--warning-bg)",
                            borderBottom: "1px solid rgba(210,153,34,0.3)",
                            display: "flex", gap: "0.5rem", alignItems: "center",
                            fontSize: "0.8rem", color: "var(--warning)",
                        }}>
                            <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                            <span>
                                <strong>Important:</strong> Ensure required provider packages are installed via
                                <strong> Settings → Dependency Manager</strong> before starting the agent.
                            </span>
                        </div>

                        {/* API error banner */}
                        {submitError && (
                            <div className="alert alert-danger" style={{ margin: "0.75rem 1.25rem 0", borderRadius: "var(--radius)" }}>
                                <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                                <span><strong>Error:</strong> {submitError}</span>
                            </div>
                        )}

                        {/* Tab Nav */}
                        <div style={{
                            display: "flex",
                            borderBottom: "1px solid var(--border-color)",
                            background: "var(--bg-tertiary)",
                            overflowX: "auto",
                        }}>
                            {TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.4rem",
                                        padding: "0.75rem 1.125rem",
                                        background: "transparent",
                                        border: "none",
                                        borderBottom: `2px solid ${activeTab === tab.id ? "var(--brand-primary)" : "transparent"}`,
                                        color: activeTab === tab.id ? "var(--brand-primary)" : "var(--text-secondary)",
                                        fontWeight: activeTab === tab.id ? 600 : 400,
                                        fontSize: "0.8125rem",
                                        cursor: "pointer",
                                        whiteSpace: "nowrap",
                                        transition: "all 0.15s",
                                    }}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="card-body" style={{ minHeight: "520px" }}>
                            {activeTab === "identity" && <IdentityTab form={form} setForm={setForm} />}
                            {activeTab === "behavior" && <BehaviorTab form={form} setForm={setForm} getPriceFor={getPriceFor} />}
                            {activeTab === "stt" && <SttTab form={form} setForm={setForm} getPriceFor={getPriceFor} />}
                            {activeTab === "tts" && <TtsTab form={form} setForm={setForm} getPriceFor={getPriceFor} />}
                            {activeTab === "tools" && <ToolsTab form={form} setForm={setForm} />}
                            {activeTab === "advanced" && <AdvancedTab form={form} />}
                        </div>

                        {/* Tab Navigation Footer */}
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "0.875rem 1.25rem",
                            borderTop: "1px solid var(--border-color)",
                            background: "var(--bg-tertiary)",
                        }}>
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => setActiveTab(TABS[Math.max(0, currentTabIdx - 1)].id)}
                                disabled={currentTabIdx === 0}
                            >
                                ← Previous
                            </button>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", alignSelf: "center" }}>
                                {currentTabIdx + 1} / {TABS.length}
                            </span>
                            {currentTabIdx < TABS.length - 1 ? (
                                <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setActiveTab(TABS[currentTabIdx + 1].id)}
                                >
                                    Next →
                                </button>
                            ) : (
                                <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                                    <Save size={13} /> {submitting ? "Saving…" : "Create Agent"}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </main>

            <footer className="site-footer">
                <span>Global Access AI Engine &copy; {new Date().getFullYear()}</span>
                <span style={{ color: "var(--text-muted)" }}>Sovereign Deployment — Air-Gapped</span>
            </footer>
        </>
    );
}
