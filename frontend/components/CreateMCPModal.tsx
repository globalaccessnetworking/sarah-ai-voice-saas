"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tool } from "@/db/schema";

interface CreateMCPModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (tool: Tool) => void;
}

export default function CreateMCPModal({ isOpen, onClose, onSuccess }: CreateMCPModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [transportType, setTransportType] = useState<"sse" | "stdio">("sse");
    const [url, setUrl] = useState("");
    const [command, setCommand] = useState("");
    const [args, setArgs] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const parametersSchema = {
                type: transportType,
                url: transportType === "sse" ? url : undefined,
                command: transportType === "stdio" ? command : undefined,
                args: transportType === "stdio" ? args.split(",").map(a => a.trim()).filter(a => a) : undefined,
            };

            const res = await fetch("/api/tools", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    description,
                    type: "mcp",
                    parametersSchema,
                })
            });

            if (!res.ok) throw new Error("Failed to create MCP tool");

            const newTool = await res.json();
            onSuccess(newTool);

            // Reset and close
            setName("");
            setDescription("");
            setTransportType("sse");
            setUrl("");
            setCommand("");
            setArgs("");
            onClose();
        } catch (error) {
            alert("Error creating MCP tool.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Add MCP Server Tool</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Connect to a Model Context Protocol (MCP) server to dynamically extend agent capabilities.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="mcp-name">Server Name <span className="text-red-500">*</span></Label>
                        <Input
                            id="mcp-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., search_engine, database_connector"
                            className="bg-slate-950 border-slate-800 focus-visible:ring-blue-500"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="mcp-description">Description <span className="text-red-500">*</span></Label>
                        <Textarea
                            id="mcp-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe what these tools do for the AI."
                            className="bg-slate-950 border-slate-800 focus-visible:ring-blue-500 h-20"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Transport Type</Label>
                        <Select value={transportType} onValueChange={(v: any) => setTransportType(v)}>
                            <SelectTrigger className="bg-slate-950 border-slate-800">
                                <SelectValue placeholder="Select transport" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                <SelectItem value="sse">SSE (HTTP Streaming)</SelectItem>
                                <SelectItem value="stdio">Stdio (Local Command)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {transportType === "sse" ? (
                        <div className="space-y-2">
                            <Label htmlFor="mcp-url">Server URL <span className="text-red-500">*</span></Label>
                            <Input
                                id="mcp-url"
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="http://localhost:3001/sse"
                                className="bg-slate-950 border-slate-800 focus-visible:ring-blue-500"
                                required
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="mcp-command">Command <span className="text-red-500">*</span></Label>
                                <Input
                                    id="mcp-command"
                                    value={command}
                                    onChange={(e) => setCommand(e.target.value)}
                                    placeholder="npx"
                                    className="bg-slate-950 border-slate-800"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mcp-args">Args (comma separated)</Label>
                                <Input
                                    id="mcp-args"
                                    value={args}
                                    onChange={(e) => setArgs(e.target.value)}
                                    placeholder="-y, @modelcontextprotocol/server-everything"
                                    className="bg-slate-950 border-slate-800"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={onClose} className="hover:bg-slate-800 text-slate-300">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
                            {isSubmitting ? "Connecting..." : "Add MCP Server"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
