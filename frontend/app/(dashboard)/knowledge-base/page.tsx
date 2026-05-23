"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
    UploadCloud, 
    FileText, 
    Database, 
    Trash2, 
    Loader2, 
    CheckCircle2, 
    AlertCircle,
    HardDrive
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface KBFile {
    id: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    status: string;
    vectorCount: number;
    uploadedAt: string;
}

export default function KnowledgeBasePage() {
    const [files, setFiles] = useState<KBFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        try {
            const res = await fetch("/api/knowledge-base");
            const data = await res.json();
            if (data.files) {
                setFiles(data.files);
            }
        } catch (err) {
            console.error("Failed to load knowledge base files:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/knowledge-base", {
                method: "POST",
                body: formData,
            });
            if (res.ok) {
                fetchFiles();
            }
        } catch (err) {
            console.error("Upload failed:", err);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-3">
                    <Database className="w-6 h-6 text-blue-500" />
                    Knowledge Base & RAG Hub
                </h1>
                <p className="text-zinc-500 text-sm">
                    Upload company documents to vectorize and train your AI agents for precise domain intelligence.
                </p>
            </div>

            {/* Upload Dropzone */}
            <div 
                className={cn(
                    "w-full bg-zinc-900/20 border-2 border-dashed border-zinc-700/50 hover:border-blue-500/50 hover:bg-zinc-900/40 rounded-2xl p-12 text-center transition-all cursor-pointer group relative overflow-hidden",
                    isUploading && "pointer-events-none opacity-50"
                )}
                onClick={() => fileInputRef.current?.click()}
            >
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".pdf,.txt,.csv"
                    className="hidden" 
                />
                
                <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-zinc-950 rounded-full border border-zinc-800 group-hover:scale-110 transition-transform duration-300">
                        {isUploading ? (
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        ) : (
                            <UploadCloud className="w-8 h-8 text-zinc-400 group-hover:text-blue-400" />
                        )}
                    </div>
                    <div className="space-y-1">
                        <p className="text-lg font-medium text-white">
                            {isUploading ? "Vectorizing Document..." : "Drag and drop your PDFs, TXT, or CSV files here"}
                        </p>
                        <p className="text-sm text-zinc-500">Maximum file size: 50MB</p>
                    </div>
                </div>

                {/* Decorative particles for "Tronic" look */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Document Ledger */}
            <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl overflow-hidden backdrop-blur-sm">
                <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Vectorized Document Ledger
                    </h3>
                    <Badge variant="outline" className="bg-zinc-950 text-zinc-500 border-zinc-800">
                        {files.length} Total Sources
                    </Badge>
                </div>
                
                <Table>
                    <TableHeader className="bg-zinc-950/40">
                        <TableRow className="border-zinc-800 hover:bg-transparent">
                            <TableHead className="text-zinc-500 font-bold uppercase tracking-wider text-[10px] py-4">Document Name</TableHead>
                            <TableHead className="text-zinc-500 font-bold uppercase tracking-wider text-[10px] py-4">Size</TableHead>
                            <TableHead className="text-zinc-500 font-bold uppercase tracking-wider text-[10px] py-4">Status</TableHead>
                            <TableHead className="text-zinc-500 font-bold uppercase tracking-wider text-[10px] py-4">Vectors Extracted</TableHead>
                            <TableHead className="text-zinc-500 font-bold uppercase tracking-wider text-[10px] py-4">Upload Date</TableHead>
                            <TableHead className="text-zinc-500 font-bold uppercase tracking-wider text-[10px] py-4 text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                        <p className="text-zinc-500 text-sm">Syncing RAG index...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : files.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center gap-4">
                                        <HardDrive className="w-10 h-10 text-zinc-800" />
                                        <p className="text-zinc-600">No documents vectorized yet. Start by uploading a source above.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            files.map((file) => (
                                <TableRow key={file.id} className="border-zinc-800/50 hover:bg-zinc-800/20 group transition-colors">
                                    <TableCell className="py-4">
                                        <div className="flex items-center gap-3">
                                            <FileText className="w-4 h-4 text-blue-400" />
                                            <span className="font-medium text-zinc-200">{file.fileName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-zinc-400 text-xs">
                                        {formatSize(file.fileSize)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge 
                                            className={cn(
                                                "capitalize font-bold text-[9px] px-2 py-0 border-transparent transition-all",
                                                file.status === 'Ready' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500 animate-pulse"
                                            )}
                                        >
                                            {file.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-zinc-300 text-xs">
                                        {file.vectorCount.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-xs text-zinc-500 font-mono">
                                        {new Date(file.uploadedAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
