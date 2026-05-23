"use client";
import React, { useState } from "react";
import {
    PhoneForwarded, Phone, PhoneOff, PhoneIncoming, ArrowRight,
    Users, Clock, CheckCircle2, AlertTriangle, History, Play,
    Pause, Star, RefreshCw, Mic
} from "lucide-react";

interface ActiveCall {
    id: string;
    callerName: string;
    callerNum: string;
    channel: string;
    duration: number;
    state: "Active" | "On Hold" | "Transferred";
    extension: string;
}

interface ParkSlot {
    slot: number;
    callerNum: string;
    callerName: string;
    parkedSince: number;
    parkedBy: string;
    occupied: boolean;
}

interface TransferLog {
    id: string;
    time: string;
    from: string;
    to: string;
    type: "Attended" | "Blind";
    result: "Completed" | "Failed" | "Cancelled";
}

const ACTIVE_CALLS: ActiveCall[] = [
    { id: "c1", callerName: "John Smith", callerNum: "+61412345678", channel: "PJSIP/vonex-0001", duration: 180, state: "Active", extension: "1001" },
    { id: "c2", callerName: "Sarah Johnson", callerNum: "+61298765432", channel: "PJSIP/mynetfone-0002", duration: 65, state: "On Hold", extension: "1002" },
    { id: "c3", callerName: "Unknown", callerNum: "+61387654321", channel: "PJSIP/symbio-0003", duration: 12, state: "Active", extension: "1003" },
];

const PARK_SLOTS: ParkSlot[] = [
    { slot: 71, callerNum: "+61411222333", callerName: "Robert Chen", parkedSince: 45, parkedBy: "Sarah AI", occupied: true },
    { slot: 72, callerNum: "", callerName: "", parkedSince: 0, parkedBy: "", occupied: false },
    { slot: 73, callerNum: "", callerName: "", parkedSince: 0, parkedBy: "", occupied: false },
    { slot: 74, callerNum: "", callerName: "", parkedSince: 0, parkedBy: "", occupied: false },
];

const TRANSFER_LOG: TransferLog[] = [
    { id: "t1", time: "06:42:11", from: "+61412345678 (John)", to: "Sales Queue", type: "Attended", result: "Completed" },
    { id: "t2", time: "06:38:05", from: "+61298765432 (Sarah)", to: "+61411000001 (Manager)", type: "Blind", result: "Completed" },
    { id: "t3", time: "06:25:50", from: "+61387654321", to: "Voicemail", type: "Blind", result: "Completed" },
    { id: "t4", time: "06:10:33", from: "+61422111000", to: "+61413000000 (Tech)", type: "Attended", result: "Cancelled" },
];

function formatDuration(s: number): string {
    const m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, "0")}`;
}

export default function TransferPage() {
    const [calls, setCalls] = useState(ACTIVE_CALLS);
    const [parkSlots] = useState(PARK_SLOTS);
    const [selectedCall, setSelectedCall] = useState<ActiveCall | null>(ACTIVE_CALLS[0]);
    const [transferTarget, setTransferTarget] = useState("");
    const [transferType, setTransferType] = useState<"Attended" | "Blind">("Attended");
    const [transferring, setTransferring] = useState(false);
    const [transferDone, setTransferDone] = useState(false);

    const handleTransfer = async () => {
        if (!selectedCall || !transferTarget) return;
        setTransferring(true);
        await new Promise(r => setTimeout(r, 1500));
        setTransferring(false);
        setTransferDone(true);
        setCalls(prev => prev.filter(c => c.id !== selectedCall.id));
        setSelectedCall(null);
        setTransferTarget("");
        setTimeout(() => setTransferDone(false), 3000);
    };

    const toggleHold = (id: string) => {
        setCalls(prev => prev.map(c => c.id === id ? { ...c, state: c.state === "On Hold" ? "Active" : "On Hold" } : c));
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200 p-8 md:p-10">
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-950/40 to-teal-950/30 border border-emerald-900/30 rounded-2xl p-6 flex items-center gap-5">
                    <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center">
                        <PhoneForwarded className="w-7 h-7 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-white mb-1">Call Transfer Engine</h1>
                        <p className="text-xs text-zinc-400">Attended and blind transfers via Asterisk AMI. Park calls, retrieve from lot, transfer to queues, extensions or external numbers. Full transfer history.</p>
                    </div>
                    <div className="flex gap-6">
                        <div className="text-right">
                            <div className="text-2xl font-bold text-emerald-400">{calls.length}</div>
                            <div className="text-[10px] text-zinc-500">Active Calls</div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-orange-400">{parkSlots.filter(p => p.occupied).length}</div>
                            <div className="text-[10px] text-zinc-500">Parked</div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-5 gap-6">
                    {/* Active Calls */}
                    <div className="lg:col-span-2 space-y-3">
                        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Active Calls</h2>
                        {calls.map(call => (
                            <div key={call.id} onClick={() => setSelectedCall(call)}
                                className={`bg-zinc-900 border rounded-xl p-4 cursor-pointer transition-all ${selectedCall?.id === call.id ? "border-emerald-500/50 ring-1 ring-emerald-500/20" : "border-zinc-800 hover:border-zinc-600"}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <div className="text-sm font-bold text-zinc-200">{call.callerName}</div>
                                        <div className="text-[10px] font-mono text-zinc-500">{call.callerNum}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-mono text-sm text-white">{formatDuration(call.duration)}</div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${call.state === "Active" ? "text-emerald-400 bg-emerald-500/10" : "text-yellow-400 bg-yellow-500/10"}`}>{call.state}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <button onClick={e => { e.stopPropagation(); toggleHold(call.id); }} className="flex-1 py-1.5 text-[10px] font-bold bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/20 rounded-lg transition-colors flex items-center justify-center gap-1">
                                        {call.state === "On Hold" ? <><Play className="w-3 h-3" /> Resume</> : <><Pause className="w-3 h-3" /> Hold</>}
                                    </button>
                                    <button className="flex-1 py-1.5 text-[10px] font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors flex items-center justify-center gap-1">
                                        <PhoneOff className="w-3 h-3" /> Hangup
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Transfer Panel */}
                    <div className="lg:col-span-3 space-y-5">
                        {/* Transfer Form */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-5">
                            <h2 className="text-sm font-bold text-white">Transfer Call</h2>
                            {selectedCall ? (
                                <>
                                    <div className="flex items-center gap-3 bg-zinc-800 rounded-xl p-3">
                                        <Phone className="w-4 h-4 text-emerald-400" />
                                        <div>
                                            <div className="text-xs font-bold text-white">{selectedCall.callerName}</div>
                                            <div className="text-[10px] text-zinc-500 font-mono">{selectedCall.callerNum} — {selectedCall.channel}</div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Transfer Type</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {(["Attended", "Blind"] as const).map(t => (
                                                <button key={t} onClick={() => setTransferType(t)}
                                                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${transferType === t ? "bg-emerald-600 border-emerald-500 text-white" : "border-zinc-700 text-zinc-400 hover:text-zinc-200"}`}>
                                                    {t === "Attended" ? "🤝 Attended (warm)" : "⚡ Blind (cold)"}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-zinc-500 mt-2">
                                            {transferType === "Attended" ? "Caller is placed on hold, you speak with target first, then bridge." : "Caller is immediately transferred to destination without consulting."}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Transfer To</label>
                                        <input value={transferTarget} onChange={e => setTransferTarget(e.target.value)}
                                            placeholder="Extension (1001), Queue (sales-queue), or Number (+61...)"
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500" />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {["1001 (Reception)", "Sales Queue", "Voicemail"].map(quick => (
                                            <button key={quick} onClick={() => setTransferTarget(quick.split(" ")[0])}
                                                className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-[10px] font-bold text-zinc-400 hover:text-zinc-200 transition-colors truncate">
                                                {quick}
                                            </button>
                                        ))}
                                    </div>
                                    <button onClick={handleTransfer} disabled={!transferTarget || transferring}
                                        className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${transferDone ? "bg-emerald-600 text-white" : "bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"}`}>
                                        {transferring ? <><RefreshCw className="w-4 h-4 animate-spin" /> Transferring...</> :
                                            transferDone ? <><CheckCircle2 className="w-4 h-4" /> Transfer Complete!</> :
                                                <><PhoneForwarded className="w-4 h-4" /> {transferType} Transfer</>}
                                    </button>
                                </>
                            ) : (
                                <div className="text-center py-8 text-zinc-500">
                                    <PhoneIncoming className="w-10 h-10 mx-auto mb-3 text-zinc-700" />
                                    <p className="text-sm">Select an active call to transfer</p>
                                </div>
                            )}
                        </div>

                        {/* Parking Lot */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                            <div className="px-5 py-4 border-b border-zinc-800">
                                <h2 className="text-sm font-bold text-white">Call Parking Lot</h2>
                            </div>
                            <div className="grid grid-cols-4 gap-px bg-zinc-800">
                                {parkSlots.map(slot => (
                                    <div key={slot.slot} className={`p-4 ${slot.occupied ? "bg-orange-950/20" : "bg-zinc-900"}`}>
                                        <div className="text-xs font-bold text-zinc-500 mb-1">Slot {slot.slot}</div>
                                        {slot.occupied ? (
                                            <>
                                                <div className="text-xs font-bold text-orange-400">{slot.callerName}</div>
                                                <div className="text-[10px] font-mono text-zinc-500">{slot.callerNum}</div>
                                                <div className="text-[10px] text-zinc-600 mt-1">Parked {slot.parkedSince}s ago</div>
                                                <button className="mt-2 w-full py-1 bg-emerald-500/10 text-emerald-400 rounded text-[10px] font-bold hover:bg-emerald-500/20">Retrieve</button>
                                            </>
                                        ) : (
                                            <div className="text-[10px] text-zinc-700">Empty</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Transfer History */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                            <div className="px-5 py-4 border-b border-zinc-800"><h2 className="text-sm font-bold text-white">Transfer History</h2></div>
                            <div className="divide-y divide-zinc-800/50">
                                {TRANSFER_LOG.map(log => (
                                    <div key={log.id} className="flex items-center gap-4 px-5 py-3">
                                        <span className="font-mono text-[10px] text-zinc-600 w-14">{log.time}</span>
                                        <div className="flex-1 text-xs text-zinc-400">{log.from} <ArrowRight className="w-3 h-3 inline text-zinc-600 mx-1" /> {log.to}</div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${log.type === "Attended" ? "text-blue-400 bg-blue-500/10" : "text-orange-400 bg-orange-500/10"}`}>{log.type}</span>
                                        <span className={`text-[10px] font-bold ${log.result === "Completed" ? "text-emerald-400" : log.result === "Cancelled" ? "text-yellow-400" : "text-red-400"}`}>{log.result}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
