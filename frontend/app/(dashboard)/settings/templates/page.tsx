"use client";

import React, { useState, useEffect } from "react";
import { 
    LayoutTemplate, 
    Plus, 
    Search, 
    Database, 
    Code2, 
    Eye, 
    ChevronRight,
    Clock,
    Tag,
    Filter
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import EmailEditorModal from "@/components/EmailEditorModal";
import EmailPreviewModal from "@/components/EmailPreviewModal";

interface EmailTemplate {
    id: string;
    name: string;
    uniqueIdentifier: string;
    type: "SYSTEM" | "CUSTOM";
    expectedVariables: string[];
    updatedAt: string;
}

export default function TemplateManagementPage() {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    
    // Editor State
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

    // Preview State
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);

    useEffect(() => {
        async function fetchTemplates() {
            try {
                const res = await fetch("/api/email-templates");
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                setTemplates(data);
            } catch (error: any) {
                console.error("Failed to load templates:", error);
                toast.error("Failed to synchronize template library");
            } finally {
                setIsLoading(false);
            }
        }
        fetchTemplates();
    }, []);

    const openEditor = (id: string) => {
        setActiveTemplateId(id);
        setIsEditorOpen(true);
    };

    const closeEditor = () => {
        setIsEditorOpen(false);
        setActiveTemplateId(null);
    };

    const openPreview = (id: string) => {
        setPreviewTemplateId(id);
        setIsPreviewOpen(true);
    };

    const closePreview = () => {
        setIsPreviewOpen(false);
        setPreviewTemplateId(null);
    };

    const filteredTemplates = templates.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.uniqueIdentifier.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-zinc-500 text-sm animate-pulse">Synchronizing template data nodes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <LayoutTemplate className="w-6 h-6 text-blue-400" />
                        Email Templates
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">Manage and customize the automated system reports and notifications.</p>
                </div>
                
                <Button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 h-10 px-6 rounded-xl transition-all flex items-center gap-2 group opacity-50 cursor-not-allowed">
                    <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
                    Create Custom Template
                </Button>
            </div>

            {/* Content Container */}
            <div className="space-y-6">
                {/* Global Search & Filters Placeholder */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                        <Input 
                            placeholder="Filter by name or identifier..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-zinc-900/40 border-zinc-800 pl-10 h-11 text-zinc-300 focus:ring-blue-500/20"
                        />
                    </div>
                    <Button variant="outline" className="bg-zinc-900/40 border-zinc-800 h-11 px-4 text-zinc-500 hover:text-white">
                        <Filter className="w-4 h-4 mr-2" />
                        Type
                    </Button>
                </div>

                {/* Templates Data Grid */}
                <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-900/80 border-b border-zinc-800">
                                    <th className="p-5 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Template Name</th>
                                    <th className="p-5 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Identifier</th>
                                    <th className="p-5 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Type</th>
                                    <th className="p-5 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Variables</th>
                                    <th className="p-5 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Last Modified</th>
                                    <th className="p-5 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/40">
                                {filteredTemplates.length > 0 ? (
                                    filteredTemplates.map((template) => (
                                        <tr key={template.id} className="group hover:bg-zinc-800/30 transition-all">
                                            <td className="p-5">
                                                <div className="flex flex-col">
                                                    <span className="text-white font-semibold text-sm group-hover:text-blue-400 transition-colors">
                                                        {template.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <code className="bg-zinc-950 border border-zinc-800 text-zinc-400 px-2 py-1 rounded text-[11px] font-mono tracking-tight">
                                                    {template.uniqueIdentifier}
                                                </code>
                                            </td>
                                            <td className="p-5">
                                                {template.type === "SYSTEM" ? (
                                                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20 transition-all font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                                                        SYSTEM
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 transition-all font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                                                        CUSTOM
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center gap-2 text-zinc-400">
                                                    <Database className="w-3.5 h-3.5 text-blue-500/50" />
                                                    <span className="text-xs">{template.expectedVariables.length} Variables</span>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center gap-2 text-[11px] text-zinc-600">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {new Date(template.updatedAt).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="p-5 text-right">
                                                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                                                    <button 
                                                        onClick={() => openEditor(template.id)}
                                                        title="Standard Editor"
                                                        className="p-2 bg-zinc-800 hover:bg-green-500/10 hover:border-green-500/30 border border-transparent rounded-lg transition-all text-zinc-500 hover:text-green-500"
                                                    >
                                                        <Code2 className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => openPreview(template.id)}
                                                        title="Live Preview"
                                                        className="p-2 bg-zinc-800 hover:bg-blue-500/10 hover:border-blue-500/30 border border-transparent rounded-lg transition-all text-zinc-500 hover:text-blue-400"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <div className="w-px h-8 bg-zinc-800 mx-1" />
                                                    <button className="text-zinc-600 hover:text-white transition-colors">
                                                        <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                                                    <LayoutTemplate className="w-6 h-6 text-zinc-700" />
                                                </div>
                                                <p className="text-zinc-600 text-sm font-medium">No templates matching your current filter sequence.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Insight */}
                <div className="flex items-center justify-between px-2">
                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
                        Library Status: <span className="text-blue-500">7 Core System Assets Online</span>
                    </p>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">System</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Custom</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* IDE Interface */}
            {isEditorOpen && activeTemplateId && (
                <EmailEditorModal 
                    templateId={activeTemplateId} 
                    onClose={closeEditor} 
                />
            )}

            {/* Preview Interface */}
            {isPreviewOpen && previewTemplateId && (
                <EmailPreviewModal 
                    templateId={previewTemplateId} 
                    onClose={closePreview} 
                />
            )}
        </div>
    );
}
