"use client";
import React, { useState } from "react";
import {
    Shield, FileCheck, Download, Eye, EyeOff, Clock,
    CheckCircle2, AlertTriangle, FileText, Lock, Mic, MicOff,
    RefreshCw, ChevronRight, Info, Calendar, Trash2
} from "lucide-react";

interface ComplianceToggle {
    id: string;
    label: string;
    description: string;
    enabled: boolean;
    color: string;
    impact: string;
    regulation: string;
}

const DEFAULT_TOGGLES: ComplianceToggle[] = [
    {
        id: "hipaa",
        label: "HIPAA Mode",
        description: "Automatically redact all Protected Health Information (PHI) from transcripts before they are stored. Required for healthcare clients in the United States.",
        enabled: false,
        color: "#10b981",
        impact: "Redacts: names, DOB, SSN, medical record numbers, health plan numbers, account numbers, phone/fax, email, addresses, dates",
        regulation: "HIPAA §164.514(b)",
    },
    {
        id: "gdpr",
        label: "GDPR Mode",
        description: "European Union data protection compliance. Auto-deletes call recordings and transcripts after the configured retention window. Enables consent management.",
        enabled: true,
        color: "#6366f1",
        impact: "Enables: right to erasure, data retention schedules, consent logging, cross-border data transfer restrictions",
        regulation: "GDPR Article 17",
    },
    {
        id: "shadow",
        label: "Shadow Mode",
        description: "AI listens silently to calls but does not speak. Used for training new agent configurations on live call data without interrupting the caller experience.",
        enabled: false,
        color: "#f59e0b",
        impact: "Creates transcript-only call logs. No TTS output. Agent learns from conversation patterns. Storage costs apply.",
        regulation: "Internal Compliance",
    },
    {
        id: "consent-audio",
        label: "Call Recording Consent Disclosure",
        description: "Play a legally required audio disclosure before every call begins. The disclosure informs callers that they are being recorded for quality and training purposes.",
        enabled: true,
        color: "#06b6d4",
        impact: "Plays disclosure on every call before agent speaks. Customizable disclosure text. Verbal acceptance is logged.",
        regulation: "Telecommunications (Interception) Act 1979 (AU)",
    },
    {
        id: "pii-redact",
        label: "PII Auto-Redaction Engine",
        description: "Use AI to detect and redact common Personally Identifiable Information from transcripts: names, phone numbers, credit card numbers, addresses, and email addresses.",
        enabled: true,
        color: "#ef4444",
        impact: "Redacts: phone numbers, card numbers (replaces with ****), email addresses, Australian TFN/ABN numbers",
        regulation: "Privacy Act 1988 (AU)",
    },
    {
        id: "e-signature",
        label: "Verbal Consent Capture",
        description: "Record and log verbal consent from callers during the call. Used for opt-in confirmations, appointment confirmations, and service agreement acceptances.",
        enabled: false,
        color: "#a855f7",
        impact: "Timestamps consent moment in transcript. Creates auditable consent record linked to call ID and caller phone number.",
        regulation: "Electronic Transactions Act 1999 (AU)",
    },
];

const RETENTION_OPTIONS = [
    { label: "7 days", value: 7 },
    { label: "30 days", value: 30 },
    { label: "60 days", value: 60 },
    { label: "90 days", value: 90 },
    { label: "1 year", value: 365 },
    { label: "Never delete", value: 0 },
];

const AUDIT_REPORTS = [
    { name: "Q1 2026 — Privacy Audit", date: "2026-01-01", size: "2.4 MB", type: "GDPR" },
    { name: "FY2025 — HIPAA Compliance", date: "2025-07-01", size: "1.8 MB", type: "HIPAA" },
    { name: "Monthly — March 2026", date: "2026-03-01", size: "0.9 MB", type: "General" },
];

function ComplianceToggleCard({ toggle, onToggle }: { toggle: ComplianceToggle; onToggle: (id: string) => void }) {
    const [expanded, setExpanded] = useState(false);
    return (
        <div className={`border rounded-xl overflow-hidden transition-all ${toggle.enabled ? "border-zinc-700" : "border-zinc-800"}`} style={toggle.enabled ? { borderLeftWidth: 3, borderLeftColor: toggle.color } : {}}>
            <div className="flex items-start gap-4 p-5">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1.5">
                        <span className="text-sm font-bold text-white">{toggle.label}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-zinc-500 bg-zinc-800">{toggle.regulation}</span>
                        {toggle.enabled && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">Active</span>}
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed mb-2">{toggle.description}</p>
                    {expanded && (
                        <div className="flex items-start gap-2 text-[11px] text-zinc-500 bg-zinc-800/50 rounded-lg p-3 mt-2">
                            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: toggle.color }} />
                            <span>{toggle.impact}</span>
                        </div>
                    )}
                    <button onClick={() => setExpanded(p => !p)} className="text-[10px] text-zinc-500 hover:text-zinc-300 mt-2 flex items-center gap-1 transition-colors">
                        {expanded ? "Hide details" : "Show impact details"} <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`} />
                    </button>
                </div>
                <button
                    onClick={() => onToggle(toggle.id)}
                    className={`w-12 h-6 rounded-full transition-all relative shrink-0 mt-1 ${toggle.enabled ? "bg-emerald-600" : "bg-zinc-700"}`}
                >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${toggle.enabled ? "right-1" : "left-1"}`} />
                </button>
            </div>
        </div>
    );
}

export default function CompliancePage() {
    const [toggles, setToggles] = useState(DEFAULT_TOGGLES);
    const [retention, setRetention] = useState(30);
    const [saved, setSaved] = useState(false);
    const [disclosureText, setDisclosureText] = useState("This call may be recorded for quality and training purposes. By continuing, you consent to this recording.");

    const handleToggle = (id: string) => {
        setToggles(p => p.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t));
    };

    const activeCount = toggles.filter(t => t.enabled).length;

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="min-h-screen bg-black text-zinc-200">
            <div className="w-full overflow-y-auto bg-zinc-950 p-8 md:p-10">
                <div className="max-w-[1400px] mx-auto space-y-8">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-950/40 to-teal-950/30 border border-emerald-900/30 rounded-2xl p-6 flex items-center gap-5">
                        <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center">
                            <Shield className="w-7 h-7 text-emerald-400" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold text-white mb-1">Compliance & Legal Mode</h1>
                            <p className="text-xs text-zinc-400">Regulatory compliance controls for HIPAA, GDPR, Australian Privacy Act, and Telecommunications Act. Activate modes per client or globally.</p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-emerald-400">{activeCount}/{toggles.length}</div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Active Modes</div>
                        </div>
                    </div>

                    {/* Compliance Modes Grid */}
                    <div className="space-y-4">
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                            <Shield className="w-4 h-4 text-emerald-400" /> Compliance Modes
                        </h2>
                        <div className="grid lg:grid-cols-2 gap-4">
                            {toggles.map(t => (
                                <ComplianceToggleCard key={t.id} toggle={t} onToggle={handleToggle} />
                            ))}
                        </div>
                    </div>

                    {/* Retention Policy */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                            <Clock className="w-4 h-4 text-indigo-400" /> Data Retention Policy
                        </h2>
                        <p className="text-xs text-zinc-500">Recordings and transcripts older than this window are automatically deleted. This applies globally unless overridden per-client.</p>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                            {RETENTION_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setRetention(opt.value)}
                                    className={`py-2.5 px-3 rounded-xl text-xs font-bold text-center transition-all border ${retention === opt.value ? "bg-indigo-600 border-indigo-500 text-white" : "border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500"}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        {retention > 0 && (
                            <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-950/20 border border-amber-900/20 rounded-lg px-4 py-3">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                Auto-delete is active: all calls older than {RETENTION_OPTIONS.find(o => o.value === retention)?.label} will be permanently deleted. This cannot be undone.
                            </div>
                        )}
                    </div>

                    {/* Consent Disclosure */}
                    {toggles.find(t => t.id === "consent-audio")?.enabled && (
                        <div className="bg-zinc-900 border border-cyan-900/30 rounded-2xl p-6 space-y-4">
                            <h2 className="text-sm font-bold text-white flex items-center gap-2">
                                <Mic className="w-4 h-4 text-cyan-400" /> Recording Consent Disclosure Text
                            </h2>
                            <p className="text-xs text-zinc-500">This text is read to callers before every call via text-to-speech. Make sure it complies with your local telecommunications laws.</p>
                            <textarea
                                value={disclosureText}
                                onChange={e => setDisclosureText(e.target.value)}
                                rows={3}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 resize-none"
                            />
                            <button className="flex items-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
                                <Eye className="w-3.5 h-3.5" /> Preview disclosure audio
                            </button>
                        </div>
                    )}

                    {/* Compliance Reports */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-zinc-800">
                            <h2 className="text-sm font-bold text-white flex items-center gap-2"><FileText className="w-4 h-4 text-zinc-400" /> Compliance Reports</h2>
                        </div>
                        <div className="divide-y divide-zinc-800/50">
                            {AUDIT_REPORTS.map(rep => (
                                <div key={rep.name} className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-800/30 transition-colors">
                                    <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-zinc-200">{rep.name}</div>
                                        <div className="text-xs text-zinc-500 flex items-center gap-2">
                                            <Calendar className="w-3 h-3" /> {rep.date}
                                            <span className="w-1 h-1 rounded-full bg-zinc-600" />
                                            {rep.size}
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">{rep.type}</span>
                                    <button className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg transition-colors">
                                        <Download className="w-3.5 h-3.5" /> Download PDF
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Save */}
                    <div className="flex justify-end">
                        <button onClick={handleSave} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${saved ? "bg-emerald-600 text-white" : "bg-indigo-600 hover:bg-indigo-500 text-white"}`}>
                            {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : "Save Compliance Config"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
