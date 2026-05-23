"use client";
import React, { useState } from "react";
import {
    Globe, Plus, Trash2, Settings, ChevronDown, CheckCircle2,
    ArrowRight, Server, Users, Phone, Clock, Shield, Copy, Edit3
} from "lucide-react";

interface SubAccount {
    id: string;
    companyName: string;
    domain: string;
    contactEmail: string;
    maxTrunks: number;
    maxChannels: number;
    maxRecordingGB: number;
    sipCredentials: { username: string; password: string; registrar: string };
    plan: "Starter" | "Professional" | "Enterprise";
    status: "Active" | "Suspended" | "Provisioning";
    callsMonth: number;
    minutesMonth: number;
    portalUrl: string;
    brandColor: string;
    logoUrl: string;
}

const DEMO_ACCOUNTS: SubAccount[] = [
    {
        id: "sa1", companyName: "Bright Smiles Dental Group", domain: "brightsmilesai.com", contactEmail: "admin@brightsmilesai.com",
        maxTrunks: 3, maxChannels: 10, maxRecordingGB: 50,
        sipCredentials: { username: "brightsmilesai_pbx", password: "••••••••••••", registrar: "pbx.yourdomain.com" },
        plan: "Professional", status: "Active", callsMonth: 1240, minutesMonth: 3720, portalUrl: "https://brightsmilesai.voiceai.app",
        brandColor: "#06b6d4", logoUrl: ""
    },
    {
        id: "sa2", companyName: "Peak Performance Gym Network", domain: "peakperf.ai", contactEmail: "it@peakperf.com",
        maxTrunks: 2, maxChannels: 6, maxRecordingGB: 25,
        sipCredentials: { username: "peakperf_pbx", password: "••••••••••••", registrar: "pbx.yourdomain.com" },
        plan: "Starter", status: "Active", callsMonth: 430, minutesMonth: 1075, portalUrl: "https://peakperf.voiceai.app",
        brandColor: "#f59e0b", logoUrl: ""
    },
    {
        id: "sa3", companyName: "City Medical Centre", domain: "citymedai.com", contactEmail: "admin@citymedai.com",
        maxTrunks: 5, maxChannels: 20, maxRecordingGB: 200,
        sipCredentials: { username: "citymedai_pbx", password: "••••••••••••", registrar: "pbx.yourdomain.com" },
        plan: "Enterprise", status: "Provisioning", callsMonth: 0, minutesMonth: 0, portalUrl: "https://citymedai.voiceai.app",
        brandColor: "#6366f1", logoUrl: ""
    },
];

const PLAN_COLORS = {
    Starter: "text-zinc-400 bg-zinc-800",
    Professional: "text-blue-400 bg-blue-500/10 border border-blue-500/20",
    Enterprise: "text-violet-400 bg-violet-500/10 border border-violet-500/20",
};

const STATUS_COLORS = {
    Active: "text-emerald-400 bg-emerald-500/10",
    Suspended: "text-red-400 bg-red-500/10",
    Provisioning: "text-yellow-400 bg-yellow-500/10",
};

export default function WhiteLabelPage() {
    const [accounts, setAccounts] = useState(DEMO_ACCOUNTS);
    const [expanded, setExpanded] = useState<string | null>("sa1");
    const [copied, setCopied] = useState<string | null>(null);

    const copyText = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    };

    const totalCalls = accounts.reduce((s, a) => s + a.callsMonth, 0);

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200 p-8 md:p-10">
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* Header */}
                <div className="bg-gradient-to-r from-violet-950/40 to-indigo-950/30 border border-violet-900/30 rounded-2xl p-6 flex items-center gap-5">
                    <div className="w-14 h-14 bg-violet-500/10 border border-violet-500/20 rounded-2xl flex items-center justify-center">
                        <Server className="w-7 h-7 text-violet-400" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-xl font-bold text-white">White-Label PBX</h1>
                            <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-full uppercase tracking-widest">Agency Feature</span>
                        </div>
                        <p className="text-xs text-zinc-400">Give each agency client their own branded PBX sub-account. Custom domain, SIP credentials, resource quotas, and white-labelled portal at their own URL.</p>
                    </div>
                    <div className="flex gap-5">
                        <div className="text-right">
                            <div className="text-2xl font-bold text-violet-400">{accounts.length}</div>
                            <div className="text-[10px] text-zinc-500">Sub-Accounts</div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-white">{totalCalls.toLocaleString()}</div>
                            <div className="text-[10px] text-zinc-500">Calls This Month</div>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-bold transition-colors">
                            <Plus className="w-4 h-4" /> New Sub-Account
                        </button>
                    </div>
                </div>

                {/* Accounts */}
                <div className="space-y-4">
                    {accounts.map(acc => (
                        <div key={acc.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                            <div className="flex items-center gap-5 p-5 cursor-pointer hover:bg-zinc-800/20" onClick={() => setExpanded(p => p === acc.id ? null : acc.id)}>
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: acc.brandColor + "20", border: `1px solid ${acc.brandColor}40`, color: acc.brandColor }}>
                                    {acc.companyName.substring(0, 2)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-0.5">
                                        <span className="text-sm font-bold text-white">{acc.companyName}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${STATUS_COLORS[acc.status]}`}>{acc.status}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${PLAN_COLORS[acc.plan]}`}>{acc.plan}</span>
                                    </div>
                                    <div className="text-[10px] text-zinc-500">{acc.domain} · {acc.contactEmail}</div>
                                </div>
                                <div className="flex items-center gap-6 text-right">
                                    <div>
                                        <div className="text-sm font-bold text-zinc-300">{acc.callsMonth.toLocaleString()}</div>
                                        <div className="text-[10px] text-zinc-600">calls</div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-zinc-300">{acc.minutesMonth.toLocaleString()}</div>
                                        <div className="text-[10px] text-zinc-600">minutes</div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-zinc-300">{acc.maxTrunks} trunks / {acc.maxChannels} ch</div>
                                        <div className="text-[10px] text-zinc-600">quota</div>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${expanded === acc.id ? "rotate-180" : ""}`} />
                                </div>
                            </div>

                            {expanded === acc.id && (
                                <div className="border-t border-zinc-800 p-5 grid md:grid-cols-3 gap-6">
                                    {/* SIP credentials */}
                                    <div>
                                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">SIP Credentials</div>
                                        <div className="space-y-2">
                                            {Object.entries(acc.sipCredentials).map(([key, val]) => (
                                                <div key={key} className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-2">
                                                    <span className="text-[10px] text-zinc-500 w-16 shrink-0">{key}</span>
                                                    <span className="text-xs font-mono text-zinc-300 flex-1 truncate">{val}</span>
                                                    <button onClick={() => copyText(val, key + acc.id)} className="text-zinc-500 hover:text-zinc-200 shrink-0">
                                                        {copied === key + acc.id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Portal & branding */}
                                    <div>
                                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Portal & Branding</div>
                                        <div className="space-y-3">
                                            <div>
                                                <div className="text-[10px] text-zinc-500 mb-1">Portal URL</div>
                                                <div className="flex items-center gap-2">
                                                    <div className="bg-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-300 flex-1 truncate">{acc.portalUrl}</div>
                                                    <button onClick={() => copyText(acc.portalUrl, "url" + acc.id)} className="text-zinc-500 hover:text-zinc-200">
                                                        {copied === "url" + acc.id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-zinc-500 mb-1">Brand Color</div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded" style={{ background: acc.brandColor }} />
                                                    <span className="text-xs font-mono text-zinc-400">{acc.brandColor}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Quota */}
                                    <div>
                                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Resource Quota</div>
                                        <div className="space-y-2">
                                            {[
                                                { label: "SIP Trunks", current: 2, max: acc.maxTrunks },
                                                { label: "Max Channels", current: 4, max: acc.maxChannels },
                                                { label: "Recording GB", current: 12, max: acc.maxRecordingGB },
                                            ].map(q => (
                                                <div key={q.label}>
                                                    <div className="flex justify-between text-[10px] text-zinc-500 mb-0.5">
                                                        <span>{q.label}</span>
                                                        <span>{q.current}/{q.max}</span>
                                                    </div>
                                                    <div className="w-full bg-zinc-800 rounded-full h-1.5">
                                                        <div className="h-1.5 rounded-full bg-violet-500" style={{ width: `${(q.current / q.max) * 100}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
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
