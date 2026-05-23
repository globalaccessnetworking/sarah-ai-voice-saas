"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, Play, Database, RefreshCw, Monitor, Mail, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EmailPreviewModalProps {
    templateId: string;
    onClose: () => void;
}

export default function EmailPreviewModal({ templateId, onClose }: EmailPreviewModalProps) {
    const [template, setTemplate] = useState<any>(null);
    const [mockData, setMockData] = useState<Record<string, string>>({});
    const [compiledHtml, setCompiledHtml] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isRendering, setIsRendering] = useState(false);

    const renderPreview = useCallback(async (currentHtml: string, currentData: Record<string, string>) => {
        setIsRendering(true);
        try {
            const res = await fetch("/api/email-templates/preview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ htmlContent: currentHtml, mockData: currentData })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setCompiledHtml(data.compiledHtml);
        } catch (error: any) {
            toast.error("Failed to render visual preview");
        } finally {
            setIsRendering(false);
        }
    }, []);

    useEffect(() => {
        async function fetchTemplate() {
            try {
                const res = await fetch(`/api/email-templates/${templateId}`);
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                setTemplate(data);
                
                // Auto-generate mock data placeholders
                const initialMock: Record<string, string> = {};
                data.expectedVariables?.forEach((v: string) => {
                    initialMock[v] = `Test_${v}`;
                });
                setMockData(initialMock);
                
                // Initial render
                await renderPreview(data.htmlContent, initialMock);
            } catch (error: any) {
                toast.error("Failed to load template data");
                onClose();
            } finally {
                setIsLoading(false);
            }
        }
        fetchTemplate();
    }, [templateId, onClose, renderPreview]);

    const handleMockChange = (key: string, value: string) => {
        setMockData(prev => ({ ...prev, [key]: value }));
    };

    const handleReRender = () => {
        if (template) {
            renderPreview(template.htmlContent, mockData);
        }
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                    <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest animate-pulse">Assembling Preview Canvas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-full max-w-7xl h-full bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="h-16 border-b border-zinc-900 bg-zinc-900/50 flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                            <Monitor className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest leading-none mb-1">Visualizer</p>
                            <h2 className="text-white font-bold text-sm">Live Preview: {template?.name}</h2>
                        </div>
                    </div>

                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Dashboard Engine */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Left Panel: Test Data Injection */}
                    <div className="w-80 md:w-96 bg-zinc-900/30 border-r border-zinc-800 shrink-0 flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-zinc-800">
                            <h3 className="text-white font-bold text-xs flex items-center gap-2 uppercase tracking-[0.15em]">
                                <Database className="w-4 h-4 text-blue-500" />
                                Mock Data Payload
                            </h3>
                            <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed italic">
                                Customize the variables below to see real-time compilation in the isolated canvas.
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            {template?.expectedVariables?.map((variable: string) => (
                                <div key={variable} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{variable}</label>
                                        <div className="w-1 h-1 rounded-full bg-blue-500/50" />
                                    </div>
                                    <div className="relative group">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-700 group-hover:text-blue-500/50 transition-colors" />
                                        <Input 
                                            value={mockData[variable] || ""}
                                            onChange={(e) => handleMockChange(variable, e.target.value)}
                                            className="bg-zinc-950 border-zinc-800 pl-9 h-10 text-sm text-zinc-300 focus:ring-blue-500/20 placeholder:text-zinc-800"
                                            placeholder={`Enter ${variable}...`}
                                        />
                                    </div>
                                </div>
                            ))}

                            {(!template?.expectedVariables || template.expectedVariables.length === 0) && (
                                <div className="p-8 text-center bg-zinc-950/20 rounded-2xl border border-zinc-800 border-dashed">
                                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider leading-relaxed"> No dynamic variables identified for this asset. </p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-zinc-900 border-t border-zinc-800">
                            <Button 
                                onClick={handleReRender}
                                disabled={isRendering}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs h-11 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.2)] group"
                            >
                                {isRendering ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <RefreshCw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                                )}
                                {isRendering ? "Compiling Logic..." : "Re-Render Preview"}
                            </Button>
                        </div>
                    </div>

                    {/* Right Panel: Rendered Canvas */}
                    <div className="flex-1 bg-zinc-950 p-6 md:p-12 overflow-y-auto flex items-start justify-center pattern-grid relative">
                        {isRendering && (
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10 flex items-center justify-center">
                                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl shadow-2xl flex items-center gap-4">
                                    <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                                    <span className="text-xs text-white font-bold uppercase tracking-widest">Compiling Assets...</span>
                                </div>
                            </div>
                        )}
                        
                        <div className="w-full max-w-2xl flex flex-col items-center">
                            {/* Browser Decoration */}
                            <div className="w-full bg-zinc-900 border border-zinc-800 border-b-0 rounded-t-2xl py-3 px-4 flex items-center gap-3">
                                <div className="flex gap-1.5 border-r border-zinc-800 pr-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                                </div>
                                <div className="flex-1 bg-zinc-950 rounded-lg h-6 flex items-center px-4">
                                    <div className="flex items-center gap-2 text-[9px] text-zinc-700 font-mono">
                                        <Mail className="w-3 h-3" />
                                        https://preview.globalaccess.ai/api/v1/dispatch/render
                                    </div>
                                </div>
                            </div>

                            {/* The Sterile Iframe Renderer */}
                            <iframe 
                                srcDoc={compiledHtml}
                                className="w-full h-[700px] bg-white rounded-b-2xl shadow-2xl border border-zinc-800 border-t-0"
                                title="Email Dispatch Preview"
                            />

                            <p className="text-[10px] text-zinc-600 mt-6 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-zinc-700" />
                                Isolated Environment Rendering Protocol v1.2
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            
            <style jsx>{`
                .pattern-grid {
                    background-image: radial-gradient(circle at 1px 1px, #18181b 1px, transparent 0);
                    background-size: 24px 24px;
                }
            `}</style>
        </div>
    );
}
