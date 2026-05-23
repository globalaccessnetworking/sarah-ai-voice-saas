"use client";
import React, { useState } from "react";
import {
    Building2, Phone, Cpu, CheckCircle2, ArrowRight, ArrowLeft,
    Zap, Shield, Globe, RefreshCw, Eye, EyeOff, Copy, Rocket,
    User, Mail, Lock, CreditCard, Star
} from "lucide-react";

interface StepData {
    companyName: string;
    contactName: string;
    email: string;
    phone: string;
    industry: string;
    plan: "Starter" | "Professional" | "Enterprise" | "";
    trunkCarrier: string;
    didNumber: string;
    agentName: string;
    agentVoice: string;
    agentPrompt: string;
    timezone: string;
}

const STEPS = [
    { id: 1, label: "Company Info", icon: <Building2 className="w-4 h-4" /> },
    { id: 2, label: "Choose Plan", icon: <Star className="w-4 h-4" /> },
    { id: 3, label: "SIP Trunking", icon: <Phone className="w-4 h-4" /> },
    { id: 4, label: "AI Agent Setup", icon: <Cpu className="w-4 h-4" /> },
    { id: 5, label: "Go Live!", icon: <Rocket className="w-4 h-4" /> },
];

const PLANS = [
    { id: "Starter", price: 99, color: "#6366f1", desc: "Perfect for small clinics & solo operators", features: ["1 AI Agent", "500 min/mo", "2 SIP Trunks"] },
    { id: "Professional", price: 299, color: "#06b6d4", desc: "Best for growing multi-location businesses", features: ["5 AI Agents", "2,000 min/mo", "5 SIP Trunks", "Analytics"] },
    { id: "Enterprise", price: 799, color: "#f59e0b", desc: "Unlimited scale for enterprise clients", features: ["Unlimited Agents", "10,000 min/mo", "White-Label", "24/7 SLA"] },
];

const CARRIERS = ["Vonex-AU", "MyNetFone-AU", "Symbio-AU", "Telnyx-Global", "Bring Your Own Trunk"];
const VOICES = ["Sarah (AU Female)", "Emma (AU Female)", "James (AU Male)", "Alex (US Neutral)", "Aria (UK Female)"];
const INDUSTRIES = ["Dental", "Medical", "Legal", "Real Estate", "Gym/Fitness", "Hospitality", "Trade/Services", "Other"];

function genSIPCreds(company: string) {
    const slug = company.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "").slice(0, 16) || "client";
    const pass = Math.random().toString(36).slice(2, 10).toUpperCase() + "!" + Math.floor(Math.random() * 999);
    return { username: `${slug}_pbx`, password: pass, registrar: "pbx.globalaccess.ai", domain: `${slug}.globalaccess.ai` };
}

export default function OnboardingPage() {
    const [step, setStep] = useState(1);
    const [provisioning, setProvisioning] = useState(false);
    const [provisioned, setProvisioned] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [data, setData] = useState<StepData>({
        companyName: "", contactName: "", email: "", phone: "", industry: "Dental",
        plan: "", trunkCarrier: "Vonex-AU", didNumber: "", agentName: "Receptionist AI",
        agentVoice: "Sarah (AU Female)", agentPrompt: "You are a friendly Australian receptionist...", timezone: "Australia/Sydney"
    });

    const update = (k: keyof StepData, v: string) => setData(d => ({ ...d, [k]: v }));

    const sipCreds = data.companyName ? genSIPCreds(data.companyName) : { username: "", password: "", registrar: "pbx.globalaccess.ai", domain: "" };

    const provision = async () => {
        setProvisioning(true);
        await new Promise(r => setTimeout(r, 3000));
        setProvisioning(false);
        setProvisioned(true);
        setStep(5);
    };

    const copyText = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    };

    const canNext = () => {
        if (step === 1) return data.companyName && data.contactName && data.email;
        if (step === 2) return !!data.plan;
        if (step === 3) return !!data.trunkCarrier;
        if (step === 4) return !!data.agentName;
        return true;
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200 p-8 md:p-12 flex flex-col items-center">
            <div className="w-full max-w-3xl space-y-8">

                {/* Header */}
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-4 py-1.5 rounded-full mb-4">
                        <Rocket className="w-3.5 h-3.5" /> Client Onboarding Wizard
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Get Your Client Live in Minutes</h1>
                    <p className="text-zinc-400 text-sm">Auto-provision SIP trunks, AI agents, and client portal in one guided flow.</p>
                </div>

                {/* Step bar */}
                <div className="flex items-center gap-0">
                    {STEPS.map((s, i) => (
                        <React.Fragment key={s.id}>
                            <div className={`flex items-center gap-2 flex-1 ${i > 0 ? "justify-center" : ""}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${step > s.id ? "bg-emerald-600 border-emerald-600 text-white" : step === s.id ? "border-emerald-500 text-emerald-400 bg-emerald-500/10" : "border-zinc-700 text-zinc-600"}`}>
                                    {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : s.id}
                                </div>
                                <span className={`text-[10px] font-bold hidden sm:block ${step === s.id ? "text-emerald-400" : step > s.id ? "text-zinc-400" : "text-zinc-600"}`}>{s.label}</span>
                            </div>
                            {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-2 ${step > s.id + 1 ? "bg-emerald-600" : "bg-zinc-800"}`} />}
                        </React.Fragment>
                    ))}
                </div>

                {/* Step content */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">

                    {step === 1 && (
                        <div className="space-y-5">
                            <h2 className="text-lg font-bold text-white mb-1">Company Information</h2>
                            <p className="text-xs text-zinc-500 mb-4">Basic details about the client being onboarded.</p>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: "Company Name", key: "companyName", placeholder: "Bright Smiles Dental Group" },
                                    { label: "Contact Name", key: "contactName", placeholder: "Dr. Sarah Johnson" },
                                    { label: "Email", key: "email", placeholder: "admin@brightsmiles.com.au" },
                                    { label: "Phone", key: "phone", placeholder: "+61 2 9876 5432" },
                                ].map(f => (
                                    <div key={f.key}>
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">{f.label}</label>
                                        <input value={(data as any)[f.key]} onChange={e => update(f.key as keyof StepData, e.target.value)} placeholder={f.placeholder}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500" />
                                    </div>
                                ))}
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Industry</label>
                                <div className="flex flex-wrap gap-2">
                                    {INDUSTRIES.map(ind => (
                                        <button key={ind} onClick={() => update("industry", ind)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${data.industry === ind ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"}`}>{ind}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-5">
                            <h2 className="text-lg font-bold text-white mb-1">Choose a Plan</h2>
                            <p className="text-xs text-zinc-500 mb-4">Select the subscription plan for this client.</p>
                            <div className="grid grid-cols-3 gap-4">
                                {PLANS.map(plan => (
                                    <button key={plan.id} onClick={() => update("plan", plan.id)}
                                        className={`text-left p-5 rounded-2xl border-2 transition-all space-y-3 ${data.plan === plan.id ? "border-current bg-zinc-800" : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"}`}
                                        style={data.plan === plan.id ? { borderColor: plan.color } : {}}>
                                        <div className="text-sm font-bold" style={{ color: plan.color }}>{plan.id}</div>
                                        <div className="text-xl font-bold text-white">${plan.price}<span className="text-xs font-normal text-zinc-500">/mo</span></div>
                                        <p className="text-[10px] text-zinc-400">{plan.desc}</p>
                                        <div className="space-y-1">{plan.features.map(f => <div key={f} className="text-[10px] text-zinc-300 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" style={{ color: plan.color }} />{f}</div>)}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-5">
                            <h2 className="text-lg font-bold text-white mb-1">SIP Trunk Provisioning</h2>
                            <p className="text-xs text-zinc-500 mb-4">Select a carrier and DID number for this client.</p>
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Carrier</label>
                                <div className="flex flex-wrap gap-2">
                                    {CARRIERS.map(c => (
                                        <button key={c} onClick={() => update("trunkCarrier", c)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${data.trunkCarrier === c ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"}`}>{c}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">DID Number</label>
                                    <input value={data.didNumber} onChange={e => update("didNumber", e.target.value)} placeholder="+61 2 8888 9999"
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Timezone</label>
                                    <select value={data.timezone} onChange={e => update("timezone", e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500">
                                        <option>Australia/Sydney</option>
                                        <option>Australia/Melbourne</option>
                                        <option>Australia/Brisbane</option>
                                        <option>Australia/Perth</option>
                                        <option>Pacific/Auckland</option>
                                    </select>
                                </div>
                            </div>
                            <div className="bg-zinc-800 rounded-xl p-4 space-y-2">
                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Auto-Generated SIP Credentials</div>
                                {[
                                    { label: "Username", val: sipCreds.username },
                                    { label: "Registrar", val: sipCreds.registrar },
                                    { label: "Domain", val: sipCreds.domain },
                                ].map(c => (
                                    <div key={c.label} className="flex items-center gap-2 bg-zinc-900 rounded-lg px-3 py-2">
                                        <span className="text-[10px] text-zinc-500 w-16 shrink-0">{c.label}</span>
                                        <span className="text-xs font-mono text-zinc-300 flex-1">{c.val || "—"}</span>
                                        <button onClick={() => copyText(c.val, c.label)} className="text-zinc-500 hover:text-zinc-200">
                                            {copied === c.label ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-5">
                            <h2 className="text-lg font-bold text-white mb-1">AI Agent Setup</h2>
                            <p className="text-xs text-zinc-500 mb-4">Configure the AI agent that will handle calls for this client.</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Agent Name</label>
                                    <input value={data.agentName} onChange={e => update("agentName", e.target.value)} placeholder="Receptionist AI"
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Voice</label>
                                    <select value={data.agentVoice} onChange={e => update("agentVoice", e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500">
                                        {VOICES.map(v => <option key={v}>{v}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">System Prompt</label>
                                <textarea value={data.agentPrompt} onChange={e => update("agentPrompt", e.target.value)} rows={5}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 resize-none font-mono" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Auto-Provision</label>
                                <div className="flex flex-wrap gap-2">
                                    {["Call Recording", "AI Voicemail", "Sentiment Analysis", "Call Transcription", "Cost Tracking"].map(f => (
                                        <span key={f} className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                                            <CheckCircle2 className="w-2.5 h-2.5" /> {f}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <button onClick={provision} disabled={provisioning}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-70">
                                {provisioning ? <><RefreshCw className="w-4 h-4 animate-spin" /> Provisioning...</> : <><Zap className="w-4 h-4" /> Provision & Go Live</>}
                            </button>
                        </div>
                    )}

                    {step === 5 && provisioned && (
                        <div className="text-center space-y-6">
                            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">🎉 {data.companyName || "Client"} is Live!</h2>
                                <p className="text-zinc-400 text-sm">SIP trunk provisioned, AI agent deployed, client portal created. They are ready to take calls.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-left">
                                {[
                                    { label: "SIP Username", val: sipCreds.username },
                                    { label: "Portal URL", val: `https://${sipCreds.domain}/portal` },
                                    { label: "Agent", val: data.agentName },
                                    { label: "Plan", val: data.plan },
                                ].map(i => (
                                    <div key={i.label} className="bg-zinc-800 rounded-xl p-3">
                                        <div className="text-[10px] text-zinc-500 mb-0.5">{i.label}</div>
                                        <div className="text-xs font-mono font-bold text-zinc-200">{i.val}</div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => { setStep(1); setProvisioned(false); setData({ companyName: "", contactName: "", email: "", phone: "", industry: "Dental", plan: "", trunkCarrier: "Vonex-AU", didNumber: "", agentName: "Receptionist AI", agentVoice: "Sarah (AU Female)", agentPrompt: "You are a friendly Australian receptionist...", timezone: "Australia/Sydney" }); }}
                                className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-bold transition-colors">
                                Onboard Another Client
                            </button>
                        </div>
                    )}
                </div>

                {step < 5 && step !== 4 && (
                    <div className="flex justify-between">
                        <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-bold transition-colors disabled:opacity-30">
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                        <button onClick={() => setStep(s => Math.min(4, s + 1))} disabled={!canNext()} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-30">
                            Continue <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
                {step === 4 && !provisioned && (
                    <button onClick={() => setStep(3)} className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-bold transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                )}
            </div>
        </div>
    );
}
