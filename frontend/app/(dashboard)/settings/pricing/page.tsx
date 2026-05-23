"use client";

import React, { useState, useEffect } from 'react';
import { 
    Coins, 
    Calculator, 
    Check, 
    Info, 
    Settings, 
    Key, 
    Shield, 
    Activity, 
    Wrench,
    X,
    Table,
    RotateCcw,
    Save,
    Trash2,
    PhoneCall,
    PhoneForwarded,
    Lightbulb
} from 'lucide-react';
import { toast } from 'sonner';
import AddProviderModal from '../components/AddProviderModal';

// Master Hardcoded Default Map
const DEFAULT_PRICING_MAP = {
    currency: 'AUD',
    rates: { usdAud: '1.58', usdEur: '1.09', eurAud: '1.72' },
    factors: { llmInput: '800', llmOutput: '200', ttsChars: '900', realtimeInput: '1500', realtimeOutput: '1500' },
    llmProviders: [
        { id: 'groq', name: 'Groq', input: '0.59', output: '0.79', enabled: true },
        { id: 'aws', name: 'AWS Bedrock', input: '3.00', output: '15.00', enabled: false },
        { id: 'azure', name: 'Azure OpenAI', input: '2.50', output: '10.00', enabled: false },
        { id: 'anthropic', name: 'Anthropic', input: '3.00', output: '15.00', enabled: false },
        { id: 'gcp', name: 'Google Cloud', input: '0.30', output: '2.50', enabled: false },
        { id: 'xai', name: 'xAI (Grok)', input: '0.20', output: '0.50', enabled: false },
        { id: 'google', name: 'Google', input: '0.30', output: '2.50', enabled: false },
        { id: 'openai', name: 'OpenAI', input: '2.50', output: '10.00', enabled: true },
    ],
    sttProviders: [
        { id: 'groq', name: 'Groq (Whisper)', rate: '0.0011', enabled: true },
        { id: 'elevenlabs', name: 'ElevenLabs', rate: '0.00667', enabled: false },
        { id: 'gcp', name: 'Google Cloud', rate: '0.016', enabled: false },
        { id: 'azure', name: 'Azure Speech', rate: '0.016', enabled: false },
        { id: 'deepgram', name: 'Deepgram', rate: '0.0077', enabled: false },
        { id: 'openai', name: 'OpenAI', rate: '0.006', enabled: true },
        { id: 'azure_openai', name: 'Azure OpenAI', rate: '0.006', enabled: false },
    ],
    ttsProviders: [
        { id: 'gemini_tts', name: 'Google Cloud Gemini TTS', rate: '160.00', enabled: false },
        { id: 'deepgram', name: 'Deepgram', rate: '30.00', enabled: false },
        { id: 'openai', name: 'OpenAI', rate: '15.00', enabled: true },
        { id: 'gcp_tts', name: 'Google Cloud TTS', rate: '16.00', enabled: false },
        { id: 'polly', name: 'Amazon Polly', rate: '16.00', enabled: false },
        { id: 'azure_openai', name: 'Azure OpenAI', rate: '15.00', enabled: false },
        { id: 'cartesia', name: 'Cartesia', rate: '50.00', enabled: false },
        { id: 'azure', name: 'Azure Speech', rate: '16.00', enabled: false },
        { id: 'groq', name: 'Groq', rate: '30.00', enabled: false },
        { id: 'elevenlabs', name: 'ElevenLabs', rate: '83.33', enabled: true },
    ],
    realtimeProviders: [
        { id: 'azure_openai', name: 'Azure OpenAI Realtime', input: '32.00', output: '64.00', minute: '', enabled: false },
        { id: 'aws_nova', name: 'AWS Nova Sonic', input: '3.40', output: '13.60', minute: '', enabled: false },
        { id: 'gcp', name: 'Google Cloud Realtime (Vertex AI)', input: '3.00', output: '12.00', minute: '', enabled: false },
        { id: 'gemini_live', name: 'Google Realtime (Gemini Live)', input: '3.00', output: '12.00', minute: '', enabled: false },
        { id: 'openai', name: 'OpenAI Realtime', input: '32.00', output: '64.00', minute: '', enabled: true },
        { id: 'xai', name: 'xAI Grok Realtime', input: '', output: '', minute: '0.05', enabled: false },
    ],
    telephony: { inboundRate: '0.00', outboundRate: '0.00' }
};

export default function PricingPage() {
    const [isLive, setIsLive] = useState(false);
    const [showBanner, setShowBanner] = useState(true);

    // Form states
    const [currency, setCurrency] = useState('AUD');
    
    // Currency rates
    const [rates, setRates] = useState({
        usdAud: '1.58',
        usdEur: '1.09',
        eurAud: '1.72'
    });
    const [originalRates] = useState({ ...rates });
    const isRatesDirty = JSON.stringify(rates) !== JSON.stringify(originalRates);

    // Conversion factors
    const [factors, setFactors] = useState({
        llmInput: '800',
        llmOutput: '200',
        ttsChars: '900',
        realtimeInput: '1500',
        realtimeOutput: '1500'
    });
    const [originalFactors] = useState({ ...factors });
    const isFactorsDirty = JSON.stringify(factors) !== JSON.stringify(originalFactors);

    // Provider Navigation
    const [activeTab, setActiveTab] = useState('LLM');

    // LLM Provider Data
    const [llmProviders, setLlmProviders] = useState([
        { id: 'groq', name: 'Groq', input: '0.59', output: '0.79', enabled: true },
        { id: 'aws', name: 'AWS Bedrock', input: '3.00', output: '15.00', enabled: false },
        { id: 'azure', name: 'Azure OpenAI', input: '2.50', output: '10.00', enabled: false },
        { id: 'anthropic', name: 'Anthropic', input: '3.00', output: '15.00', enabled: false },
        { id: 'gcp', name: 'Google Cloud', input: '0.30', output: '2.50', enabled: false },
        { id: 'xai', name: 'xAI (Grok)', input: '0.20', output: '0.50', enabled: false },
        { id: 'google', name: 'Google', input: '0.30', output: '2.50', enabled: false },
        { id: 'openai', name: 'OpenAI', input: '2.50', output: '10.00', enabled: true },
    ]);

    // STT Provider Data
    const [sttProviders, setSttProviders] = useState([
        { id: 'groq', name: 'Groq (Whisper)', rate: '0.0011', enabled: true },
        { id: 'elevenlabs', name: 'ElevenLabs', rate: '0.00667', enabled: false },
        { id: 'gcp', name: 'Google Cloud', rate: '0.016', enabled: false },
        { id: 'azure', name: 'Azure Speech', rate: '0.016', enabled: false },
        { id: 'deepgram', name: 'Deepgram', rate: '0.0077', enabled: false },
        { id: 'openai', name: 'OpenAI', rate: '0.006', enabled: true },
        { id: 'azure_openai', name: 'Azure OpenAI', rate: '0.006', enabled: false },
    ]);

    // TTS Provider Data
    const [ttsProviders, setTtsProviders] = useState([
        { id: 'gemini_tts', name: 'Google Cloud Gemini TTS', rate: '160.00', enabled: false },
        { id: 'deepgram', name: 'Deepgram', rate: '30.00', enabled: false },
        { id: 'openai', name: 'OpenAI', rate: '15.00', enabled: true },
        { id: 'gcp_tts', name: 'Google Cloud TTS', rate: '16.00', enabled: false },
        { id: 'polly', name: 'Amazon Polly', rate: '16.00', enabled: false },
        { id: 'azure_openai', name: 'Azure OpenAI', rate: '15.00', enabled: false },
        { id: 'cartesia', name: 'Cartesia', rate: '50.00', enabled: false },
        { id: 'azure', name: 'Azure Speech', rate: '16.00', enabled: false },
        { id: 'groq', name: 'Groq', rate: '30.00', enabled: false },
        { id: 'elevenlabs', name: 'ElevenLabs', rate: '83.33', enabled: true },
    ]);

    // Realtime Provider Data (Hybrid tokens & minute rates)
    const [realtimeProviders, setRealtimeProviders] = useState([
        { id: 'azure_openai', name: 'Azure OpenAI Realtime', input: '32.00', output: '64.00', minute: '', enabled: false },
        { id: 'aws_nova', name: 'AWS Nova Sonic', input: '3.40', output: '13.60', minute: '', enabled: false },
        { id: 'gcp', name: 'Google Cloud Realtime (Vertex AI)', input: '3.00', output: '12.00', minute: '', enabled: false },
        { id: 'gemini_live', name: 'Google Realtime (Gemini Live)', input: '3.00', output: '12.00', minute: '', enabled: false },
        { id: 'openai', name: 'OpenAI Realtime', input: '32.00', output: '64.00', minute: '', enabled: true },
        { id: 'xai', name: 'xAI Grok Realtime', input: '', output: '', minute: '0.05', enabled: false },
    ]);

    // Telephony Data
    const [telephony, setTelephony] = useState({
        inboundRate: '0.00',
        outboundRate: '0.00'
    });
    const [originalTelephony] = useState({ ...telephony });
    const isTelephonyDirty = JSON.stringify(telephony) !== JSON.stringify(originalTelephony);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/settings/pricing');
            if (res.ok) {
                const data = await res.json();
                if (!data.message) {
                    if (data.currency) setCurrency(data.currency);
                    if (data.rates) setRates(data.rates);
                    if (data.factors) setFactors(data.factors);
                    // Hydrate explicitly ensuring required fields exist or padding with defaults
                    if (data.llmProviders) setLlmProviders(data.llmProviders.map((p:any) => ({ ...p, enabled: p.enabled ?? false })));
                    if (data.sttProviders) setSttProviders(data.sttProviders.map((p:any) => ({ ...p, enabled: p.enabled ?? false })));
                    if (data.ttsProviders) setTtsProviders(data.ttsProviders.map((p:any) => ({ ...p, enabled: p.enabled ?? false })));
                    if (data.realtimeProviders) setRealtimeProviders(data.realtimeProviders.map((p:any) => ({ ...p, enabled: p.enabled ?? false })));
                    if (data.telephony) setTelephony(data.telephony);
                    
                    setIsLive(true);
                }
            }
        } catch (e) {
            console.error("Failed to fetch initial pricing config", e);
            setIsLive(false);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    const handleSaveAll = async () => {
        const payload = {
            currency,
            rates,
            factors,
            llmProviders,
            sttProviders,
            ttsProviders,
            realtimeProviders,
            telephony
        };
        
        const savePromise = fetch('/api/settings/pricing/sync', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(async (res) => {
            if (!res.ok) throw new Error("Sync failed. Check server logs.");
            await fetchConfig(); // Refresh to clean state parity
            return res.json();
        });

        toast.promise(savePromise, {
            loading: 'Encrypting and syncing financial data...',
            success: 'Global pricing synchronized successfully.',
            error: (err) => err.message
        });
    };

    const handleResetToDefaults = () => {
        const confirmed = window.confirm("Are you sure? This will overwrite all custom rates with industry standards.");
        if (!confirmed) return;

        setCurrency(DEFAULT_PRICING_MAP.currency);
        setRates(DEFAULT_PRICING_MAP.rates);
        setFactors(DEFAULT_PRICING_MAP.factors);
        setLlmProviders(DEFAULT_PRICING_MAP.llmProviders);
        setSttProviders(DEFAULT_PRICING_MAP.sttProviders);
        setTtsProviders(DEFAULT_PRICING_MAP.ttsProviders);
        setRealtimeProviders(DEFAULT_PRICING_MAP.realtimeProviders);
        setTelephony(DEFAULT_PRICING_MAP.telephony);

        // Immediate persist
        setTimeout(handleSaveAll, 100);
    };

    const handleNumberInput = (setter: any, key: string, value: string) => {
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setter((prev: any) => ({ ...prev, [key]: value }));
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Settings className="w-6 h-6 text-zinc-400" />
                    Settings <span className="text-zinc-600 font-normal">/</span> Configuration & Integrations
                </h1>
                
                {/* Live Sync Status Indicator */}
                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1.5 shadow-sm">
                    <span className={`relative flex h-2 w-2`}>
                        {isLive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    </span>
                    <span className="text-xs font-medium text-zinc-300 tracking-wide uppercase">
                        {isLive ? 'Live Sync' : 'Disconnected'}
                    </span>
                </div>
            </div>

            {/* Getting Started Banner */}
            {showBanner && (
                <div className="bg-green-900/10 border border-green-800/50 rounded-lg p-6 relative">
                    <button 
                        onClick={() => setShowBanner(false)}
                        className="absolute top-4 right-4 text-green-500/70 hover:text-green-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <h2 className="text-green-500 font-bold mb-4">Getting Started</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
                        <div className="space-y-2">
                            <div className="font-bold text-zinc-300 flex items-center gap-1.5 mb-3">
                                <Key className="w-4 h-4 text-green-500/70" /> Configuration
                            </div>
                            <div className="text-green-500 hover:text-green-400 cursor-pointer transition-colors">API Keys</div>
                            <div className="text-green-500 hover:text-green-400 cursor-pointer transition-colors">Create Agent</div>
                            <div className="text-green-500 hover:text-green-400 cursor-pointer transition-colors">SIP Trunks</div>
                        </div>
                        <div className="space-y-2">
                            <div className="font-bold text-zinc-300 flex items-center gap-1.5 mb-3">
                                <Shield className="w-4 h-4 text-green-500/70" /> Security
                            </div>
                            <div className="text-green-500 hover:text-green-400 cursor-pointer transition-colors">2FA</div>
                            <div className="text-green-500 hover:text-green-400 cursor-pointer transition-colors">Sub-Users</div>
                            <div className="text-green-500 hover:text-green-400 cursor-pointer transition-colors">HTTPS</div>
                        </div>
                        <div className="space-y-2">
                            <div className="font-bold text-zinc-300 flex items-center gap-1.5 mb-3">
                                <Wrench className="w-4 h-4 text-green-500/70" /> Tools & Webhooks
                            </div>
                            <div className="text-green-500 hover:text-green-400 cursor-pointer transition-colors">Built-in Tools</div>
                            <div className="text-green-500 hover:text-green-400 cursor-pointer transition-colors">Webhook Integration</div>
                        </div>
                        <div className="space-y-2">
                            <div className="font-bold text-zinc-300 flex items-center gap-1.5 mb-3">
                                <Activity className="w-4 h-4 text-green-500/70" /> Monitoring
                            </div>
                            <div className="text-green-500 hover:text-green-400 cursor-pointer transition-colors">Live Sessions</div>
                            <div className="text-green-500 hover:text-green-400 cursor-pointer transition-colors">Call History</div>
                            <div className="text-green-500 hover:text-green-400 cursor-pointer transition-colors">System Resources</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Financial Foundation Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                
                {/* Left Column */}
                <div className="space-y-6 flex flex-col">
                    {/* Currency & Exchange Rates */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 flex flex-col">
                    <div className="flex items-center gap-2 text-white font-bold text-lg mb-6 tracking-tight">
                        <Coins className="w-5 h-5 text-indigo-400" /> Currency & Exchange Rates
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Display Currency</label>
                        <select 
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-zinc-200 outline-none focus:border-zinc-600 transition-colors"
                        >
                            <option value="AUD">AUD A$</option>
                            <option value="USD">USD $</option>
                            <option value="EUR">EUR €</option>
                        </select>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">USD &rarr; AUD</label>
                            <input 
                                type="text"
                                value={rates.usdAud}
                                onChange={(e) => handleNumberInput(setRates, 'usdAud', e.target.value)}
                                className={`w-full bg-zinc-950 border ${rates.usdAud !== originalRates.usdAud ? 'border-indigo-500/50' : 'border-zinc-800'} rounded-md px-3 py-2 text-zinc-200 font-mono focus:outline-none focus:border-zinc-600 transition-all`}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">USD &rarr; EUR</label>
                            <input 
                                type="text"
                                value={rates.usdEur}
                                onChange={(e) => handleNumberInput(setRates, 'usdEur', e.target.value)}
                                className={`w-full bg-zinc-950 border ${rates.usdEur !== originalRates.usdEur ? 'border-indigo-500/50' : 'border-zinc-800'} rounded-md px-3 py-2 text-zinc-200 font-mono focus:outline-none focus:border-zinc-600 transition-all`}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">EUR &rarr; AUD</label>
                            <input 
                                type="text"
                                value={rates.eurAud}
                                onChange={(e) => handleNumberInput(setRates, 'eurAud', e.target.value)}
                                className={`w-full bg-zinc-950 border ${rates.eurAud !== originalRates.eurAud ? 'border-indigo-500/50' : 'border-zinc-800'} rounded-md px-3 py-2 text-zinc-200 font-mono focus:outline-none focus:border-zinc-600 transition-all`}
                            />
                        </div>
                    </div>

                    <div className="mt-auto flex justify-end">
                        <button 
                            onClick={handleSaveAll}
                            disabled={!isRatesDirty}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all ${isRatesDirty ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
                        >
                            <Check className="w-4 h-4" /> Save Currency Settings
                        </button>
                    </div>
                </div>

                {/* SIP Trunk Pricing */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 flex flex-col">
                    <div className="flex items-center gap-2 text-white font-bold text-lg mb-1 tracking-tight">
                        <PhoneCall className="w-5 h-5 text-indigo-400" /> SIP Trunk Pricing
                    </div>
                    <p className="text-zinc-500 text-sm mb-6">Per-minute rates for SIP trunk calls. Set to 0 if not applicable.</p>

                    <div className="space-y-4 mb-8">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Inbound Rate (USD/minute)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-zinc-500 text-sm">$</span>
                                <input 
                                    type="text"
                                    value={telephony.inboundRate}
                                    onChange={(e) => handleNumberInput(setTelephony, 'inboundRate', e.target.value)}
                                    className={`w-full bg-zinc-950 border ${telephony.inboundRate !== originalTelephony.inboundRate ? 'border-indigo-500/50' : 'border-zinc-800'} rounded-md px-3 py-2 pl-7 text-zinc-200 font-mono focus:outline-none focus:border-zinc-600 transition-all`}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Outbound Rate (USD/minute)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-zinc-500 text-sm">$</span>
                                <input 
                                    type="text"
                                    value={telephony.outboundRate}
                                    onChange={(e) => handleNumberInput(setTelephony, 'outboundRate', e.target.value)}
                                    className={`w-full bg-zinc-950 border ${telephony.outboundRate !== originalTelephony.outboundRate ? 'border-indigo-500/50' : 'border-zinc-800'} rounded-md px-3 py-2 pl-7 text-zinc-200 font-mono focus:outline-none focus:border-zinc-600 transition-all`}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto flex justify-end">
                        <button 
                            onClick={handleSaveAll}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all bg-emerald-600 hover:bg-emerald-500 text-white`}
                        >
                            <PhoneForwarded className="w-4 h-4" /> Save SIP Pricing
                        </button>
                    </div>
                </div>
            </div>

                {/* Conversion Factors */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 flex flex-col h-fit">
                    <div className="flex items-center gap-2 text-white font-bold text-lg mb-1 tracking-tight">
                        <Calculator className="w-5 h-5 text-indigo-400" /> Conversion Factors
                    </div>
                    <p className="text-zinc-500 text-sm mb-6">These factors normalize token-based and character-based pricing to cost-per-minute.</p>

                    <div className="space-y-4 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <label className="text-xs font-semibold text-zinc-400">LLM Input Tokens / Minute</label>
                                <Info className="w-3.5 h-3.5 text-zinc-600 cursor-help" />
                            </div>
                            <input 
                                type="text"
                                value={factors.llmInput}
                                onChange={(e) => handleNumberInput(setFactors, 'llmInput', e.target.value)}
                                className={`w-full bg-zinc-950 border ${factors.llmInput !== originalFactors.llmInput ? 'border-indigo-500/50' : 'border-zinc-800'} rounded-md px-3 py-2 text-zinc-200 font-mono focus:outline-none focus:border-zinc-600 transition-all`}
                            />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <label className="text-xs font-semibold text-zinc-400">LLM Output Tokens / Minute</label>
                                <Info className="w-3.5 h-3.5 text-zinc-600 cursor-help" />
                            </div>
                            <input 
                                type="text"
                                value={factors.llmOutput}
                                onChange={(e) => handleNumberInput(setFactors, 'llmOutput', e.target.value)}
                                className={`w-full bg-zinc-950 border ${factors.llmOutput !== originalFactors.llmOutput ? 'border-indigo-500/50' : 'border-zinc-800'} rounded-md px-3 py-2 text-zinc-200 font-mono focus:outline-none focus:border-zinc-600 transition-all`}
                            />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <label className="text-xs font-semibold text-zinc-400">TTS Characters / Minute of Call</label>
                                <Info className="w-3.5 h-3.5 text-zinc-600 cursor-help" />
                            </div>
                            <input 
                                type="text"
                                value={factors.ttsChars}
                                onChange={(e) => handleNumberInput(setFactors, 'ttsChars', e.target.value)}
                                className={`w-full bg-zinc-950 border ${factors.ttsChars !== originalFactors.ttsChars ? 'border-indigo-500/50' : 'border-zinc-800'} rounded-md px-3 py-2 text-zinc-200 font-mono focus:outline-none focus:border-zinc-600 transition-all`}
                            />
                        </div>

                        {/* Realtime Audio Sub-section */}
                        <div className="pt-4 mt-4 border-t border-zinc-800/50">
                            <h4 className="text-zinc-300 font-medium mb-1 flex items-center gap-2">
                                Realtime Audio
                            </h4>
                            <p className="text-zinc-500 text-xs mb-4 flex items-center gap-1.5">
                                <Info className="w-3 h-3" /> E.g. Google Gemini Live (25 tokens/sec = 1500/min).
                            </p>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Input Tokens / Min</label>
                                    <input 
                                        type="text"
                                        value={factors.realtimeInput}
                                        onChange={(e) => handleNumberInput(setFactors, 'realtimeInput', e.target.value)}
                                        className={`w-full bg-zinc-950 border ${factors.realtimeInput !== originalFactors.realtimeInput ? 'border-indigo-500/50' : 'border-zinc-800'} rounded-md px-3 py-2 text-zinc-200 font-mono focus:outline-none focus:border-zinc-600 transition-all`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Output Tokens / Min</label>
                                    <input 
                                        type="text"
                                        value={factors.realtimeOutput}
                                        onChange={(e) => handleNumberInput(setFactors, 'realtimeOutput', e.target.value)}
                                        className={`w-full bg-zinc-950 border ${factors.realtimeOutput !== originalFactors.realtimeOutput ? 'border-indigo-500/50' : 'border-zinc-800'} rounded-md px-3 py-2 text-zinc-200 font-mono focus:outline-none focus:border-zinc-600 transition-all`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto flex justify-end">
                        <button 
                            onClick={() => toast.success("Conversion factors saved successfully")}
                            disabled={!isFactorsDirty}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all ${isFactorsDirty ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
                        >
                            <Check className="w-4 h-4" /> Save Conversion Factors
                        </button>
                    </div>
                </div>

            </div>

            {/* Provider Navigation Tabs */}
            <div className="flex justify-center mt-12 mb-8">
                <div className="flex items-center gap-1 bg-zinc-900/80 p-1.5 rounded-full border border-zinc-800">
                    {['LLM', 'STT', 'TTS', 'Realtime'].map((tab) => {
                        const icons: any = { LLM: '💬', STT: '🎙️', TTS: '🔊', Realtime: '📡' };
                        const isActive = activeTab === tab;
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all ${
                                    isActive 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                                }`}
                            >
                                <span className={isActive ? '' : 'opacity-70'}>{icons[tab]}</span> 
                                {tab}
                                {tab === 'Realtime' && (
                                    <span className="flex h-2 w-2 relative ml-1">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Provider Pricing Grid Header (Sticky) */}
            <div className="sticky top-0 z-10 bg-[#09090b] py-4 border-b border-zinc-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Table className="w-5 h-5 text-indigo-400" /> 
                    {activeTab} Provider Pricing
                </h3>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleResetToDefaults}
                        className="flex items-center gap-2 px-4 py-2 bg-transparent border border-zinc-700 text-zinc-300 rounded-md hover:bg-zinc-800 transition-colors font-medium text-sm"
                    >
                        <RotateCcw className="w-4 h-4" /> Reset to Defaults
                    </button>
                    <button 
                        onClick={handleSaveAll}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md transition-colors font-medium text-sm shadow-lg shadow-green-900/20"
                    >
                        <Save className="w-4 h-4" /> Save All Prices
                    </button>
                </div>
            </div>

            {/* Pricing Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        {activeTab === 'LLM' && (
                            <>
                                <thead className="bg-black/50 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-800/50">
                                    <tr>
                                        <th className="px-6 py-4">PROVIDER</th>
                                        <th className="px-6 py-4">INPUT $ / 1M TOKENS</th>
                                        <th className="px-6 py-4">OUTPUT $ / 1M TOKENS</th>
                                        <th className="px-6 py-4 text-center">ENABLED</th>
                                        <th className="px-6 py-4 text-right">ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50">
                                    {llmProviders.map((provider, idx) => (
                                        <tr key={provider.id} className="hover:bg-zinc-800/20 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-white text-sm">{provider.name}</div>
                                                <div className="text-zinc-500 text-xs font-mono mt-0.5">{provider.id}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="relative w-32">
                                                    <span className="absolute left-3 top-1.5 text-zinc-500">$</span>
                                                    <input 
                                                        type="text" 
                                                        value={provider.input}
                                                        onChange={(e) => {
                                                            const newProviders = [...llmProviders];
                                                            if (e.target.value === '' || /^\\d*\\.?\\d*$/.test(e.target.value)) {
                                                                newProviders[idx].input = e.target.value;
                                                                setLlmProviders(newProviders);
                                                            }
                                                        }}
                                                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 pl-7 text-sm text-zinc-300 font-mono focus:outline-none focus:border-zinc-600 transition-colors"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="relative w-32">
                                                    <span className="absolute left-3 top-1.5 text-zinc-500">$</span>
                                                    <input 
                                                        type="text" 
                                                        value={provider.output}
                                                        onChange={(e) => {
                                                            const newProviders = [...llmProviders];
                                                            if (e.target.value === '' || /^\\d*\\.?\\d*$/.test(e.target.value)) {
                                                                newProviders[idx].output = e.target.value;
                                                                setLlmProviders(newProviders);
                                                            }
                                                        }}
                                                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 pl-7 text-sm text-zinc-300 font-mono focus:outline-none focus:border-zinc-600 transition-colors"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button 
                                                    onClick={() => {
                                                        const newProviders = [...llmProviders];
                                                        newProviders[idx].enabled = !newProviders[idx].enabled;
                                                        setLlmProviders(newProviders);
                                                    }}
                                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${provider.enabled ? 'bg-green-500' : 'bg-zinc-700'}`}
                                                >
                                                    <span className="sr-only">Toggle enabled</span>
                                                    <span aria-hidden="true" className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${provider.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => {
                                                        const newProviders = llmProviders.filter(p => p.id !== provider.id);
                                                        setLlmProviders(newProviders);
                                                    }}
                                                    className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors inline-block"
                                                    title="Delete Provider"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </>
                        )}
                        
                        {activeTab === 'STT' && (
                            <>
                                <thead className="bg-black/50 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-800/50">
                                    <tr>
                                        <th className="px-6 py-4">PROVIDER</th>
                                        <th className="px-6 py-4">$/MINUTE</th>
                                        <th className="px-6 py-4 text-center">ENABLED</th>
                                        <th className="px-6 py-4 text-right">ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50">
                                    {sttProviders.map((provider, idx) => (
                                        <tr key={provider.id} className="hover:bg-zinc-800/20 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-white text-sm">{provider.name}</div>
                                                <div className="text-zinc-500 text-xs font-mono mt-0.5">{provider.id}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="relative w-32">
                                                    <span className="absolute left-3 top-1.5 text-zinc-500">$</span>
                                                    <input 
                                                        type="text" 
                                                        value={provider.rate}
                                                        onChange={(e) => {
                                                            const newProviders = [...sttProviders];
                                                            if (e.target.value === '' || /^\\d*\\.?\\d*$/.test(e.target.value)) {
                                                                newProviders[idx].rate = e.target.value;
                                                                setSttProviders(newProviders);
                                                            }
                                                        }}
                                                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 pl-7 text-sm text-zinc-300 font-mono focus:outline-none focus:border-zinc-600 transition-colors"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button 
                                                    onClick={() => {
                                                        const newProviders = [...sttProviders];
                                                        newProviders[idx].enabled = !newProviders[idx].enabled;
                                                        setSttProviders(newProviders);
                                                    }}
                                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${provider.enabled ? 'bg-green-500' : 'bg-zinc-700'}`}
                                                >
                                                    <span className="sr-only">Toggle enabled</span>
                                                    <span aria-hidden="true" className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${provider.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => {
                                                        const newProviders = sttProviders.filter(p => p.id !== provider.id);
                                                        setSttProviders(newProviders);
                                                    }}
                                                    className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors inline-block"
                                                    title="Delete Provider"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </>
                        )}

                        {activeTab === 'TTS' && (
                            <>
                                <thead className="bg-black/50 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-800/50">
                                    <tr>
                                        <th className="px-6 py-4">PROVIDER</th>
                                        <th className="px-6 py-4">$/1M CHARACTERS</th>
                                        <th className="px-6 py-4 text-center">ENABLED</th>
                                        <th className="px-6 py-4 text-right">ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50">
                                    {ttsProviders.map((provider, idx) => (
                                        <tr key={provider.id} className="hover:bg-zinc-800/20 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-white text-sm">{provider.name}</div>
                                                <div className="text-zinc-500 text-xs font-mono mt-0.5">{provider.id}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="relative w-32">
                                                    <span className="absolute left-3 top-1.5 text-zinc-500">$</span>
                                                    <input 
                                                        type="text" 
                                                        value={provider.rate}
                                                        onChange={(e) => {
                                                            const newProviders = [...ttsProviders];
                                                            if (e.target.value === '' || /^\\d*\\.?\\d*$/.test(e.target.value)) {
                                                                newProviders[idx].rate = e.target.value;
                                                                setTtsProviders(newProviders);
                                                            }
                                                        }}
                                                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 pl-7 text-sm text-zinc-300 font-mono focus:outline-none focus:border-zinc-600 transition-colors"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button 
                                                    onClick={() => {
                                                        const newProviders = [...ttsProviders];
                                                        newProviders[idx].enabled = !newProviders[idx].enabled;
                                                        setTtsProviders(newProviders);
                                                    }}
                                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${provider.enabled ? 'bg-green-500' : 'bg-zinc-700'}`}
                                                >
                                                    <span className="sr-only">Toggle enabled</span>
                                                    <span aria-hidden="true" className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${provider.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => {
                                                        const newProviders = ttsProviders.filter(p => p.id !== provider.id);
                                                        setTtsProviders(newProviders);
                                                    }}
                                                    className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors inline-block"
                                                    title="Delete Provider"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </>
                        )}

                        {activeTab === 'Realtime' && (
                            <>
                                <thead className="bg-black/50 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-800/50">
                                    <tr>
                                        <th className="px-6 py-4">PROVIDER</th>
                                        <th className="px-6 py-4">INPUT $ / 1M TOKENS</th>
                                        <th className="px-6 py-4">OUTPUT $ / 1M TOKENS</th>
                                        <th className="px-6 py-4">$/MINUTE</th>
                                        <th className="px-6 py-4 text-center">ENABLED</th>
                                        <th className="px-6 py-4 text-right">ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50">
                                    {realtimeProviders.map((provider, idx) => (
                                        <tr key={provider.id} className="hover:bg-zinc-800/20 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-white text-sm">{provider.name}</div>
                                                <div className="text-zinc-500 text-xs font-mono mt-0.5">{provider.id}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {provider.input !== '' ? (
                                                    <div className="relative w-28">
                                                        <span className="absolute left-3 top-1.5 text-zinc-500">$</span>
                                                        <input 
                                                            type="text" 
                                                            value={provider.input}
                                                            onChange={(e) => {
                                                                const newProviders = [...realtimeProviders];
                                                                if (e.target.value === '' || /^\\d*\\.?\\d*$/.test(e.target.value)) {
                                                                    newProviders[idx].input = e.target.value;
                                                                    setRealtimeProviders(newProviders);
                                                                }
                                                            }}
                                                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 pl-7 text-sm text-zinc-300 font-mono focus:outline-none focus:border-zinc-600 transition-colors"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="text-zinc-600 font-mono w-28 text-center">—</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {provider.output !== '' ? (
                                                    <div className="relative w-28">
                                                        <span className="absolute left-3 top-1.5 text-zinc-500">$</span>
                                                        <input 
                                                            type="text" 
                                                            value={provider.output}
                                                            onChange={(e) => {
                                                                const newProviders = [...realtimeProviders];
                                                                if (e.target.value === '' || /^\\d*\\.?\\d*$/.test(e.target.value)) {
                                                                    newProviders[idx].output = e.target.value;
                                                                    setRealtimeProviders(newProviders);
                                                                }
                                                            }}
                                                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 pl-7 text-sm text-zinc-300 font-mono focus:outline-none focus:border-zinc-600 transition-colors"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="text-zinc-600 font-mono w-28 text-center">—</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {provider.minute !== '' ? (
                                                    <div className="relative w-28">
                                                        <span className="absolute left-3 top-1.5 text-zinc-500">$</span>
                                                        <input 
                                                            type="text" 
                                                            value={provider.minute}
                                                            onChange={(e) => {
                                                                const newProviders = [...realtimeProviders];
                                                                if (e.target.value === '' || /^\\d*\\.?\\d*$/.test(e.target.value)) {
                                                                    newProviders[idx].minute = e.target.value;
                                                                    setRealtimeProviders(newProviders);
                                                                }
                                                            }}
                                                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 pl-7 text-sm text-zinc-300 font-mono focus:outline-none focus:border-zinc-600 transition-colors"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="text-zinc-600 font-mono w-28 text-center">—</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button 
                                                    onClick={() => {
                                                        const newProviders = [...realtimeProviders];
                                                        newProviders[idx].enabled = !newProviders[idx].enabled;
                                                        setRealtimeProviders(newProviders);
                                                    }}
                                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${provider.enabled ? 'bg-green-500' : 'bg-zinc-700'}`}
                                                >
                                                    <span className="sr-only">Toggle enabled</span>
                                                    <span aria-hidden="true" className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${provider.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => {
                                                        const newProviders = realtimeProviders.filter(p => p.id !== provider.id);
                                                        setRealtimeProviders(newProviders);
                                                    }}
                                                    className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors inline-block"
                                                    title="Delete Provider"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </>
                        )}
                    </table>
                </div>
            </div>

            {/* Add Custom Footer */}
            {activeTab === 'LLM' && (
                <div className="mt-4 px-2">
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1.5"
                    >
                        (+) Add Custom LLM Provider
                    </button>
                </div>
            )}
            {activeTab === 'STT' && (
                <div className="mt-4 px-2">
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1.5"
                    >
                        (+) Add Custom STT Provider
                    </button>
                </div>
            )}
            {activeTab === 'TTS' && (
                <div className="mt-4 px-2">
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1.5"
                    >
                        (+) Add Custom TTS Provider
                    </button>
                </div>
            )}
            {activeTab === 'Realtime' && (
                <div className="mt-4 px-2">
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1.5"
                    >
                        (+) Add Custom Realtime Provider
                    </button>
                </div>
            )}

            {/* Pricing Information Footer */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-8 mt-12 mb-8">
                <h3 className="text-xl font-bold flex items-center gap-2 mb-8 text-white">
                    <Info className="w-6 h-6 text-blue-500" /> Pricing Information
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Column 1: How Cost is Calculated */}
                    <div>
                        <h4 className="font-bold text-white mb-4">How Cost is Calculated</h4>
                        <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                            Each call's cost is calculated from the agent's configured providers:
                        </p>
                        <ul className="space-y-3 text-sm text-zinc-300 font-mono bg-black/20 p-4 rounded-lg border border-zinc-800/50">
                            <li><span className="text-indigo-400 font-bold">LLM:</span> (Input tokens/min × input price) + (Output tokens/min × output price)</li>
                            <li><span className="text-emerald-400 font-bold">STT:</span> Duration × price per minute</li>
                            <li><span className="text-blue-400 font-bold">TTS:</span> (Characters/min × duration) × price per 1M characters</li>
                            <li className="pt-2 border-t border-zinc-800/50 text-zinc-400 leading-relaxed font-sans">
                                <strong>Realtime:</strong> For audio-to-audio agents, a single realtime provider replaces LLM+STT+TTS. 
                                Token-based providers use <span className="font-mono text-xs bg-zinc-800 px-1 rounded">(Audio tokens/min × input/output price)</span>. 
                                Flat-rate providers (e.g. xAI) use <span className="font-mono text-xs bg-zinc-800 px-1 rounded">duration × price per minute</span>.
                            </li>
                        </ul>
                    </div>

                    {/* Column 2: Currency & Sync Logic */}
                    <div>
                        <h4 className="font-bold text-white mb-4">Currency Display</h4>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            All base prices are stored in USD. Costs are converted to your default display currency using the exchange rates configured above. Margins are applied per-user at display time.
                        </p>
                        
                        <div className="bg-emerald-900/10 border border-emerald-800/50 rounded-lg p-4 mt-6">
                            <p className="text-sm text-emerald-500/90 flex gap-2 leading-relaxed">
                                <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" /> 
                                <span><strong>Tip:</strong> Provider prices reflect list rates. Adjust them to match your actual contracted rates for more accurate cost tracking.</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <AddProviderModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                category={activeTab}
                onSuccess={fetchConfig}
            />

        </div>
    );
}

// Future integration for Call History Tab
export const calculateTotalCost = (
    aiCost: number, // LLM + STT + TTS
    durationMinutes: number,
    telephonyRate: number
) => {
    return aiCost + (durationMinutes * telephonyRate);
};

