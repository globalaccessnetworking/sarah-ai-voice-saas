"use client";
import React, { useState, useCallback } from "react";
import {
    Book, Upload, Link2, FileText, CheckCircle2, AlertCircle, Loader2,
    Search, Trash2, Eye, TestTube, ChevronRight, Globe, File, Database,
    X, Bot, Plus, Tag, Cpu
} from "lucide-react";

interface KBDocument {
    id: string;
    name: string;
    type: "pdf" | "docx" | "txt" | "csv" | "url";
    status: "processing" | "indexed" | "failed";
    chunks: number;
    size: string;
    addedAt: string;
    preview: string;
}

interface KBData {
    id: string;
    name: string;
    description: string;
    documents: KBDocument[];
    linkedAgents: string[];
    vectorDimensions: number;
    totalChunks: number;
}

const MOCK_KB: KBData = {
    id: "kb-001",
    name: "Dental Practice — Sydney CBD",
    description: "FAQs, pricing, procedures, and appointment policies for Sydney Dental Group.",
    documents: [
        { id: "d1", name: "Practice FAQ 2026.pdf", type: "pdf", status: "indexed", chunks: 48, size: "1.2 MB", addedAt: "2026-02-14", preview: "Q: What are your opening hours? A: We are open Monday to Friday 8am..." },
        { id: "d2", name: "Fee Schedule.docx", type: "docx", status: "indexed", chunks: 22, size: "450 KB", addedAt: "2026-02-14", preview: "General Consultation: $85, Scale & Clean: $180, Composite Filling..." },
        { id: "d3", name: "Procedure Guide.pdf", type: "pdf", status: "indexed", chunks: 112, size: "3.8 MB", addedAt: "2026-02-20", preview: "Root Canal Therapy: This procedure removes infected pulp from..." },
        { id: "d4", name: "sydneydental.com.au/policies", type: "url", status: "indexed", chunks: 31, size: "—", addedAt: "2026-03-01", preview: "Cancellation Policy: We require 24 hours notice for all appointment..." },
        { id: "d5", name: "Patient Forms Template.csv", type: "csv", status: "processing", chunks: 0, size: "82 KB", addedAt: "2026-03-10", preview: "" },
    ],
    linkedAgents: ["Receptionist AI", "Dental Front Desk"],
    vectorDimensions: 1536,
    totalChunks: 213,
};

function StatusBadge({ status }: { status: KBDocument["status"] }) {
    const cfg = {
        indexed: { color: "#10b981", label: "Indexed", icon: <CheckCircle2 className="w-3 h-3" /> },
        processing: { color: "#f59e0b", label: "Processing", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
        failed: { color: "#ef4444", label: "Failed", icon: <AlertCircle className="w-3 h-3" /> },
    }[status];
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ color: cfg.color, background: cfg.color + "20" }}>
            {cfg.icon} {cfg.label}
        </span>
    );
}

function TypeIcon({ type }: { type: KBDocument["type"] }) {
    const cfg = {
        pdf: { color: "#ef4444", label: "PDF" },
        docx: { color: "#2563eb", label: "DOC" },
        txt: { color: "#6b7280", label: "TXT" },
        csv: { color: "#10b981", label: "CSV" },
        url: { color: "#8b5cf6", label: "URL" },
    }[type];
    return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono" style={{ color: cfg.color, background: cfg.color + "20" }}>{cfg.label}</span>;
}

export default function KnowledgeBaseDetailPage() {
    const [kb] = useState<KBData>(MOCK_KB);
    const [activeTab, setActiveTab] = useState<"documents" | "test" | "agents">("documents");
    const [urlInput, setUrlInput] = useState("");
    const [testQuery, setTestQuery] = useState("");
    const [testResult, setTestResult] = useState<string | null>(null);
    const [testing, setTesting] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [previewDoc, setPreviewDoc] = useState<KBDocument | null>(null);

    const handleTest = async () => {
        if (!testQuery.trim()) return;
        setTesting(true);
        setTestResult(null);
        await new Promise(r => setTimeout(r, 800));
        setTestResult(kb.documents[0]?.preview || "No matching chunks found.");
        setTesting(false);
    };

    return (
        <div className="min-h-screen bg-black text-zinc-200">
            <div className="w-full overflow-y-auto bg-zinc-950 p-8 md:p-10">
                <div className="max-w-[1400px] mx-auto space-y-6">

                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
                                    <Database className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">{kb.name}</h1>
                                    <p className="text-xs text-zinc-500">{kb.description}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-center">
                                <div className="text-xl font-bold text-white">{kb.totalChunks}</div>
                                <div className="text-[10px] text-zinc-500">Chunks</div>
                            </div>
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-center">
                                <div className="text-xl font-bold text-white">{kb.documents.length}</div>
                                <div className="text-[10px] text-zinc-500">Documents</div>
                            </div>
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-center">
                                <div className="text-xl font-bold text-white">{kb.vectorDimensions}</div>
                                <div className="text-[10px] text-zinc-500">Dimensions</div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
                        {(["documents", "test", "agents"] as const).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
                                {tab === "documents" ? "📄 Documents" : tab === "test" ? "🧪 RAG Test" : "🤖 Linked Agents"}
                            </button>
                        ))}
                    </div>

                    {activeTab === "documents" && (
                        <div className="space-y-5">
                            {/* Upload Zone */}
                            <div
                                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${dragOver ? "border-blue-500 bg-blue-500/5" : "border-zinc-700 hover:border-zinc-500"}`}
                                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={() => setDragOver(false)}
                            >
                                <Upload className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
                                <div className="text-base font-bold text-zinc-300 mb-1">Drop files here or click to upload</div>
                                <div className="text-xs text-zinc-500 mb-4">Supports: PDF, DOCX, TXT, CSV · Max 50MB per file</div>
                                <button className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-sm font-bold transition-colors">
                                    Browse Files
                                </button>
                            </div>

                            {/* URL Scraper */}
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex gap-3">
                                <Globe className="w-5 h-5 text-purple-400 shrink-0 mt-2.5" />
                                <input
                                    type="url"
                                    placeholder="https://yourwebsite.com/faq — auto-scrape & chunk"
                                    value={urlInput}
                                    onChange={e => setUrlInput(e.target.value)}
                                    className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none"
                                />
                                <button className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors shrink-0">
                                    Scrape & Index
                                </button>
                            </div>

                            {/* Document Table */}
                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                                <div className="grid grid-cols-12 text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-5 py-3 border-b border-zinc-800 bg-black/20">
                                    <div className="col-span-1">Type</div>
                                    <div className="col-span-4">Name</div>
                                    <div className="col-span-2">Status</div>
                                    <div className="col-span-1">Chunks</div>
                                    <div className="col-span-1">Size</div>
                                    <div className="col-span-2">Added</div>
                                    <div className="col-span-1">Actions</div>
                                </div>
                                {kb.documents.map(doc => (
                                    <div key={doc.id} className="grid grid-cols-12 px-5 py-4 items-center text-xs border-b border-zinc-800/40 hover:bg-zinc-800/20">
                                        <div className="col-span-1"><TypeIcon type={doc.type} /></div>
                                        <div className="col-span-4 text-zinc-200 font-medium truncate pr-2">{doc.name}</div>
                                        <div className="col-span-2"><StatusBadge status={doc.status} /></div>
                                        <div className="col-span-1 font-mono text-zinc-400">{doc.chunks || "—"}</div>
                                        <div className="col-span-1 text-zinc-500">{doc.size}</div>
                                        <div className="col-span-2 text-zinc-500 font-mono">{doc.addedAt}</div>
                                        <div className="col-span-1 flex gap-1">
                                            {doc.preview && <button onClick={() => setPreviewDoc(doc)} className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg"><Eye className="w-3 h-3 text-zinc-400" /></button>}
                                            <button className="p-1.5 bg-zinc-800 hover:bg-red-900/40 rounded-lg"><Trash2 className="w-3 h-3 text-zinc-600 hover:text-red-400" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "test" && (
                        <div className="space-y-5">
                            <div className="bg-gradient-to-r from-emerald-950/30 to-green-950/20 border border-emerald-900/30 rounded-xl p-4 flex items-center gap-3">
                                <TestTube className="w-5 h-5 text-emerald-400" />
                                <div>
                                    <div className="text-sm font-bold text-white">RAG Query Tester</div>
                                    <p className="text-xs text-zinc-400">Type a test question to see which document chunks would be retrieved when a caller asks the same thing.</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <input
                                        type="text"
                                        placeholder='e.g. "What are your opening hours?" or "How much does a filling cost?"'
                                        value={testQuery}
                                        onChange={e => setTestQuery(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && handleTest()}
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <button
                                    onClick={handleTest}
                                    disabled={testing}
                                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-xl text-sm font-bold transition-colors disabled:opacity-60"
                                >
                                    {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                                    Run Test
                                </button>
                            </div>
                            {testResult && (
                                <div className="space-y-3">
                                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Top Retrieved Chunk — Similarity Score: 0.94</div>
                                    <div className="bg-zinc-900 border border-emerald-500/30 rounded-xl p-5">
                                        <div className="flex items-center gap-2 mb-3">
                                            <FileText className="w-4 h-4 text-emerald-400" />
                                            <span className="text-xs font-bold text-emerald-400">Practice FAQ 2026.pdf · Chunk #3</span>
                                        </div>
                                        <p className="text-sm text-zinc-300 leading-relaxed italic">"{testResult}"</p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        {["Procedure Guide.pdf · Chunk #18", "Practice FAQ 2026.pdf · Chunk #7", "sydneydental.com.au/policies · Chunk #2"].map((src, i) => (
                                            <div key={src} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                                                <div className="text-[10px] text-zinc-500 flex justify-between mb-2"><span>#{i + 2} Best match</span><span className="text-zinc-400 font-bold">{(0.88 - i * 0.08).toFixed(2)}</span></div>
                                                <div className="text-xs text-zinc-400 truncate">{src}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "agents" && (
                        <div className="space-y-4">
                            <div className="text-xs text-zinc-500 mb-2">Agents that use this Knowledge Base for RAG-powered responses.</div>
                            {kb.linkedAgents.map(agent => (
                                <div key={agent} className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-600 transition-colors">
                                    <div className="w-9 h-9 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
                                        <Bot className="w-4 h-4 text-indigo-400" />
                                    </div>
                                    <span className="text-sm font-bold text-white flex-1">{agent}</span>
                                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Active</span>
                                    <button className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-950/30 transition-colors">Remove</button>
                                </div>
                            ))}
                            <button className="w-full py-3 border border-dashed border-zinc-700 rounded-xl text-xs text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-colors flex items-center justify-center gap-2">
                                <Plus className="w-3.5 h-3.5" /> Link Another Agent
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Modal */}
            {previewDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setPreviewDoc(null)}>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between">
                            <div className="flex items-center gap-2">
                                <TypeIcon type={previewDoc.type} />
                                <span className="text-sm font-bold text-white">{previewDoc.name}</span>
                            </div>
                            <button onClick={() => setPreviewDoc(null)} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                            <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Extracted Text Preview</div>
                            <p className="text-sm text-zinc-300 leading-relaxed">{previewDoc.preview}</p>
                        </div>
                        <div className="text-xs text-zinc-500">{previewDoc.chunks} chunks indexed · Added {previewDoc.addedAt}</div>
                    </div>
                </div>
            )}
        </div>
    );
}
