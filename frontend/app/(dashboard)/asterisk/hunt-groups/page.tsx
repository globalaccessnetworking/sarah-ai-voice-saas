"use client";
import React, { useState } from "react";
import {
    Users, Cpu, TrendingUp, RefreshCw, Plus, Trash2, Settings,
    CheckCircle2, ArrowRight, Zap, Clock, Phone, BarChart3, Star
} from "lucide-react";

type HuntStrategy = "Round Robin" | "Most Idle" | "Least Calls" | "Priority" | "Skills Based";

interface AgentMember {
    id: string;
    name: string;
    type: "AI" | "Human";
    status: "Available" | "Busy" | "Offline";
    skills: string[];
    callsToday: number;
    avgHandleTime: number;
    priority: number;
    idleSeconds: number;
}

interface HuntGroup {
    id: string;
    name: string;
    extension: string;
    strategy: HuntStrategy;
    ringTimeout: number;
    members: AgentMember[];
    callsRoutedToday: number;
}

const DEMO_GROUPS: HuntGroup[] = [
    {
        id: "hg1", name: "Dental AI Pool", extension: "7001", strategy: "Round Robin", ringTimeout: 20,
        callsRoutedToday: 87,
        members: [
            { id: "a1", name: "Sarah (Dental)", type: "AI", status: "Busy", skills: ["Dental", "Appointments", "Insurance"], callsToday: 24, avgHandleTime: 142, priority: 1, idleSeconds: 0 },
            { id: "a2", name: "Emma (Dental)", type: "AI", status: "Available", skills: ["Dental", "Emergency Triage"], callsToday: 21, avgHandleTime: 128, priority: 1, idleSeconds: 340 },
            { id: "a3", name: "Tom (Reception)", type: "Human", status: "Available", skills: ["Dental", "Billing"], callsToday: 8, avgHandleTime: 195, priority: 2, idleSeconds: 120 },
        ],
    },
    {
        id: "hg2", name: "Sales Team", extension: "7002", strategy: "Skills Based", ringTimeout: 30,
        callsRoutedToday: 42,
        members: [
            { id: "b1", name: "Alex (Sales AI)", type: "AI", status: "Available", skills: ["Sales", "Pricing", "Demo"], callsToday: 18, avgHandleTime: 210, priority: 1, idleSeconds: 90 },
            { id: "b2", name: "Mark (Senior Sales)", type: "Human", status: "Busy", skills: ["Sales", "Enterprise", "Negotiation"], callsToday: 12, avgHandleTime: 340, priority: 1, idleSeconds: 0 },
        ],
    },
    {
        id: "hg3", name: "After Hours", extension: "7003", strategy: "Priority", ringTimeout: 10,
        callsRoutedToday: 5,
        members: [
            { id: "c1", name: "Night AI Agent", type: "AI", status: "Available", skills: ["General", "Triage", "Messaging"], callsToday: 5, avgHandleTime: 65, priority: 1, idleSeconds: 1800 },
        ],
    },
];

const STRATEGIES: HuntStrategy[] = ["Round Robin", "Most Idle", "Least Calls", "Priority", "Skills Based"];
const ALL_SKILLS = ["Dental", "Appointments", "Insurance", "Emergency Triage", "Sales", "Pricing", "Demo", "Enterprise", "General", "Billing"];

const STATUS_DOT: Record<string, string> = { Available: "bg-emerald-400", Busy: "bg-orange-400", Offline: "bg-zinc-600" };

function formatSeconds(s: number): string {
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
    return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

export default function HuntGroupsPage() {
    const [groups, setGroups] = useState(DEMO_GROUPS);
    const [selectedGroup, setSelectedGroup] = useState<HuntGroup | null>(DEMO_GROUPS[0]);

    const updateStrategy = (id: string, strategy: HuntStrategy) => {
        setGroups(prev => prev.map(g => g.id === id ? { ...g, strategy } : g));
        setSelectedGroup(prev => prev?.id === id ? { ...prev, strategy } : prev);
    };

    const toggleSkill = (groupId: string, memberId: string, skill: string) => {
        const update = (g: HuntGroup): HuntGroup => ({
            ...g,
            members: g.members.map(m => m.id === memberId ? {
                ...m, skills: m.skills.includes(skill) ? m.skills.filter(s => s !== skill) : [...m.skills, skill]
            } : m)
        });
        setGroups(prev => prev.map(g => g.id === groupId ? update(g) : g));
        setSelectedGroup(prev => prev?.id === groupId ? update(prev) : prev);
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200 p-8 md:p-10">
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* Header */}
                <div className="bg-gradient-to-r from-violet-950/40 to-purple-950/30 border border-violet-900/30 rounded-2xl p-6 flex items-center gap-5">
                    <div className="w-14 h-14 bg-violet-500/10 border border-violet-500/20 rounded-2xl flex items-center justify-center">
                        <Users className="w-7 h-7 text-violet-400" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-white mb-1">Multi-Line Agent Hunt Groups</h1>
                        <p className="text-xs text-zinc-400">Route inbound calls across AI and human agent pools. Supports Round Robin, Most Idle, Fewest Calls, Priority, and Skills-Based routing strategies.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="text-right">
                            <div className="text-2xl font-bold text-violet-400">{groups.length}</div>
                            <div className="text-[10px] text-zinc-500">Hunt Groups</div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-emerald-400">{groups.reduce((s, g) => s + g.members.filter(m => m.status === "Available").length, 0)}</div>
                            <div className="text-[10px] text-zinc-500">Available Now</div>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-bold transition-colors">
                            <Plus className="w-4 h-4" /> New Group
                        </button>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Groups List */}
                    <div className="space-y-3">
                        {groups.map(group => (
                            <div key={group.id}
                                onClick={() => setSelectedGroup(group)}
                                className={`bg-zinc-900 border rounded-xl p-4 cursor-pointer transition-all hover:border-zinc-600 ${selectedGroup?.id === group.id ? "border-violet-500/50 ring-1 ring-violet-500/20" : "border-zinc-800"}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <div className="text-sm font-bold text-white">{group.name}</div>
                                        <div className="text-[10px] text-zinc-500 font-mono">ext. {group.extension}</div>
                                    </div>
                                    <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded">{group.strategy}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {group.members.map(m => (
                                        <div key={m.id} className="flex items-center gap-1">
                                            <div className={`w-2 h-2 rounded-full ${STATUS_DOT[m.status]}`} />
                                        </div>
                                    ))}
                                    <span className="text-[10px] text-zinc-500 ml-1">{group.members.filter(m => m.status === "Available").length}/{group.members.length} available</span>
                                    <span className="ml-auto text-[10px] text-zinc-500">{group.callsRoutedToday} calls today</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Group Detail */}
                    {selectedGroup && (
                        <div className="col-span-2 space-y-5">
                            {/* Strategy selector */}
                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-sm font-bold text-white">{selectedGroup.name} — Configuration</h2>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-zinc-500">Ring timeout:</span>
                                        <input type="number" defaultValue={selectedGroup.ringTimeout}
                                            className="w-16 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-violet-500" />
                                        <span className="text-xs text-zinc-500">s</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-5 gap-2">
                                    {STRATEGIES.map(s => (
                                        <button key={s} onClick={() => updateStrategy(selectedGroup.id, s)}
                                            className={`py-2 px-3 rounded-xl text-[10px] font-bold text-center transition-all border ${selectedGroup.strategy === s ? "bg-violet-600 border-violet-500 text-white" : "border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500"}`}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Members */}
                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                                <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
                                    <h2 className="text-sm font-bold text-white">Members</h2>
                                    <button className="text-xs text-violet-400 flex items-center gap-1 hover:text-violet-300">
                                        <Plus className="w-3.5 h-3.5" /> Add Member
                                    </button>
                                </div>
                                <div className="divide-y divide-zinc-800/50">
                                    {selectedGroup.members.map(member => (
                                        <div key={member.id} className="p-5">
                                            <div className="flex items-center gap-4 mb-3">
                                                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_DOT[member.status]}`} />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-zinc-200">{member.name}</span>
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${member.type === "AI" ? "text-violet-400 bg-violet-500/10" : "text-blue-400 bg-blue-500/10"}`}>{member.type}</span>
                                                        <span className="text-[10px] text-zinc-500">{member.status}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-zinc-500">
                                                    <span>{member.callsToday} calls</span>
                                                    <span>{Math.round(member.avgHandleTime / 60)}m avg</span>
                                                    {member.status === "Available" && <span className="text-emerald-400">Idle {formatSeconds(member.idleSeconds)}</span>}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] text-zinc-500">Priority</span>
                                                    <select defaultValue={member.priority} className="bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-200 px-1 py-0.5 focus:outline-none">
                                                        {[1, 2, 3, 4, 5].map(p => <option key={p} value={p}>{p}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            {selectedGroup.strategy === "Skills Based" && (
                                                <div className="ml-6">
                                                    <div className="text-[10px] text-zinc-500 mb-2">Skills:</div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {ALL_SKILLS.map(skill => (
                                                            <button key={skill} onClick={() => toggleSkill(selectedGroup.id, member.id, skill)}
                                                                className={`text-[10px] px-2 py-0.5 rounded-full border font-bold transition-all ${member.skills.includes(skill) ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "border-zinc-700 text-zinc-600 hover:text-zinc-400"}`}>
                                                                {skill}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
