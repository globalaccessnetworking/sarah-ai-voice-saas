"use client";
import React, { useState } from "react";
import {
    Voicemail, Play, Pause, Mail, MessageSquare, CheckCircle2,
    Mic, Clock, PhoneIncoming, RefreshCw, Trash2, ExternalLink,
    Search, Download, Settings, User
} from "lucide-react";

interface VoicemailEntry {
    id: string;
    from: string;
    callerNum: string;
    duration: number;
    receivedAt: string;
    read: boolean;
    transcription: string | null;
    transcribing: boolean;
    sentToEmail: boolean;
    sentToCRM: boolean;
    box: string;
    agent: string;
}

const DEMO_VOICEMAILS: VoicemailEntry[] = [
    {
        id: "vm1", from: "John Smith", callerNum: "+61412345678", duration: 48, receivedAt: "06:01:23", read: false,
        transcription: "Hi, this is John from ABC Dental. I was hoping to book an appointment for next Tuesday afternoon if possible. My existing patient file is under the name Smith. Please call me back on this number. Thank you.",
        transcribing: false, sentToEmail: true, sentToCRM: false, box: "dental@", agent: "Sarah (Dental)"
    },
    {
        id: "vm2", from: "Unknown", callerNum: "+61298765432", duration: 32, receivedAt: "05:45:10", read: false,
        transcription: null, transcribing: false, sentToEmail: false, sentToCRM: false, box: "sales@", agent: "Alex (Sales)"
    },
    {
        id: "vm3", from: "Sarah Johnson", callerNum: "+61387654321", duration: 71, receivedAt: "05:22:00", read: true,
        transcription: "Good morning, this is Sarah Johnson calling about my prescription refill. My date of birth is January 15 1982 and I'm after a refill for my blood pressure medication. Can you please call me back as soon as possible. Thank you very much.",
        transcribing: false, sentToEmail: true, sentToCRM: true, box: "medical@", agent: "Reception AI"
    },
    {
        id: "vm4", from: "Robert Chen", callerNum: "+61411222333", duration: 25, receivedAt: "05:01:44", read: true,
        transcription: "Hi I'm calling about a quote for commercial cleaning services. We have a 500 square metre office in the CBD. Please call Robert on this number.",
        transcribing: false, sentToEmail: false, sentToCRM: false, box: "sales@", agent: "Alex (Sales)"
    },
];

function formatDuration(s: number): string {
    const m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, "0")}`;
}

export default function VoicemailPage() {
    const [voicemails, setVoicemails] = useState(DEMO_VOICEMAILS);
    const [playing, setPlaying] = useState<string | null>(null);
    const [selected, setSelected] = useState<VoicemailEntry | null>(DEMO_VOICEMAILS[0]);
    const [search, setSearch] = useState("");

    const transcribe = async (id: string) => {
        setVoicemails(prev => prev.map(v => v.id === id ? { ...v, transcribing: true } : v));
        await new Promise(r => setTimeout(r, 2500));
        setVoicemails(prev => prev.map(v => v.id === id ? {
            ...v, transcribing: false,
            transcription: "Hi there, I saw your advertisement online and I'm very interested in finding out more about your AI phone system for my business. We currently handle about 200 calls per day and I think your solution could help. Please call me back at your earliest convenience."
        } : v));
    };

    const sendToEmail = (id: string) => setVoicemails(prev => prev.map(v => v.id === id ? { ...v, sentToEmail: true } : v));
    const sendToCRM = (id: string) => setVoicemails(prev => prev.map(v => v.id === id ? { ...v, sentToCRM: true } : v));
    const markRead = (v: VoicemailEntry) => { setSelected(v); setVoicemails(prev => prev.map(m => m.id === v.id ? { ...m, read: true } : m)); };

    const filtered = voicemails.filter(v =>
        v.from.toLowerCase().includes(search.toLowerCase()) ||
        v.callerNum.includes(search) ||
        v.box.includes(search)
    );

    const unread = voicemails.filter(v => !v.read).length;

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200 p-8 md:p-10">
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* Header */}
                <div className="bg-gradient-to-r from-teal-950/40 to-cyan-950/30 border border-teal-900/30 rounded-2xl p-6 flex items-center gap-5">
                    <div className="w-14 h-14 bg-teal-500/10 border border-teal-500/20 rounded-2xl flex items-center justify-center">
                        <Voicemail className="w-7 h-7 text-teal-400" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-white mb-1">AI Voicemail Transcription</h1>
                        <p className="text-xs text-zinc-400">Asterisk voicemail auto-transcribed by OpenAI Whisper. Send transcripts to email, push to HubSpot/GHL CRM contacts, and view full inbox with audio player.</p>
                    </div>
                    <div className="flex gap-5">
                        <div className="text-right">
                            <div className="text-2xl font-bold text-teal-400">{unread}</div>
                            <div className="text-[10px] text-zinc-500">Unread</div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-white">{voicemails.length}</div>
                            <div className="text-[10px] text-zinc-500">Total</div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-5 gap-6">
                    {/* Voicemail list */}
                    <div className="lg:col-span-2 space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search voicemails..."
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-teal-500" />
                        </div>
                        {filtered.map(vm => (
                            <div key={vm.id} onClick={() => markRead(vm)}
                                className={`bg-zinc-900 border rounded-xl p-4 cursor-pointer transition-all hover:border-zinc-600 ${selected?.id === vm.id ? "border-teal-500/50" : !vm.read ? "border-zinc-700" : "border-zinc-800"}`}>
                                <div className="flex items-start justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                        {!vm.read && <div className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />}
                                        <div className="text-xs font-bold text-zinc-200">{vm.from}</div>
                                    </div>
                                    <span className="text-[10px] text-zinc-500">{vm.receivedAt}</span>
                                </div>
                                <div className="text-[10px] font-mono text-zinc-500 mb-2">{vm.callerNum} · {vm.box}</div>
                                {vm.transcription ? (
                                    <p className="text-[10px] text-zinc-400 line-clamp-2">{vm.transcription}</p>
                                ) : (
                                    <p className="text-[10px] text-zinc-600 italic">No transcript yet — click to transcribe</p>
                                )}
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-[10px] text-zinc-600">🎙 {formatDuration(vm.duration)}</span>
                                    <div className="flex gap-1.5">
                                        {vm.sentToEmail && <Mail className="w-3 h-3 text-emerald-400" />}
                                        {vm.sentToCRM && <MessageSquare className="w-3 h-3 text-blue-400" />}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Detail panel */}
                    <div className="lg:col-span-3">
                        {selected ? (
                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="text-sm font-bold text-white mb-0.5">{selected.from}</div>
                                        <div className="text-[10px] font-mono text-zinc-500">{selected.callerNum} · {selected.box} · {selected.receivedAt}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setPlaying(p => p === selected.id ? null : selected.id)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${playing === selected.id ? "bg-teal-600/30 text-teal-400" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}>
                                            {playing === selected.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                            {playing === selected.id ? "Pause" : "Play"}
                                        </button>
                                        <button className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-400"><Download className="w-3.5 h-3.5" /></button>
                                        <button className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                </div>

                                {/* Waveform visual */}
                                <div className="bg-zinc-800 rounded-xl p-4 flex items-center gap-2">
                                    {Array.from({ length: 48 }, (_, i) => (
                                        <div key={i} className="flex-1 rounded-full bg-teal-500/40 transition-all"
                                            style={{ height: `${8 + Math.sin(i * 0.5) * 12 + Math.random() * 8}px`, opacity: playing === selected.id ? 1 : 0.4 }} />
                                    ))}
                                </div>

                                {/* Transcription */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Transcription (Whisper AI)</h3>
                                        {!selected.transcription && (
                                            <button onClick={() => transcribe(selected.id)} disabled={selected.transcribing}
                                                className="flex items-center gap-1.5 text-[10px] font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-3 py-1.5 rounded-lg hover:bg-teal-500/20 transition-colors disabled:opacity-50">
                                                {selected.transcribing ? <><RefreshCw className="w-3 h-3 animate-spin" /> Transcribing...</> : <><Mic className="w-3 h-3" /> Transcribe Now</>}
                                            </button>
                                        )}
                                    </div>
                                    {selected.transcription ? (
                                        <div className="bg-zinc-800 rounded-xl p-4">
                                            <p className="text-sm text-zinc-300 leading-relaxed">{selected.transcription}</p>
                                        </div>
                                    ) : selected.transcribing ? (
                                        <div className="bg-zinc-800 rounded-xl p-4 flex items-center gap-3 text-teal-400">
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            <span className="text-sm">Sending to Whisper API...</span>
                                        </div>
                                    ) : (
                                        <div className="bg-zinc-800 rounded-xl p-4 text-zinc-600 text-sm italic">Click &quot;Transcribe Now&quot; to generate transcript</div>
                                    )}
                                </div>

                                {/* Actions */}
                                {selected.transcription && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => sendToEmail(selected.id)}
                                            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${selected.sentToEmail ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"}`}>
                                            <Mail className="w-4 h-4" /> {selected.sentToEmail ? "✓ Emailed" : "Send to Email"}
                                        </button>
                                        <button onClick={() => sendToCRM(selected.id)}
                                            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${selected.sentToCRM ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"}`}>
                                            <MessageSquare className="w-4 h-4" /> {selected.sentToCRM ? "✓ In CRM" : "Push to CRM"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center h-64">
                                <div className="text-center text-zinc-600">
                                    <Voicemail className="w-12 h-12 mx-auto mb-3" />
                                    <p className="text-sm">Select a voicemail</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
