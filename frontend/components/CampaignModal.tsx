"use client";

import { useState, useRef } from "react";
import { X, Upload, Check, AlertCircle, Trash2, Users, FileText, Plus } from "lucide-react";

interface CampaignModalProps {
    isOpen: boolean;
    onClose: () => void;
    agents: any[];
    trunks: any[];
    initialData?: any;
    onSave: (campaign: any) => void;
}

export default function CampaignModal({ isOpen, onClose, agents, trunks, initialData, onSave }: CampaignModalProps) {
    const [name, setName] = useState(initialData?.name || "");
    const [agentId, setAgentId] = useState(initialData?.agentId || (agents[0]?.id || ""));
    const [sipTrunkId, setSipTrunkId] = useState(initialData?.sipTrunkId || (trunks[0]?.id || ""));
    const [concurrency, setConcurrency] = useState(initialData?.concurrency || 1);
    const [callDelay, setCallDelay] = useState(initialData?.callDelaySeconds || 0);
    const [leads, setLeads] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const rows = text.split('\n').filter(row => row.trim().length > 0);
            const parsedLeads = rows.slice(1).map(row => {
                const parts = row.split(',').map(p => p.trim());
                return {
                    phone: parts[0],
                    name: parts[1] || "",
                    companyName: parts[2] || "",
                    customData: parts.slice(3).join(',') || ""
                };
            }).filter(l => l.phone.length > 0);
            setLeads(parsedLeads);
        };
        reader.readAsText(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const payload = {
            name,
            agentId,
            sipTrunkId,
            concurrency,
            callDelaySeconds: callDelay,
            numbers: leads
        };

        try {
            const res = await fetch("/api/campaigns", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                onSave(data);
                onClose();
            } else {
                alert(data.error || "Failed to create campaign");
            }
        } catch (err) {
            console.error(err);
            alert("Error creating campaign");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-4xl bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[var(--brand-primary)]/10 rounded-lg">
                            <Plus className="w-5 h-5 text-[var(--brand-primary)]" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Scale New Campaign</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-8 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Configuration Section */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" /> Strategy & Routing
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Campaign Identity</label>
                                    <input
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Renewals Q1 - High Priority"
                                        className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] transition-all font-medium"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Voice Agent</label>
                                        <select
                                            value={agentId}
                                            onChange={(e) => setAgentId(e.target.value)}
                                            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] transition-all font-medium"
                                        >
                                            {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Outbound Trunk</label>
                                        <select
                                            value={sipTrunkId}
                                            onChange={(e) => setSipTrunkId(e.target.value)}
                                            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] transition-all font-medium"
                                        >
                                            {trunks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Concurrency</label>
                                        <input
                                            type="number"
                                            value={concurrency}
                                            onChange={(e) => setConcurrency(parseInt(e.target.value))}
                                            min="1"
                                            max="50"
                                            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] transition-all font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Delay (Seconds)</label>
                                        <input
                                            type="number"
                                            value={callDelay}
                                            onChange={(e) => setCallDelay(parseInt(e.target.value))}
                                            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] transition-all font-medium"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Lead Upload Section */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
                                <span className="flex items-center gap-2"><Users className="w-4 h-4" /> Lead Pipeline</span>
                                <span className="text-[10px] bg-[var(--brand-primary)]/20 text-[var(--brand-primary)] px-2 py-1 rounded-full">{leads.length} Leads</span>
                            </h3>

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-[var(--border-color)] rounded-2xl p-10 text-center cursor-pointer hover:border-[var(--brand-primary)]/50 hover:bg-[var(--brand-primary)]/5 transition-all group"
                            >
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
                                <Upload className="w-10 h-10 mx-auto mb-4 text-gray-600 group-hover:text-[var(--brand-primary)] transition-colors" />
                                <p className="font-bold text-white">Upload Lead Matrix (CSV)</p>
                                <p className="text-xs text-gray-500 mt-2 font-mono">Phone, Name, Company, Custom...</p>
                            </div>

                            <div className="max-h-[250px] overflow-y-auto custom-scrollbar border border-[var(--border-color)] rounded-xl bg-[var(--bg-tertiary)]/30 divide-y divide-[var(--border-color)]">
                                {leads.length > 0 ? leads.map((l, i) => (
                                    <div key={i} className="p-3 flex items-center justify-between text-xs group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-[var(--bg-primary)] flex items-center justify-center text-[10px] text-gray-500">{i + 1}</div>
                                            <div>
                                                <div className="text-white font-mono">{l.phone}</div>
                                                <div className="text-gray-500">{l.name || 'Anonymous'} {l.companyName ? `@ ${l.companyName}` : ''}</div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setLeads(leads.filter((_, idx) => idx !== i)); }}
                                            className="p-1 text-red-500/0 group-hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                )) : (
                                    <div className="p-10 text-center text-gray-600 italic text-sm">
                                        No leads injected yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-[var(--border-color)] bg-[var(--bg-tertiary)]/50 flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 font-bold text-gray-400 hover:text-white transition-colors">Cancel</button>
                        <button
                            type="submit"
                            disabled={submitting || leads.length === 0}
                            className="flex items-center gap-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white px-8 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[var(--brand-primary)]/20"
                        >
                            {submitting ? "Launching..." : "Ignite Campaign"}
                            {!submitting && <Check className="w-4 h-4" />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
