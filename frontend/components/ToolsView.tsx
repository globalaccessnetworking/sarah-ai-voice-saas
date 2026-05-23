"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tool, Agent } from "@/db/schema";
import {
    Wrench, Webhook, Plug, LayoutGrid, Bot,
    Plus, Trash2, Info, Settings, Link,
    MessageSquare, Database, Cpu, LifeBuoy, Phone,
    Zap, Activity, Target, ShieldCheck, ChevronRight
} from "lucide-react";
import CreateWebhookModal from "./CreateWebhookModal";
import CreateMCPModal from "./CreateMCPModal";
import AssignToolModal, { HydratedAgentTool } from "./AssignToolModal";
import ToolDetailsModal from "./ToolDetailsModal";
import ToolConfigureModal from "./ToolConfigureModal";

interface ToolsViewProps {
    initialTools: Tool[];
    agents: Partial<Agent>[];
    initialAssignments: any[];
}

export default function ToolsView({ initialTools, agents, initialAssignments }: ToolsViewProps) {
    const [tools, setTools] = useState<Tool[]>(initialTools);
    const [assignments, setAssignments] = useState<any[]>(initialAssignments);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isMCPOpen, setIsMCPOpen] = useState(false);
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isConfigureOpen, setIsConfigureOpen] = useState(false);

    // Categories for grouping
    const categories = ["communication", "data", "system", "utility"];

    const getToolsByCategory = (cat: string) => {
        return tools.filter(t => {
            const schema = t.parametersSchema as any;
            return schema?.category === cat || (!schema?.category && cat === "utility");
        });
    };

    const handleDeleteTool = async (id: string) => {
        if (!confirm("Delete this tool? Any agents using it will lose access immediately.")) return;
        try {
            const res = await fetch(`/api/tools/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete tool");
            setTools(prev => prev.filter(t => t.id !== id));
            setAssignments(prev => prev.filter(a => a.toolId !== id));
        } catch (error) {
            alert("Error deleting tool.");
        }
    };

    const handleUnassign = async (agentId: string, toolId: string) => {
        try {
            const res = await fetch("/api/agent-tools", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ agentId, toolId })
            });
            if (!res.ok) throw new Error("Failed to unassign tool");
            setAssignments(prev => prev.filter(a => !(a.agentId === agentId && a.toolId === toolId)));
        } catch (error) {
            alert("Error unassigning tool.");
        }
    };

    const handleConfigSuccess = (updatedTool: Tool, updatedAssignments: any[]) => {
        // Update tools list with possibly new enabled status / URL
        setTools(prev => prev.map(t => t.id === updatedTool.id ? updatedTool : t));

        // Update assignments list
        // 1. Remove all assignments for this specific tool first
        const otherAssignments = assignments.filter(a => a.toolId !== updatedTool.id);
        // 2. Add the new set of assignments
        setAssignments([...otherAssignments, ...updatedAssignments]);
    };

    // KPI Stats
    const totalTools = tools.length;
    const webhookTools = tools.filter(t => t.type === 'webhook').length;
    const mcpServers = 0; // Legacy placeholder logic
    const categoryCount = 4;
    const agentsWithTools = Array.from(new Set(assignments.map(a => a.agentId))).length;

    return (
        <div className="flex flex-col gap-10 pb-20 animate-in fade-in duration-700">
            {/* Professional Header Section */}
            <div className="flex flex-col gap-1 border-l-2 border-indigo-500 pl-4 py-2">
                <h1 className="text-3xl font-bold text-white tracking-tight leading-none">
                    Tool Registry
                </h1>
                <p className="text-slate-400 text-sm font-medium max-w-xl">
                    Configure and deploy AI capabilities across your agent fleet. Connect webhooks, native telephony, or MCP servers.
                </p>
            </div>
 
            {/* Row 1: KPI Stats (Metric Row) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <MetricCard icon={<Wrench className="w-4 h-4" />} label="Available Tools" value={totalTools} subtitle="Global Catalog" />
                <MetricCard icon={<Webhook className="w-4 h-4" />} label="Webhooks" value={webhookTools} subtitle="External APIs" />
                <MetricCard icon={<Plug className="w-4 h-4" />} label="MCP Nodes" value={mcpServers} subtitle="Protocol Active" />
                <MetricCard icon={<LayoutGrid className="w-4 h-4" />} label="Taxonomy" value={categoryCount} subtitle="Logical Groups" />
                <MetricCard icon={<Bot className="w-4 h-4" />} label="Agent Uplift" value={agentsWithTools} subtitle="Active Links" />
            </div>

            {/* Row 2 & 3: Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Agent Control Center */}
                <div className="lg:col-span-12 xl:col-span-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <h2 className="text-sm font-bold text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                            <Bot className="w-4 h-4 text-indigo-400" />
                            Agent Fleet
                        </h2>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                        {agents.map((agent) => {
                            const myTools = assignments.filter(a => a.agentId === agent.id);
                            const isActive = agent.status === 'running';

                            return (
                                <div key={agent.id} className="relative overflow-hidden rounded-xl border border-white/5 bg-[#11141a] p-5 transition-all hover:bg-[#151921] hover:border-white/10 group">
                                    <div className="flex items-start justify-between relative z-10">
                                        <div className="space-y-1.5 font-inter">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-md font-semibold text-white tracking-tight">{agent.name}</h3>
                                                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                                                    {isActive ? 'Running' : 'Stopped'}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                                                <span className="opacity-60">ID: {agent.id?.slice(0, 8)}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-800" />
                                                <span className="text-indigo-400/80">{agent.pipelineMode}</span>
                                            </div>
                                        </div>
                                        <Button 
                                            variant="secondary"
                                            size="sm" 
                                            className="h-8 rounded-lg bg-indigo-500 text-white hover:bg-indigo-400 border-none px-4 text-xs font-bold transition-all active:scale-95"
                                            onClick={() => { setSelectedAgentId(agent.id!); setIsAssignOpen(true); }}
                                        >
                                            Assign
                                        </Button>
                                    </div>
 
                                    <div className="mt-4 flex flex-wrap gap-1.5">
                                        {myTools.map(mt => (
                                            <div key={mt.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-white/5 text-[10px] font-semibold text-slate-300 hover:border-indigo-500/30 transition-colors">
                                                <Wrench className="w-3 h-3 text-indigo-500/70" />
                                                {mt.toolName}
                                                <button onClick={() => handleUnassign(agent.id!, mt.toolId)} className="ml-1 text-slate-600 hover:text-red-400 transition-colors">
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                        {myTools.length === 0 && (
                                            <div className="text-[10px] text-slate-600 font-medium py-1">No extensions linked</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                {/* Right Column: Registry and MCP Servers */}
                <div className="lg:col-span-12 xl:col-span-7 space-y-4">
                    {/* Tool Registry Header */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <h2 className="text-sm font-bold text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                            <Target className="w-4 h-4 text-indigo-400" />
                            Capability Hub
                        </h2>
                        <Button 
                            className="h-8 bg-white text-slate-950 hover:bg-slate-200 font-bold px-5 rounded-lg text-xs transition-all active:scale-95"
                            onClick={() => setIsCreateOpen(true)}
                        >
                            <Plus className="w-3.5 h-3.5 mr-1.5" strokeWidth={3} /> Create Extension
                        </Button>
                    </div>
 
                    {/* Tool Grid Sections */}
                    <div className="space-y-8 mt-6">
                        {categories.map(cat => {
                            const catTools = getToolsByCategory(cat);
                            if (catTools.length === 0) return null;
                            return (
                                <div key={cat} className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/60">
                                            {cat}
                                        </span>
                                        <div className="h-px bg-white/5 flex-grow"></div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {catTools.map(tool => (
                                            <div key={tool.id} className={`group relative p-4 rounded-xl border transition-all duration-300 bg-[#11141a] border-white/5 hover:border-white/10 hover:bg-[#151921] ${
                                                (tool as any).enabled === false ? 'opacity-50 grayscale' : ''
                                            }`}>
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">
                                                            {tool.type === 'webhook' ? <Webhook className="w-3.5 h-3.5" /> :
                                                                tool.type === 'native' ? <Phone className="w-3.5 h-3.5" /> :
                                                                    cat === 'system' ? <Cpu className="w-3.5 h-3.5" /> :
                                                                        cat === 'data' ? <Database className="w-3.5 h-3.5" /> :
                                                                            cat === 'communication' ? <MessageSquare className="w-3.5 h-3.5" /> :
                                                                                <Wrench className="w-3.5 h-3.5" />}
                                                        </div>
                                                        <h4 className="font-semibold text-white text-sm tracking-tight">{tool.name}</h4>
                                                    </div>
                                                    <button className="text-slate-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteTool(tool.id)}>
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                
                                                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed h-8 mb-4">
                                                    {tool.description}
                                                </p>
                                                
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider ${(tool as any).enabled !== false ? 'text-emerald-500/80' : 'text-red-500/80'}`}>
                                                        <Activity className="w-2.5 h-2.5" /> {(tool as any).enabled !== false ? 'Active' : 'Disabled'}
                                                    </div>
                                                    <div className="text-[9px] text-slate-700 font-mono">#{tool.id.slice(0, 6)}</div>
                                                </div>
 
                                                <div className="flex gap-2">
                                                    <Button variant="ghost" size="sm" className="flex-1 h-7 bg-white/5 border border-white/5 text-[10px] font-bold hover:bg-white/10 hover:text-white rounded-md" onClick={() => { setSelectedTool(tool); setIsDetailsOpen(true); }}>
                                                        View Details
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 bg-white/5 border border-white/5 hover:bg-white/10 hover:text-white rounded-md" onClick={() => { setSelectedTool(tool); setIsConfigureOpen(true); }}>
                                                        <Settings className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>

            {/* Row 4: Help Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="flex gap-4 p-6 rounded-xl bg-[#11141a] border border-white/5 hover:border-indigo-500/20 transition-all cursor-help group">
                    <div className="p-3 bg-indigo-500/10 rounded-lg h-fit group-hover:bg-indigo-500/20 transition-colors">
                        <ShieldCheck className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                            Intelligent Routing
                            <span className="bg-indigo-500/10 text-indigo-400 text-[8px] px-2 py-0.5 rounded-full uppercase tracking-widest font-black border border-indigo-500/10">Engine</span>
                        </h3>
                        <p className="text-slate-500 text-[11px] leading-relaxed"> Sarah uses these tools dynamically. Properly documented tools with clear descriptions improve Sarah's decision-making by 40%.</p>
                    </div>
                </div>
 
                <div className="flex gap-4 p-6 rounded-xl bg-[#11141a] border border-white/5 hover:border-emerald-500/20 transition-all cursor-help group">
                    <div className="p-3 bg-emerald-500/10 rounded-lg h-fit group-hover:bg-emerald-500/20 transition-colors">
                        <Plug className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                            MCP Protocol
                            <span className="bg-emerald-500/10 text-emerald-400 text-[8px] px-2 py-0.5 rounded-full uppercase tracking-widest font-black border border-emerald-500/10">Coming Soon</span>
                        </h3>
                        <p className="text-slate-500 text-[11px] leading-relaxed">Model Context Protocol support is being finalized. Soon you'll be able to plug in entire MCP Servers for deep tool orchestration.</p>
                    </div>
                </div>
            </div>

            <CreateWebhookModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSuccess={(nt: Tool) => setTools(prev => [nt, ...prev])} />
            <CreateMCPModal isOpen={isMCPOpen} onClose={() => setIsMCPOpen(false)} onSuccess={(nt: Tool) => setTools(prev => [nt, ...prev])} />
            <AssignToolModal isOpen={isAssignOpen} onClose={() => setIsAssignOpen(false)} agentId={selectedAgentId} agents={agents} tools={tools} currentAssignments={assignments.filter(a => a.agentId === selectedAgentId)} onSuccess={(nl: HydratedAgentTool) => setAssignments(prev => [nl, ...prev])} />

            <ToolDetailsModal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} tool={selectedTool} />
            <ToolConfigureModal
                isOpen={isConfigureOpen}
                onClose={() => setIsConfigureOpen(false)}
                tool={selectedTool}
                agents={agents}
                currentAssignments={assignments}
                onSuccess={handleConfigSuccess}
            />
        </div>
    );
}

function MetricCard({ icon, label, value, subtitle }: { icon: React.ReactNode, label: string, value: number, subtitle: string }) {
    return (
        <div className="relative group overflow-hidden bg-[#11141a] border border-white/5 p-5 rounded-2xl transition-all duration-300 hover:border-indigo-500/30 hover:bg-[#151921] cursor-default">
            <div className="flex items-center gap-3 mb-3">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">
                    {icon}
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
            </div>
            
            <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
                <p className="text-[10px] text-indigo-400/50 font-medium tracking-tight uppercase">{subtitle}</p>
            </div>

            {/* Subtler background glow on hover */}
            <div className="absolute -right-8 -bottom-8 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity rounded-full bg-indigo-500" />
        </div>
    );
}
