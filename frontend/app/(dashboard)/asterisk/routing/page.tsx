"use client";
import React, { useState } from "react";
import {
    Globe, Plus, Trash2, Settings, AlertTriangle, CheckCircle2,
    MapPin, Phone, TrendingDown, ArrowRight, RefreshCw, ToggleLeft, ToggleRight
} from "lucide-react";

interface RoutingRule {
    id: string;
    name: string;
    prefix: string;
    country: string;
    flag: string;
    type: string;
    carrier: string;
    rateCentPerMin: number;
    priority: number;
    enabled: boolean;
    callsRouted: number;
}

const INITIAL_RULES: RoutingRule[] = [
    { id: "r1", name: "AU Local (02/03/07/08)", prefix: "+612|+613|+617|+618", country: "Australia", flag: "🇦🇺", type: "Geographic", carrier: "Vonex-AU-Primary", rateCentPerMin: 1.2, priority: 1, enabled: true, callsRouted: 2341 },
    { id: "r2", name: "AU Mobile (04)", prefix: "+614", country: "Australia", flag: "🇦🇺", type: "Mobile", carrier: "MyNetFone-AU", rateCentPerMin: 2.8, priority: 1, enabled: true, callsRouted: 876 },
    { id: "r3", name: "AU 1300/1800", prefix: "1300|1800", country: "Australia", flag: "🇦🇺", type: "Toll-Free", carrier: "Symbio-AU-Backup", rateCentPerMin: 0.0, priority: 1, enabled: true, callsRouted: 234 },
    { id: "r4", name: "US Domestic", prefix: "+1", country: "United States", flag: "🇺🇸", type: "Geographic", carrier: "Telnyx-Global", rateCentPerMin: 0.8, priority: 2, enabled: true, callsRouted: 145 },
    { id: "r5", name: "UK Geographic", prefix: "+44", country: "United Kingdom", flag: "🇬🇧", type: "Geographic", carrier: "Telnyx-Global", rateCentPerMin: 1.0, priority: 2, enabled: true, callsRouted: 67 },
    { id: "r6", name: "NZ Geographic", prefix: "+64", country: "New Zealand", flag: "🇳🇿", type: "Geographic", carrier: "Vonex-AU-Primary", rateCentPerMin: 3.5, priority: 2, enabled: true, callsRouted: 32 },
    { id: "r7", name: "International Fallback", prefix: "+", country: "Global", flag: "🌐", type: "International", carrier: "Telnyx-Global", rateCentPerMin: 8.0, priority: 99, enabled: true, callsRouted: 12 },
];

const CARRIERS = ["Vonex-AU-Primary", "MyNetFone-AU", "Symbio-AU-Backup", "Telnyx-Global", "Twilio-Fallback"];
const TYPES = ["Geographic", "Mobile", "Toll-Free", "International", "Premium"];

export default function RoutingPage() {
    const [rules, setRules] = useState(INITIAL_RULES);
    const [onShoreMode, setOnShoreMode] = useState(true);
    const [showAdd, setShowAdd] = useState(false);

    const toggleRule = (id: string) => setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    const deleteRule = (id: string) => setRules(prev => prev.filter(r => r.id !== id));

    const totalCalls = rules.reduce((s, r) => s + r.callsRouted, 0);
    const avgRate = rules.filter(r => r.enabled).reduce((s, r) => s + r.rateCentPerMin, 0) / rules.filter(r => r.enabled).length;

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200 p-8 md:p-10">
            <div className="max-w-[1600px] mx-auto space-y-8">

                <div className="bg-gradient-to-r from-indigo-950/40 to-violet-950/30 border border-indigo-900/30 rounded-2xl p-6 flex items-center gap-5">
                    <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center">
                        <Globe className="w-7 h-7 text-indigo-400" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-white mb-1">E.164 Multi-Country Routing</h1>
                        <p className="text-xs text-zinc-400">Route outbound calls to AU/US/UK/NZ and global destinations via least-cost routing. On-Shore mode forces all AU calls through AU-based carriers. International routes via Telnyx Global.</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 bg-zinc-800 rounded-xl px-4 py-3">
                            <span className="text-xs font-bold text-zinc-300">On-Shore Mode (AU Only)</span>
                            <button onClick={() => setOnShoreMode(p => !p)} className={onShoreMode ? "text-emerald-400" : "text-zinc-600"}>
                                {onShoreMode ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                            </button>
                        </div>
                        <div className="text-right">
                            <div className="text-xl font-bold text-indigo-400">{totalCalls.toLocaleString()}</div>
                            <div className="text-[10px] text-zinc-500">Calls Routed</div>
                        </div>
                        <button onClick={() => setShowAdd(p => !p)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-colors">
                            <Plus className="w-4 h-4" /> Add Route
                        </button>
                    </div>
                </div>

                {onShoreMode && (
                    <div className="bg-emerald-950/30 border border-emerald-900/30 rounded-xl p-4 flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                        <p className="text-xs text-emerald-300"><strong>On-Shore Mode Active:</strong> All AU geographic and mobile calls are forced through Vonex-AU or MyNetFone-AU carriers. International traffic still routes via Telnyx Global.</p>
                    </div>
                )}

                {showAdd && (
                    <div className="bg-zinc-900 border border-indigo-900/40 rounded-2xl p-6 space-y-4">
                        <h3 className="text-sm font-bold text-white">Add Routing Rule</h3>
                        <div className="grid md:grid-cols-4 gap-4">
                            {["Rule Name", "E.164 Prefix", "Country"].map(label => (
                                <div key={label}>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">{label}</label>
                                    <input className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500" placeholder={label} />
                                </div>
                            ))}
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Carrier</label>
                                <select className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500">
                                    {CARRIERS.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowAdd(false)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-bold">Save Route</button>
                            <button onClick={() => setShowAdd(false)} className="bg-zinc-800 text-zinc-300 px-5 py-2 rounded-xl text-xs font-bold hover:bg-zinc-700">Cancel</button>
                        </div>
                    </div>
                )}

                {/* Rules table */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-12 px-5 py-3 border-b border-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        <div className="col-span-3">Route Name</div>
                        <div className="col-span-2">Prefix</div>
                        <div className="col-span-2">Carrier</div>
                        <div className="col-span-1">Rate (¢/min)</div>
                        <div className="col-span-1">Priority</div>
                        <div className="col-span-1">Calls</div>
                        <div className="col-span-2">Actions</div>
                    </div>
                    <div className="divide-y divide-zinc-800/50">
                        {rules.map(rule => (
                            <div key={rule.id} className={`grid grid-cols-12 items-center px-5 py-4 hover:bg-zinc-800/20 transition-colors ${!rule.enabled ? "opacity-50" : ""}`}>
                                <div className="col-span-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-base">{rule.flag}</span>
                                        <div>
                                            <div className="text-xs font-bold text-zinc-200">{rule.name}</div>
                                            <div className="text-[10px] text-zinc-500">{rule.type}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-2 font-mono text-xs text-zinc-400 truncate">{rule.prefix}</div>
                                <div className="col-span-2 text-xs text-zinc-300">{rule.carrier}</div>
                                <div className="col-span-1 font-mono text-xs text-emerald-400">{rule.rateCentPerMin === 0 ? "Free" : rule.rateCentPerMin.toFixed(1)}</div>
                                <div className="col-span-1 text-xs text-zinc-500">{rule.priority}</div>
                                <div className="col-span-1 text-xs text-zinc-400">{rule.callsRouted.toLocaleString()}</div>
                                <div className="col-span-2 flex gap-2">
                                    <button onClick={() => toggleRule(rule.id)} className={`text-sm ${rule.enabled ? "text-emerald-400" : "text-zinc-600"}`}>
                                        {rule.enabled ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                                    </button>
                                    <button onClick={() => deleteRule(rule.id)} className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
