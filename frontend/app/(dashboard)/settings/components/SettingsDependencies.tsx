"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Info, Package, RefreshCw, Trash2, Mic, Cpu, MapPin, Network, Volume2, Plug, AlertTriangle, List, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";

export const TRACKED_PACKAGES = [
    "aioboto3", "anthropic", "boto3", "cartesia", "deepgram-sdk", "elevenlabs", 
    "google-cloud-speech", "google-cloud-texttospeech", "google-generativeai", 
    "livekit", "livekit-agents", "livekit-api", "livekit-blingfire", 
    "livekit-plugins-anthropic", "livekit-plugins-aws", "livekit-plugins-azure", 
    "livekit-plugins-cartesia", "livekit-plugins-deepgram", "livekit-plugins-elevenlabs", 
    "livekit-plugins-google", "livekit-plugins-groq", "livekit-plugins-noise-cancellation", 
    "livekit-plugins-openai", "livekit-plugins-silero", "livekit-plugins-turn-detector", 
    "livekit-plugins-xai", "livekit-protocol", "openai"
];

export function SettingsDependencies() {
    const [inventory, setInventory] = useState<Record<string, string>>({});
    const [loadingPackages, setLoadingPackages] = useState<Record<string, boolean>>({});
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [latestVersions, setLatestVersions] = useState<Record<string, string>>({});
    const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const isAnyLoading = Object.values(loadingPackages).some(val => val) || isCheckingUpdates;

    const fetchInventory = useCallback(async () => {
        try {
            setIsRefreshing(true);
            const res = await fetch("/api/settings/dependencies");
            const data = await res.json();
            setInventory(data);
        } catch (error: any) {
            toast.error("Failed to fetch dependencies", { description: error.message });
        } finally {
            setIsRefreshing(false);
            setIsInitialLoad(false);
        }
    }, []);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    const handleInstall = async (packageName: string, type: 'temporary' | 'permanent') => {
        const toastId = toast.loading("Installing " + packageName + "...");
        try {
            setLoadingPackages(prev => ({ ...prev, [packageName]: true }));
            const res = await fetch("/api/settings/dependencies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ package_name: packageName, install_type: type })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Installation failed");

            await fetchInventory();
            toast.dismiss(toastId);
            toast.success(packageName + " installed successfully");
        } catch (error: any) {
            toast.dismiss(toastId);
            toast.error("Installation failed: " + error.message);
        } finally {
            setLoadingPackages(prev => ({ ...prev, [packageName]: false }));
        }
    };

    const handleUninstall = async (packageName: string) => {
        try {
            setLoadingPackages(prev => ({ ...prev, [packageName]: true }));
            const res = await fetch("/api/settings/dependencies", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ package_name: packageName })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Uninstallation failed");

            toast.success("Uninstalled successfully", { description: `${packageName} removed` });
            await fetchInventory();
        } catch (error: any) {
            toast.error("Uninstallation Error", { description: error.message });
        } finally {
            setLoadingPackages(prev => ({ ...prev, [packageName]: false }));
        }
    };

    const handleCheckUpdates = async () => {
        setIsCheckingUpdates(true);
        try {
            const res = await fetch("/api/settings/dependencies/updates");
            const data = await res.json();
            if (data.status === "success" && data.latestVersions) {
                setLatestVersions(data.latestVersions);
                toast.success("Successfully synced with PyPI", {
                    description: "Dependency versions are now up to date."
                });
            } else {
                throw new Error("Failed to sync with PyPI");
            }
        } catch (error: any) {
            toast.error("Fetch Error", { description: error.message });
        } finally {
            setIsCheckingUpdates(false);
        }
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-500 max-w-6xl mx-auto pb-24">
            {/* The Page Container & Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <Package className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Required Dependencies</h2>
                        <p className="text-sm text-zinc-500 mt-1 font-medium">Manage LiveKit AI agent Python packages.</p>
                    </div>
                </div>
                <Button
                    onClick={handleCheckUpdates}
                    disabled={isCheckingUpdates || isAnyLoading}
                    variant="outline"
                    className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 font-bold h-11 px-6 shadow-[0_0_15px_-5px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2"
                >
                    {isCheckingUpdates ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    {isCheckingUpdates ? "Checking PyPI..." : "Check for Updates"}
                </Button>
            </div>

            {/* The Informational Banners */}
            <div className="space-y-4">
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 transition-colors hover:bg-emerald-500/10">
                    {/* Top Section */}
                    <div className="flex items-start gap-4">
                        <Info className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div className="space-y-3">
                            <p className="text-[13px] text-zinc-300 font-medium leading-relaxed">
                                <span className="text-emerald-500 font-bold uppercase text-[10px] tracking-widest mr-2">Package Installation:</span>
                                Install required packages for LiveKit AI agents. Packages are grouped by category.
                            </p>
                            {/* Bullet Points */}
                            <ul className="text-[13px] text-zinc-300 space-y-2 pl-4 list-disc marker:text-emerald-500/50 leading-relaxed">
                                <li>
                                    <span className="text-green-500 font-bold">Temporary:</span> Installs via pip only. Package will be lost on container restart.
                                </li>
                                <li>
                                    <span className="text-green-500 font-bold">Permanent:</span> Installs via pip and adds to requirements.txt for persistence across restarts. (Note: We use requirements.txt instead of pyproject.toml for this system).
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Section (Divider + Info Icon) */}
                    <div className="mt-6 pt-6 border-t border-emerald-500/10 flex items-start gap-4">
                        <Info className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
                        <p className="text-[13px] text-zinc-400 font-medium leading-relaxed">
                            Greyed out models in the Agent Editor indicate either the SDK is not installed or a valid API key has not been configured.
                        </p>
                    </div>
                </div>
            </div>

            {/* The Content Wrapper */}
            <div className="flex flex-col gap-8">

                {/* STT Matrix */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                        <Mic className="w-5 h-5 text-zinc-400" /> Speech-to-Text (STT)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <DependencyCard globalDisabled={isAnyLoading}
                            title="Deepgram SDK"
                            description="Deepgram's current flagship for speed/accuracy (Nova-3)."
                            packageName="livekit-plugins-deepgram"
                            installedVersion={inventory['livekit-plugins-deepgram'] || null}
                            latestVersion={latestVersions["livekit-plugins-deepgram"] || "0.4.2"}
                            isLoading={loadingPackages['livekit-plugins-deepgram'] || false}
                            isInitialLoad={isInitialLoad}
                            onInstall={(type) => handleInstall('livekit-plugins-deepgram', type)}
                            onUninstall={() => handleUninstall('livekit-plugins-deepgram')}
                        />
                        <DependencyCard globalDisabled={isAnyLoading}
                            title="OpenAI SDK"
                            description="Standard open-source/API model for high-accuracy batch processing."
                            packageName="livekit-plugins-openai"
                            installedVersion={inventory['livekit-plugins-openai'] || null}
                            latestVersion={latestVersions["livekit-plugins-openai"] || "0.9.0"}
                            isLoading={loadingPackages['livekit-plugins-openai'] || false}
                            isInitialLoad={isInitialLoad}
                            onInstall={(type) => handleInstall('livekit-plugins-openai', type)}
                            onUninstall={() => handleUninstall('livekit-plugins-openai')}
                        />
                        <DependencyCard globalDisabled={isAnyLoading}
                            title="Google Cloud Speech"
                            description="Powers Chirp 2 (latest_long and latest_short models)."
                            packageName="livekit-plugins-google"
                            installedVersion={inventory['livekit-plugins-google'] || null}
                            latestVersion={latestVersions["livekit-plugins-google"] || "0.2.1"}
                            isLoading={loadingPackages['livekit-plugins-google'] || false}
                            isInitialLoad={isInitialLoad}
                            onInstall={(type) => handleInstall('livekit-plugins-google', type)}
                            onUninstall={() => handleUninstall('livekit-plugins-google')}
                        />
                    </div>
                </div>

                {/* LLM Matrix */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 mt-8 text-white">
                        <Cpu className="w-5 h-5 text-zinc-400" /> Large Language Models (LLM)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <DependencyCard globalDisabled={isAnyLoading}
                            title="OpenAI SDK (xAI)"
                            description="Powers GPT-4o-mini (High-speed, low-cost) and GPT-4o. Also enables xAI/Grok models."
                            packageName="openai"
                            installedVersion={inventory['openai'] || null}
                            latestVersion={latestVersions["openai"] || "2.26.0"}
                            isLoading={loadingPackages['openai'] || false}
                            isInitialLoad={isInitialLoad}
                            onInstall={(type) => handleInstall('openai', type)}
                            onUninstall={() => handleUninstall('openai')}
                        />
                        <DependencyCard globalDisabled={isAnyLoading}
                            title="Google GenAI"
                            description="Powers Gemini 2.5 Flash (Optimized for speed) and 3.0 Flash."
                            packageName="google-generativeai"
                            installedVersion={inventory['google-generativeai'] || null}
                            latestVersion={latestVersions["google-generativeai"] || "0.8.6"}
                            isLoading={loadingPackages['google-generativeai'] || false}
                            isInitialLoad={isInitialLoad}
                            onInstall={(type) => handleInstall('google-generativeai', type)}
                            onUninstall={() => handleUninstall('google-generativeai')}
                        />
                        <DependencyCard globalDisabled={isAnyLoading}
                            title="Google GenAI SDK (Realtime)"
                            description="Required for Google Realtime (Gemini Live) audio-to-audio agents. Installed automatically with livekit-plugins-google."
                            packageName="google-genai"
                            installedVersion={inventory['google-genai'] || null}
                            latestVersion={latestVersions["google-genai"] || "1.56.0"}
                            isLoading={loadingPackages['google-genai'] || false}
                            isInitialLoad={isInitialLoad}
                            onInstall={(type) => handleInstall('google-genai', type)}
                            onUninstall={() => handleUninstall('google-genai')}
                        />
                        <DependencyCard globalDisabled={isAnyLoading}
                            title="Anthropic SDK"
                            description="Powers Claude 4.5 Sonnet (Best for complex tasks) and Haiku."
                            packageName="anthropic"
                            installedVersion={inventory['anthropic'] || null}
                            latestVersion={latestVersions["anthropic"] || "0.84.0"}
                            isLoading={loadingPackages['anthropic'] || false}
                            isInitialLoad={isInitialLoad}
                            onInstall={(type) => handleInstall('anthropic', type)}
                            onUninstall={() => handleUninstall('anthropic')}
                        />
                    </div>
                </div>

                {/* Geo-Located Models (AWS Bedrock) */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 mt-8 text-white">
                        <MapPin className="w-5 h-5 text-zinc-400" /> Geo-Located Models (AWS Bedrock)
                    </h3>
                    
                    {/* The Information Container & Sub-Header */}
                    <div className="border border-zinc-800 rounded-lg p-6 bg-zinc-900/50 mb-4 flex flex-col gap-4">
                        <h4 className="text-md font-semibold flex items-center gap-2 text-white">
                            <Network className="w-4 h-4 text-zinc-400" /> Cross-Region Inference Profiles
                        </h4>
                        <p className="text-sm text-zinc-300">
                            AWS Bedrock uses <strong className="text-white">cross-region inference profiles</strong> to route requests to the optimal region. There are two types of models available:
                        </p>

                        {/* The HTML Data Table */}
                        <div className="overflow-x-auto rounded-lg border border-zinc-800 mt-2">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="bg-zinc-800/50 text-xs text-zinc-400 uppercase font-semibold border-b border-zinc-700">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Model Type</th>
                                        <th className="px-4 py-3 font-semibold">Prefix</th>
                                        <th className="px-4 py-3 font-semibold">Behavior</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50">
                                    {/* Row 1 */}
                                    <tr className="bg-zinc-900/20">
                                        <td className="px-4 py-4 align-top">
                                            <div className="font-bold text-white">APAC Models</div>
                                            <div className="text-zinc-500 text-xs mt-1">(e.g., Claude Sonnet 4, Haiku 3)</div>
                                        </td>
                                        <td className="px-4 py-4 align-top">
                                            <code className="bg-black text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-800 font-mono text-xs">apac.</code>
                                        </td>
                                        <td className="px-4 py-4 align-top text-zinc-300 leading-relaxed">
                                            Routes to any Asia-Pacific region for load balancing. Good for older models.
                                        </td>
                                    </tr>
                                    {/* Row 2 */}
                                    <tr className="bg-zinc-900/20 border-t border-zinc-800">
                                        <td className="px-4 py-4 align-top">
                                            <div className="font-bold text-white">Regional Models</div>
                                            <div className="text-zinc-500 text-xs mt-1">(e.g., Claude Sonnet 4.5, Haiku 4.5)</div>
                                        </td>
                                        <td className="px-4 py-4 align-top">
                                            <code className="bg-black text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-800 font-mono text-xs whitespace-nowrap">au. / jp. / us. / eu.</code>
                                        </td>
                                        <td className="px-4 py-4 align-top text-zinc-300 leading-relaxed">
                                            Routes within a specific geographic area based on your AWS Region setting. Required for Claude 4.5 models.
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* The Warning Footer */}
                        <div className="text-xs text-zinc-400 flex gap-2 mt-2">
                            <Info className="w-4 h-4 text-zinc-500 shrink-0" />
                            <span>
                                <strong className="text-zinc-300">Note:</strong> Claude Haiku 4.5 and Sonnet 4.5 are not available via the <code className="bg-black/50 px-1 rounded text-zinc-300">apac.</code> prefix. Use the "(Regional)" models which automatically select the correct prefix based on your configured AWS Region (e.g., <code className="bg-black/50 px-1 rounded text-zinc-300">ap-southeast-2</code> &rarr; <code className="bg-black/50 px-1 rounded text-zinc-300">au.</code>, <code className="bg-black/50 px-1 rounded text-zinc-300">ap-northeast-1</code> &rarr; <code className="bg-black/50 px-1 rounded text-zinc-300">jp.</code>).
                            </span>
                        </div>
                    </div>

                    {/* The boto3 Dependency Card */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        <DependencyCard globalDisabled={isAnyLoading}
                            title="AWS SDK (boto3)"
                            description="Powers Claude Sonnet 4.5 and Claude Haiku 4.5 (via AWS), and Amazon Nova Micro."
                            packageName="boto3"
                            installedVersion={inventory['boto3'] || null}
                            latestVersion={latestVersions["boto3"] || "1.42.63"}
                            isLoading={loadingPackages['boto3'] || false}
                            isInitialLoad={isInitialLoad}
                            onInstall={(type) => handleInstall('boto3', type)}
                            onUninstall={() => handleUninstall('boto3')}
                        />
                    </div>
                </div>

                {/* Section 4: Text-to-Speech (TTS) Matrix */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 mt-8 text-white">
                        <Volume2 className="w-5 h-5 text-zinc-400" /> Text-to-Speech (TTS)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <DependencyCard globalDisabled={isAnyLoading}
                            title="Cartesia"
                            description="Ultra-low latency (90ms) Sonic 2 & 3 models."
                            packageName="cartesia"
                            installedVersion={inventory['cartesia'] || null}
                            latestVersion={latestVersions["cartesia"] || "3.0.2"}
                            isLoading={loadingPackages['cartesia'] || false}
                            isInitialLoad={isInitialLoad}
                            onInstall={(type) => handleInstall('cartesia', type)}
                            onUninstall={() => handleUninstall('cartesia')}
                        />
                        <DependencyCard globalDisabled={isAnyLoading}
                            title="ElevenLabs"
                            description="High quality Flash v2.5 (~75ms latency) and Turbo v2.5."
                            packageName="elevenlabs"
                            installedVersion={inventory['elevenlabs'] || null}
                            latestVersion={latestVersions["elevenlabs"] || "2.38.1"}
                            isLoading={loadingPackages['elevenlabs'] || false}
                            isInitialLoad={isInitialLoad}
                            onInstall={(type) => handleInstall('elevenlabs', type)}
                            onUninstall={() => handleUninstall('elevenlabs')}
                        />
                        <DependencyCard globalDisabled={isAnyLoading}
                            title="Google Cloud Text-to-Speech"
                            description="Powers Studio voices (en-US-Studio-O and Studio-Q models)."
                            packageName="google-cloud-texttospeech"
                            installedVersion={inventory['google-cloud-texttospeech'] || null}
                            latestVersion={latestVersions["google-cloud-texttospeech"] || "2.34.0"}
                            isLoading={loadingPackages['google-cloud-texttospeech'] || false}
                            isInitialLoad={isInitialLoad}
                            onInstall={(type) => handleInstall('google-cloud-texttospeech', type)}
                            onUninstall={() => handleUninstall('google-cloud-texttospeech')}
                        />
                    </div>
                </div>

                {/* Section 5: LiveKit Plugins Matrix */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 mt-8 text-white">
                        <Plug className="w-5 h-5 text-zinc-400" /> LiveKit Plugins
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DependencyCard globalDisabled={isAnyLoading}
                            title="LiveKit Agents"
                            description="Core framework for building voice AI agents."
                            packageName="livekit-agents"
                            installedVersion={inventory['livekit-agents'] || null}
                            latestVersion={latestVersions["livekit-agents"] || "1.4.4"}
                            isLoading={loadingPackages['livekit-agents'] || false}
                            isInitialLoad={isInitialLoad}
                            onInstall={(type) => handleInstall('livekit-agents', type)}
                            onUninstall={() => handleUninstall('livekit-agents')}
                        />
                        <DependencyCard globalDisabled={isAnyLoading}
                            title="Silero VAD"
                            description="Voice Activity Detection for speech segmentation."
                            packageName="livekit-plugins-silero"
                            installedVersion={inventory['livekit-plugins-silero'] || null}
                            latestVersion={latestVersions["livekit-plugins-silero"] || "1.4.4"}
                            isLoading={loadingPackages['livekit-plugins-silero'] || false}
                            isInitialLoad={isInitialLoad}
                            onInstall={(type) => handleInstall('livekit-plugins-silero', type)}
                            onUninstall={() => handleUninstall('livekit-plugins-silero')}
                        />
                        <DependencyCard globalDisabled={isAnyLoading}
                            title="Turn Detector"
                            description="Advanced turn detection for natural conversations."
                            packageName="livekit-plugins-turn-detector"
                            installedVersion={inventory['livekit-plugins-turn-detector'] || null}
                            latestVersion={latestVersions["livekit-plugins-turn-detector"] || "1.4.4"}
                            isLoading={loadingPackages['livekit-plugins-turn-detector'] || false}
                            isInitialLoad={isInitialLoad}
                            onInstall={(type) => handleInstall('livekit-plugins-turn-detector', type)}
                            onUninstall={() => handleUninstall('livekit-plugins-turn-detector')}
                        />
                        <DependencyCard globalDisabled={isAnyLoading}
                            title="OpenAI Plugin"
                            description="LiveKit plugin for OpenAI and xAI integration."
                            packageName="livekit-plugins-openai"
                            installedVersion={inventory['livekit-plugins-openai'] || null}
                            latestVersion={latestVersions["livekit-plugins-openai"] || "1.4.4"}
                            isLoading={loadingPackages['livekit-plugins-openai'] || false}
                            isInitialLoad={isInitialLoad}
                            onInstall={(type) => handleInstall('livekit-plugins-openai', type)}
                            onUninstall={() => handleUninstall('livekit-plugins-openai')}
                        />
                        <DependencyCard globalDisabled={isAnyLoading}
                            title="Deepgram Plugin"
                            description="LiveKit plugin for Deepgram STT/TTS."
                            packageName="livekit-plugins-deepgram"
                            installedVersion={inventory['livekit-plugins-deepgram'] || null}
                            latestVersion={latestVersions["livekit-plugins-deepgram"] || "1.4.4"}
                            isLoading={loadingPackages['livekit-plugins-deepgram'] || false}
                            isInitialLoad={isInitialLoad}
                            onInstall={(type) => handleInstall('livekit-plugins-deepgram', type)}
                            onUninstall={() => handleUninstall('livekit-plugins-deepgram')}
                        />
                        <DependencyCard globalDisabled={isAnyLoading}
                            title="ElevenLabs Plugin"
                            description="LiveKit plugin for ElevenLabs STT/TTS."
                            packageName="livekit-plugins-elevenlabs"
                            installedVersion={inventory['livekit-plugins-elevenlabs'] || null}
                            latestVersion={latestVersions["livekit-plugins-elevenlabs"] || "1.4.4"}
                            isLoading={loadingPackages['livekit-plugins-elevenlabs'] || false}
                            isInitialLoad={isInitialLoad}
                            onInstall={(type) => handleInstall('livekit-plugins-elevenlabs', type)}
                            onUninstall={() => handleUninstall('livekit-plugins-elevenlabs')}
                        />
                        <DependencyCard globalDisabled={isAnyLoading}
                            title="Cartesia Plugin"
                            description="LiveKit plugin for Cartesia TTS."
                            packageName="livekit-plugins-cartesia"
                            installedVersion={inventory['livekit-plugins-cartesia'] || null}
                            latestVersion={latestVersions["livekit-plugins-cartesia"] || "1.4.4"}
                            isLoading={loadingPackages['livekit-plugins-cartesia'] || false}
                            isInitialLoad={isInitialLoad}
                            onInstall={(type) => handleInstall('livekit-plugins-cartesia', type)}
                            onUninstall={() => handleUninstall('livekit-plugins-cartesia')}
                        />
                        <DependencyCard globalDisabled={isAnyLoading}
                            title="Google Plugin"
                            description="LiveKit plugin for Google Gemini and Cloud Speech."
                            packageName="livekit-plugins-google"
                            installedVersion={inventory['livekit-plugins-google'] || null}
                            latestVersion={latestVersions["livekit-plugins-google"] || "1.4.4"}
                            isLoading={loadingPackages['livekit-plugins-google'] || false}
                            isInitialLoad={isInitialLoad}
                            onInstall={(type) => handleInstall('livekit-plugins-google', type)}
                            onUninstall={() => handleUninstall('livekit-plugins-google')}
                        />
                        <DependencyCard globalDisabled={isAnyLoading}
                            title="AWS Plugin"
                            description="LiveKit plugin for AWS Bedrock LLM."
                            packageName="livekit-plugins-aws"
                            installedVersion={inventory['livekit-plugins-aws'] || null}
                            latestVersion={latestVersions["livekit-plugins-aws"] || "1.4.4"}
                            isLoading={loadingPackages['livekit-plugins-aws'] || false}
                            isInitialLoad={isInitialLoad}
                            onInstall={(type) => handleInstall('livekit-plugins-aws', type)}
                            onUninstall={() => handleUninstall('livekit-plugins-aws')}
                        />
                        <DependencyCard
                            title="Anthropic Plugin"
                            description="LiveKit plugin for Anthropic Claude LLM."
                            packageName="livekit-plugins-anthropic"
                            installedVersion={inventory['livekit-plugins-anthropic'] || null}
                            latestVersion={latestVersions["livekit-plugins-anthropic"] || "1.4.4"}
                            isLoading={loadingPackages['livekit-plugins-anthropic'] || false}
                            isInitialLoad={isInitialLoad}
                            onInstall={(type) => handleInstall('livekit-plugins-anthropic', type)}
                            onUninstall={() => handleUninstall('livekit-plugins-anthropic')}
                        />
                        <DependencyCard
                            title="Noise Cancellation Plugin"
                            description="LiveKit plugin for Standard WebRTC noise suppression. Runs locally on CPU."
                            packageName="livekit-plugins-noise-cancellation"
                            installedVersion={inventory['livekit-plugins-noise-cancellation'] || null}
                            latestVersion={latestVersions["livekit-plugins-noise-cancellation"] || "0.2.5"}
                            isLoading={loadingPackages['livekit-plugins-noise-cancellation'] || false}
                            isInitialLoad={isInitialLoad}
                            onInstall={(type) => handleInstall('livekit-plugins-noise-cancellation', type)}
                            onUninstall={() => handleUninstall('livekit-plugins-noise-cancellation')}
                        />
                        <DependencyCard
                            title="xAI Plugin"
                            description="LiveKit plugin for xAI Grok Realtime audio-to-audio."
                            packageName="livekit-plugins-xai"
                            installedVersion={inventory['livekit-plugins-xai'] || null}
                            latestVersion={latestVersions["livekit-plugins-xai"] || "1.4.4"}
                            isLoading={loadingPackages['livekit-plugins-xai'] || false}
                            onInstall={(type) => handleInstall('livekit-plugins-xai', type)}
                            onUninstall={() => handleUninstall('livekit-plugins-xai')}
                        />
                    </div>
                </div>

                {/* The Final Warning Banner */}
                <div className="mt-6 p-4 border border-yellow-700/50 bg-yellow-900/10 rounded-lg flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-600/90 leading-relaxed">
                        <strong className="text-yellow-500">Model Availability:</strong> When creating or editing agents, models will be <strong className="text-yellow-500">greyed out and disabled</strong> if their required SDK is not installed. Install the necessary dependencies above to enable all model options.
                    </p>
                </div>

                {/* Section 6: Installed LiveKit & AI Packages (Master Inventory) */}
                <div className="mt-12 bg-zinc-900/40 border border-zinc-800 rounded-lg overflow-hidden">
                    <div className="p-6 border-b border-zinc-800">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                            <List className="w-5 h-5 text-zinc-400" /> Installed LiveKit & AI Packages
                        </h3>
                        <p className="text-sm text-zinc-500 mt-2 flex items-center gap-2">
                            <Info className="w-4 h-4" /> Showing LiveKit core packages and AI/Voice provider dependencies (OpenAI, Deepgram, ElevenLabs, etc.)
                        </p>
                    </div>
                    
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-black/50 text-xs text-zinc-400 uppercase font-bold">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Package Name</th>
                                <th className="px-6 py-4 font-semibold text-right">Version</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                const installedPackages = TRACKED_PACKAGES.filter(pkg => inventory[pkg]);
                                
                                if (installedPackages.length === 0 && !isRefreshing) {
                                    return (
                                        <tr>
                                            <td colSpan={2} className="px-6 py-8 text-center text-zinc-500 italic">
                                                No tracked packages installed.
                                            </td>
                                        </tr>
                                    );
                                }

                                return installedPackages.map(pkg => (
                                    <tr key={pkg} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                                        <td className="px-6 py-4 font-mono text-zinc-300">
                                            {pkg}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="bg-blue-900/30 text-blue-400 font-mono text-xs px-2 py-1 rounded font-semibold inline-block">
                                                {inventory[pkg]}
                                            </span>
                                        </td>
                                    </tr>
                                ));
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Reusable Component: DependencyCard
// ---------------------------------------------------------------------------

export interface DependencyCardProps {
    title: string;
    description: string;
    packageName: string;
    installedVersion: string | null;
    latestVersion: string | null;
    isLoading: boolean;
    isInitialLoad?: boolean;
    globalDisabled?: boolean;
    onInstall: (type: 'temporary' | 'permanent') => void;
    onUninstall: () => void;
}

export function DependencyCard({
    title,
    description,
    packageName,
    installedVersion,
    latestVersion,
    isLoading,
    isInitialLoad = false,
    globalDisabled = false,
    onInstall,
    onUninstall
}: DependencyCardProps) {

    // Determine Status
    const isMissing = !installedVersion;
    const isUpToDate = installedVersion && (installedVersion === latestVersion || !latestVersion);
    const hasUpdate = installedVersion && latestVersion && installedVersion !== latestVersion;

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col justify-between">
            {/* Header Row */}
            <div className="flex items-start justify-between">
                <div>
                    <h4 className="text-sm font-bold text-white tracking-tight">{title}</h4>
                </div>
                <div>
                    {isUpToDate && (
                        <div className="bg-green-500 text-[10px] font-black px-2 py-0.5 rounded text-zinc-950 flex items-center gap-1">
                            ✅ v{installedVersion}
                        </div>
                    )}
                    {hasUpdate && (
                        <div className="border border-orange-500 text-orange-500 text-[10px] font-bold px-2 py-0.5 rounded">
                            Update Available
                        </div>
                    )}
                    {isMissing && (
                        <div className="border border-zinc-600 text-zinc-500 text-[10px] font-bold px-2 py-0.5 rounded">
                            Missing
                        </div>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="mt-2">
                <p className="text-xs text-zinc-400">{description}</p>
                <div className="inline-block bg-black text-gray-300 font-mono text-[11px] px-2 py-1 rounded mt-3">
                    {packageName}
                </div>
            </div>

            {/* Action Area */}
            <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-zinc-800/50">
                {isLoading ? (
                    <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        PROCESSING...
                    </div>
                ) : (
                    <>
                        {isMissing && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={globalDisabled}
                                    onClick={() => onInstall('temporary')}
                                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white h-8 text-xs font-semibold gap-1.5"
                                >
                                    ↓ Temporary
                                </Button>
                                <Button
                                    size="sm"
                                    disabled={globalDisabled}
                                    onClick={() => onInstall('permanent')}
                                    className="bg-green-600 hover:bg-green-500 text-white h-8 text-xs font-bold gap-1.5 shadow-[0_0_10px_-2px_rgba(22,163,74,0.4)]"
                                >
                                    <Package className="w-3.5 h-3.5" />
                                    Permanent
                                </Button>
                            </>
                        )}

                        {hasUpdate && (
                            <>
                                <Button
                                    size="sm"
                                    disabled={globalDisabled}
                                    onClick={() => onInstall('permanent')} // Updates are inherently pip installs + req tracking logic handles deduping
                                    className="bg-orange-600 hover:bg-orange-500 text-white h-8 text-xs font-bold gap-1.5"
                                >
                                    ↑ Update
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={globalDisabled}
                                    onClick={onUninstall}
                                    className="border-zinc-700 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 h-8 w-8 p-0"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </>
                        )}

                        {isUpToDate && (
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={globalDisabled}
                                    onClick={onUninstall}
                                className="border-zinc-700 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 h-8 w-8 p-0"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
