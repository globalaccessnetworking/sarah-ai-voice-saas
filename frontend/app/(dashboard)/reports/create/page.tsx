"use client";

import React, { useState } from 'react';
import { ChevronLeft, Save, Plus, X, Server, FileText, Filter } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CreateReportRule() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [name, setName] = useState('');
    const [enabled, setEnabled] = useState(true);
    const [triggerType, setTriggerType] = useState('post_call');

    // Scheduled state
    const [scheduleFrequency, setScheduleFrequency] = useState('daily');
    const [scheduleTime, setScheduleTime] = useState('09:00');

    // Filters
    const [directionFilter, setDirectionFilter] = useState('all');
    const [agentFilterType, setAgentFilterType] = useState('all');
    const [agentFilter, setAgentFilter] = useState<string[]>([]);

    // Recipients
    const [recipients, setRecipients] = useState<string[]>([]);
    const [emailInput, setEmailInput] = useState('');

    const handleEmailKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && emailInput.trim() !== '') {
            e.preventDefault();
            if (!recipients.includes(emailInput.trim())) {
                setRecipients([...recipients, emailInput.trim()]);
            }
            setEmailInput('');
        }
    };

    const removeRecipient = (index: number) => {
        setRecipients(recipients.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!name.trim()) return alert("Name is required");
        if (recipients.length === 0) return alert("At least one recipient is required");

        setLoading(true);
        try {
            const body = {
                name,
                enabled,
                triggerType,
                scheduleConfig: triggerType === 'scheduled' ? { frequency: scheduleFrequency, time: scheduleTime } : {},
                agentFilter: agentFilterType === 'all' ? [] : agentFilter,
                directionFilter,
                recipients,
                templateId: 'default'
            };

            const res = await fetch('/api/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                router.push('/reports');
            } else {
                alert("Failed to save report rule");
            }
        } catch (error) {
            console.error("Failed to save report rule", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-zinc-200">
            <div className="w-full h-full overflow-y-auto bg-zinc-950 p-8 md:p-10">
                <div className="max-w-[1000px] mx-auto flex flex-col gap-8">

                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/reports" className="p-2 hover:bg-zinc-900 rounded-xl transition-colors text-zinc-400 hover:text-white">
                                <ChevronLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold font-mono tracking-tight text-white">Create Report Rule</h1>
                                <p className="text-sm text-zinc-500 font-medium">Define event triggers and payload distribution.</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
                        >
                            <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Rule'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Left Column: Form */}
                        <div className="md:col-span-2 flex flex-col gap-6">

                            {/* General */}
                            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                                <h3 className="font-bold text-zinc-100 flex items-center gap-2 text-sm uppercase tracking-wider">
                                    <FileText className="w-4 h-4 text-emerald-500" />
                                    General Details
                                </h3>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Rule Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="e.g. Daily Inbound Summary"
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                                    />
                                </div>
                                <div className="flex items-center gap-3 mt-2">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
                                        <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                        <span className="ml-3 text-sm font-bold text-zinc-300">Enable this rule immediately</span>
                                    </label>
                                </div>
                            </div>

                            {/* Trigger Engine */}
                            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                                <h3 className="font-bold text-zinc-100 flex items-center gap-2 text-sm uppercase tracking-wider">
                                    <Server className="w-4 h-4 text-blue-500" />
                                    Trigger Engine
                                </h3>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Event Type</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { id: 'post_call', label: 'Post-Call', desc: 'Fires instantly on hangup' },
                                            { id: 'post_analysis', label: 'Post-Analysis', desc: 'Fires after LLM summary' },
                                            { id: 'scheduled', label: 'Scheduled', desc: 'Fires on a chron timer' }
                                        ].map(type => (
                                            <button
                                                key={type.id}
                                                onClick={() => setTriggerType(type.id)}
                                                className={`p-4 rounded-xl border text-left transition-all ${triggerType === type.id
                                                    ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                                                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                                    }`}
                                            >
                                                <div className="font-bold text-sm mb-1">{type.label}</div>
                                                <div className="text-[10px] opacity-70 leading-snug">{type.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {triggerType === 'scheduled' && (
                                    <div className="grid grid-cols-2 gap-4 mt-2 p-4 bg-zinc-950 border border-zinc-800 rounded-xl fade-in animate-in">
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Frequency</label>
                                            <select
                                                value={scheduleFrequency}
                                                onChange={e => setScheduleFrequency(e.target.value)}
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                                            >
                                                <option value="daily">Daily Report</option>
                                                <option value="weekly">Weekly Report</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Time (Local)</label>
                                            <input
                                                type="time"
                                                value={scheduleTime}
                                                onChange={e => setScheduleTime(e.target.value)}
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-medium [color-scheme:dark]"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Filters */}
                            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                                <h3 className="font-bold text-zinc-100 flex items-center gap-2 text-sm uppercase tracking-wider">
                                    <Filter className="w-4 h-4 text-purple-500" />
                                    Data Filters
                                </h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Agent Target</label>
                                        <select
                                            value={agentFilterType}
                                            onChange={e => setAgentFilterType(e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all font-medium"
                                        >
                                            <option value="all">All Agents</option>
                                            <option value="specific">Specific Agents...</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Direction</label>
                                        <select
                                            value={directionFilter}
                                            onChange={e => setDirectionFilter(e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all font-medium"
                                        >
                                            <option value="all">Inbound & Outbound</option>
                                            <option value="inbound">Inbound Only</option>
                                            <option value="outbound">Outbound Only</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Recipients */}
                        <div className="flex flex-col gap-6">
                            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl flex flex-col h-full shadow-sm">
                                <div className="p-6 border-b border-zinc-800">
                                    <h3 className="font-bold text-zinc-100 flex items-center gap-2 text-sm uppercase tracking-wider">
                                        Distribution List
                                    </h3>
                                    <p className="text-xs text-zinc-500 mt-1">Add notification recipients.</p>
                                </div>
                                <div className="p-6 flex-1 flex flex-col gap-4">
                                    <div className="relative">
                                        <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                        <input
                                            type="email"
                                            value={emailInput}
                                            onChange={e => setEmailInput(e.target.value)}
                                            onKeyDown={handleEmailKeyDown}
                                            placeholder="Add email & press Enter"
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2 flex-1 pt-2">
                                        {recipients.length === 0 ? (
                                            <div className="text-center text-zinc-600 text-sm mt-8">No recipients added.</div>
                                        ) : (
                                            recipients.map((email, i) => (
                                                <div key={i} className="flex items-center justify-between bg-zinc-950 border border-zinc-800 p-3 rounded-xl animate-in fade-in zoom-in-95 duration-200">
                                                    <span className="text-sm font-medium text-zinc-300 truncate pr-4">{email}</span>
                                                    <button onClick={() => removeRecipient(i)} className="text-zinc-500 hover:text-rose-500 transition-colors">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
