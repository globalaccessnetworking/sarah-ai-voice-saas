"use client";
import React, { useState } from "react";
import {
    Globe, CheckCircle2, Star, Zap, Phone, Shield, Clock,
    ArrowRight, Plus, ExternalLink, Info, TrendingDown, RefreshCw
} from "lucide-react";

interface CarrierPlan {
    id: string;
    name: string;
    country: string;
    flag: string;
    type: "Wholesale" | "Retail" | "Bring Your Own";
    ratePerMin: number;
    setupFee: number;
    monthlyFee: number;
    includedMinutes: number;
    support: "24/7" | "Business Hours" | "Email Only";
    sla: string;
    features: string[];
    regions: string[];
    status: "Available" | "Popular" | "Enterprise Only";
    numberTypes: string[];
}

const MARKETPLACE: CarrierPlan[] = [
    {
        id: "vonex-pro", name: "Vonex AU Pro", country: "Australia", flag: "🇦🇺", type: "Wholesale",
        ratePerMin: 0.012, setupFee: 0, monthlyFee: 29, includedMinutes: 0,
        support: "Business Hours", sla: "99.9%", features: ["Local DIDs", "1300/1800", "SMS", "Fax", "SIP Trunking"],
        regions: ["Sydney", "Melbourne", "Brisbane", "Perth"], status: "Popular",
        numberTypes: ["Geographic", "1300", "1800", "Mobile"]
    },
    {
        id: "mynetfone-biz", name: "MyNetFone Business", country: "Australia", flag: "🇦🇺", type: "Wholesale",
        ratePerMin: 0.010, setupFee: 0, monthlyFee: 19, includedMinutes: 500,
        support: "Business Hours", sla: "99.9%", features: ["Local DIDs", "Number Porting", "Voicemail", "Geo DIDs"],
        regions: ["AU National"], status: "Available",
        numberTypes: ["Geographic", "1300", "1800"]
    },
    {
        id: "symbio-carrier", name: "Symbio Networks", country: "Australia", flag: "🇦🇺", type: "Wholesale",
        ratePerMin: 0.009, setupFee: 99, monthlyFee: 49, includedMinutes: 0,
        support: "24/7", sla: "99.99%", features: ["Bulk DIDs", "High CPS", "Number Porting", "ENUM", "White-Label"],
        regions: ["AU National", "NZ"], status: "Enterprise Only",
        numberTypes: ["Geographic", "1300", "1800", "Mobile", "International"]
    },
    {
        id: "telnyx-global", name: "Telnyx Global", country: "Global", flag: "🌐", type: "Wholesale",
        ratePerMin: 0.007, setupFee: 0, monthlyFee: 0, includedMinutes: 0,
        support: "24/7", sla: "99.999%", features: ["US/AU/UK/NZ/EU", "Elastic SIP", "Real-time CDR", "WebRTC", "SMS"],
        regions: ["Global (40+ countries)"], status: "Popular",
        numberTypes: ["Geographic", "Toll-Free", "Mobile", "International"]
    },
    {
        id: "byot", name: "Bring Your Own Trunk", country: "Any", flag: "⚙️", type: "Bring Your Own",
        ratePerMin: 0, setupFee: 0, monthlyFee: 0, includedMinutes: 0,
        support: "Email Only", sla: "Your carrier SLA", features: ["Custom SIP credentials", "PJSIP config helper", "Test tool included"],
        regions: ["Any carrier"], status: "Available",
        numberTypes: ["Any"]
    },
];

export default function TrunkMarketplacePage() {
    const [provisioning, setProvisioning] = useState<string | null>(null);
    const [provisioned, setProvisioned] = useState<string[]>([]);

    const handleProvision = async (id: string) => {
        setProvisioning(id);
        await new Promise(r => setTimeout(r, 2000));
        setProvisioning(null);
        setProvisioned(prev => [...prev, id]);
    };

    const twilioCost = 0.085;

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200 p-8 md:p-10">
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-950/40 to-cyan-950/30 border border-blue-900/30 rounded-2xl p-6 flex items-center gap-5">
                    <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center">
                        <Globe className="w-7 h-7 text-blue-400" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-white mb-1">SIP Trunk Marketplace</h1>
                        <p className="text-xs text-zinc-400">Choose from our pre-negotiated carrier rates or bring your own trunk. One-click provisioning via Asterisk PJSIP. Compare rates, SLA, regions, and features side-by-side.</p>
                    </div>
                    <div className="text-right bg-red-950/30 border border-red-900/30 rounded-xl px-5 py-3">
                        <div className="flex items-center gap-2 mb-0.5">
                            <TrendingDown className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm font-bold text-white">vs Twilio: $0.085/min</span>
                        </div>
                        <div className="text-[10px] text-emerald-400">Save up to 92% on AU calls</div>
                    </div>
                </div>

                {/* Plans grid */}
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {MARKETPLACE.map(plan => (
                        <div key={plan.id} className={`bg-zinc-900 border rounded-2xl p-5 flex flex-col gap-4 relative ${plan.status === "Popular" ? "border-blue-500/40" : "border-zinc-800"}`}>
                            {plan.status === "Popular" && (
                                <div className="absolute -top-2.5 left-5">
                                    <span className="text-[10px] font-bold text-white bg-blue-600 px-3 py-1 rounded-full flex items-center gap-1">
                                        <Star className="w-2.5 h-2.5 fill-white" /> Popular
                                    </span>
                                </div>
                            )}

                            <div className="flex items-start gap-3">
                                <span className="text-2xl">{plan.flag}</span>
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-white">{plan.name}</div>
                                    <div className="text-[10px] text-zinc-500">{plan.type} · {plan.sla} SLA · {plan.support}</div>
                                </div>
                            </div>

                            {/* Rate */}
                            {plan.type !== "Bring Your Own" && (
                                <div className="bg-zinc-800 rounded-xl p-4">
                                    <div className="flex items-end gap-2 mb-1">
                                        <span className="text-2xl font-bold font-mono text-emerald-400">${plan.ratePerMin.toFixed(3)}</span>
                                        <span className="text-xs text-zinc-500 mb-1">/min</span>
                                        <span className="ml-auto text-[10px] text-emerald-400 font-bold">
                                            {Math.round(((twilioCost - plan.ratePerMin) / twilioCost) * 100)}% cheaper than Twilio
                                        </span>
                                    </div>
                                    {plan.monthlyFee > 0 && (
                                        <div className="text-[10px] text-zinc-500">+${plan.monthlyFee}/mo platform fee {plan.includedMinutes > 0 ? `· ${plan.includedMinutes} min included` : ""}</div>
                                    )}
                                    {plan.setupFee > 0 && <div className="text-[10px] text-zinc-600">${plan.setupFee} one-time setup</div>}
                                    {plan.monthlyFee === 0 && plan.setupFee === 0 && <div className="text-[10px] text-emerald-500">No monthly fee, no setup fee</div>}
                                </div>
                            )}

                            {/* Features */}
                            <div className="flex flex-wrap gap-1.5">
                                {plan.features.map(f => (
                                    <span key={f} className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">{f}</span>
                                ))}
                            </div>

                            {/* Regions */}
                            <div className="text-[10px] text-zinc-500">
                                <span className="font-bold text-zinc-400">Regions: </span>
                                {plan.regions.join(" · ")}
                            </div>

                            {/* Number types */}
                            <div className="flex flex-wrap gap-1.5">
                                {plan.numberTypes.map(nt => (
                                    <span key={nt} className="text-[9px] font-bold text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">{nt}</span>
                                ))}
                            </div>

                            {/* Action */}
                            <button onClick={() => !provisioned.includes(plan.id) && handleProvision(plan.id)}
                                disabled={provisioning === plan.id || plan.status === "Enterprise Only"}
                                className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                                    provisioned.includes(plan.id) ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                                    : plan.status === "Enterprise Only" ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                                    : provisioning === plan.id ? "bg-blue-600/30 text-blue-400"
                                    : plan.type === "Bring Your Own" ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
                                    : "bg-blue-600 hover:bg-blue-500 text-white"
                                }`}>
                                {provisioned.includes(plan.id) ? <><CheckCircle2 className="w-4 h-4" /> Provisioned</>
                                    : provisioning === plan.id ? <><RefreshCw className="w-4 h-4 animate-spin" /> Provisioning...</>
                                    : plan.status === "Enterprise Only" ? "Contact Sales"
                                    : plan.type === "Bring Your Own" ? <><Plus className="w-4 h-4" /> Configure BYOT</>
                                    : <><Zap className="w-4 h-4" /> Provision Now</>}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
