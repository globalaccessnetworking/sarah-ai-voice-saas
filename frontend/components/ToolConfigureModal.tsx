"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tool, Agent, AgentTool } from "@/db/schema";
import { Settings, Save, Loader2, Bot, Link as LinkIcon, AlertTriangle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface ToolConfigureModalProps {
    isOpen: boolean;
    onClose: () => void;
    tool: Tool | null;
    agents: Partial<Agent>[];
    currentAssignments: any[];
    onSuccess: (updatedTool: Tool, updatedAssignments: any[]) => void;
}

export default function ToolConfigureModal({ isOpen, onClose, tool, agents, currentAssignments, onSuccess }: ToolConfigureModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [enabled, setEnabled] = useState(true);
    const [endpointUrl, setEndpointUrl] = useState("");
    const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);

    useEffect(() => {
        if (tool) {
            setEnabled((tool as any).enabled !== false);
            setEndpointUrl(tool.endpointUrl || "");

            // Extract agent IDs from assignments for this specific tool
            const myAgentIds = currentAssignments
                .filter(a => a.toolId === tool.id)
                .map(a => a.agentId);
            setSelectedAgentIds(myAgentIds);
        }
    }, [tool, currentAssignments]);

    if (!tool) return null;

    const toggleAgent = (agentId: string) => {
        setSelectedAgentIds(prev =>
            prev.includes(agentId)
                ? prev.filter(id => id !== agentId)
                : [...prev, agentId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // 1. Update Tool Basic Info
            const toolRes = await fetch(`/api/tools/${tool.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    enabled,
                    endpointUrl: tool.type === 'webhook' ? endpointUrl : undefined
                })
            });

            if (!toolRes.ok) throw new Error("Failed to update tool configuration");
            const updatedTool = await toolRes.json();

            // 2. Update Tool -> Agent Assignments
            // We'll send a bulk update to a specialized endpoint
            const assignRes = await fetch(`/api/tools/${tool.id}/assignments`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ agentIds: selectedAgentIds })
            });

            if (!assignRes.ok) throw new Error("Failed to update agent assignments");
            const { assignments: updatedAssignments } = await assignRes.json();

            onSuccess(updatedTool, updatedAssignments);
            onClose();
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[650px] max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <Settings className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <DialogTitle>Configure Tool: {tool.name}</DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Manage status, assignments, and connection settings.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto py-6 space-y-8 pr-2 custom-scrollbar">
                    {/* Status Section */}
                    <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-bold">Tool Status</Label>
                            <p className="text-xs text-slate-500">Enable or disable this capability globally.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${enabled ? 'text-emerald-500' : 'text-slate-600'}`}>
                                {enabled ? 'Active' : 'Disabled'}
                            </span>
                            <Switch checked={enabled} onCheckedChange={setEnabled} />
                        </div>
                    </div>

                    {/* Endpoint Configuration */}
                    {tool.type === 'webhook' && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-1">
                                <LinkIcon className="w-4 h-4 text-blue-400" />
                                <Label className="text-sm font-bold uppercase tracking-wider text-slate-400">Webhook Connection</Label>
                            </div>
                            <Input
                                value={endpointUrl}
                                onChange={(e) => setEndpointUrl(e.target.value)}
                                placeholder="https://api.example.com/webhook"
                                className="bg-slate-950 border-slate-800 focus:border-blue-500"
                                type="url"
                                required={enabled}
                            />
                            <div className="flex items-start gap-2 bg-blue-500/5 p-3 rounded-lg border border-blue-500/10">
                                <AlertTriangle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                                <p className="text-[10px] text-blue-400 leading-relaxed shadow-sm">
                                    Changes to the endpoint URL will immediately affect all agents calling this tool. Ensure the target service is operational.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Agent Assignments */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Bot className="w-4 h-4 text-amber-400" />
                            <Label className="text-sm font-bold uppercase tracking-wider text-slate-400">Agent Access Control</Label>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {agents.map(agent => (
                                <div
                                    key={agent.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${selectedAgentIds.includes(agent.id!)
                                            ? 'bg-blue-500/10 border-blue-500/30'
                                            : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                                        }`}
                                    onClick={() => toggleAgent(agent.id!)}
                                >
                                    <Checkbox
                                        id={`agent-${agent.id}`}
                                        checked={selectedAgentIds.includes(agent.id!)}
                                        onCheckedChange={() => toggleAgent(agent.id!)}
                                        className="border-slate-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                    />
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-white truncate">{agent.name}</p>
                                        <p className="text-[9px] text-slate-500 uppercase tracking-tighter">{agent.pipelineMode} agent</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {selectedAgentIds.length === 0 && (
                            <p className="text-xs text-red-400/80 italic text-center py-2">
                                Warning: No agents selected. This tool will be available but unassigned.
                            </p>
                        )}
                    </div>
                </form>

                <DialogFooter className="bg-slate-950/50 -mx-6 -mb-6 p-6 border-t border-slate-800">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} className="text-slate-400 hover:text-white hover:bg-slate-800">
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px]">
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving Changes
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Configuration
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
