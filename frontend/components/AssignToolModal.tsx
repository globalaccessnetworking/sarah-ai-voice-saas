"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tool, Agent, AgentTool } from "@/db/schema";

export type HydratedAgentTool = AgentTool & { toolName?: string; toolType?: string };

interface AssignToolModalProps {
    isOpen: boolean;
    onClose: () => void;
    agentId: string | null;
    agents: Partial<Agent>[];
    tools: Tool[];
    currentAssignments: HydratedAgentTool[];
    onSuccess: (newLink: HydratedAgentTool) => void;
}

export default function AssignToolModal({ isOpen, onClose, agentId, agents, tools, currentAssignments, onSuccess }: AssignToolModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedToolId, setSelectedToolId] = useState("");

    // Filter out tools the agent already has assigned
    const assignedToolIds = new Set(currentAssignments.map(a => a.toolId));
    const availableTools = tools.filter(t => !assignedToolIds.has(t.id));

    const agent = agents.find(a => a.id === agentId);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!agentId || !selectedToolId) return;

        setIsSubmitting(true);

        try {
            const res = await fetch("/api/agent-tools", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    agentId,
                    toolId: selectedToolId,
                })
            });

            if (!res.ok) throw new Error("Failed to assign tool");

            const newLink = await res.json();

            // Hydrate link with tool metadata for UI
            const tool = tools.find(t => t.id === selectedToolId);
            const hydratedLink = {
                ...newLink,
                toolName: tool?.name,
                toolType: tool?.type
            };

            onSuccess(hydratedLink);

            // Reset and close
            setSelectedToolId("");
            onClose();
        } catch (error) {
            alert("Error assigning tool.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-slate-900 border-slate-800 text-white">
                <DialogHeader>
                    <DialogTitle>Assign Tool to Agent</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Grant <strong className="text-white">{agent?.name}</strong> permission to use a specific tool during calls.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="tool">Select Tool <span className="text-red-500">*</span></Label>
                        <Select value={selectedToolId} onValueChange={(val) => setSelectedToolId(val || "")} required disabled={availableTools.length === 0}>
                            <SelectTrigger id="tool" className="w-full bg-slate-950 border-slate-800 relative z-50">
                                <SelectValue placeholder={availableTools.length === 0 ? "All tools already assigned" : "Select a capability..."} />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800 text-white z-50">
                                {availableTools.map(tool => (
                                    <SelectItem key={tool.id} value={tool.id} className="focus:bg-slate-800 focus:text-white cursor-pointer">
                                        <div className="flex items-center justify-between w-full">
                                            <span>{tool.name}</span>
                                            <span className="text-xs text-slate-500 uppercase ml-4">{tool.type}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="pt-4 mt-8">
                        <Button type="button" variant="ghost" onClick={onClose} className="hover:bg-slate-800 text-slate-300">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || availableTools.length === 0} className="bg-blue-600 hover:bg-blue-700">
                            {isSubmitting ? "Assigning..." : "Assign Tool"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
