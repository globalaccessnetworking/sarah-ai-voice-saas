"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tool } from "@/db/schema";
import { Webhook, Cpu, Database, MessageSquare, Wrench, Code } from "lucide-react";

interface ToolDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    tool: Tool | null;
}

export default function ToolDetailsModal({ isOpen, onClose, tool }: ToolDetailsModalProps) {
    if (!tool) return null;

    const parameters = (tool.parametersSchema as any)?.properties || {};
    const hasParams = Object.keys(parameters).length > 0;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            {tool.type === 'webhook' ? <Webhook className="w-5 h-5 text-purple-400" /> :
                                (tool.parametersSchema as any)?.category === 'system' ? <Cpu className="w-5 h-5 text-emerald-400" /> :
                                    (tool.parametersSchema as any)?.category === 'data' ? <Database className="w-5 h-5 text-blue-400" /> :
                                        (tool.parametersSchema as any)?.category === 'communication' ? <MessageSquare className="w-5 h-5 text-amber-400" /> :
                                            <Wrench className="w-5 h-5 text-slate-400" />}
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold">{tool.name}</DialogTitle>
                            <DialogDescription className="text-slate-400 uppercase text-[10px] font-black tracking-widest mt-1">
                                {tool.type} Capability
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <section>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</h4>
                        <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/50 p-4 rounded-lg border border-slate-800">
                            {tool.description || "No description provided."}
                        </p>
                    </section>

                    {tool.type === 'webhook' && (
                        <section>
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Endpoint URL</h4>
                            <code className="text-xs text-blue-400 break-all bg-slate-950 px-3 py-2 rounded block border border-slate-800">
                                {tool.endpointUrl}
                            </code>
                        </section>
                    )}

                    <section>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Parameters</h4>
                        {hasParams ? (
                            <div className="space-y-3">
                                {Object.entries(parameters).map(([key, value]: [string, any]) => (
                                    <div key={key} className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-bold text-white">{key}</span>
                                            <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                                {value.type || "string"}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400">{value.description || "No parameter description."}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500 italic">This tool takes no parameters.</p>
                        )}
                    </section>

                    <section>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-red-400/80 mt-1">Security Notes</h4>
                        <div className="text-xs text-slate-500 space-y-2">
                            <p>• This tool is executed in the AI Worker context.</p>
                            <p>• {tool.type === 'webhook' ? "Data is sent via POST payload to the configured endpoint." : "This is a native system tool with full local execution rights."}</p>
                        </div>
                    </section> section ---
                </div>

                <DialogFooter>
                    <Button onClick={onClose} className="bg-slate-800 hover:bg-slate-700 text-white w-full sm:w-auto">
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
