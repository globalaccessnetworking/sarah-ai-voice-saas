"use client";
import React, { useState } from "react";
import {
    Users, Plus, Building2, Globe, Tag, BarChart3, Bot, DollarSign,
    Mail, Settings, ChevronRight, CheckCircle, AlertCircle, Trash2,
    Eye, Copy, ExternalLink, Palette, Shield, Clock, TrendingUp, X, Loader2
} from "lucide-react";

interface Client {
    id: string;
    company: string;
    email: string;
    plan: "starter" | "professional" | "agency";
    status: "active" | "suspended" | "trial";
    agents: number;
    callsThisMonth: number;
    revenueThisMonth: number;
    costThisMonth: number;
    margin: number;
    customDomain?: string;
    brandColor: string;
    joinedAt: string;
    lastActive: string;
}

const MOCK_CLIENTS: Client[] = [
    { id: "c1", company: "Sydney Dental Group", email: "admin@sydneydental.com.au", plan: "professional", status: "active", agents: 3, callsThisMonth: 842, revenueThisMonth: 2340, costThisMonth: 780, margin: 66, customDomain: "ai.sydneydental.com.au", brandColor: "#2563eb", joinedAt: "2026-01-12", lastActive: "2026-03-10" },
    { id: "c2", company: "Melbourne Real Estate", email: "ops@melbrealestate.com.au", plan: "agency", status: "active", agents: 8, callsThisMonth: 1924, revenueThisMonth: 5820, costThisMonth: 1460, margin: 75, customDomain: "voice.mre.com.au", brandColor: "#059669", joinedAt: "2025-12-03", lastActive: "2026-03-10" },
    { id: "c3", company: "Gold Coast Tradies", email: "hello@gctradies.com.au", plan: "starter", status: "trial", agents: 1, callsThisMonth: 124, revenueThisMonth: 220, costThisMonth: 88, margin: 60, brandColor: "#d97706", joinedAt: "2026-03-01", lastActive: "2026-03-09" },
    { id: "c4", company: "Brisbane Hotel Group", email: "it@brisbanehg.com.au", plan: "professional", status: "active", agents: 4, callsThisMonth: 638, revenueThisMonth: 1840, costThisMonth: 552, margin: 70, customDomain: "concierge.brisbanehg.com.au", brandColor: "#7c3aed", joinedAt: "2026-02-08", lastActive: "2026-03-08" },
    { id: "c5", company: "Perth Financial Services", email: "admin@perthfs.com.au", plan: "agency", status: "suspended", agents: 6, callsThisMonth: 0, revenueThisMonth: 0, costThisMonth: 0, margin: 72, brandColor: "#dc2626", joinedAt: "2026-01-20", lastActive: "2026-02-28" },
];

const planColors = { starter: "#f59e0b", professional: "#6366f1", agency: "#10b981" };
const statusColors = { active: "#10b981", suspended: "#ef4444", trial: "#f59e0b" };

function StatCard({ label, value, sub, color, icon }: { label: string; value: string; sub?: string; color: string; icon: React.ReactNode }) {
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + "18", color }}>{icon}</div>
            <div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{label}</div>
                <div className="text-2xl font-bold text-white">{value}</div>
                {sub && <div className="text-[10px] text-zinc-600">{sub}</div>}
            </div>
        </div>
    );
}

export default function ClientPortalsPage() {
    const [clients] = useState(MOCK_CLIENTS);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [showNewModal, setShowNewModal] = useState(false);
    const [newClient, setNewClient] = useState({ company: "", email: "", plan: "starter" });

    const totalRevenue = clients.reduce((s, c) => s + c.revenueThisMonth, 0);
    const totalCost = clients.reduce((s, c) => s + c.costThisMonth, 0);
    const totalMargin = Math.round(((totalRevenue - totalCost) / totalRevenue) * 100);
    const activeClients = clients.filter(c => c.status === "active").length;

    return (
        <div className="min-h-screen bg-black text-zinc-200">
            <div className="w-full overflow-y-auto bg-zinc-950 p-8 md:p-10">
                <div className="max-w-[1600px] mx-auto space-y-8">

                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                                <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-emerald-400" />
                                </div>
                                Client Portals
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full uppercase tracking-widest">White-Label</span>
                            </h1>
                            <p className="text-xs text-zinc-500 mt-1 ml-12">Agency multi-tenancy hub. Each client gets their own branded portal with scoped agents and analytics.</p>
                        </div>
                        <button
                            onClick={() => setShowNewModal(true)}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                        >
                            <Plus className="w-4 h-4" /> Add Client
                        </button>
                    </div>

                    {/* Agency Revenue Summary */}
                    <div className="bg-gradient-to-r from-emerald-950/40 to-teal-950/30 border border-emerald-900/30 rounded-2xl p-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Monthly Revenue</div>
                            <div className="text-3xl font-bold text-emerald-400">${totalRevenue.toLocaleString()}</div>
                            <div className="text-xs text-zinc-600">across {clients.length} clients</div>
                        </div>
                        <div>
                            <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Provider Cost</div>
                            <div className="text-3xl font-bold text-red-400">${totalCost.toLocaleString()}</div>
                            <div className="text-xs text-zinc-600">passed through at cost</div>
                        </div>
                        <div>
                            <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Net Profit</div>
                            <div className="text-3xl font-bold text-white">${(totalRevenue - totalCost).toLocaleString()}</div>
                            <div className="text-xs text-emerald-500">{totalMargin}% average margin</div>
                        </div>
                        <div>
                            <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Active Clients</div>
                            <div className="text-3xl font-bold text-white">{activeClients}/{clients.length}</div>
                            <div className="text-xs text-zinc-600">1 in trial, 1 suspended</div>
                        </div>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard label="Total Agents" value={String(clients.reduce((s, c) => s + c.agents, 0))} sub="Across all clients" color="#6366f1" icon={<Bot className="w-5 h-5" />} />
                        <StatCard label="Calls This Month" value={clients.reduce((s, c) => s + c.callsThisMonth, 0).toLocaleString()} sub="All clients combined" color="#06b6d4" icon={<BarChart3 className="w-5 h-5" />} />
                        <StatCard label="Custom Domains" value={String(clients.filter(c => c.customDomain).length)} sub="White-label portals live" color="#10b981" icon={<Globe className="w-5 h-5" />} />
                        <StatCard label="Top Margin" value="75%" sub="Melbourne Real Estate" color="#f59e0b" icon={<TrendingUp className="w-5 h-5" />} />
                    </div>

                    {/* Client Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                        {clients.map(client => (
                            <div
                                key={client.id}
                                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-5 flex flex-col gap-4 cursor-pointer transition-all hover:shadow-lg hover:shadow-black/30 group"
                                onClick={() => setSelectedClient(client)}
                            >
                                {/* Client Header */}
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ background: client.brandColor }}>
                                            {client.company.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{client.company}</div>
                                            <div className="text-xs text-zinc-500">{client.email}</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase" style={{ color: planColors[client.plan], background: planColors[client.plan] + "20" }}>
                                            {client.plan}
                                        </span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1" style={{ color: statusColors[client.status], background: statusColors[client.status] + "20" }}>
                                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColors[client.status] }} />
                                            {client.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Metrics */}
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-zinc-800/50 rounded-lg p-2.5 text-center">
                                        <div className="text-lg font-bold text-white">{client.agents}</div>
                                        <div className="text-[10px] text-zinc-500">Agents</div>
                                    </div>
                                    <div className="bg-zinc-800/50 rounded-lg p-2.5 text-center">
                                        <div className="text-lg font-bold text-white">{client.callsThisMonth.toLocaleString()}</div>
                                        <div className="text-[10px] text-zinc-500">Calls</div>
                                    </div>
                                    <div className="bg-zinc-800/50 rounded-lg p-2.5 text-center">
                                        <div className="text-lg font-bold text-emerald-400">{client.margin}%</div>
                                        <div className="text-[10px] text-zinc-500">Margin</div>
                                    </div>
                                </div>

                                {/* Revenue Bar */}
                                <div>
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="text-zinc-500">Revenue this month</span>
                                        <span className="font-bold text-white">${client.revenueThisMonth.toLocaleString()}</span>
                                    </div>
                                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${(client.revenueThisMonth / 6000) * 100}%`, background: client.brandColor }} />
                                    </div>
                                </div>

                                {/* Custom Domain */}
                                {client.customDomain && (
                                    <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-800/40 rounded-lg px-3 py-2">
                                        <Globe className="w-3.5 h-3.5 text-emerald-400" />
                                        <span className="text-emerald-400 font-mono">{client.customDomain}</span>
                                        <ExternalLink className="w-3 h-3 ml-auto" />
                                    </div>
                                )}

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50">
                                    <span className="text-[10px] text-zinc-600">Joined {client.joinedAt}</span>
                                    <div className="flex gap-2">
                                        <button className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors" onClick={e => { e.stopPropagation(); }}>
                                            <Settings className="w-3.5 h-3.5 text-zinc-400" />
                                        </button>
                                        <button className="p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors" onClick={e => { e.stopPropagation(); }}>
                                            <Eye className="w-3.5 h-3.5 text-white" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pricing Tiers */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                        <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2"><Tag className="w-4 h-4 text-yellow-400" /> Agency Pricing Tiers</h3>
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { plan: "Starter", price: "$99/mo", agents: "2 Agents", features: ["Basic analytics", "Email support", "Shared infra"], color: "#f59e0b" },
                                { plan: "Professional", price: "$299/mo", agents: "10 Agents", features: ["Full analytics", "White-label domain", "Priority support", "Recording library"], color: "#6366f1" },
                                { plan: "Agency", price: "$699/mo", agents: "Unlimited", features: ["Client portals", "Custom billing margins", "Dedicated support", "SLA guarantee", "API access"], color: "#10b981" },
                            ].map(t => (
                                <div key={t.plan} className="p-4 rounded-xl border" style={{ borderColor: t.color + "40", background: t.color + "08" }}>
                                    <div className="text-sm font-bold mb-1" style={{ color: t.color }}>{t.plan}</div>
                                    <div className="text-2xl font-bold text-white mb-0.5">{t.price}</div>
                                    <div className="text-xs text-zinc-500 mb-3">{t.agents}</div>
                                    {t.features.map(f => (
                                        <div key={f} className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                                            <CheckCircle className="w-3 h-3" style={{ color: t.color }} /> {f}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Client Detail Drawer */}
            {selectedClient && (
                <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm" onClick={() => setSelectedClient(null)}>
                    <div className="w-full max-w-lg bg-zinc-950 border-l border-zinc-800 h-full overflow-y-auto p-8 space-y-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold" style={{ background: selectedClient.brandColor }}>
                                    {selectedClient.company.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">{selectedClient.company}</h2>
                                    <p className="text-xs text-zinc-500">{selectedClient.email}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedClient(null)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: "Revenue", value: `$${selectedClient.revenueThisMonth.toLocaleString()}`, color: "#10b981" },
                                { label: "Cost", value: `$${selectedClient.costThisMonth.toLocaleString()}`, color: "#ef4444" },
                                { label: "Margin", value: `${selectedClient.margin}%`, color: "#f59e0b" },
                                { label: "Net Profit", value: `$${(selectedClient.revenueThisMonth - selectedClient.costThisMonth).toLocaleString()}`, color: "#6366f1" },
                            ].map(m => (
                                <div key={m.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest">{m.label}</div>
                                    <div className="text-xl font-bold" style={{ color: m.color }}>{m.value}</div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Branding Settings</h3>
                            <div className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                                <Palette className="w-4 h-4 text-zinc-400" />
                                <span className="text-xs text-zinc-400 flex-1">Brand Color</span>
                                <div className="w-6 h-6 rounded-full border border-zinc-600" style={{ background: selectedClient.brandColor }} />
                                <span className="text-xs font-mono text-zinc-400">{selectedClient.brandColor}</span>
                            </div>
                            {selectedClient.customDomain && (
                                <div className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                                    <Globe className="w-4 h-4 text-emerald-400" />
                                    <span className="text-xs text-zinc-400 flex-1">Custom Domain</span>
                                    <span className="text-xs font-mono text-emerald-400">{selectedClient.customDomain}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors">Login as Client</button>
                            <button className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition-colors">Send Report</button>
                            <button className="p-2.5 bg-red-950/40 hover:bg-red-900/40 border border-red-900/30 rounded-xl transition-colors">
                                <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* New Client Modal */}
            {showNewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md p-8 space-y-5">
                        <div className="flex justify-between">
                            <h2 className="text-lg font-bold text-white">Add New Client</h2>
                            <button onClick={() => setShowNewModal(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        {["Company Name", "Email Address"].map(label => (
                            <div key={label}>
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">{label}</label>
                                <input className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500" placeholder={label} />
                            </div>
                        ))}
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">Plan</label>
                            <select className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500">
                                <option>Starter — $99/mo</option>
                                <option>Professional — $299/mo</option>
                                <option>Agency — $699/mo</option>
                            </select>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setShowNewModal(false)} className="flex-1 py-3 border border-zinc-700 rounded-xl text-sm font-bold text-zinc-400 hover:bg-zinc-900">Cancel</button>
                            <button className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-colors">Create Client Portal</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
