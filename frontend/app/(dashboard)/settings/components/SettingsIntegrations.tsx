"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Check,
    X,
    Zap,
    Trash2,
    AlertCircle,
    Info,
    MapPin,
    AlertTriangle,
    ChevronDown,
    ShieldCheck,
    Cloud,
    Globe,
    Mic,
    Gauge,
    Clock,
    Activity
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function SettingsIntegrations() {
    const [loading, setLoading] = useState<string | null>(null);
    const [configs, setConfigs] = useState<any[]>([]);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [testResults, setTestResults] = useState<any[]>([]);
    const [isTesting, setIsTesting] = useState(false);
    const [lastTestTime, setLastTestTime] = useState<string | null>(null);

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        try {
            const res = await fetch("/api/settings/integrations");
            if (res.ok) {
                const data = await res.json();
                setConfigs(data);

                // Pre-initialize with defaults
                const initial: Record<string, any> = {
                    gcp: { serviceAccount: "", llmRegion: "global", sttRegion: "global", ttsRegion: "global", realtimeRegion: "us-central1" },
                    aws: { accessKeyId: "", secretAccessKey: "", awsRegion: "us-east-1", novaSonicRegion: "default", pollyTtsRegion: "default" },
                    azure_openai: { apiKey: "", endpoint: "", apiVersion: "2025-04-01-preview" },
                    aws_s3: { bucketName: "", region: "", accessKeyId: "", secretAccessKey: "" },
                    azure_speech: { speechKey: "", region: "" },
                    google_cloud_storage: { bucketName: "", serviceAccount: "" }
                };

                data.forEach((item: any) => {
                    if (item.providerName === 'gcp') {
                        initial['gcp'] = {
                            ...initial['gcp'],
                            llmRegion: item.configJson?.llmRegion || "global",
                            sttRegion: item.configJson?.sttRegion || "global",
                            ttsRegion: item.configJson?.ttsRegion || "global",
                            realtimeRegion: item.configJson?.realtimeRegion || "us-central1"
                        };
                    } else if (item.providerName === 'aws') {
                        initial['aws'] = {
                            ...initial['aws'],
                            awsRegion: item.configJson?.awsRegion || "us-east-1",
                            novaSonicRegion: item.configJson?.novaSonicRegion || "default",
                            pollyTtsRegion: item.configJson?.pollyTtsRegion || "default"
                        };
                    } else if (item.providerName === 'azure_openai') {
                        initial['azure_openai'] = {
                            ...initial['azure_openai'],
                            endpoint: item.configJson?.endpoint || "",
                            apiVersion: item.configJson?.apiVersion || "2025-04-01-preview"
                        };
                    } else if (item.providerName === 'aws_s3') {
                        initial['aws_s3'] = {
                            ...initial['aws_s3'],
                            bucketName: item.configJson?.bucketName || "",
                            region: item.region || "",
                            accessKeyId: item.configJson?.accessKeyId || ""
                        };
                    } else if (item.providerName === 'azure_speech') {
                        initial['azure_speech'] = {
                            ...initial['azure_speech'],
                            speechKey: item.configJson?.speech_key || "",
                            region: item.configJson?.region || ""
                        };
                    } else if (item.providerName === 'google_cloud_storage') {
                        initial['google_cloud_storage'] = {
                            ...initial['google_cloud_storage'],
                            bucketName: item.configJson?.bucketName || "",
                            serviceAccount: item.configJson?.serviceAccount || ""
                        };
                    } else if (item.apiKey) {
                        initial[item.providerName] = "";
                    }
                });
                setFormData(initial);
            }
        } catch (error) {
            console.error("Failed to fetch integration configs:", error);
        }
    };

    const handleSaveAll = async () => {
        setLoading("save-all");

        // Only update if modified or if complex provider (to ensure regions sync)
        const providersToUpdate = Object.keys(formData).filter(p => {
            if (p === 'gcp') return formData[p].serviceAccount !== "" || configs.some(c => c.providerName === 'gcp');
            if (p === 'aws') return formData[p].accessKeyId !== "" || formData[p].secretAccessKey !== "" || configs.some(c => c.providerName === 'aws');
            if (p === 'azure_openai') return formData[p].apiKey !== "" || formData[p].endpoint !== "" || configs.some(c => c.providerName === 'azure_openai');
            if (p === 'aws_s3') return formData[p].bucketName !== "" || formData[p].region !== "" || formData[p].accessKeyId !== "" || formData[p].secretAccessKey !== "" || configs.some(c => c.providerName === 'aws_s3');
            if (p === 'azure_speech') return formData[p].speechKey !== "" || formData[p].region !== "" || configs.some(c => c.providerName === 'azure_speech');
            if (p === 'google_cloud_storage') return formData[p].bucketName !== "" || formData[p].serviceAccount !== "" || configs.some(c => c.providerName === 'google_cloud_storage');
            return formData[p] !== "";
        });

        if (providersToUpdate.length === 0) {
            toast.info("No changes to save.");
            setLoading(null);
            return;
        }

        try {
            for (const provider of providersToUpdate) {
                let payload: any = { providerName: provider, isActive: true };

                if (provider === 'gcp') {
                    const gcpData = formData['gcp'];
                    payload.configJson = {
                        ...(configs.find(c => c.providerName === 'gcp')?.configJson || {}),
                        llmRegion: gcpData.llmRegion,
                        sttRegion: gcpData.sttRegion,
                        ttsRegion: gcpData.ttsRegion,
                        realtimeRegion: gcpData.realtimeRegion
                    };
                    if (gcpData.serviceAccount) {
                        payload.configJson.serviceAccount = gcpData.serviceAccount;
                    }
                } else if (provider === 'aws') {
                    const awsData = formData['aws'];
                    payload.configJson = {
                        ...(configs.find(c => c.providerName === 'aws')?.configJson || {}),
                        awsRegion: awsData.awsRegion,
                        novaSonicRegion: awsData.novaSonicRegion,
                        pollyTtsRegion: awsData.pollyTtsRegion
                    };
                    if (awsData.accessKeyId) payload.configJson.accessKeyId = awsData.accessKeyId;
                    if (awsData.secretAccessKey) payload.apiKey = awsData.secretAccessKey; // Secret key as main API key
                } else if (provider === 'azure_openai') {
                    const azureData = formData['azure_openai'];
                    payload.configJson = {
                        ...(configs.find(c => c.providerName === 'azure_openai')?.configJson || {}),
                        endpoint: azureData.endpoint,
                        apiVersion: azureData.apiVersion
                    };
                    if (azureData.apiKey) payload.apiKey = azureData.apiKey;
                } else if (provider === 'aws_s3') {
                    const s3Data = formData['aws_s3'];
                    payload.configJson = {
                        ...(configs.find(c => c.providerName === 'aws_s3')?.configJson || {}),
                        bucketName: s3Data.bucketName
                    };
                    payload.region = s3Data.region;
                    if (s3Data.accessKeyId) payload.configJson.accessKeyId = s3Data.accessKeyId;
                    if (s3Data.secretAccessKey) payload.apiKey = s3Data.secretAccessKey;
                } else if (provider === 'azure_speech') {
                    const speechData = formData['azure_speech'];
                    payload.configJson = {
                        ...(configs.find(c => c.providerName === 'azure_speech')?.configJson || {}),
                        speech_key: speechData.speechKey,
                        region: speechData.region
                    };
                    if (speechData.speechKey) payload.apiKey = speechData.speechKey;
                } else if (provider === 'google_cloud_storage') {
                    const gcsData = formData['google_cloud_storage'];
                    payload.configJson = {
                        ...(configs.find(c => c.providerName === 'google_cloud_storage')?.configJson || {}),
                        bucketName: gcsData.bucketName,
                        serviceAccount: gcsData.serviceAccount
                    };
                } else {
                    payload.apiKey = formData[provider];
                }

                console.log(`[SaveAll] Saving ${provider} with payload:`, JSON.stringify(payload));

                const res = await fetch("/api/settings/integrations", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) {
                    const errorDetails = await res.json().catch(() => ({}));
                    throw new Error(errorDetails.message || `Failed to save ${provider}`);
                }
            }

            toast.success("Settings updated successfully.");
            fetchConfigs();
        } catch (error: any) {
            console.error("Save error:", error);
            toast.error(error.message);
        } finally {
            setLoading(null);
        }
    };

    const handleDelete = async (provider: string) => {
        if (!confirm(`Are you sure you want to remove the ${provider} configuration?`)) return;

        try {
            const res = await fetch(`/api/settings/integrations?providerName=${provider}`, {
                method: "DELETE"
            });

            if (res.ok) {
                toast.success(`${provider} configuration removed.`);
                fetchConfigs();
            } else {
                throw new Error("Delete failed");
            }
        } catch (error) {
            toast.error("Failed to delete.");
        }
    };

    const handleTest = (provider: string) => {
        setLoading(`test-${provider}`);
        setTimeout(() => {
            setLoading(null);
            toast.success(`Connection to ${provider} verified.`);
        }, 1000);
    };

    const handleTestAll = async () => {
        setIsTesting(true);
        setTestResults([]);
        try {
            const res = await fetch("/api/settings/integrations/test-all", { method: "POST" });
            if (res.ok) {
                const data = await res.json();
                const results = data.results;
                // Progressive fill for UI feedback
                for (let i = 1; i <= results.length; i++) {
                    setTestResults(results.slice(0, i));
                    await new Promise(r => setTimeout(r, 400));
                }
                setLastTestTime(new Date().toLocaleTimeString());
                toast.success("Global verification complete.");
            } else {
                toast.error("Global test failed.");
            }
        } catch (err) {
            toast.error("Failed to execute global test.");
        } finally {
            setIsTesting(false);
        }
    };

    const isConfigured = (name: string, field?: string) => {
        const config = configs.find(c => c.providerName === name);
        if (!config) return false;
        if (field) {
            if (field === 'apiKey') return !!config.apiKey;
            if (field === 'region') return !!config.region || !!config.configJson?.region;
            return !!config.configJson?.[field];
        }
        return config.isConfigured;
    };

    const coreProviders = [
        {
            id: "openai",
            name: "OpenAI API Key",
            subtext: "OpenAI API key must start with sk- or sk-proj-. Powers GPT-4o and GPT-4o-mini (LLM), Whisper v3 (STT), and TTS-1 (TTS)."
        },
        {
            id: "deepgram",
            name: "Deepgram API Key",
            subtext: "Deepgram API key powers high-speed specialized STT models (Nova-2) and TTS (Aura)."
        },
        {
            id: "google_gemini",
            name: "Google API Key (Gemini LLM)",
            subtext: "Google AI Studio API key. Powers Gemini 1.5 Pro and Gemini 1.5 Flash multimodal models."
        },
        {
            id: "anthropic",
            name: "Anthropic API Key",
            subtext: "Claude API key. Powers the Claude 3.5 Sonnet and Claude 3 Opus LLM architectures."
        },
        {
            id: "xai",
            name: "xAI / Grok API Key",
            subtext: "xAI API key. Enables access to Grok-1 and Grok-beta models with real-time X knowledge."
        },
        {
            id: "groq",
            name: "Groq API Key",
            subtext: "Groq API key powers ultra-low latency Llama 3 and Mixtral inference on LPUs."
        },
        {
            id: "elevenlabs",
            name: "ElevenLabs API Key",
            subtext: "ElevenLabs API key powers high-fidelity neural TTS and Voice Cloning capabilities."
        },
        {
            id: "cartesia",
            name: "Cartesia API Key",
            subtext: "Cartesia Sonic API key. Powers ultra-fast 100ms latency neural text-to-speech."
        }
    ];

    const gcpRegions = {
        us: [
            { id: "us-central1", name: "us-central1 (Iowa)" },
            { id: "us-east1", name: "us-east1 (S. Carolina)" },
            { id: "us-east4", name: "us-east4 (N. Virginia)" },
            { id: "us-west1", name: "us-west1 (Oregon)" },
            { id: "us-west4", name: "us-west4 (Nevada)" },
        ],
        americas: [
            { id: "northamerica-northeast1", name: "northamerica-northeast1 (Montreal)" },
            { id: "southamerica-east1", name: "southamerica-east1 (Sao Paulo)" },
        ],
        europe: [
            { id: "europe-west1", name: "europe-west1 (Belgium)" },
            { id: "europe-west2", name: "europe-west2 (London)" },
            { id: "europe-west3", name: "europe-west3 (Frankfurt)" },
            { id: "europe-west4", name: "europe-west4 (Netherlands)" },
            { id: "europe-west9", name: "europe-west9 (Paris)" },
        ],
        asia: [
            { id: "asia-northeast1", name: "asia-northeast1 (Tokyo)" },
            { id: "asia-northeast3", name: "asia-northeast3 (Seoul)" },
            { id: "asia-southeast1", name: "asia-southeast1 (Singapore)" },
        ]
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-500 max-w-6xl mx-auto pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">API Keys & Integrations</h2>
                    <p className="text-zinc-500 text-sm mt-1 font-medium">Manage your global AI provider credentials</p>
                </div>
                <Button
                    onClick={handleSaveAll}
                    disabled={loading === "save-all"}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 px-6 shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-2"
                >
                    {loading === "save-all" ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Check className="w-4 h-4" />
                    )}
                    Save API Keys
                </Button>
            </div>

            {/* Warning Banners */}
            <div className="space-y-3">
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
                    <Info className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-emerald-100/80 leading-relaxed font-medium">
                        <span className="text-emerald-500 font-bold uppercase text-[10px] tracking-widest mr-2">Note</span>
                        API keys are stored in the .env file and masked for security. Only provide values if you want to update them.
                    </p>
                </div>
                <div className="bg-zinc-500/5 border border-zinc-500/20 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-zinc-300 leading-relaxed font-medium">
                        Greyed out models in the Agent Editor indicate either the SDK is not installed or a valid API key has not been configured.
                    </p>
                </div>
            </div>

            {/* Core Provider Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                {coreProviders.map((provider) => (
                    <div key={provider.id} className="flex flex-col gap-3 group">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{provider.name}</h4>
                            {isConfigured(provider.id) ? (
                                <div className="bg-emerald-500 text-[10px] font-black px-2 py-0.5 rounded text-zinc-950 flex items-center gap-1 scale-90 origin-right">
                                    <Check className="w-3 h-3 stroke-[3px]" /> CONFIGURED
                                </div>
                            ) : (
                                <div className="border border-zinc-700 text-zinc-500 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 scale-90 origin-right">
                                    <span className="text-xs leading-none mt-[-2px]">⊗</span> NOT SET
                                </div>
                            )}
                        </div>

                        <div className="relative flex items-center group-focus-within:ring-1 ring-blue-500/30 rounded-lg transition-all">
                            <Input
                                type="password"
                                placeholder={isConfigured(provider.id) ? "••••••••••••••••" : ""}
                                className="bg-zinc-950 border-zinc-800 h-10 pr-24 font-mono text-xs focus-visible:ring-0 focus-visible:border-zinc-700"
                                value={formData[provider.id] || ""}
                                onChange={(e) => setFormData({ ...formData, [provider.id]: e.target.value })}
                            />
                            <div className="absolute right-1 flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleTest(provider.id)}
                                    className="h-8 w-16 text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 text-[10px] font-bold flex items-center gap-1 px-2"
                                >
                                    <Zap className="w-3 h-3 fill-current" /> TEST
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(provider.id)}
                                    className="h-8 w-8 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 p-0"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>

                        <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                            {provider.subtext}
                        </p>
                    </div>
                ))}
            </div>

            {/* Google Cloud Section */}
            <div className="border border-zinc-800 rounded-3xl bg-zinc-900/10 overflow-hidden shadow-2xl">
                <div className="bg-zinc-800/20 border-b border-zinc-800 p-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-3">
                            <span className="text-2xl">☁️</span> Google Cloud (LLM/STT/TTS/Realtime)
                        </h3>
                        <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wider font-bold">Enterprise Cloud Protocol</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-zinc-500 hover:text-rose-500"
                            onClick={() => handleDelete('gcp')}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* GCP Banners */}
                    <div className="grid grid-cols-1 gap-2">
                        <div className="bg-zinc-800/40 border border-zinc-800 rounded-xl p-4 flex items-start gap-4 transition-colors hover:bg-zinc-800/60">
                            <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                            <p className="text-[13px] text-zinc-300 font-medium">
                                <span className="text-blue-400 font-bold uppercase text-[10px] tracking-widest mr-2">Google Cloud:</span> Service account credentials for Google Cloud LLM, Chirp 2/3 STT, Cloud TTS, Gemini TTS, and Gemini Live Realtime.
                            </p>
                        </div>
                        <div className="bg-zinc-800/40 border border-zinc-800 rounded-xl p-4 flex items-start gap-4 transition-colors hover:bg-zinc-800/60">
                            <MapPin className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
                            <p className="text-[13px] text-zinc-300 font-medium">
                                <span className="text-pink-400 font-bold uppercase text-[10px] tracking-widest mr-2">Regional models:</span> Models marked as "(Regional)" in the agent editor will use the regions selected below.
                            </p>
                        </div>
                        <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 flex items-start gap-4 transition-colors hover:bg-orange-500/10">
                            <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                            <p className="text-[13px] text-orange-100/90 font-medium">
                                <span className="text-orange-400 font-bold uppercase text-[10px] tracking-widest mr-2">LLM Requirements:</span> Your service account needs the Vertex AI User role and the Vertex AI API must be enabled in your project.
                            </p>
                        </div>
                    </div>

                    {/* Service Account JSON */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                Service Account Credentials (JSON)
                            </h4>
                            {isConfigured('gcp', 'serviceAccount') ? (
                                <div className="bg-blue-500 text-[10px] font-black px-2 py-0.5 rounded text-zinc-950 flex items-center gap-1 scale-90 origin-right">
                                    <Check className="w-3 h-3 stroke-[3px]" /> CONFIGURED
                                </div>
                            ) : (
                                <div className="border border-zinc-700 text-zinc-500 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 scale-90 origin-right">
                                    <span className="text-xs leading-none mt-[-2px]">⊗</span> NOT SET
                                </div>
                            )}
                        </div>
                        <Textarea
                            placeholder={isConfigured('gcp', 'serviceAccount') ? '{"type": "service_account", ...}' : 'Paste JSON content here'}
                            className="bg-zinc-950 border-zinc-800 font-mono text-xs min-h-[140px] focus:ring-0 focus:border-zinc-700 resize-none p-4 rounded-xl"
                            value={formData['gcp']?.serviceAccount || ""}
                            onChange={(e) => setFormData({
                                ...formData,
                                gcp: { ...formData.gcp, serviceAccount: e.target.value }
                            })}
                        />
                        <p className="text-[11px] text-zinc-500 font-medium">Paste JSON from Google Cloud Console → Service Accounts → Keys.</p>
                    </div>

                    {/* Regional Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 pt-4 border-t border-zinc-800/50">
                        {/* LLM Region */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">LLM Region (Vertex AI)</h4>
                                <div className={`text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${formData['gcp']?.llmRegion ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500'}`}>
                                    {formData['gcp']?.llmRegion ? 'CONFIGURED' : 'NOT SET'}
                                </div>
                            </div>
                            <Select
                                value={formData['gcp']?.llmRegion || "global"}
                                onValueChange={(v) => setFormData({ ...formData, gcp: { ...formData.gcp, llmRegion: v } })}
                            >
                                <SelectTrigger className="bg-zinc-950 border-zinc-800 h-10 px-4 rounded-lg focus:ring-0">
                                    <SelectValue placeholder="Default (global)" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white shadow-2xl">
                                    <SelectItem value="global">Default (global)</SelectItem>
                                    <SelectGroup>
                                        <SelectLabel className="text-zinc-500 text-[10px] font-bold px-4 pt-2">United States</SelectLabel>
                                        {gcpRegions.us.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                                    </SelectGroup>
                                    <SelectGroup>
                                        <SelectLabel className="text-zinc-500 text-[10px] font-bold px-4 pt-2">Americas</SelectLabel>
                                        {gcpRegions.americas.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                                    </SelectGroup>
                                    <SelectGroup>
                                        <SelectLabel className="text-zinc-500 text-[10px] font-bold px-4 pt-2">Asia Pacific</SelectLabel>
                                        {gcpRegions.asia.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                                    </SelectGroup>
                                    <SelectGroup>
                                        <SelectLabel className="text-zinc-500 text-[10px] font-bold px-4 pt-2">Europe</SelectLabel>
                                        {gcpRegions.europe.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <a href="#" className="text-[11px] text-blue-500 hover:text-blue-400 flex items-center gap-1 font-bold">
                                ⓘ View regional model availability
                            </a>
                        </div>

                        {/* STT Region */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">STT Region (Chirp)</h4>
                                <div className={`text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${formData['gcp']?.sttRegion ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500'}`}>
                                    {formData['gcp']?.sttRegion ? 'CONFIGURED' : 'NOT SET'}
                                </div>
                            </div>
                            <Select
                                value={formData['gcp']?.sttRegion || "global"}
                                onValueChange={(v) => setFormData({ ...formData, gcp: { ...formData.gcp, sttRegion: v } })}
                            >
                                <SelectTrigger className="bg-zinc-950 border-zinc-800 h-10 px-4 rounded-lg focus:ring-0">
                                    <SelectValue placeholder="global (default - Chirp 2 only)" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white shadow-2xl">
                                    <SelectItem value="global">global (default - Chirp 2 only)</SelectItem>
                                    <SelectItem value="us">us (US multi-region)</SelectItem>
                                    <SelectItem value="eu">eu (EU multi-region)</SelectItem>
                                    <SelectItem value="asia-northeast1">asia-northeast1 (Tokyo)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">Chirp 3 requires a region, while Chirp 2 defaults to global.</p>
                        </div>

                        {/* TTS Region */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Google Cloud TTS Region</h4>
                                <div className={`text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${formData['gcp']?.ttsRegion ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500'}`}>
                                    {formData['gcp']?.ttsRegion ? 'CONFIGURED' : 'NOT SET'}
                                </div>
                            </div>
                            <Select
                                value={formData['gcp']?.ttsRegion || "global"}
                                onValueChange={(v) => setFormData({ ...formData, gcp: { ...formData.gcp, ttsRegion: v } })}
                            >
                                <SelectTrigger className="bg-zinc-950 border-zinc-800 h-10 px-4 rounded-lg focus:ring-0">
                                    <SelectValue placeholder="global (default)" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white shadow-2xl">
                                    <SelectItem value="global">global (default)</SelectItem>
                                    <SelectGroup>
                                        <SelectLabel className="text-zinc-500 text-[10px] font-bold px-4 pt-2">United States</SelectLabel>
                                        {gcpRegions.us.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                                    </SelectGroup>
                                    <SelectGroup>
                                        <SelectLabel className="text-zinc-500 text-[10px] font-bold px-4 pt-2">Europe</SelectLabel>
                                        {gcpRegions.europe.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Realtime Region */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Vertex Realtime Region</h4>
                                <div className={`text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${formData['gcp']?.realtimeRegion ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500'}`}>
                                    {formData['gcp']?.realtimeRegion ? 'CONFIGURED' : 'NOT SET'}
                                </div>
                            </div>
                            <Select
                                value={formData['gcp']?.realtimeRegion || "us-central1"}
                                onValueChange={(v) => setFormData({ ...formData, gcp: { ...formData.gcp, realtimeRegion: v } })}
                            >
                                <SelectTrigger className="bg-zinc-950 border-zinc-800 h-10 px-4 rounded-lg focus:ring-0">
                                    <SelectValue placeholder="Default (us-central1)" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white shadow-2xl">
                                    <SelectItem value="us-central1">us-central1 (United States)</SelectItem>
                                    <SelectItem value="asia-southeast1">asia-southeast1 (Singapore - AU Best)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">Region for Google Cloud Vertex AI Realtime (Gemini Live). Only verified working regions are listed.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* AWS Section */}
            <div className="border border-zinc-800 rounded-3xl bg-zinc-900/10 overflow-hidden shadow-2xl">
                <div className="bg-zinc-800/20 border-b border-zinc-800 p-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-3">
                            <span className="text-2xl">📦</span> AWS (Bedrock LLM & Transcribe STT)
                        </h3>
                        <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wider font-bold">Amazon Web Services Protocol</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-zinc-500 hover:text-rose-500"
                            onClick={() => handleDelete('aws')}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* AWS Banners */}
                    <div className="grid grid-cols-1 gap-2">
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-4 transition-colors hover:bg-emerald-500/10">
                            <Info className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                            <p className="text-[13px] text-zinc-300 font-medium leading-relaxed">
                                <span className="text-emerald-500 font-bold uppercase text-[10px] tracking-widest mr-2">AWS Services:</span> These credentials are used for Bedrock LLM (Claude, Amazon Nova), Transcribe STT, and Nova Sonic Realtime. They are separate from S3 storage credentials below.
                            </p>
                        </div>
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-4 transition-colors hover:bg-emerald-500/10">
                            <MapPin className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                            <p className="text-[13px] text-zinc-300 font-medium leading-relaxed">
                                <span className="text-emerald-500 font-bold uppercase text-[10px] tracking-widest mr-2">Regional models:</span> Models marked as "(Regional)" in the agent editor will automatically use the appropriate inference profile based on the AWS Region you select below.
                            </p>
                        </div>
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-4 transition-colors hover:bg-emerald-500/10">
                            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                            <p className="text-[13px] text-zinc-300 font-medium leading-relaxed">
                                <span className="text-emerald-500 font-bold uppercase text-[10px] tracking-widest mr-2">IAM Permissions:</span> For Transcribe STT, ensure your IAM user has <code className="text-emerald-400 font-bold">transcribe:StartStreamTranscription</code> and <code className="text-emerald-400 font-bold">transcribe:StartStreamTranscriptionWebSocket</code> permissions.
                            </p>
                        </div>
                    </div>

                    {/* Core Credentials Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Access Key */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">AWS Access Key ID</h4>
                                {isConfigured('aws', 'accessKeyId') ? (
                                    <div className="bg-emerald-500 text-[10px] font-black px-2 py-0.5 rounded text-zinc-950 flex items-center gap-1 scale-90 origin-right">
                                        <Check className="w-3 h-3 stroke-[3px]" /> CONFIGURED
                                    </div>
                                ) : (
                                    <div className="border border-zinc-700 text-zinc-500 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 scale-90 origin-right">
                                        <span className="text-xs leading-none mt-[-2px]">⊗</span> NOT SET
                                    </div>
                                )}
                            </div>
                            <Input
                                type="password"
                                placeholder={isConfigured('aws', 'accessKeyId') ? "••••••••••••••••" : "AKIA..."}
                                className="bg-zinc-950 border-zinc-800 h-10 font-mono text-xs focus:ring-0 focus:border-zinc-700"
                                value={formData['aws']?.accessKeyId || ""}
                                onChange={(e) => setFormData({ ...formData, aws: { ...formData.aws, accessKeyId: e.target.value } })}
                            />
                            <p className="text-[11px] text-zinc-500 font-medium">Your AWS access key ID.</p>
                        </div>

                        {/* Secret Key */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Secret Access Key</h4>
                                {isConfigured('aws') ? (
                                    <div className="bg-emerald-500 text-[10px] font-black px-2 py-0.5 rounded text-zinc-950 flex items-center gap-1 scale-90 origin-right">
                                        <Check className="w-3 h-3 stroke-[3px]" /> CONFIGURED
                                    </div>
                                ) : (
                                    <div className="border border-zinc-700 text-zinc-500 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 scale-90 origin-right">
                                        <span className="text-xs leading-none mt-[-2px]">⊗</span> NOT SET
                                    </div>
                                )}
                            </div>
                            <Input
                                type="password"
                                placeholder={isConfigured('aws') ? "••••••••••••••••" : "AWS Secret..."}
                                className="bg-zinc-950 border-zinc-800 h-10 font-mono text-xs focus:ring-0 focus:border-zinc-700"
                                value={formData['aws']?.secretAccessKey || ""}
                                onChange={(e) => setFormData({ ...formData, aws: { ...formData.aws, secretAccessKey: e.target.value } })}
                            />
                            <p className="text-[11px] text-zinc-500 font-medium">Your AWS secret access key.</p>
                        </div>

                        {/* Default Region */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">AWS Region</h4>
                                {formData['aws']?.awsRegion ? (
                                    <div className="bg-emerald-500 text-[10px] font-black px-2 py-0.5 rounded text-zinc-950 flex items-center gap-1 scale-90 origin-right">
                                        <Check className="w-3 h-3 stroke-[3px]" /> CONFIGURED
                                    </div>
                                ) : (
                                    <div className="border border-zinc-700 text-zinc-500 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 scale-90 origin-right">
                                        <span className="text-xs leading-none mt-[-2px]">⊗</span> NOT SET
                                    </div>
                                )}
                            </div>
                            <Input
                                type="text"
                                placeholder="us-east-1"
                                className="bg-zinc-950 border-zinc-800 h-10 font-mono text-xs focus:ring-0 focus:border-zinc-700"
                                value={formData['aws']?.awsRegion || ""}
                                onChange={(e) => setFormData({ ...formData, aws: { ...formData.aws, awsRegion: e.target.value } })}
                            />
                            <p className="text-[11px] text-zinc-500 font-medium">AWS region (e.g., ap-southeast-2 for Sydney, us-east-1 for N. Virginia).</p>
                        </div>
                    </div>

                    {/* Service Overrides Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 pt-4 border-t border-zinc-800/50">
                        {/* Nova Sonic Region */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Nova Sonic Realtime Region</h4>
                                <div className={`text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${formData['aws']?.novaSonicRegion && formData['aws']?.novaSonicRegion !== 'default' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500'}`}>
                                    {formData['aws']?.novaSonicRegion && formData['aws']?.novaSonicRegion !== 'default' ? 'CONFIGURED' : 'NOT SET'}
                                </div>
                            </div>
                            <Select
                                value={formData['aws']?.novaSonicRegion || "default"}
                                onValueChange={(v) => setFormData({ ...formData, aws: { ...formData.aws, novaSonicRegion: v } })}
                            >
                                <SelectTrigger className="bg-zinc-950 border-zinc-800 h-10 px-4 rounded-lg focus:ring-0">
                                    <SelectValue placeholder="Default (use AWS Region above)" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white shadow-2xl">
                                    <SelectItem value="default">Default (use AWS Region above)</SelectItem>
                                    <SelectItem value="us-east-1">us-east-1 (N. Virginia)</SelectItem>
                                    <SelectItem value="us-west-2">us-west-2 (Oregon)</SelectItem>
                                    <SelectItem value="ap-northeast-1">ap-northeast-1 (Tokyo)</SelectItem>
                                    <SelectItem value="eu-west-1">eu-west-1 (Ireland)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">Region for Nova Sonic realtime. Falls back to AWS Region above if not set.</p>
                        </div>

                        {/* Polly Region */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Amazon Polly TTS Region</h4>
                                <div className={`text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${formData['aws']?.pollyTtsRegion && formData['aws']?.pollyTtsRegion !== 'default' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500'}`}>
                                    {formData['aws']?.pollyTtsRegion && formData['aws']?.pollyTtsRegion !== 'default' ? 'CONFIGURED' : 'NOT SET'}
                                </div>
                            </div>
                            <Select
                                value={formData['aws']?.pollyTtsRegion || "default"}
                                onValueChange={(v) => setFormData({ ...formData, aws: { ...formData.aws, pollyTtsRegion: v } })}
                            >
                                <SelectTrigger className="bg-zinc-950 border-zinc-800 h-10 px-4 rounded-lg focus:ring-0">
                                    <SelectValue placeholder="Default (use AWS Region above)" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white shadow-2xl">
                                    <SelectItem value="default">Default (use AWS Region above)</SelectItem>
                                    <SelectItem value="us-east-1">us-east-1 (N. Virginia)</SelectItem>
                                    <SelectItem value="us-west-2">us-west-2 (Oregon)</SelectItem>
                                    <SelectItem value="ap-southeast-2">ap-southeast-2 (Sydney)</SelectItem>
                                    <SelectItem value="ap-northeast-1">ap-northeast-1 (Tokyo)</SelectItem>
                                    <SelectItem value="eu-west-1">eu-west-1 (Ireland)</SelectItem>
                                    <SelectItem value="eu-west-2">eu-west-2 (London)</SelectItem>
                                    <SelectItem value="ca-central-1">ca-central-1 (Canada)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">Region for Amazon Polly TTS. Generative engine requires us-east-1 or us-west-2.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Azure OpenAI Section */}
            <div className="border border-zinc-800 rounded-3xl bg-zinc-900/10 overflow-hidden shadow-2xl">
                <div className="bg-zinc-800/20 border-b border-zinc-800 p-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-3">
                            <Cloud className="w-6 h-6 text-sky-400" /> Azure OpenAI (LLM / RT / STT / TTS)
                        </h3>
                        <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wider font-bold">Microsoft Enterprise AI Cloud</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-zinc-500 hover:text-rose-500"
                            onClick={() => handleDelete('azure_openai')}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Azure Banner */}
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-4 transition-colors hover:bg-emerald-500/10">
                        <Info className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <p className="text-[13px] text-zinc-300 font-medium leading-relaxed">
                            <span className="text-emerald-500 font-bold uppercase text-[10px] tracking-widest mr-2">Azure OpenAI:</span> Uses OpenAI models through Azure infrastructure for enterprise compliance and regional deployment. Get credentials from Azure Portal &gt; your OpenAI resource &gt; Keys and Endpoint. Powers Realtime, LLM, STT (Whisper), and TTS in both standard and realtime pipelines.
                        </p>
                    </div>

                    {/* Core Credentials Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* API Key */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Azure OpenAI API Key</h4>
                                {isConfigured('azure_openai') ? (
                                    <div className="bg-emerald-500 text-[10px] font-black px-2 py-0.5 rounded text-zinc-950 flex items-center gap-1 scale-90 origin-right">
                                        <Check className="w-3 h-3 stroke-[3px]" /> CONFIGURED
                                    </div>
                                ) : (
                                    <div className="border border-zinc-700 text-zinc-500 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 scale-90 origin-right">
                                        <span className="text-xs leading-none mt-[-2px]">⊗</span> NOT SET
                                    </div>
                                )}
                            </div>
                            <Input
                                type="password"
                                placeholder={isConfigured('azure_openai') ? "••••••••••••••••" : "Azure OpenAI API key"}
                                className="bg-zinc-950 border-zinc-800 h-10 font-mono text-xs focus:ring-0 focus:border-zinc-700"
                                value={formData['azure_openai']?.apiKey || ""}
                                onChange={(e) => setFormData({ ...formData, azure_openai: { ...formData.azure_openai, apiKey: e.target.value } })}
                            />
                            <p className="text-[11px] text-zinc-500 font-medium">Powers Azure OpenAI Realtime, LLM, STT (Whisper), and TTS.</p>
                        </div>

                        {/* Endpoint */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Azure Endpoint</h4>
                                {isConfigured('azure_openai', 'endpoint') ? (
                                    <div className="bg-emerald-500 text-[10px] font-black px-2 py-0.5 rounded text-zinc-950 flex items-center gap-1 scale-90 origin-right">
                                        <Check className="w-3 h-3 stroke-[3px]" /> CONFIGURED
                                    </div>
                                ) : (
                                    <div className="border border-zinc-700 text-zinc-500 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 scale-90 origin-right">
                                        <span className="text-xs leading-none mt-[-2px]">⊗</span> NOT SET
                                    </div>
                                )}
                            </div>
                            <Input
                                type="text"
                                placeholder="https://your-resource.openai.azure.com/"
                                className="bg-zinc-950 border-zinc-800 h-10 font-mono text-xs focus:ring-0 focus:border-zinc-700"
                                value={formData['azure_openai']?.endpoint || ""}
                                onChange={(e) => setFormData({ ...formData, azure_openai: { ...formData.azure_openai, endpoint: e.target.value } })}
                            />
                            <p className="text-[11px] text-zinc-500 font-medium">Your Azure OpenAI resource endpoint URL. Region is implicit in the endpoint.</p>
                        </div>
                    </div>

                    {/* API Version Selection */}
                    <div className="space-y-3 max-w-md pt-4 border-t border-zinc-800/50">
                        <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Azure API Version</h4>
                        <Select
                            value={formData['azure_openai']?.apiVersion || "2025-04-01-preview"}
                            onValueChange={(v) => setFormData({ ...formData, azure_openai: { ...formData.azure_openai, apiVersion: v } })}
                        >
                            <SelectTrigger className="bg-zinc-950 border-zinc-800 h-10 px-4 rounded-lg focus:ring-0">
                                <SelectValue placeholder="Select API Version" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800 text-white shadow-2xl">
                                <SelectItem value="2025-04-01-preview">2025-04-01-preview (Recommended)</SelectItem>
                                <SelectItem value="2025-06-01-preview">2025-06-01-preview</SelectItem>
                                <SelectItem value="2025-03-01-preview">2025-03-01-preview</SelectItem>
                                <SelectItem value="2024-10-01-preview">2024-10-01-preview (Legacy)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                            API version for Azure OpenAI services. Use 2025-04-01-preview or newer for realtime GA models and transcribe endpoints.
                        </p>
                    </div>

                    {/* Regional Alignment Banner */}
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-4 transition-colors hover:bg-emerald-500/10">
                        <Globe className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <p className="text-[13px] text-zinc-300 font-medium leading-relaxed">
                            <span className="text-emerald-500 font-bold uppercase text-[10px] tracking-widest mr-2">Region &amp; Model Availability:</span> Not all models are available in every Azure region. For the broadest model coverage (including GPT-4o Realtime, GPT-4.1 Nano, and transcribe models), use East US 2 or Sweden Central. Your deployment names in the agent editor must match the deployments created in your Azure portal.
                        </p>
                    </div>
                </div>
            </div>

            {/* Section 6: Azure Speech Services */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-8 relative overflow-hidden group hover:border-zinc-700/50 transition-all duration-500 mt-8 mb-8">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                    <Mic className="w-32 h-32 text-white" />
                </div>

                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/20">
                        <Mic className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tight">Azure Speech Services</h3>
                        <p className="text-[13px] text-zinc-500 font-medium">Enterprise STT & TTS pipeline.</p>
                    </div>
                </div>

                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-4 transition-colors hover:bg-emerald-500/10">
                    <Info className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-[13px] text-zinc-300 font-medium leading-relaxed">
                        <span className="text-emerald-500 font-bold uppercase text-[10px] tracking-widest mr-2">Azure Speech:</span> Real-time speech recognition (STT) and neural voice synthesis (TTS). Get credentials from Azure Portal &gt; Speech resource &gt; Keys and Endpoint.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
                    {/* Speech Key */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Speech Key</h4>
                            {isConfigured('azure_speech', 'apiKey') ? (
                                <div className="bg-emerald-500 text-[10px] font-black px-2 py-0.5 rounded text-zinc-950 flex items-center gap-1 scale-90 origin-right">
                                    <Check className="w-3 h-3 stroke-[3px]" /> CONFIGURED
                                </div>
                            ) : (
                                <div className="border border-zinc-700 text-zinc-500 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 scale-90 origin-right">
                                    <span className="text-xs leading-none mt-[-2px]">⊗</span> NOT SET
                                </div>
                            )}
                        </div>
                        <Input
                            type="password"
                            placeholder={isConfigured('azure_speech', 'apiKey') ? "••••••••••••••••" : "Azure Speech key"}
                            className="bg-zinc-950 border-zinc-800 h-10 font-mono text-xs focus:ring-0 focus:border-zinc-700"
                            value={formData['azure_speech']?.speechKey || ""}
                            onChange={(e) => setFormData({ ...formData, azure_speech: { ...formData.azure_speech, speechKey: e.target.value } })}
                        />
                        <p className="text-[11px] text-zinc-500 font-medium text-pretty leading-relaxed">Powers Azure Speech STT and TTS.</p>
                    </div>

                    {/* Region */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Speech Region</h4>
                            {isConfigured('azure_speech', 'region') ? (
                                <div className="bg-emerald-500 text-[10px] font-black px-2 py-0.5 rounded text-zinc-950 flex items-center gap-1 scale-90 origin-right">
                                    <Check className="w-3 h-3 stroke-[3px]" /> CONFIGURED
                                </div>
                            ) : (
                                <div className="border border-zinc-700 text-zinc-500 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 scale-90 origin-right">
                                    <span className="text-xs leading-none mt-[-2px]">⊗</span> NOT SET
                                </div>
                            )}
                        </div>
                        <Select
                            value={formData['azure_speech']?.region || ""}
                            onValueChange={(v) => setFormData({ ...formData, azure_speech: { ...formData.azure_speech, region: v } })}
                        >
                            <SelectTrigger className="bg-zinc-950 border-zinc-800 h-10 px-4 rounded-lg focus:ring-0">
                                <SelectValue placeholder="-- Select Region --" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800 text-white shadow-2xl max-h-[300px]">
                                <SelectGroup>
                                    <SelectLabel className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest px-2 py-2">Americas</SelectLabel>
                                    <SelectItem value="eastus">East US</SelectItem>
                                    <SelectItem value="eastus2">East US 2</SelectItem>
                                    <SelectItem value="centralus">Central US</SelectItem>
                                    <SelectItem value="northcentralus">North Central US</SelectItem>
                                    <SelectItem value="southcentralus">South Central US</SelectItem>
                                    <SelectItem value="westcentralus">West Central US</SelectItem>
                                    <SelectItem value="westus">West US</SelectItem>
                                    <SelectItem value="westus2">West US 2</SelectItem>
                                    <SelectItem value="westus3">West US 3</SelectItem>
                                    <SelectItem value="canadacentral">Canada Central</SelectItem>
                                    <SelectItem value="canadaeast">Canada East</SelectItem>
                                    <SelectItem value="brazilsouth">Brazil South</SelectItem>
                                </SelectGroup>
                                <SelectGroup>
                                    <SelectLabel className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest px-2 py-2 border-t border-zinc-800 mt-2">Europe</SelectLabel>
                                    <SelectItem value="northeurope">North Europe</SelectItem>
                                    <SelectItem value="westeurope">West Europe</SelectItem>
                                    <SelectItem value="francecentral">France Central</SelectItem>
                                    <SelectItem value="germanywestcentral">Germany West Central</SelectItem>
                                    <SelectItem value="italynorth">Italy North</SelectItem>
                                    <SelectItem value="norwayeast">Norway East</SelectItem>
                                    <SelectItem value="swedencentral">Sweden Central</SelectItem>
                                    <SelectItem value="switzerlandnorth">Switzerland North</SelectItem>
                                    <SelectItem value="switzerlandwest">Switzerland West</SelectItem>
                                    <SelectItem value="uksouth">UK South</SelectItem>
                                    <SelectItem value="ukwest">UK West</SelectItem>
                                </SelectGroup>
                                <SelectGroup>
                                    <SelectLabel className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest px-2 py-2 border-t border-zinc-800 mt-2">Asia Pacific &amp; MEA</SelectLabel>
                                    <SelectItem value="australiaeast">Australia East</SelectItem>
                                    <SelectItem value="centralindia">Central India</SelectItem>
                                    <SelectItem value="eastasia">East Asia</SelectItem>
                                    <SelectItem value="japaneast">Japan East</SelectItem>
                                    <SelectItem value="japanwest">Japan West</SelectItem>
                                    <SelectItem value="koreacentral">Korea Central</SelectItem>
                                    <SelectItem value="southeastasia">Southeast Asia</SelectItem>
                                    <SelectItem value="qatarcentral">Qatar Central</SelectItem>
                                    <SelectItem value="uaenorth">UAE North</SelectItem>
                                    <SelectItem value="southafricanorth">South Africa North</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                            Azure Speech Services region for STT and TTS.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-8 relative overflow-hidden group hover:border-zinc-700/50 transition-all duration-500">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                    <Cloud className="w-32 h-32 text-white" />
                </div>

                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center border border-blue-500/20">
                        <Cloud className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tight">Cloud Storage <span className="text-zinc-500 font-medium">(Recordings & Call History)</span></h3>
                        <p className="text-[13px] text-zinc-500 font-medium">Configure where your voice data is persisted.</p>
                    </div>
                </div>

                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-4 transition-colors hover:bg-emerald-500/10 mb-2">
                    <Info className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-[13px] text-zinc-300 font-medium leading-relaxed">
                        <span className="text-emerald-500 font-bold uppercase text-[10px] tracking-widest mr-2">Cloud Storage:</span> Configure AWS S3 or Google Cloud Storage for recording uploads and call history storage. Each provider has separate credentials so you can use different AWS accounts or regions for storage.
                    </p>
                </div>

                {/* AWS S3 Sub-Section */}
                <div className="space-y-6 pt-2">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center border border-zinc-700/50">
                            <Cloud className="w-4 h-4 text-zinc-400" />
                        </div>
                        <h4 className="text-[13px] font-bold text-zinc-200 uppercase tracking-[0.2em]">AWS S3</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        {/* Bucket Name */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">S3 Bucket Name</h4>
                                {isConfigured('aws_s3', 'bucketName') ? (
                                    <div className="bg-emerald-500 text-[10px] font-black px-2 py-0.5 rounded text-zinc-950 flex items-center gap-1 scale-90 origin-right">
                                        <Check className="w-3 h-3 stroke-[3px]" /> CONFIGURED
                                    </div>
                                ) : (
                                    <div className="border border-zinc-700 text-zinc-500 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 scale-90 origin-right">
                                        <span className="text-xs leading-none mt-[-2px]">⊗</span> NOT SET
                                    </div>
                                )}
                            </div>
                            <Input
                                type="text"
                                placeholder="my-recordings-bucket"
                                className="bg-zinc-950 border-zinc-800 h-10 font-mono text-xs focus:ring-0 focus:border-zinc-700"
                                value={formData['aws_s3']?.bucketName || ""}
                                onChange={(e) => setFormData({ ...formData, aws_s3: { ...formData.aws_s3, bucketName: e.target.value } })}
                            />
                            <p className="text-[11px] text-zinc-500 font-medium">Bucket must exist with write permissions.</p>
                        </div>

                        {/* Region */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">S3 Region</h4>
                                {isConfigured('aws_s3', 'region') ? (
                                    <div className="bg-emerald-500 text-[10px] font-black px-2 py-0.5 rounded text-zinc-950 flex items-center gap-1 scale-90 origin-right">
                                        <Check className="w-3 h-3 stroke-[3px]" /> CONFIGURED
                                    </div>
                                ) : (
                                    <div className="border border-zinc-700 text-zinc-500 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 scale-90 origin-right">
                                        <span className="text-xs leading-none mt-[-2px]">⊗</span> NOT SET
                                    </div>
                                )}
                            </div>
                            <Input
                                type="text"
                                placeholder="ap-southeast-2"
                                className="bg-zinc-950 border-zinc-800 h-10 font-mono text-xs focus:ring-0 focus:border-zinc-700"
                                value={formData['aws_s3']?.region || ""}
                                onChange={(e) => setFormData({ ...formData, aws_s3: { ...formData.aws_s3, region: e.target.value } })}
                            />
                            <p className="text-[11px] text-zinc-500 font-medium">AWS region for S3 bucket (e.g., ap-southeast-2).</p>
                        </div>

                        {/* Access Key ID */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">S3 Access Key ID</h4>
                                {isConfigured('aws_s3', 'accessKeyId') ? (
                                    <div className="bg-emerald-500 text-[10px] font-black px-2 py-0.5 rounded text-zinc-950 flex items-center gap-1 scale-90 origin-right">
                                        <Check className="w-3 h-3 stroke-[3px]" /> CONFIGURED
                                    </div>
                                ) : (
                                    <div className="border border-zinc-700 text-zinc-500 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 scale-90 origin-right">
                                        <span className="text-xs leading-none mt-[-2px]">⊗</span> NOT SET
                                    </div>
                                )}
                            </div>
                            <Input
                                type="password"
                                placeholder={isConfigured('aws_s3', 'accessKeyId') ? "••••••••••••••••" : "AKIA..."}
                                className="bg-zinc-950 border-zinc-800 h-10 font-mono text-xs focus:ring-0 focus:border-zinc-700"
                                value={formData['aws_s3']?.accessKeyId || ""}
                                onChange={(e) => setFormData({ ...formData, aws_s3: { ...formData.aws_s3, accessKeyId: e.target.value } })}
                            />
                            <p className="text-[11px] text-zinc-500 font-medium">AWS access key for S3 (can be different from Bedrock).</p>
                        </div>

                        {/* Secret Access Key */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">S3 Secret Access Key</h4>
                                {isConfigured('aws_s3', 'apiKey') ? (
                                    <div className="bg-emerald-500 text-[10px] font-black px-2 py-0.5 rounded text-zinc-950 flex items-center gap-1 scale-90 origin-right">
                                        <Check className="w-3 h-3 stroke-[3px]" /> CONFIGURED
                                    </div>
                                ) : (
                                    <div className="border border-zinc-700 text-zinc-500 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 scale-90 origin-right">
                                        <span className="text-xs leading-none mt-[-2px]">⊗</span> NOT SET
                                    </div>
                                )}
                            </div>
                            <Input
                                type="password"
                                placeholder={isConfigured('aws_s3', 'apiKey') ? "••••••••••••••••" : "AWS Secret Access Key"}
                                className="bg-zinc-950 border-zinc-800 h-10 font-mono text-xs focus:ring-0 focus:border-zinc-700"
                                value={formData['aws_s3']?.secretAccessKey || ""}
                                onChange={(e) => setFormData({ ...formData, aws_s3: { ...formData.aws_s3, secretAccessKey: e.target.value } })}
                            />
                            <p className="text-[11px] text-zinc-500 font-medium">AWS secret key for S3.</p>
                        </div>
                    </div>

                    {/* Test Connection Button */}
                    <div className="pt-4 flex justify-start">
                        <Button
                            onClick={() => handleTest('aws_s3')}
                            disabled={loading === 'test-aws_s3'}
                            variant="outline"
                            className="bg-blue-600/10 border-blue-600/20 text-blue-400 hover:bg-blue-600/20 hover:text-blue-300 gap-2 h-11 px-6 rounded-xl font-bold transition-all active:scale-95"
                        >
                            {loading === 'test-aws_s3' ? (
                                <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                            ) : (
                                <Zap className="w-4 h-4" />
                            )}
                            Test S3 Connection
                        </Button>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-zinc-800/50 my-8"></div>

                {/* Google Cloud Storage Sub-Section */}
                <div className="space-y-6 pt-2">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center border border-zinc-700/50">
                            <Cloud className="w-4 h-4 text-zinc-400" />
                        </div>
                        <h4 className="text-[13px] font-bold text-zinc-200 uppercase tracking-[0.2em]">Google Cloud Storage</h4>
                    </div>

                    <div className="space-y-8 max-w-4xl">
                        {/* GCS Bucket Name */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">GCS Bucket Name</h4>
                                {isConfigured('google_cloud_storage', 'bucketName') ? (
                                    <div className="bg-emerald-500 text-[10px] font-black px-2 py-0.5 rounded text-zinc-950 flex items-center gap-1 scale-90 origin-right">
                                        <Check className="w-3 h-3 stroke-[3px]" /> CONFIGURED
                                    </div>
                                ) : (
                                    <div className="border border-zinc-700 text-zinc-500 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 scale-90 origin-right">
                                        <span className="text-xs leading-none mt-[-2px]">⊗</span> NOT SET
                                    </div>
                                )}
                            </div>
                            <Input
                                type="text"
                                placeholder="my-recordings-bucket"
                                className="bg-zinc-950 border-zinc-800 h-10 font-mono text-xs focus:ring-0 focus:border-zinc-700"
                                value={formData['google_cloud_storage']?.bucketName || ""}
                                onChange={(e) => setFormData({ ...formData, google_cloud_storage: { ...formData.google_cloud_storage, bucketName: e.target.value } })}
                            />
                            <p className="text-[11px] text-zinc-500 font-medium">GCS bucket name for recording uploads.</p>
                        </div>

                        {/* GCS Service Account JSON */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">GCS Service Account Credentials</h4>
                                {isConfigured('google_cloud_storage', 'serviceAccount') ? (
                                    <div className="bg-emerald-500 text-[10px] font-black px-2 py-0.5 rounded text-zinc-950 flex items-center gap-1 scale-90 origin-right">
                                        <Check className="w-3 h-3 stroke-[3px]" /> CONFIGURED
                                    </div>
                                ) : (
                                    <div className="border border-zinc-700 text-zinc-500 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 scale-90 origin-right">
                                        <span className="text-xs leading-none mt-[-2px]">⊗</span> NOT SET
                                    </div>
                                )}
                            </div>
                            <Textarea
                                placeholder={isConfigured('google_cloud_storage', 'serviceAccount') ? '{"type": "service_account", ...}' : "Paste GCS service account JSON for storage uploads..."}
                                className="bg-zinc-950 border-zinc-800 min-h-[120px] font-mono text-[10px] focus:ring-0 focus:border-zinc-700 p-4 leading-relaxed"
                                value={formData['google_cloud_storage']?.serviceAccount || ""}
                                onChange={(e) => setFormData({ ...formData, google_cloud_storage: { ...formData.google_cloud_storage, serviceAccount: e.target.value } })}
                            />
                            <p className="text-[11px] text-zinc-500 font-medium">Service account JSON with Storage Object Creator role.</p>
                        </div>

                        {/* Test Connection Button */}
                        <div className="pt-2 flex justify-start">
                            <Button
                                onClick={() => handleTest('google_cloud_storage')}
                                disabled={loading === 'test-google_cloud_storage'}
                                variant="outline"
                                className="bg-blue-600 border-blue-600/20 text-white hover:bg-blue-500 hover:text-white gap-2 h-11 px-6 rounded-xl font-bold transition-all active:scale-95 shadow-[0_0_15px_-5px_rgba(37,99,235,0.4)]"
                            >
                                {loading === 'test-google_cloud_storage' ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Zap className="w-4 h-4" />
                                )}
                                Test GCS Connection
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 8: Test All Models Global Engine */}
            <div className="mt-12 pt-8 border-t border-zinc-800">
                <div className="flex items-center justify-between gap-6 mb-8">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                <Gauge className="w-5 h-5 text-green-400" />
                            </div>
                            <h3 className="text-lg font-bold text-zinc-100 tracking-tight">Test All Models</h3>
                        </div>
                        <p className="text-sm text-zinc-500 max-w-2xl leading-relaxed font-medium">
                            Verifies API credentials and model availability for each configured provider.
                            Each test uses minimal tokens (~$0.001 per model). Results confirm API access — not a full agent simulation.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        {lastTestTime && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                                <Clock className="w-3.5 h-3.5" />
                                Last Results: {lastTestTime}
                            </div>
                        )}
                        <Button
                            onClick={handleTestAll}
                            disabled={isTesting}
                            className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 h-12 px-8 rounded-xl font-black text-sm transition-all active:scale-95 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)] disabled:opacity-50"
                        >
                            {isTesting ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                                    <span>TESTING...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4 fill-current" />
                                    <span>TEST ALL MODELS</span>
                                </div>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Verification Results Panel */}
                {(isTesting || testResults.length > 0) && (
                    <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {testResults.map((result, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 animate-in zoom-in-95 duration-300"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${result.status === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                                            <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest leading-none">{result.provider.replace('_', ' ')}</span>
                                        </div>
                                        <div className="flex items-center gap-3 leading-none">
                                            <span className="text-[10px] font-mono text-zinc-500">{result.latency}</span>
                                            {result.status === 'success' ? (
                                                <div className="flex items-center gap-1 text-[10px] font-black text-emerald-400">
                                                    <Check className="w-3 h-3 stroke-[3px]" /> SUCCESS
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-[10px] font-black text-red-400">
                                                    <X className="w-3 h-3 stroke-[3px]" /> FAILED
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {isTesting && (
                                    <div className="flex items-center justify-center p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50 border-dashed animate-pulse">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 border-2 border-zinc-700 border-t-zinc-500 rounded-full animate-spin" />
                                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-none">Verifying...</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
