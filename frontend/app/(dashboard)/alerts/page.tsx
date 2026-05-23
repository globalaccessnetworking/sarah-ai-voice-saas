"use client";
import React, { useState } from "react";
import {
    Bell, Plus, Trash2, CheckCircle2, AlertTriangle, XCircle,
    Mail, MessageSquare, Phone, Slack, Zap, ToggleLeft, ToggleRight,
    RefreshCw, Clock, Activity, Search, Filter
} from "lucide-react";

type Severity = "Info" | "Warning" | "Critical";
type Channel = "Email" | "SMS" | "Slack" | "PagerDuty";

interface AlertRule {
    id: string;
    name: string;
    trigger: string;
    threshold: string;
    channels: Channel[];
    enabled: boolean;
    severity: Severity;
    lastTriggered: string | null;
    triggerCount30d: number;
}

interface AlertEvent {
    id: string;
    rule: string;
    severity: Severity;
    message: string;
    time: string;
    resolved: boolean;
    channels: Channel[];
}

const DEMO_RULES: AlertRule[] = [
    { id: "r1", name: "Trunk Down", trigger: "SIP Trunk Registration Lost", threshold: "Any trunk", channels: ["Email", "Slack", "PagerDuty"], enabled: true, severity: "Critical", lastTriggered: "2026-03-08T14:22:00Z", triggerCount30d: 2 },
    { id: "r2", name: "Queue Wait Time High", trigger: "Queue Average Wait > Threshold", threshold: "60 seconds", channels: ["Slack"], enabled: true, severity: "Warning", lastTriggered: "2026-03-09T11:00:00Z", triggerCount30d: 5 },
    { id: "r3", name: "Usage 80% Alert", trigger: "Client Minute Usage Exceeds %", threshold: "80% of plan", channels: ["Email"], enabled: true, severity: "Info", lastTriggered: "2026-03-10T09:45:00Z", triggerCount30d: 8 },
    { id: "r4", name: "MOS Score Low", trigger: "Average MOS Below Threshold", threshold: "< 3.5", channels: ["Email", "Slack"], enabled: true, severity: "Warning", lastTriggered: null, triggerCount30d: 0 },
    { id: "r5", name: "Server CPU Critical", trigger: "Asterisk CPU Usage", threshold: "> 85%", channels: ["Email", "PagerDuty"], enabled: true, severity: "Critical", lastTriggered: null, triggerCount30d: 0 },
    { id: "r6", name: "After-Hours Outage", trigger: "System Unavailable 10pm–6am", threshold: "Any downtime", channels: ["PagerDuty", "SMS"], enabled: false, severity: "Critical", lastTriggered: null, triggerCount30d: 0 },
];

const DEMO_EVENTS: AlertEvent[] = [
    { id: "e1", rule: "Trunk Down", severity: "Critical", message: "PJSIP trunk Vonex-AU-Primary lost registration. Failing over to MyNetFone-AU.", time: "2026-03-08 14:22:31", resolved: true, channels: ["Email", "Slack", "PagerDuty"] },
    { id: "e2", rule: "Queue Wait Time High", severity: "Warning", message: "dental-queue average wait time reached 78s (threshold: 60s). 3 callers waiting.", time: "2026-03-09 11:00:05", resolved: true, channels: ["Slack"] },
    { id: "e3", rule: "Queue Wait Time High", severity: "Warning", message: "dental-queue average wait time reached 92s. Overflow to AI triggered.", time: "2026-03-09 16:34:12", resolved: true, channels: ["Slack"] },
    { id: "e4", rule: "Usage 80% Alert", severity: "Info", message: "Peak Performance Gym has used 487/500 minutes (97%). Overage will apply.", time: "2026-03-10 09:45:00", resolved: false, channels: ["Email"] },
    { id: "e5", rule: "Usage 80% Alert", severity: "Info", message: "24h Locksmith has used 412/500 minutes (82%).", time: "2026-03-10 14:20:00", resolved: false, channels: ["Email"] },
];

const CHANNEL_ICONS: Record<Channel, React.ReactNode> = {
    Email: <Mail className="w-3 h-3" />,
    SMS: <Phone className="w-3 h-3" />,
    Slack: <Slack className="w-3 h-3" />,
    PagerDuty: <Zap className="w-3 h-3" />,
};

const SEV_CONFIG: Record<Severity, { color: string; bg: string; icon: React.ReactNode }> = {
    Info: { color: "#6366f1", bg: "bg-violet-500/10 border-violet-500/20", icon: <Activity className="w-3.5 h-3.5 text-violet-400" /> },
    Warning: { color: "#f59e0b", bg: "bg-yellow-500/10 border-yellow-500/20", icon: <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" /> },
    Critical: { color: "#ef4444", bg: "bg-red-500/10 border-red-500/20", icon: <XCircle className="w-3.5 h-3.5 text-red-400" /> },
};

export default function AlertsPage() {
    const [rules, setRules] = useState(DEMO_RULES);
    const [events] = useState(DEMO_EVENTS);
    const [tab, setTab] = useState<"rules" | "history" | "channels">("rules");
    const [showAdd, setShowAdd] = useState(false);

    const toggleRule = (id: string) => setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    const deleteRule = (id: string) => setRules(prev => prev.filter(r => r.id !== id));

    const activeRules = rules.filter(r => r.enabled).length;
    const unresolvedEvents = events.filter(e => !e.resolved).length;

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200 p-8 md:p-10">
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* Header */}
                <div className="bg-gradient-to-r from-orange-950/40 to-red-950/30 border border-orange-900/30 rounded-2xl p-6 flex items-center gap-5">
                    <div className="w-14 h-14 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center">
                        <Bell className="w-7 h-7 text-orange-400" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-white mb-1">Real-Time Alerts & Notifications</h1>
                        <p className="text-xs text-zinc-400">Configure alert rules for trunk outages, queue overflows, usage limits, and server health. Send alerts via Email, SMS, Slack webhook, or PagerDuty.</p>
                    </div>
                    <div className="flex gap-5">
                        <div className="text-right"><div className="text-2xl font-bold text-orange-400">{activeRules}</div><div className="text-[10px] text-zinc-500">Active Rules</div></div>
                        <div className="text-right"><div className={`text-2xl font-bold ${unresolvedEvents > 0 ? "text-red-400" : "text-emerald-400"}`}>{unresolvedEvents}</div><div className="text-[10px] text-zinc-500">Unresolved</div></div>
                        <button onClick={() => setShowAdd(p => !p)} className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-bold transition-colors">
                            <Plus className="w-4 h-4" /> Add Rule
                        </button>
                    </div>
                </div>

                {/* Active critical alerts */}
                {events.filter(e => !e.resolved && e.severity === "Critical").length > 0 && (
                    <div className="bg-red-950/30 border border-red-900/40 rounded-2xl p-4 flex items-center gap-3">
                        <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                        <p className="text-sm text-red-300 font-bold">ACTIVE CRITICAL ALERTS — Immediate action required</p>
                    </div>
                )}

                {showAdd && (
                    <div className="bg-zinc-900 border border-orange-900/40 rounded-2xl p-6 space-y-4">
                        <h3 className="text-sm font-bold text-white">Add Alert Rule</h3>
                        <div className="grid md:grid-cols-4 gap-4">
                            {["Rule Name", "Trigger Event", "Threshold"].map(label => (
                                <div key={label}>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">{label}</label>
                                    <input className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-orange-500" placeholder={label} />
                                </div>
                            ))}
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Severity</label>
                                <select className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-orange-500">
                                    <option>Info</option><option>Warning</option><option>Critical</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowAdd(false)} className="bg-orange-600 hover:bg-orange-500 text-white px-5 py-2 rounded-xl text-xs font-bold">Save Rule</button>
                            <button onClick={() => setShowAdd(false)} className="bg-zinc-800 text-zinc-300 px-5 py-2 rounded-xl text-xs font-bold hover:bg-zinc-700">Cancel</button>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
                    {(["rules", "history", "channels"] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)} className={`px-5 py-2 rounded-lg text-xs font-bold capitalize transition-all ${tab === t ? "bg-orange-600 text-white" : "text-zinc-400 hover:text-zinc-200"}`}>{t}</button>
                    ))}
                </div>

                {tab === "rules" && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                        <div className="grid grid-cols-12 px-5 py-3 border-b border-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                            <div className="col-span-3">Rule</div>
                            <div className="col-span-2">Trigger</div>
                            <div className="col-span-1">Threshold</div>
                            <div className="col-span-2">Channels</div>
                            <div className="col-span-1">Severity</div>
                            <div className="col-span-1">30d</div>
                            <div className="col-span-2">Actions</div>
                        </div>
                        <div className="divide-y divide-zinc-800/50">
                            {rules.map(rule => {
                                const sev = SEV_CONFIG[rule.severity];
                                return (
                                    <div key={rule.id} className={`grid grid-cols-12 items-center px-5 py-4 hover:bg-zinc-800/20 ${!rule.enabled ? "opacity-50" : ""}`}>
                                        <div className="col-span-3 text-xs font-bold text-zinc-200">{rule.name}</div>
                                        <div className="col-span-2 text-[10px] text-zinc-400">{rule.trigger}</div>
                                        <div className="col-span-1 text-[10px] font-mono text-zinc-400">{rule.threshold}</div>
                                        <div className="col-span-2 flex flex-wrap gap-1">
                                            {rule.channels.map(ch => (
                                                <span key={ch} className="text-[8px] flex items-center gap-0.5 bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-700">
                                                    {CHANNEL_ICONS[ch]} {ch}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="col-span-1">
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${sev.bg}`} style={{ color: sev.color }}>{rule.severity}</span>
                                        </div>
                                        <div className="col-span-1 text-xs text-zinc-400">{rule.triggerCount30d}</div>
                                        <div className="col-span-2 flex items-center gap-2">
                                            <button onClick={() => toggleRule(rule.id)} className={rule.enabled ? "text-emerald-400" : "text-zinc-600"}>
                                                {rule.enabled ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                                            </button>
                                            <button onClick={() => deleteRule(rule.id)} className="p-1 text-zinc-600 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {tab === "history" && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-zinc-800"><h2 className="text-sm font-bold text-white">Alert Event Log</h2></div>
                        <div className="divide-y divide-zinc-800/50">
                            {events.map(ev => {
                                const sev = SEV_CONFIG[ev.severity];
                                return (
                                    <div key={ev.id} className="flex items-center gap-4 px-5 py-4 hover:bg-zinc-800/20">
                                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${sev.bg}`}>{sev.icon}</div>
                                        <div className="flex-1">
                                            <div className="text-xs font-bold text-zinc-200 mb-0.5">{ev.rule}</div>
                                            <div className="text-[10px] text-zinc-400">{ev.message}</div>
                                        </div>
                                        <div className="flex flex-wrap gap-1 shrink-0">
                                            {ev.channels.map(ch => <span key={ch} className="text-[8px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded flex items-center gap-0.5">{CHANNEL_ICONS[ch]} {ch}</span>)}
                                        </div>
                                        <span className="text-[10px] text-zinc-500 w-32 shrink-0 text-right">{ev.time}</span>
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded shrink-0 ${ev.resolved ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"}`}>{ev.resolved ? "Resolved" : "Active"}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {tab === "channels" && (
                    <div className="grid md:grid-cols-2 gap-5">
                        {([
                            { name: "Email", icon: <Mail className="w-6 h-6 text-blue-400" />, color: "#3b82f6", fields: [{ label: "SMTP Host", placeholder: "smtp.sendgrid.net" }, { label: "From Address", placeholder: "alerts@globalaccess.ai" }, { label: "API Key", placeholder: "SG.xxxx" }] },
                            { name: "SMS (Twilio)", icon: <Phone className="w-6 h-6 text-green-400" />, color: "#10b981", fields: [{ label: "Account SID", placeholder: "ACxxxx" }, { label: "Auth Token", placeholder: "token" }, { label: "From Number", placeholder: "+61412000000" }] },
                            { name: "Slack Webhook", icon: <Slack className="w-6 h-6 text-yellow-400" />, color: "#f59e0b", fields: [{ label: "Webhook URL", placeholder: "https://hooks.slack.com/services/xxx" }, { label: "Channel", placeholder: "#alerts" }] },
                            { name: "PagerDuty", icon: <Zap className="w-6 h-6 text-red-400" />, color: "#ef4444", fields: [{ label: "Integration Key", placeholder: "pagerduty-routing-key" }, { label: "Escalation Policy", placeholder: "On-Call Engineers" }] },
                        ] as any[]).map(ch => (
                            <div key={ch.name} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
                                <div className="flex items-center gap-3">
                                    {ch.icon}
                                    <h3 className="text-sm font-bold text-white">{ch.name}</h3>
                                </div>
                                <div className="space-y-3">
                                    {ch.fields.map((f: any) => (
                                        <div key={f.label}>
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">{f.label}</label>
                                            <input placeholder={f.placeholder} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none" style={{ borderColor: "var(--focus-color)" }} onFocus={e => (e.target.style.borderColor = ch.color)} onBlur={e => (e.target.style.borderColor = "")} />
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-80" style={{ background: ch.color }}>Save & Test</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
