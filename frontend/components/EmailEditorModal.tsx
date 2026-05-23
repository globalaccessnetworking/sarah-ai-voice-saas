"use client";

import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { X, Save, Database, Copy, Loader2, Check, Code2, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface EmailEditorModalProps {
    templateId: string;
    onClose: () => void;
}

export default function EmailEditorModal({ templateId, onClose }: EmailEditorModalProps) {
    const [template, setTemplate] = useState<any>(null);
    const [htmlContent, setHtmlContent] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [copiedVar, setCopiedVar] = useState<string | null>(null);

    useEffect(() => {
        async function fetchTemplate() {
            try {
                const res = await fetch(`/api/email-templates/${templateId}`);
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                setTemplate(data);
                setHtmlContent(data.htmlContent || "");
            } catch (error: any) {
                toast.error("Failed to load template editor");
                onClose();
            } finally {
                setIsLoading(false);
            }
        }
        fetchTemplate();
    }, [templateId, onClose]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/email-templates/${templateId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ htmlContent })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            toast.success("Template node synchronized successfully");
        } catch (error: any) {
            toast.error("Failed to save changes");
        } finally {
            setIsSaving(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(`{{${text}}}`);
        setCopiedVar(text);
        toast.info(`Copied {{${text}}} to clipboard`);
        setTimeout(() => setCopiedVar(null), 2000);
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
                    <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest animate-pulse">Initializing IDE Environment...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden animate-in fade-in duration-300">
            {/* Header / Nav */}
            <div className="h-16 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                        <Code2 className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Editor Environment</p>
                        <h2 className="text-white font-bold text-sm">Editing: {template?.name}</h2>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button 
                        variant="ghost" 
                        onClick={onClose}
                        className="text-zinc-500 hover:text-white hover:bg-zinc-900 font-bold text-xs"
                    >
                        Discard Changes
                    </Button>
                    <Button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-green-600 hover:bg-green-500 text-white font-bold text-xs px-6 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.2)]"
                    >
                        {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        {isSaving ? "Syncing..." : "Save Template"}
                    </Button>
                </div>
            </div>

            {/* IDE Layout */}
            <div className="flex flex-1 overflow-hidden">
                {/* Monaco Editor */}
                <div className="flex-1 bg-zinc-950 overflow-hidden relative">
                    <Editor
                        height="100%"
                        defaultLanguage="html"
                        theme="vs-dark"
                        value={htmlContent}
                        onChange={(val) => setHtmlContent(val || "")}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            lineNumbers: "on",
                            readOnly: isSaving,
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            padding: { top: 20 },
                            fontFamily: "JetBrains Mono, Menlo, Monaco, 'Courier New', monospace",
                        }}
                        loading={
                            <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
                                <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
                            </div>
                        }
                    />
                </div>

                {/* Variables Dictionary */}
                <div className="w-80 bg-zinc-900 border-l border-zinc-900 shrink-0 flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-zinc-800">
                        <h3 className="text-white font-bold text-xs flex items-center gap-2 uppercase tracking-widest">
                            <Database className="w-4 h-4 text-blue-400" />
                            Variable Nexus
                        </h3>
                        <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">
                            Click any variable to inject it into your clipboard buffer. Use handlebars syntax <code className="text-green-500">{"{{"}var{"}}"}</code>.
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <div className="space-y-2">
                            {template?.expectedVariables?.map((variable: string) => (
                                <button
                                    key={variable}
                                    onClick={() => copyToClipboard(variable)}
                                    className="w-full text-left group bg-zinc-950 border border-zinc-800/50 hover:border-green-500/50 p-3 rounded-xl transition-all flex items-center justify-between"
                                >
                                    <div className="flex flex-col">
                                        <span className="text-green-500 font-mono text-[11px] tracking-tight group-hover:text-green-400 transition-colors">
                                            {"{{"}{variable}{"}}"}
                                        </span>
                                    </div>
                                    <div className="shrink-0">
                                        {copiedVar === variable ? (
                                            <Check className="w-3.5 h-3.5 text-green-500" />
                                        ) : (
                                            <Copy className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                                        )}
                                    </div>
                                </button>
                            ))}

                            {(!template?.expectedVariables || template.expectedVariables.length === 0) && (
                                <div className="p-8 text-center bg-zinc-950/50 rounded-2xl border border-zinc-800 border-dashed">
                                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">No Variables Map Available</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-6 bg-blue-500/5 border-t border-zinc-800">
                        <div className="flex gap-3">
                            <Shield className="w-4 h-4 text-blue-500 shrink-0" />
                            <p className="text-[10px] text-zinc-500 leading-relaxed italic">
                                Handlebars logic (if/each) is supported. Ensure all required variables are present to avoid system dispatch failures.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

