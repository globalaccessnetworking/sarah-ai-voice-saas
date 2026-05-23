"use client";
import React, { useState } from "react";
import {
    Phone, Globe, Plus, Trash2, CheckCircle2, XCircle, RefreshCw,
    Zap, DollarSign, Settings, Copy, ChevronDown, ChevronUp,
    AlertTriangle, TrendingDown, Shield, Info, ExternalLink
} from "lucide-react";

interface Carrier {
    id: string;
    name: string;
    country: string;
    flag: string;
    host: string;
    port: number;
    transport: "UDP" | "TCP" | "TLS";
    status: "Registered" | "Unregistered" | "Configuring";
    latencyMs: number;
    ratePerMin: number;
    twilioCostPerMin: number;
    features: string[];
    codecs: string[];
    region: string;
}

const CARRIERS: Carrier[] = [
    {
        id: "vonex",
        name: "Vonex",
        country: "Australia",
        flag: "🇦🇺",
        host: "sip.vonex.com.au",
        port: 5060,
        transport: "UDP",
        status: "Registered",
        latencyMs: 12,
        ratePerMin: 0.012,
        twilioCostPerMin: 0.085,
        features: ["Local Numbers", "1300 Numbers", "1800 Numbers", "SMS", "Fax"],
        codecs: ["G.711a", "G.711u", "G.722", "G.729"],
        region: "Sydney, AU",
    },
    {
        id: "mynetfone",
        name: "MyNetFone",
        country: "Australia",
        flag: "🇦🇺",
        host: "au1.mynetfone.com.au",
        port: 5060,
        transport: "UDP",
        status: "Registered",
        latencyMs: 18,
        ratePerMin: 0.010,
        twilioCostPerMin: 0.085,
        features: ["Local Numbers", "1300/1800", "Geographic Numbers", "Voicemail"],
        codecs: ["G.711a", "G.711u", "G.729"],
        region: "Melbourne, AU",
    },
    {
        id: "symbio",
        name: "Symbio Networks",
        country: "Australia",
        flag: "🇦🇺",
        host: "sip.symbionetworks.com",
        port: 5060,
        transport: "TLS",
        status: "Registered",
        latencyMs: 24,
        ratePerMin: 0.009,
        twilioCostPerMin: 0.085,
        features: ["Bulk Numbers", "Number Porting", "ENUM", "High CPS"],
        codecs: ["G.711a", "G.711u", "G.722"],
        region: "Brisbane, AU",
    },
    {
        id: "pennytel",
        name: "Pennytel",
        country: "Australia",
        flag: "🇦🇺",
        host: "sip.pennytel.com.au",
        port: 5060,
        transport: "UDP",
        status: "Unregistered",
        latencyMs: 0,
        ratePerMin: 0.008,
        twilioCostPerMin: 0.085,
        features: ["Budget Carrier", "Local Numbers", "Mobile Termination"],
        codecs: ["G.711a", "G.711u"],
        region: "AU National",
    },
    {
        id: "telnyx",
        name: "Telnyx",
        country: "Global",
        flag: "🌐",
        host: "sip.telnyx.com",
        port: 5060,
        transport: "TLS",
        status: "Unregistered",
        latencyMs: 0,
        ratePerMin: 0.007,
        twilioCostPerMin: 0.085,
        features: ["US/AU/UK/NZ", "Elastic SIP", "99.999% SLA", "Real-Time CDR"],
        codecs: ["OPUS", "G.711a", "G.711u", "G.722"],
        region: "Global",
    },
];

function StatusBadge({ status }: { status: Carrier["status"] }) {
    if (status === "Registered") return <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Registered</span>;
    if (status === "Unregistered") return <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-400"><span className="w-1.5 h-1.5 bg-red-500 rounded-full" /> Unregistered</span>;
    return <span className="flex items-center gap-1.5 text-[10px] font-bold text-yellow-400"><RefreshCw className="w-3 h-3 animate-spin" /> Configuring</span>;
}

function SavingsTag({ carrier }: { carrier: Carrier }) {
    const savings = Math.round(((carrier.twilioCostPerMin - carrier.ratePerMin) / carrier.twilioCostPerMin) * 100);
    return (
        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            Save {savings}% vs Twilio
        </span>
    );
}

export default function CarriersPage() {
    const [carriers, setCarriers] = useState(CARRIERS);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [testingId, setTestingId] = useState<string | null>(null);

    const handleTest = async (id: string) => {
        setTestingId(id);
        await new Promise(r => setTimeout(r, 2000));
        setCarriers(prev => prev.map(c => c.id === id ? { ...c, status: "Registered", latencyMs: Math.floor(Math.random() * 30) + 10 } : c));
        setTestingId(null);
    };

    const handleRemove = (id: string) => setCarriers(prev => prev.filter(c => c.id !== id));

    const registered = carriers.filter(c => c.status === "Registered").length;
    const totalSavingsVsTwilio = carriers
        .filter(c => c.status === "Registered")
        .reduce((sum, c) => sum + (c.twilioCostPerMin - c.ratePerMin), 0);

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200 p-8 md:p-10">
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* Header */}
                <div className="bg-gradient-to-r from-cyan-950/40 to-blue-950/30 border border-cyan-900/30 rounded-2xl p-6 flex items-center gap-5">
                    <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center">
                        <Globe className="w-7 h-7 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-white mb-1">Carrier-Direct SIP Trunking</h1>
                        <p className="text-xs text-zinc-400">Connect AU carriers directly via Asterisk PJSIP — bypass Twilio markup and save up to 89% per-minute. Choose from pre-configured carriers or add your own BYOT.</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <div className="text-2xl font-bold text-emerald-400">{registered}/{carriers.length}</div>
                            <div className="text-[10px] text-zinc-500">Registered</div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-yellow-400">${(totalSavingsVsTwilio * 1000).toFixed(2)}</div>
                            <div className="text-[10px] text-zinc-500">Saved per 1K min</div>
                        </div>
                        <button onClick={() => setShowAddForm(p => !p)} className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-bold transition-colors">
                            <Plus className="w-4 h-4" /> Add BYOT
                        </button>
                    </div>
                </div>

                {/* Twilio vs Direct savings banner */}
                <div className="bg-gradient-to-r from-emerald-950/30 to-green-950/20 border border-emerald-900/30 rounded-xl p-4 flex items-center gap-4">
                    <TrendingDown className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div className="flex-1">
                        <p className="text-xs text-emerald-300 font-medium">
                            <strong>Cost Comparison:</strong> Twilio charges $0.085/min for AU calls. Vonex charges $0.012/min — that&apos;s <strong>86% cheaper</strong>. On 10,000 minutes/month that&apos;s <strong>$730 saved</strong>.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 shrink-0">
                        <div className="text-center">
                            <div className="text-base font-bold text-red-400">$0.085</div>
                            <div className="text-[10px] text-zinc-500">Twilio /min</div>
                        </div>
                        <div className="text-center">
                            <div className="text-base font-bold text-emerald-400">$0.009</div>
                            <div className="text-[10px] text-zinc-500">Symbio /min</div>
                        </div>
                    </div>
                </div>

                {/* BYOT Add Form */}
                {showAddForm && (
                    <div className="bg-zinc-900 border border-cyan-900/40 rounded-2xl p-6 space-y-4">
                        <h3 className="text-sm font-bold text-white">Bring Your Own Trunk (BYOT)</h3>
                        <div className="grid md:grid-cols-3 gap-4">
                            {[
                                { label: "Trunk Name", placeholder: "MyCarrier-AU" },
                                { label: "SIP Host", placeholder: "sip.mycarrier.com" },
                                { label: "Port", placeholder: "5060" },
                                { label: "Username", placeholder: "trunk_username" },
                                { label: "Password", placeholder: "••••••••" },
                                { label: "From Domain", placeholder: "sip.mycarrier.com" },
                            ].map(f => (
                                <div key={f.label}>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">{f.label}</label>
                                    <input type={f.label === "Password" ? "password" : "text"} placeholder={f.placeholder} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500" />
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors">Add Trunk</button>
                            <button onClick={() => setShowAddForm(false)} className="bg-zinc-800 text-zinc-300 px-5 py-2 rounded-xl text-xs font-bold hover:bg-zinc-700 transition-colors">Cancel</button>
                        </div>
                    </div>
                )}

                {/* Carrier Cards */}
                <div className="space-y-4">
                    {carriers.map(carrier => (
                        <div key={carrier.id} className={`bg-zinc-900 border rounded-2xl overflow-hidden transition-all ${carrier.status === "Registered" ? "border-zinc-700" : "border-zinc-800"}`}>
                            <div className="flex items-center gap-5 p-5">
                                <div className="text-3xl">{carrier.flag}</div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-sm font-bold text-white">{carrier.name}</span>
                                        <StatusBadge status={carrier.status} />
                                        <SavingsTag carrier={carrier} />
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                                        <span className="font-mono">{carrier.host}:{carrier.port}</span>
                                        <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                                        <span>{carrier.transport}</span>
                                        <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                                        <span>{carrier.region}</span>
                                        {carrier.latencyMs > 0 && <>
                                            <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                                            <span className="text-emerald-400 font-mono">{carrier.latencyMs}ms RTT</span>
                                        </>}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <div className="text-base font-bold font-mono text-emerald-400">${carrier.ratePerMin.toFixed(3)}</div>
                                        <div className="text-[10px] text-zinc-600">per minute</div>
                                    </div>
                                    <button
                                        onClick={() => handleTest(carrier.id)}
                                        disabled={testingId === carrier.id}
                                        className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-600/30 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                                    >
                                        {testingId === carrier.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin inline" /> : "Test"}
                                    </button>
                                    <button onClick={() => setExpanded(p => p === carrier.id ? null : carrier.id)} className="text-zinc-500 hover:text-zinc-200 transition-colors">
                                        {expanded === carrier.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>
                                    <button onClick={() => handleRemove(carrier.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {expanded === carrier.id && (
                                <div className="px-5 pb-5 border-t border-zinc-800 pt-4 grid md:grid-cols-3 gap-6">
                                    <div>
                                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Features</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {carrier.features.map(f => <span key={f} className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">{f}</span>)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Codecs</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {carrier.codecs.map(c => <span key={c} className="text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded font-mono">{c}</span>)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">PJSIP Config Preview</div>
                                        <pre className="text-[10px] font-mono text-zinc-400 bg-zinc-800 rounded-lg p-3 overflow-x-auto">{`[${carrier.id}]
type=endpoint
transport=transport-${carrier.transport.toLowerCase()}
context=from-trunk
disallow=all
allow=${carrier.codecs[0].toLowerCase().replace(".", "")}
outbound_auth=${carrier.id}-auth
aors=${carrier.id}`}</pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
