"use client";
import React, { useState } from "react";
import {
    DollarSign, TrendingUp, CreditCard, FileText, AlertTriangle,
    CheckCircle2, Zap, Users, Phone, BarChart3, Download,
    ArrowUp, Plus, Settings, RefreshCw, ExternalLink
} from "lucide-react";

interface ClientBilling {
    id: string;
    name: string;
    plan: "Starter" | "Professional" | "Enterprise";
    monthlyFee: number;
    includedMinutes: number;
    usedMinutes: number;
    usedCalls: number;
    overageRate: number;
    status: "Active" | "Past Due" | "Suspended";
    nextBillingDate: string;
    stripeCustomerId: string;
    balance: number;
}

interface Invoice {
    id: string;
    client: string;
    amount: number;
    status: "Paid" | "Pending" | "Overdue";
    date: string;
    period: string;
}

const PLANS = [
    {
        name: "Starter", price: 99, color: "#6366f1",
        features: ["1 AI Agent", "500 min/month", "2 SIP Trunks", "Email Support", "Basic Analytics"],
        minutes: 500, agents: 1, trunks: 2, overage: 0.25
    },
    {
        name: "Professional", price: 299, color: "#06b6d4",
        features: ["5 AI Agents", "2,000 min/month", "5 SIP Trunks", "Priority Support", "Advanced Analytics", "Call Recording"],
        minutes: 2000, agents: 5, trunks: 5, overage: 0.18
    },
    {
        name: "Enterprise", price: 799, color: "#f59e0b",
        features: ["Unlimited Agents", "10,000 min/month", "Unlimited Trunks", "24/7 Support", "White-Label", "Custom Integrations", "SLA 99.99%"],
        minutes: 10000, agents: -1, trunks: -1, overage: 0.10
    },
];

const CLIENTS: ClientBilling[] = [
    { id: "c1", name: "Bright Smiles Dental", plan: "Professional", monthlyFee: 299, includedMinutes: 2000, usedMinutes: 1640, usedCalls: 480, overageRate: 0.18, status: "Active", nextBillingDate: "2026-04-01", stripeCustomerId: "cus_abc123", balance: 0 },
    { id: "c2", name: "Peak Performance Gym", plan: "Starter", monthlyFee: 99, includedMinutes: 500, usedMinutes: 487, usedCalls: 143, overageRate: 0.25, status: "Active", nextBillingDate: "2026-04-01", stripeCustomerId: "cus_def456", balance: 0 },
    { id: "c3", name: "City Medical Centre", plan: "Enterprise", monthlyFee: 799, includedMinutes: 10000, usedMinutes: 3210, usedCalls: 1020, overageRate: 0.10, status: "Active", nextBillingDate: "2026-04-01", stripeCustomerId: "cus_ghi789", balance: 0 },
    { id: "c4", name: "24h Locksmith AU", plan: "Starter", monthlyFee: 99, includedMinutes: 500, usedMinutes: 612, usedCalls: 198, overageRate: 0.25, status: "Past Due", nextBillingDate: "2026-03-15", stripeCustomerId: "cus_jkl012", balance: -122.25 },
];

const INVOICES: Invoice[] = [
    { id: "INV-2026-0311", client: "Bright Smiles Dental", amount: 299.00, status: "Paid", date: "2026-03-01", period: "March 2026" },
    { id: "INV-2026-0312", client: "Peak Performance Gym", amount: 99.00, status: "Paid", date: "2026-03-01", period: "March 2026" },
    { id: "INV-2026-0313", client: "City Medical Centre", amount: 799.00, status: "Paid", date: "2026-03-01", period: "March 2026" },
    { id: "INV-2026-0314", client: "24h Locksmith AU", amount: 99.00, status: "Overdue", date: "2026-03-01", period: "March 2026" },
    { id: "INV-2026-0315", client: "Bright Smiles Dental", amount: 351.20, status: "Pending", date: "2026-03-11", period: "Overage — Feb 2026" },
];

const PLAN_COLORS = { Starter: "#6366f1", Professional: "#06b6d4", Enterprise: "#f59e0b" };
const STATUS_COLORS = { Active: "text-emerald-400 bg-emerald-500/10", "Past Due": "text-red-400 bg-red-500/10", Suspended: "text-zinc-400 bg-zinc-800" };
const INV_COLORS = { Paid: "text-emerald-400 bg-emerald-500/10", Pending: "text-yellow-400 bg-yellow-500/10", Overdue: "text-red-400 bg-red-500/10" };

export default function BillingPage() {
    const [tab, setTab] = useState<"overview" | "clients" | "invoices" | "plans">("overview");
    const [chargingId, setChargingId] = useState<string | null>(null);

    const totalMRR = CLIENTS.filter(c => c.status === "Active").reduce((s, c) => s + c.monthlyFee, 0);
    const pastDue = CLIENTS.filter(c => c.status === "Past Due").length;
    const overageRevenue = CLIENTS.map(c => Math.max(0, c.usedMinutes - c.includedMinutes) * c.overageRate).reduce((a, b) => a + b, 0);

    const chargeClient = async (id: string) => {
        setChargingId(id);
        await new Promise(r => setTimeout(r, 2000));
        setChargingId(null);
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200 p-8 md:p-10">
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-950/40 to-green-950/30 border border-emerald-900/30 rounded-2xl p-6 flex items-center gap-5">
                    <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center">
                        <DollarSign className="w-7 h-7 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-white mb-1">Billing & Usage Metering</h1>
                        <p className="text-xs text-zinc-400">Stripe-powered automatic billing per client. Track usage vs plan limits, apply overage charges, and manage invoices across all client accounts.</p>
                    </div>
                    <div className="flex gap-6">
                        {[
                            { label: "MRR", value: `$${totalMRR.toLocaleString()}`, color: "#10b981" },
                            { label: "Overage", value: `$${overageRevenue.toFixed(0)}`, color: "#f59e0b" },
                            { label: "Past Due", value: pastDue.toString(), color: pastDue > 0 ? "#ef4444" : "#10b981" },
                        ].map(s => (
                            <div key={s.label} className="text-right">
                                <div className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
                                <div className="text-[10px] text-zinc-500">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
                    {(["overview", "clients", "invoices", "plans"] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)} className={`px-5 py-2 rounded-lg text-xs font-bold capitalize transition-all ${tab === t ? "bg-emerald-600 text-white" : "text-zinc-400 hover:text-zinc-200"}`}>{t}</button>
                    ))}
                </div>

                {tab === "overview" && (
                    <div className="grid md:grid-cols-3 gap-5">
                        {[
                            { label: "Total MRR", value: `$${totalMRR}`, sub: "Monthly Recurring Revenue", color: "#10b981", icon: <TrendingUp className="w-6 h-6" /> },
                            { label: "Overage Revenue", value: `$${overageRevenue.toFixed(2)}`, sub: "This billing cycle", color: "#f59e0b", icon: <Zap className="w-6 h-6" /> },
                            { label: "Avg Revenue/Client", value: `$${Math.round(totalMRR / CLIENTS.length)}`, sub: "Per client average", color: "#6366f1", icon: <Users className="w-6 h-6" /> },
                            { label: "Total Minutes Used", value: `${CLIENTS.reduce((s, c) => s + c.usedMinutes, 0).toLocaleString()}`, sub: "Across all clients", color: "#06b6d4", icon: <Phone className="w-6 h-6" /> },
                            { label: "Total Calls", value: `${CLIENTS.reduce((s, c) => s + c.usedCalls, 0).toLocaleString()}`, sub: "This month", color: "#ec4899", icon: <BarChart3 className="w-6 h-6" /> },
                            { label: "Active Clients", value: `${CLIENTS.filter(c => c.status === "Active").length}/${CLIENTS.length}`, sub: "Paying subscriptions", color: "#10b981", icon: <CheckCircle2 className="w-6 h-6" /> },
                        ].map(stat => (
                            <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                                <div className="flex items-center gap-2 mb-3" style={{ color: stat.color }}>{stat.icon}</div>
                                <div className="text-2xl font-bold font-mono mb-1" style={{ color: stat.color }}>{stat.value}</div>
                                <div className="text-sm font-bold text-zinc-300">{stat.label}</div>
                                <div className="text-[10px] text-zinc-600">{stat.sub}</div>
                            </div>
                        ))}
                    </div>
                )}

                {tab === "clients" && (
                    <div className="space-y-4">
                        {CLIENTS.map(client => {
                            const usagePct = Math.min((client.usedMinutes / client.includedMinutes) * 100, 100);
                            const overage = Math.max(0, client.usedMinutes - client.includedMinutes);
                            const overageCharge = overage * client.overageRate;
                            return (
                                <div key={client.id} className={`bg-zinc-900 border rounded-2xl p-6 ${client.status === "Past Due" ? "border-red-900/50" : "border-zinc-800"}`}>
                                    <div className="flex items-start justify-between mb-5">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-sm font-bold text-white">{client.name}</h3>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ color: PLAN_COLORS[client.plan], background: PLAN_COLORS[client.plan] + "15" }}>{client.plan}</span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${STATUS_COLORS[client.status]}`}>{client.status}</span>
                                            </div>
                                            <div className="text-[10px] text-zinc-500">Stripe: {client.stripeCustomerId} · Next billing: {client.nextBillingDate}</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {client.status === "Past Due" && (
                                                <button onClick={() => chargeClient(client.id)} disabled={chargingId === client.id}
                                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-colors">
                                                    {chargingId === client.id ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Charging...</> : <><CreditCard className="w-3.5 h-3.5" /> Charge Now</>}
                                                </button>
                                            )}
                                            <div className="text-right">
                                                <div className="text-xl font-bold text-white">${(client.monthlyFee + overageCharge).toFixed(2)}</div>
                                                <div className="text-[10px] text-zinc-500">Total this cycle</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-3 gap-5">
                                        <div>
                                            <div className="flex justify-between text-xs mb-1.5">
                                                <span className="text-zinc-400">Minutes Used</span>
                                                <span className={`font-bold ${usagePct > 90 ? "text-red-400" : usagePct > 70 ? "text-yellow-400" : "text-zinc-300"}`}>{client.usedMinutes} / {client.includedMinutes}</span>
                                            </div>
                                            <div className="w-full bg-zinc-800 rounded-full h-2.5">
                                                <div className="h-2.5 rounded-full transition-all" style={{ width: `${usagePct}%`, background: usagePct > 90 ? "#ef4444" : usagePct > 70 ? "#f59e0b" : "#10b981" }} />
                                            </div>
                                            {usagePct >= 80 && <div className="text-[10px] text-yellow-400 mt-1">⚠ {Math.round(usagePct)}% used — alert sent</div>}
                                        </div>
                                        <div className="flex gap-6">
                                            <div>
                                                <div className="text-[10px] text-zinc-500 mb-0.5">Plan Rate</div>
                                                <div className="text-sm font-bold text-zinc-200">${client.monthlyFee}/mo</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-zinc-500 mb-0.5">Overage</div>
                                                <div className="text-sm font-bold text-yellow-400">${overageCharge.toFixed(2)}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-zinc-500 mb-0.5">Calls</div>
                                                <div className="text-sm font-bold text-zinc-200">{client.usedCalls}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 justify-end">
                                            <button className="flex items-center gap-1.5 text-[10px] text-zinc-400 bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-lg transition-colors">
                                                <ExternalLink className="w-3 h-3" /> Stripe Portal
                                            </button>
                                            <button className="flex items-center gap-1.5 text-[10px] text-zinc-400 bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-lg transition-colors">
                                                <FileText className="w-3 h-3" /> Invoice
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {tab === "invoices" && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
                            <h2 className="text-sm font-bold text-white">Invoice History</h2>
                            <button className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-800 px-3 py-1.5 rounded-lg hover:bg-zinc-700 transition-colors">
                                <Download className="w-3.5 h-3.5" /> Export All
                            </button>
                        </div>
                        <div className="divide-y divide-zinc-800/50">
                            {INVOICES.map(inv => (
                                <div key={inv.id} className="grid grid-cols-12 items-center px-5 py-4 hover:bg-zinc-800/20">
                                    <div className="col-span-2 text-xs font-mono text-zinc-500">{inv.id}</div>
                                    <div className="col-span-3 text-sm font-bold text-zinc-200">{inv.client}</div>
                                    <div className="col-span-2 text-xs text-zinc-400">{inv.period}</div>
                                    <div className="col-span-2 font-mono text-sm font-bold text-white">${inv.amount.toFixed(2)}</div>
                                    <div className="col-span-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${INV_COLORS[inv.status]}`}>{inv.status}</span></div>
                                    <div className="col-span-1 flex justify-end">
                                        <button className="p-1.5 text-zinc-600 hover:text-zinc-200 transition-colors"><Download className="w-3.5 h-3.5" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {tab === "plans" && (
                    <div className="grid md:grid-cols-3 gap-6">
                        {PLANS.map(plan => (
                            <div key={plan.name} className={`bg-zinc-900 border rounded-2xl p-6 flex flex-col gap-5 ${plan.name === "Professional" ? "border-cyan-500/40" : "border-zinc-800"}`}>
                                {plan.name === "Professional" && <div className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full w-fit">Most Popular</div>}
                                <div>
                                    <div className="text-sm font-bold mb-1" style={{ color: plan.color }}>{plan.name}</div>
                                    <div className="text-3xl font-bold text-white">${plan.price}<span className="text-sm font-normal text-zinc-500">/mo</span></div>
                                    <div className="text-[10px] text-zinc-500 mt-1">+${plan.overage}/min overage</div>
                                </div>
                                <div className="space-y-2">
                                    {plan.features.map(f => <div key={f} className="flex items-center gap-2 text-xs text-zinc-300"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: plan.color }} />{f}</div>)}
                                </div>
                                <button className="mt-auto w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90" style={{ background: plan.color }}>
                                    Assign to Client
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
