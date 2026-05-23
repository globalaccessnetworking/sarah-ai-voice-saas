"use client";

import { useState, useEffect, use } from "react";
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
import { TtsVocabularySync } from "@/components/agent-config/TtsVocabularySync";

// ─── Types ───────────────────────────────────────────────────────────────────
type PipelineMode = "standard" | "realtime";
type Tab = "identity" | "behavior" | "stt" | "tts" | "tools" | "outbound" | "advanced";

interface AgentFormState {
    id: string;
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

    // Outbound Robocall
    outboundGreetingText: string;
    outboundGreetingWav: string;
    resolvedFarewellText: string;
    resolvedFarewellWav: string;
    unresolvedFarewellText: string;
    unresolvedFarewellWav: string;

    // Robocall Governance
    outboundBatchLimit: number;
    outboundRetryInterval: number;
    outboundMaxRetries: number;
    outboundAllowedStart: string;
    outboundAllowedEnd: string;
    isOutboundActive: boolean;
    bypassOperatingHours: boolean;
    outboundSttModel: string;
    outboundLlmModel: string;
    outboundLlmTemperature: number;
    outboundTtsVoiceId: string;
    outboundTtsDictionaryId: string;
    bypassOutboundDictionary: boolean;
    outboundWatchdogNudgeText: string;
    
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
        auto_record?: boolean;
        sentiment_analysis?: boolean;
        greeting_audio_url?: string;
        barge_in_threshold?: number;
        vad_threshold?: number;
        vad_padding?: number;
    };
    eligibilityRules: {
        allowedCities?: string[];
        cityApologyText?: string;
        cityApologyAudio?: string;
        excludedAreas?: string[];
        areaApologyText?: string;
        areaApologyAudio?: string;
        excludeCommercial?: boolean;
        commercialApologyText?: string;
        commercialApologyAudio?: string;
        latencyMaskingAudio?: string;
    };
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
    xai: [ // Ensure this key is 'xai'
        { value: "grok-beta", label: "Grok Beta" },
        { value: "grok-2", label: "Grok 2" },
        { value: "grok-3", label: "Grok 3" },
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
    google: [
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
    id: "",
    name: "New Agent",
    slug: "", initialGreeting: "", systemPrompt: "", knowledgeBase: "", toolInstructions: "",
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
    // Outbound Robocall Defaults
    outboundGreetingText: "",
    outboundGreetingWav: "",
    resolvedFarewellText: "",
    resolvedFarewellWav: "",
    unresolvedFarewellText: "",
    unresolvedFarewellWav: "",
    // Outbound Governance Defaults
    outboundBatchLimit: 5,
    outboundRetryInterval: 120,
    outboundMaxRetries: 3,
    outboundAllowedStart: "09:00",
    outboundAllowedEnd: "20:00",
    isOutboundActive: false,
    bypassOperatingHours: false,
    outboundSttModel: "nova-2-general",
    outboundLlmModel: "gpt-4o",
    outboundLlmTemperature: 0.5,
    outboundTtsVoiceId: "v_meklc281",
    outboundTtsDictionaryId: "",
    bypassOutboundDictionary: false,
    outboundWatchdogNudgeText: "",
    toolsConfig: {
        barge_in_threshold: 0.5,
        vad_threshold: 0.55,
        vad_padding: 0.3,
    },
    eligibilityRules: {
        latencyMaskingAudio: undefined,
    },
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
                        {(Number(value) || 0).toFixed(1)}
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
                            const newName = e.target.value;
                            const newSlug = (!form.slug || form.slug === autoSlug(form.name))
                                ? autoSlug(newName)
                                : form.slug;
                            setForm({ ...form, name: newName, slug: newSlug });
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
                }}>
                    {form.toolsConfig.greeting_audio_url ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem", width: "100%" }}>
                            <div style={{ 
                                flex: 1, 
                                fontSize: "0.8rem", 
                                color: "var(--brand-primary)", 
                                overflow: "hidden", 
                                textOverflow: "ellipsis", 
                                whiteSpace: "nowrap" 
                            }}>
                                <Zap size={12} style={{ display: "inline", marginRight: "0.4rem" }} />
                                {form.toolsConfig.greeting_audio_url.split('/').pop()}
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => {
                                        const audio = new Audio(`/api/agents/${(window as any).AGENT_ID}/greeting-audio?t=${Date.now()}`);
                                        audio.play();
                                    }}
                                    style={{ padding: "0.25rem 0.6rem" }}
                                >
                                    <Play size={12} /> Preview
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={async () => {
                                        if (confirm("Delete this greeting recording?")) {
                                            try {
                                                const res = await fetch(`/api/agents/${(window as any).AGENT_ID}/greeting-audio`, { method: "DELETE" });
                                                if (res.ok) {
                                                    set("toolsConfig", { ...form.toolsConfig, greeting_audio_url: undefined });
                                                }
                                            } catch (e) {
                                                alert("Failed to delete.");
                                            }
                                        }
                                    }}
                                    style={{ padding: "0.25rem 0.6rem" }}
                                >
                                    <Trash2 size={12} /> Delete
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ width: "100%" }}>
                            <label style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "0.5rem",
                                cursor: "pointer",
                                padding: "1rem",
                                border: "1px dashed var(--border-color)",
                                borderRadius: "var(--radius)",
                                color: "var(--text-muted)",
                                transition: "all 0.15s",
                            }} onMouseOver={(e) => (e.currentTarget.style.borderColor = "var(--brand-primary)")}
                               onMouseOut={(e) => (e.currentTarget.style.borderColor = "var(--border-color)")}>
                                <Upload size={20} />
                                <span style={{ fontSize: "0.8rem" }}>Upload .wav Greeting (0ms Latency)</span>
                                <input
                                    type="file"
                                    accept=".wav"
                                    style={{ display: "none" }}
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        if (!file.name.toLowerCase().endsWith(".wav")) {
                                            alert("Only .wav files are allowed for maximum performance.");
                                            return;
                                        }

                                        const formData = new FormData();
                                        formData.append("file", file);

                                        try {
                                            const res = await fetch(`/api/agents/${(window as any).AGENT_ID}/greeting-audio`, {
                                                method: "POST",
                                                body: formData,
                                            });
                                            const data = await res.json();
                                            if (data.url) {
                                                set("toolsConfig", { ...form.toolsConfig, greeting_audio_url: data.url });
                                            } else {
                                                alert(data.error || "Upload failed.");
                                            }
                                        } catch (err) {
                                            alert("Upload failed: Network error.");
                                        }
                                    }}
                                />
                            </label>
                        </div>
                    )}
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

function AudioUploader({ label, value, type, agentId, onUpload, onDelete, hint }: {
    label: string; value: string; type: string; agentId: string;
    onUpload: (url: string) => void; onDelete: () => void; hint?: string;
}) {
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.name.toLowerCase().endsWith(".wav")) {
            alert("Only .wav files are allowed for telephony compatibility.");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch(`/api/agents/${agentId}/outbound-audio?type=${type}`, {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (data.url) {
                onUpload(data.url);
            } else {
                alert(data.error || "Upload failed.");
            }
        } catch (err) {
            alert("Upload failed: Network error.");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this recording?")) return;
        try {
            await fetch(`/api/agents/${agentId}/outbound-audio?type=${type}`, {
                method: "DELETE",
            });
            onDelete();
        } catch (err) {
            alert("Failed to delete recording.");
        }
    };

    return (
        <FormField label={label} hint={hint}>
            <div style={{ 
                display: "grid", 
                gap: "0.75rem", 
                padding: "1rem", 
                background: "var(--bg-secondary)", 
                borderRadius: "var(--radius)", 
                border: "1px dashed var(--border-color)" 
            }}>
                {value ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--brand-primary)", fontSize: "0.75rem", fontWeight: 600 }}>
                                <Volume2 size={14} /> LIVE RECORDING
                            </div>
                            <button 
                                onClick={handleDelete}
                                style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.7rem", fontWeight: 700 }}
                            >
                                <Trash2 size={12} /> REMOVE
                            </button>
                        </div>
                        <audio controls style={{ width: "100%", height: "32px", borderRadius: "4px" }} src={value}>
                            Your browser does not support audio playback.
                        </audio>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0" }}>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", textAlign: "center" }}>
                            No audio file uploaded yet.
                        </div>
                        <label className={`btn ${uploading ? 'btn-disabled' : 'btn-primary'}`} style={{ fontSize: "0.75rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            {uploading ? (
                                <>Uploading...</>
                            ) : (
                                <>
                                    <Upload size={14} /> Browse .WAV File
                                    <input type="file" accept=".wav" style={{ display: "none" }} onChange={handleUpload} disabled={uploading} />
                                </>
                            )}
                        </label>
                    </div>
                )}
            </div>
        </FormField>
    );
}

function EligibilityAudioUploader({ label, type, agentId, rules, onUpdate, hint }: {
    label: string; type: 'city' | 'area' | 'commercial' | 'latency_masking'; agentId: string;
    rules: AgentFormState['eligibilityRules'];
    onUpdate: (newRules: AgentFormState['eligibilityRules']) => void;
    hint?: string;
}) {
    const [uploading, setUploading] = useState(false);
    
    // Map internal keys
    const audioKey = (
        type === 'city' ? 'cityApologyAudio' : 
        type === 'area' ? 'areaApologyAudio' : 
        type === 'commercial' ? 'commercialApologyAudio' : 
        'latencyMaskingAudio'
    ) as keyof AgentFormState['eligibilityRules'];
    const audioUrl = rules[audioKey] as string | undefined;

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.name.toLowerCase().endsWith(".wav")) {
            alert("Only .wav files are allowed for telephony compatibility.");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch(`/api/agents/${agentId}/eligibility-audio?type=${type}`, {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (data.url) {
                onUpdate({ ...rules, [audioKey]: data.url });
            } else {
                alert(data.error || "Upload failed.");
            }
        } catch (err) {
            alert("Upload failed: Network error.");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this apology recording?")) return;
        try {
            // Reusing the upload logic but we should ideally have a DELETE endpoint or similar
            // For now, we clear it from the DB state.
            const newRules = { ...rules };
            delete newRules[audioKey];
            onUpdate(newRules);
        } catch (err) {
            alert("Failed to delete recording.");
        }
    };

    return (
        <FormField label={label} hint={hint}>
            <div style={{ 
                display: "grid", 
                gap: "0.75rem", 
                padding: "1rem", 
                background: "var(--bg-secondary)", 
                borderRadius: "var(--radius)", 
                border: "1px dashed var(--border-color)" 
            }}>
                {audioUrl ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--brand-primary)", fontSize: "0.75rem", fontWeight: 600 }}>
                                <Volume2 size={14} /> APOLOGY AUDIO
                            </div>
                            <button 
                                type="button"
                                onClick={handleDelete}
                                style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.7rem", fontWeight: 700 }}
                            >
                                <Trash2 size={12} /> REMOVE
                            </button>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                             <audio controls style={{ flex: 1, height: "32px", borderRadius: "4px" }} src={audioUrl}>
                                Your browser does not support audio playback.
                            </audio>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0" }}>
                        <label className={`btn ${uploading ? 'btn-disabled' : 'btn-primary'}`} style={{ fontSize: "0.75rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            {uploading ? (
                                <>Uploading...</>
                            ) : (
                                <>
                                    <Upload size={14} /> Upload Apology .WAV
                                    <input type="file" accept=".wav" style={{ display: "none" }} onChange={handleUpload} disabled={uploading} />
                                </>
                            )}
                        </label>
                        <p style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Agent will fallback to Text Apology if no audio is uploaded.</p>
                    </div>
                )}
            </div>
        </FormField>
    );
}

function BehaviorTab({ form, setForm }: { form: AgentFormState; setForm: (f: AgentFormState) => void }) {
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
                            <SelectField value={form.rtProvider} onChange={(v) => {
                                setForm({
                                    ...form,
                                    rtProvider: v,
                                    rtModel: RT_MODELS[v]?.[0]?.value ?? "",
                                    rtVoice: RT_VOICES[v]?.[0]?.value ?? ""
                                });
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
                                 <option value="xai">xAI / Grok</option>  {/* MUST be "xai" */}
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

function SttTab({ form, setForm }: { form: AgentFormState; setForm: (f: AgentFormState) => void }) {
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
                    <SelectField value={form.sttProvider} onChange={(v) => {
                        setForm({
                            ...form,
                            sttProvider: v,
                            sttModel: STT_MODELS[v]?.[0]?.value ?? ""
                        });
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

function TtsTab({ form, setForm }: { form: AgentFormState; setForm: (f: AgentFormState) => void }) {
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
        if (provider === "google") return (
            <FormField label="Google Gemini Voice">
                <SelectField value={form.ttsVoiceId} onChange={(v) => set("ttsVoiceId", v)}>
                    {RT_VOICES.google.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
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
                    <SelectField value={form.ttsProvider} onChange={(v) => {
                        let voiceId = "";
                        if (v === "google") voiceId = "Puck";
                        else if (v === "elevenlabs") voiceId = ELEVENLABS_VOICES[0].value;
                        else if (v === "cartesia") voiceId = CARTESIA_VOICES[0].value;
                        else if (v === "openai" || v === "azure_openai") voiceId = "nova";

                        setForm({
                            ...form,
                            ttsProvider: v,
                            ttsModel: (TTS_MODELS[v] || TTS_MODELS["openai"])[0]?.value ?? "",
                            ttsVoiceId: voiceId
                        });
                    }}>
                        <option value="cartesia">Cartesia ⚡ Lowest Latency</option>
                        <option value="elevenlabs">ElevenLabs ⭐ Best Quality</option>
                        <option value="deepgram">Deepgram (Aura-2)</option>
                        <option value="openai">OpenAI TTS</option>
                        <option value="google_cloud">Google Cloud TTS</option>
                        <option value="google">Google Cloud Gemini TTS</option>
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
    // Local buffers to prevent aggressive splitting/trimming while typing
    const [rawCities, setRawCities] = useState(form.eligibilityRules?.allowedCities?.join(", ") || "");
    const [rawAreas, setRawAreas] = useState(form.eligibilityRules?.excludedAreas?.join(", ") || "");

    const updateToolConfig = (key: string, value: any) => {
        setForm({
            ...form,
            toolsConfig: {
                ...(form.toolsConfig || {}),
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

            <div style={{ display: "grid", gap: "1rem", border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "var(--radius)", background: "var(--bg-tertiary)" }}>
                <h6 style={{ margin: 0, fontSize: "0.875rem", color: "var(--brand-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Zap size={14} /> ⚡ Barge-In & VAD Performance Tuning
                </h6>
                <p style={HELP_STYLE}>Control how long a user must speak before the AI stops talking to listen, and tune VAD sensitivity for noise rejection.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                    <SliderField
                        label="Interrupt Sensitivity (Barge-In)"
                        value={form.toolsConfig?.barge_in_threshold ?? 0.5}
                        min={0} max={2.0} step={0.05}
                        onChange={(v) => updateToolConfig("barge_in_threshold", v)}
                        recommended={0.2}
                    />
                    <SliderField
                        label="Silero Aggression (Threshold)"
                        value={form.toolsConfig?.vad_threshold ?? 0.55}
                        min={0.1} max={1.0} step={0.05}
                        onChange={(v) => updateToolConfig("vad_threshold", v)}
                        recommended={0.55}
                    />
                </div>
                <div style={{ marginTop: "0.5rem" }}>
                    <SliderField
                        label="VAD Memory Window (Padding Seconds)"
                        value={form.toolsConfig?.vad_padding ?? 0.3}
                        min={0.1} max={1.0} step={0.1}
                        onChange={(v) => updateToolConfig("vad_padding", v)}
                        recommended={0.3}
                    />
                    <p style={HELP_STYLE}>Reducing memory window decreases CPU lag. High aggression reduces false triggers on background noise.</p>
                </div>
            </div>

            <div style={{ display: "grid", gap: "1rem", border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "var(--radius)", background: "var(--bg-tertiary)" }}>
                <h6 style={{ margin: 0, fontSize: "0.875rem", color: "var(--brand-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Sparkles size={14} /> Post-Call Intelligence & Recording
                </h6>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "0.5rem" }}>
                    <ToggleField 
                        label="Enable Call Recording" 
                        hint="Automatically trigger LiveKit Egress for every session to capture audio playback." 
                        checked={form.toolsConfig?.auto_record ?? false} 
                        onChange={(v) => updateToolConfig("auto_record", v)} 
                    />
                    <ToggleField 
                        label="AI Sentiment Analysis" 
                        hint="Process transcripts post-call to extract citizen sentiment (Frustrated / Calm / Abusive)." 
                        checked={form.toolsConfig?.sentiment_analysis ?? false} 
                        onChange={(v) => updateToolConfig("sentiment_analysis", v)} 
                    />
                </div>
            </div>

            {/* --- Eligibility Gating Sections --- */}

            <div style={{ display: "grid", gap: "1rem", border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "var(--radius)", background: "var(--bg-tertiary)" }}>
                <h6 style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Volume2 size={14} /> Latency Masking (First Turn Filler)
                </h6>
                <p style={HELP_STYLE}>Upload a 1.5 to 2-second audio file (e.g., "Ji, main note kar rahi hoon") to mask the initial AI processing delay on the very first turn of the call.</p>
                <EligibilityAudioUploader 
                    label="FILLER AUDIO"
                    type="latency_masking"
                    agentId={(window as any).AGENT_ID}
                    rules={form.eligibilityRules || {}}
                    onUpdate={(newRules) => setForm({ ...form, eligibilityRules: newRules })}
                />
            </div>
            
            <div style={{ display: "grid", gap: "1rem", border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "var(--radius)", background: "var(--bg-tertiary)" }}>
                <h6 style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    🌍 Geographic Gating (Cities)
                </h6>
                <FormField label="Allowed Cities" hint="Comma-separated list (e.g. Lahore, Karachi). Leave blank to allow all.">
                    <input 
                        style={INPUT_STYLE} 
                        type="text" 
                        value={rawCities} 
                        placeholder="Lahore, Karachi"
                        onChange={(e) => setRawCities(e.target.value)}
                        onBlur={() => {
                            const cities = rawCities.split(",").map(val => val.trim()).filter(Boolean);
                            setForm({
                                ...form,
                                eligibilityRules: {
                                    ...form.eligibilityRules,
                                    allowedCities: cities
                                }
                            });
                        }}
                    />
                </FormField>
                <FormField label="City Apology Speech" hint="What Sarah says if the caller is in an unsupported city.">
                    <textarea 
                        style={{ ...INPUT_STYLE, resize: "vertical" }} 
                        rows={2} 
                        value={form.eligibilityRules?.cityApologyText || ""} 
                        placeholder="ہم اس وقت سروسز صرف لاہور میں دے رہے ہیں۔ آپ کی کال کا شکریہ۔" 
                        onChange={(e) => setForm({
                            ...form,
                            eligibilityRules: {
                                ...form.eligibilityRules,
                                cityApologyText: e.target.value
                            }
                        })} 
                    />
                </FormField>
                <EligibilityAudioUploader 
                    label="Upload City Apology Audio"
                    type="city"
                    agentId={(window as any).AGENT_ID}
                    rules={form.eligibilityRules || {}}
                    onUpdate={(newRules) => setForm({ ...form, eligibilityRules: newRules })}
                />
            </div>

            <div style={{ display: "grid", gap: "1rem", border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "var(--radius)", background: "var(--bg-tertiary)" }}>
                <h6 style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    🏘️ Geographic Gating (Societies & Areas)
                </h6>
                <FormField label="Excluded Areas / Societies" hint="Comma-separated list of blocked areas (e.g. Bahria Town, Askari 11).">
                    <input 
                        style={INPUT_STYLE} 
                        type="text" 
                        value={rawAreas} 
                        placeholder="Bahria Town, Askari 11"
                        onChange={(e) => setRawAreas(e.target.value)}
                        onBlur={() => {
                            const areas = rawAreas.split(",").map(val => val.trim()).filter(Boolean);
                            setForm({
                                ...form,
                                eligibilityRules: {
                                    ...form.eligibilityRules,
                                    excludedAreas: areas
                                }
                            });
                        }}
                    />
                </FormField>
                <FormField label="Area Apology Speech" hint="Prompted when a user mentions a blocked society.">
                    <textarea 
                        style={{ ...INPUT_STYLE, resize: "vertical" }} 
                        rows={2} 
                        value={form.eligibilityRules?.areaApologyText || ""} 
                        placeholder="ہم اس ایریا میں سروسز نہیں دیتے۔ آپ کی کال کا شکریہ۔" 
                        onChange={(e) => setForm({
                            ...form,
                            eligibilityRules: {
                                ...form.eligibilityRules,
                                areaApologyText: e.target.value
                            }
                        })} 
                    />
                </FormField>
                <EligibilityAudioUploader 
                    label="Upload Area Apology Audio"
                    type="area"
                    agentId={(window as any).AGENT_ID}
                    rules={form.eligibilityRules || {}}
                    onUpdate={(newRules) => setForm({ ...form, eligibilityRules: newRules })}
                />
            </div>

            <div style={{ display: "grid", gap: "1rem", border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "var(--radius)", background: "var(--bg-tertiary)" }}>
                <h6 style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    🏢 Property Type Gating (Commercial)
                </h6>
                <div style={{ padding: "0.5rem 0" }}>
                    <ToggleField 
                        label="Exclude Commercial Properties" 
                        hint="If enabled, Sarah will disqualify users requesting cleaning for shops/offices." 
                        checked={form.eligibilityRules?.excludeCommercial || false} 
                        onChange={(v) => setForm({
                            ...form,
                            eligibilityRules: {
                                ...form.eligibilityRules,
                                excludeCommercial: v
                            }
                        })} 
                    />
                </div>
                <FormField label="Commercial Apology Speech">
                    <textarea 
                        style={{ ...INPUT_STYLE, resize: "vertical" }} 
                        rows={2} 
                        value={form.eligibilityRules?.commercialApologyText || ""} 
                        placeholder="ہم معذرت خواہ ہیں، ہماری سروسز کمرشل ایریاز کے لیے نہیں ہیں۔" 
                        onChange={(e) => setForm({
                            ...form,
                            eligibilityRules: {
                                ...form.eligibilityRules,
                                commercialApologyText: e.target.value
                            }
                        })} 
                    />
                </FormField>
                <EligibilityAudioUploader 
                    label="Upload Commercial Apology Audio"
                    type="commercial"
                    agentId={(window as any).AGENT_ID}
                    rules={form.eligibilityRules || {}}
                    onUpdate={(newRules) => setForm({ ...form, eligibilityRules: newRules })}
                />
            </div>
        </div>
    );
}

function OutboundTab({ form, setForm }: { form: AgentFormState; setForm: (f: AgentFormState) => void }) {
    const set = <K extends keyof AgentFormState>(k: K, v: AgentFormState[K]) =>
        setForm({ ...form, [k]: v });

    return (
        <div style={{ display: "grid", gap: "1.25rem" }}>
            <div style={SECTION_TITLE_STYLE}><Zap size={13} /> Outbound Robocall Configuration</div>

            <div style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between",
                padding: "1rem", 
                borderRadius: "var(--radius)", 
                background: form.isOutboundActive ? "rgba(34, 197, 94, 0.1)" : "var(--bg-tertiary)",
                border: form.isOutboundActive ? "1px solid #22c55e" : "1px solid var(--border-color)",
                marginBottom: "1rem"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ 
                        width: 40, 
                        height: 24, 
                        background: form.isOutboundActive ? "#22c55e" : "#4b5563", 
                        borderRadius: 12, 
                        position: "relative", 
                        cursor: "pointer",
                        transition: "0.3s"
                    }} onClick={() => set("isOutboundActive", !form.isOutboundActive)}>
                        <div style={{ 
                            width: 18, 
                            height: 18, 
                            background: "white", 
                            borderRadius: "50%", 
                            position: "absolute", 
                            top: 3, 
                            left: form.isOutboundActive ? 19 : 3,
                            transition: "0.3s"
                        }} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)" }}>
                            Set as Active Outbound Agent
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                            Only one agent can be active for robocalls at a time.
                        </div>
                    </div>
                </div>
                {form.isOutboundActive && (
                    <div style={{ 
                        background: "#22c55e", 
                        color: "white", 
                        padding: "4px 8px", 
                        borderRadius: 4, 
                        fontSize: "0.7rem", 
                        fontWeight: 700,
                        letterSpacing: "0.5px"
                    }}>ACTIVE</div>
                )}
            </div>

            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                <div style={SECTION_TITLE_STYLE}><Cpu size={13} /> AI & Model Configuration</div>
                <p style={HELP_STYLE}>Configure the specific AI models Sarah uses for outbound feedback calls (independent of her inbound settings).</p>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                    <FormField label="Outbound STT Model" hint="Locked to Nova-2 General for maximum telephony stability.">
                        <SelectField value={form.outboundSttModel} onChange={(v) => set("outboundSttModel", v)}>
                            {(STT_MODELS.deepgram ?? []).map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </SelectField>
                    </FormField>

                    <FormField label="Outbound LLM Model">
                        <SelectField value={form.outboundLlmModel} onChange={(v) => set("outboundLlmModel", v)}>
                            {(LLM_MODELS.openai ?? []).map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </SelectField>
                    </FormField>
                </div>

                <div style={{ marginTop: "1.5rem" }}>
                    <SliderField
                        label="Outbound Temperature"
                        value={form.outboundLlmTemperature} min={0} max={1} step={0.05}
                        onChange={(v) => set("outboundLlmTemperature", v)}
                        recommended={0.5}
                    />
                </div>

                <div style={{ marginTop: "1.25rem" }}>
                    <FormField label="Outbound Voice ID (Uplift AI)" hint="Specific Voice ID for feedback calls (e.g., v_meklc281 for Sarah).">
                        <input
                            style={INPUT_STYLE}
                            type="text"
                            value={form.outboundTtsVoiceId}
                            placeholder="v_meklc281"
                            onChange={(e) => set("outboundTtsVoiceId", e.target.value)}
                        />
                    </FormField>
                </div>

                <TtsVocabularySync 
                    agentId={form.id || (window as any).AGENT_ID} 
                    defaultMasterId={form.outboundTtsDictionaryId || ""}
                    onMasterIdChange={(val: string) => set("outboundTtsDictionaryId", val as any)}
                />

                <div style={{ 
                    marginTop: "1.5rem", 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "0.75rem",
                    padding: "0.75rem",
                    background: "var(--bg-secondary)",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border-color)"
                }}>
                    <div style={{ 
                        width: 40, 
                        height: 24, 
                        background: form.bypassOutboundDictionary ? "#22c55e" : "#4b5563", 
                        borderRadius: 12, 
                        position: "relative", 
                        cursor: "pointer",
                        transition: "0.3s",
                        flexShrink: 0
                    }} onClick={() => set("bypassOutboundDictionary", !form.bypassOutboundDictionary)}>
                        <div style={{ 
                            width: 18, 
                            height: 18, 
                            background: "white", 
                            borderRadius: "50%", 
                            position: "absolute", 
                            top: 3, 
                            left: form.bypassOutboundDictionary ? 19 : 3,
                            transition: "0.3s"
                        }} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            Bypass Uplift Custom Dictionary
                            {form.bypassOutboundDictionary && (
                                <span style={{ 
                                    background: "#22c55e20", 
                                    color: "#22c55e", 
                                    padding: "2px 6px", 
                                    borderRadius: 4, 
                                    fontSize: "0.65rem", 
                                    fontWeight: 700 
                                }}>BYPASS ACTIVE</span>
                            )}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "2px" }}>
                            If toggled ON, Sarah will ignore the Dictionary ID above and use her pure, native Urdu pronunciation. Use this to quickly troubleshoot pronunciation issues without deleting your Dictionary link.
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="alert alert-info">
                <Info size={14} style={{ flexShrink: 0 }} />
                <span>
                    <strong>Dynamic Context:</strong> Use <code style={{ background: "var(--bg-secondary)", padding: "0 3px", borderRadius: 3 }}>{'{ticket_id}'}</code>, <code style={{ background: "var(--bg-secondary)", padding: "0 3px", borderRadius: 3 }}>{'{citizen_name}'}</code>, and <code style={{ background: "var(--bg-secondary)", padding: "0 3px", borderRadius: 3 }}>{'{issue_type}'}</code> placeholders. Sarah will automatically replace them with real data at runtime.
                </span>
            </div>

            <div style={{ display: "grid", gap: "1rem", border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "var(--radius)", background: "var(--bg-tertiary)" }}>
                <h6 style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-primary)" }}>🎙️ Initial Outbound Greeting</h6>
                <FormField label="Greeting Text (Urdu/Punjabi)" hint="What Sarah says first when the citizen answers. Use {citizen_name} for personalization.">
                    <textarea 
                        style={{ ...INPUT_STYLE, resize: "vertical" }} 
                        rows={3} 
                        value={form.outboundGreetingText} 
                        placeholder="Assalam-o-Alaikum {citizen_name}, main Punjab Helpline se Sarah baat kar rahi hoon. Kya meri baat {citizen_name} se ho rahi hai?" 
                        onChange={(e) => set("outboundGreetingText", e.target.value)} 
                        dir="auto"
                    />
                </FormField>
                <AudioUploader 
                    label="Greeting Audio (.wav)" 
                    hint="Professional record of Sarah's first contact message."
                    value={form.outboundGreetingWav}
                    type="greeting"
                    agentId={(window as any).AGENT_ID}
                    onUpload={(url) => set("outboundGreetingWav", url)}
                    onDelete={() => set("outboundGreetingWav", "")}
                />
            </div>

            <div style={{ display: "grid", gap: "1rem", border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "var(--radius)", background: "var(--bg-tertiary)" }}>
                <h6 style={{ margin: 0, fontSize: "0.875rem", color: "var(--brand-primary)" }}>✅ Resolution Verified (If Citizen presses 1)</h6>
                <FormField label="Success Message" hint="What Sarah says if the citizen confirms the issue is resolved.">
                    <textarea 
                        style={{ ...INPUT_STYLE, resize: "vertical" }} 
                        rows={2} 
                        value={form.resolvedFarewellText} 
                        placeholder="Ap ki tasdeeq ka shukriya. Allah Hafiz!" 
                        onChange={(e) => set("resolvedFarewellText", e.target.value)} 
                        dir="auto"
                    />
                </FormField>
                <AudioUploader 
                    label="Resolved Farewell (.wav)" 
                    hint="Audio played when the citizen confirms resolution."
                    value={form.resolvedFarewellWav}
                    type="resolved"
                    agentId={(window as any).AGENT_ID}
                    onUpload={(url) => set("resolvedFarewellWav", url)}
                    onDelete={() => set("resolvedFarewellWav", "")}
                />
            </div>

            <div style={{ display: "grid", gap: "1rem", border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "var(--radius)", background: "var(--bg-tertiary)" }}>
                <h6 style={{ margin: 0, fontSize: "0.875rem", color: "var(--danger)" }}>🔴 Issue Unresolved (If Citizen presses 2)</h6>
                <FormField label="Escalation Message" hint="What Sarah says if the citizen reports the issue is still NOT fixed.">
                    <textarea 
                        style={{ ...INPUT_STYLE, resize: "vertical" }} 
                        rows={2} 
                        value={form.unresolvedFarewellText} 
                        placeholder="Maaf kijiyega. Hum ne apki shikayat {ticket_id} ko dobara open kar diya hai. Allah Hafiz." 
                        onChange={(e) => set("unresolvedFarewellText", e.target.value)} 
                        dir="auto"
                    />
                </FormField>
                <AudioUploader 
                    label="Escalation Audio (.wav)" 
                    hint="Audio played when the citizen reports the issue is still active."
                    value={form.unresolvedFarewellWav}
                    type="unresolved"
                    agentId={(window as any).AGENT_ID}
                    onUpload={(url) => set("unresolvedFarewellWav", url)}
                    onDelete={() => set("unresolvedFarewellWav", "")}
                />
            </div>

            <div style={{ display: "grid", gap: "1rem", border: "1px solid rgba(234,179,8,0.3)", padding: "1rem", borderRadius: "var(--radius)", background: "rgba(234,179,8,0.05)" }}>
                <h6 style={{ margin: 0, fontSize: "0.875rem", color: "#eab308" }}>🔔 Silence Watchdog Nudge (No Response)</h6>
                <FormField label="Nudge Text (Urdu/Punjabi)" hint="What Sarah says when no response is heard for 12 seconds. Write in Urdu script for best pronunciation.">
                    <textarea 
                        style={{ ...INPUT_STYLE, resize: "vertical" }} 
                        rows={2} 
                        value={form.outboundWatchdogNudgeText} 
                        placeholder="کیا آپ وہاں موجود ہیں؟ براہ کرم اپنا جواب دیں۔ اگر مسئلہ حل ہو گیا ہے تو 1 دبائیں، اگر نہیں تو 2 دبائیں۔" 
                        onChange={(e) => set("outboundWatchdogNudgeText", e.target.value)} 
                        dir="auto"
                    />
                </FormField>
            </div>

            <div style={{ display: "grid", gap: "1rem", border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "var(--radius)", background: "var(--bg-tertiary)" }}>
                <h6 style={{ margin: 0, fontSize: "0.875rem", color: "var(--brand-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Settings2 size={14} /> ⚙️ Robocall Governance
                </h6>
                <p style={HELP_STYLE}>Control batching, retry behavior, and legal operating windows (PKT Timezone).</p>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                    <FormField label="Batch Limit" hint="Max simultaneous calls">
                        <input 
                            style={INPUT_STYLE} 
                            type="number" 
                            value={form.outboundBatchLimit} 
                            onChange={(e) => set("outboundBatchLimit", parseInt(e.target.value) || 0)} 
                        />
                    </FormField>
                    <FormField label="Retry Interval (Mins)" hint="Cooldown after failure">
                        <input 
                            style={INPUT_STYLE} 
                            type="number" 
                            value={form.outboundRetryInterval} 
                            onChange={(e) => set("outboundRetryInterval", parseInt(e.target.value) || 0)} 
                        />
                    </FormField>
                    <FormField label="Max Attempts" hint="Limit per ticket">
                        <input 
                            style={INPUT_STYLE} 
                            type="number" 
                            value={form.outboundMaxRetries} 
                            onChange={(e) => set("outboundMaxRetries", parseInt(e.target.value) || 0)} 
                        />
                    </FormField>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "0.5rem" }}>
                    <FormField label="Allowed Start (PKT)" hint="Earliest call time">
                        <input 
                            style={{ ...INPUT_STYLE, cursor: "pointer" }} 
                            type="time" 
                            value={form.outboundAllowedStart} 
                            onChange={(e) => set("outboundAllowedStart", e.target.value)} 
                        />
                    </FormField>
                    <FormField label="Allowed End (PKT)" hint="Latest call time">
                        <input 
                            style={{ ...INPUT_STYLE, cursor: "pointer" }} 
                            type="time" 
                            value={form.outboundAllowedEnd} 
                            onChange={(e) => set("outboundAllowedEnd", e.target.value)} 
                        />
                    </FormField>
                </div>

                <div style={{ marginTop: "0.5rem", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                    <ToggleField 
                        label="Bypass Time Restrictions" 
                        hint="If enabled, Sarah will dispatch calls immediately, ignoring the Allowed Start/End PKT operating hours. Use only for testing."
                        checked={form.bypassOperatingHours} 
                        onChange={(v) => set("bypassOperatingHours", v)} 
                    />
                </div>
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
    { id: "outbound", label: "Outbound Robocall", icon: <Zap size={13} /> },
    { id: "advanced", label: "Advanced", icon: <Settings2 size={13} /> },
];

export default function EditAgentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: agentId } = use(params);
    if (typeof window !== "undefined") {
        (window as any).AGENT_ID = agentId;
    }
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>("identity");
    const [form, setForm] = useState<AgentFormState>(DEFAULT_STATE);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAgent() {
            try {
                const res = await fetch(`/api/agents/${agentId}`);
                const data = await res.json();
                if (res.ok && data.agent) {
                    // Merge with defaults to handle nulls from DB/Redis
                    const sanitizedAgent = { ...DEFAULT_STATE };
                    for (const key in data.agent) {
                        if (data.agent[key] !== null && data.agent[key] !== undefined) {
                            (sanitizedAgent as any)[key] = data.agent[key];
                        }
                    }
                    setForm(sanitizedAgent);
                } else {
                    setSubmitError(data.error || "Failed to load agent");
                }
            } catch (err) {
                setSubmitError("Network error while loading agent.");
            } finally {
                setLoading(false);
            }
        }
        fetchAgent();
    }, [agentId]);

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
            const res = await fetch(`/api/agents/${agentId}`, {
                method: "PATCH",
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

    if (loading) {
        return (
            <div className="flex flex-col h-full bg-[var(--bg-primary)] items-center justify-center">
                <div className="text-gray-400 flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin"></div>
                    <p>Loading Agent Configuration...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <TopBar
                title={`Edit Agent: ${form.name || form.slug}`}
                subtitle="Configure AI voice agent for Global Access AI Engine"
            />

            <main className="page-content">
                <form onSubmit={handleSubmit}>
                    <div className="card">
                        {/* Card Header */}
                        <div className="card-header">
                            <h5 className="card-title"><Settings2 size={16} /> Edit Configuration</h5>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <Link href="/agents" className="btn btn-secondary btn-sm">Cancel</Link>
                                <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                                    <Save size={13} />
                                    {submitting ? "Saving…" : "Save Changes"}
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
                            {activeTab === "behavior" && <BehaviorTab form={form} setForm={setForm} />}
                            {activeTab === "stt" && <SttTab form={form} setForm={setForm} />}
                            {activeTab === "tts" && <TtsTab form={form} setForm={setForm} />}
                            {activeTab === "tools" && <ToolsTab form={form} setForm={setForm} />}
                            {activeTab === "outbound" && <OutboundTab form={form} setForm={setForm} />}
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
                                    <Save size={13} /> {submitting ? "Saving…" : "Save Changes"}
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
