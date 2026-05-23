"use client";
import React, { useState } from "react";
import {
    FileText, Upload, Clock, CheckCircle2, AlertCircle, Phone,
    Plus, ExternalLink, RefreshCw, Download, Info, ArrowRight
} from "lucide-react";

type PortStatus = "Draft" | "Submitted" | "Carrier Processing" | "Approved" | "Scheduled" | "Complete" | "Rejected";

interface PortRequest {
    id: string;
    number: string;
    numberType: string;
    losingCarrier: string;
    gainingCarrier: string;
    submittedDate: string;
    scheduledDate: string | null;
    status: PortStatus;
    rejectionReason: string | null;
    loaUploaded: boolean;
    accountNumber: string;
    authorizedName: string;
}

const DEMO_PORTS: PortRequest[] = [
    { id: "p1", number: "+61298765432", numberType: "Geographic (02)", losingCarrier: "Telstra", gainingCarrier: "Vonex-AU", submittedDate: "2026-03-05", scheduledDate: "2026-03-13", status: "Scheduled", rejectionReason: null, loaUploaded: true, accountNumber: "TEL-000234567", authorizedName: "John Smith" },
    { id: "p2", number: "+61412345678", numberType: "Mobile (04)", losingCarrier: "Optus", gainingCarrier: "MyNetFone-AU", submittedDate: "2026-03-01", scheduledDate: null, status: "Carrier Processing", rejectionReason: null, loaUploaded: true, accountNumber: "OPT-99887766", authorizedName: "Sarah Johnson" },
    { id: "p3", number: "1300 555 678", numberType: "1300", losingCarrier: "Issabel Telco", gainingCarrier: "Symbio-AU", submittedDate: "2026-02-20", scheduledDate: "2026-03-01", status: "Complete", rejectionReason: null, loaUploaded: true, accountNumber: "ISS-445566", authorizedName: "Robert Chen" },
    { id: "p4", number: "+61387654321", numberType: "Geographic (03)", losingCarrier: "Vodafone", gainingCarrier: "Vonex-AU", submittedDate: "2026-03-08", scheduledDate: null, status: "Rejected", rejectionReason: "Account number mismatch. Please verify account ID with losing carrier.", loaUploaded: true, accountNumber: "VOD-112233", authorizedName: "Emma Wilson" },
];

const STATUS_STEPS: PortStatus[] = ["Draft", "Submitted", "Carrier Processing", "Approved", "Scheduled", "Complete"];

const STATUS_COLORS: Record<PortStatus, string> = {
    Draft: "text-zinc-400 bg-zinc-800",
    Submitted: "text-blue-400 bg-blue-500/10",
    "Carrier Processing": "text-yellow-400 bg-yellow-500/10",
    Approved: "text-cyan-400 bg-cyan-500/10",
    Scheduled: "text-violet-400 bg-violet-500/10",
    Complete: "text-emerald-400 bg-emerald-500/10",
    Rejected: "text-red-400 bg-red-500/10",
};

export default function NumberPortingPage() {
    const [requests, setRequests] = useState(DEMO_PORTS);
    const [selected, setSelected] = useState<PortRequest | null>(DEMO_PORTS[0]);
    const [showNew, setShowNew] = useState(false);
    const [newNum, setNewNum] = useState("");
    const [newCarrier, setNewCarrier] = useState("");

    const submitNew = () => {
        if (!newNum.trim()) return;
        const port: PortRequest = {
            id: `p${Date.now()}`, number: newNum, numberType: "Geographic", losingCarrier: newCarrier || "Unknown",
            gainingCarrier: "Vonex-AU", submittedDate: new Date().toISOString().slice(0, 10), scheduledDate: null,
            status: "Submitted", rejectionReason: null, loaUploaded: false, accountNumber: "", authorizedName: ""
        };
        setRequests(prev => [port, ...prev]);
        setShowNew(false); setNewNum(""); setNewCarrier("");
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200 p-8 md:p-10">
            <div className="max-w-[1600px] mx-auto space-y-8">

                <div className="bg-gradient-to-r from-pink-950/40 to-rose-950/30 border border-pink-900/30 rounded-2xl p-6 flex items-center gap-5">
                    <div className="w-14 h-14 bg-pink-500/10 border border-pink-500/20 rounded-2xl flex items-center justify-center">
                        <Phone className="w-7 h-7 text-pink-400" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-white mb-1">Number Porting Dashboard</h1>
                        <p className="text-xs text-zinc-400">Manage inbound number port requests from any AU carrier into Asterisk PJSIP. Track status from submission through to go-live. Upload LOA and monitor carrier processing timelines.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="text-right">
                            <div className="text-2xl font-bold text-pink-400">{requests.length}</div>
                            <div className="text-[10px] text-zinc-500">Port Requests</div>
                        </div>
                        <button onClick={() => setShowNew(p => !p)} className="flex items-center gap-2 px-4 py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-sm font-bold transition-colors">
                            <Plus className="w-4 h-4" /> New Port Request
                        </button>
                    </div>
                </div>

                {showNew && (
                    <div className="bg-zinc-900 border border-pink-900/40 rounded-2xl p-6 space-y-4">
                        <h3 className="text-sm font-bold text-white">New Port-In Request</h3>
                        <div className="grid md:grid-cols-3 gap-4">
                            {[
                                { label: "Number to Port", value: newNum, setter: setNewNum, placeholder: "+61298765432" },
                                { label: "Losing Carrier", value: newCarrier, setter: setNewCarrier, placeholder: "Telstra / Optus / Vodafone" },
                            ].map(f => (
                                <div key={f.label}>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">{f.label}</label>
                                    <input value={f.value} onChange={e => f.setter(e.target.value)} placeholder={f.placeholder}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-pink-500" />
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={submitNew} className="bg-pink-600 hover:bg-pink-500 text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors">Submit Request</button>
                            <button onClick={() => setShowNew(false)} className="bg-zinc-800 text-zinc-300 px-5 py-2 rounded-xl text-xs font-bold hover:bg-zinc-700 transition-colors">Cancel</button>
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-5 gap-6">
                    {/* List */}
                    <div className="lg:col-span-2 space-y-3">
                        {requests.map(req => (
                            <div key={req.id} onClick={() => setSelected(req)}
                                className={`bg-zinc-900 border rounded-xl p-4 cursor-pointer transition-all hover:border-zinc-600 ${selected?.id === req.id ? "border-pink-500/50" : req.status === "Rejected" ? "border-red-900/50" : "border-zinc-800"}`}>
                                <div className="flex items-start justify-between mb-1">
                                    <div className="text-sm font-bold font-mono text-zinc-200">{req.number}</div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${STATUS_COLORS[req.status]}`}>{req.status}</span>
                                </div>
                                <div className="text-[10px] text-zinc-500">{req.losingCarrier} → {req.gainingCarrier}</div>
                                {req.scheduledDate && <div className="text-[10px] text-violet-400 mt-1">Go-live: {req.scheduledDate}</div>}
                                {req.status === "Rejected" && <div className="text-[10px] text-red-400 mt-1">⚠ Rejected — click to view reason</div>}
                            </div>
                        ))}
                    </div>

                    {/* Detail */}
                    {selected && (
                        <div className="lg:col-span-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
                            <div>
                                <div className="text-base font-bold font-mono text-white mb-0.5">{selected.number}</div>
                                <div className="text-xs text-zinc-500">{selected.numberType} · Submitted {selected.submittedDate}</div>
                            </div>

                            {/* Progress steps */}
                            {selected.status !== "Rejected" ? (
                                <div className="flex items-center gap-1">
                                    {STATUS_STEPS.map((step, i) => {
                                        const idx = STATUS_STEPS.indexOf(selected.status as PortStatus);
                                        const active = i <= idx;
                                        return (
                                            <React.Fragment key={step}>
                                                <div className={`text-center flex-1 ${active ? "text-white" : "text-zinc-600"}`}>
                                                    <div className={`w-6 h-6 rounded-full mx-auto mb-1 flex items-center justify-center text-[10px] font-bold ${active ? "bg-pink-600" : "bg-zinc-800"}`}>{i + 1}</div>
                                                    <div className="text-[9px]">{step}</div>
                                                </div>
                                                {i < STATUS_STEPS.length - 1 && <div className={`w-4 h-px shrink-0 mb-4 ${i < STATUS_STEPS.indexOf(selected.status as PortStatus) ? "bg-pink-600" : "bg-zinc-800"}`} />}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="bg-red-950/30 border border-red-900/40 rounded-xl p-4">
                                    <div className="text-xs font-bold text-red-400 mb-1">Port Request Rejected</div>
                                    <p className="text-xs text-zinc-300">{selected.rejectionReason}</p>
                                </div>
                            )}

                            {/* Details grid */}
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: "Losing Carrier", value: selected.losingCarrier },
                                    { label: "Gaining Carrier", value: selected.gainingCarrier },
                                    { label: "Account Number", value: selected.accountNumber || "—" },
                                    { label: "Authorized Name", value: selected.authorizedName || "—" },
                                    { label: "Scheduled Go-Live", value: selected.scheduledDate || "TBD" },
                                    { label: "LOA Document", value: selected.loaUploaded ? "✓ Uploaded" : "⚠ Not uploaded" },
                                ].map(d => (
                                    <div key={d.label} className="bg-zinc-800 rounded-xl p-3">
                                        <div className="text-[10px] text-zinc-500 mb-0.5">{d.label}</div>
                                        <div className="text-xs font-bold text-zinc-200">{d.value}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                {!selected.loaUploaded && (
                                    <button className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-bold transition-colors">
                                        <Upload className="w-3.5 h-3.5" /> Upload LOA
                                    </button>
                                )}
                                <button className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-colors">
                                    <Download className="w-3.5 h-3.5" /> Download LOA
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
