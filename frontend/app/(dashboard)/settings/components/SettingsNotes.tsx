"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    BookOpen, FileText, Download, Github,
    ExternalLink, History, Shield, Lightbulb,
    FileCode, Globe, Cpu, MessageSquare
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const RELEASE_NOTES = [
    {
        version: "v1.12.0",
        date: "March 2026",
        features: [
            "Next.js 15 Integration with Dashboard Parity",
            "Enhanced STT/TTS Plugin Architecture",
            "Real-time Audio Token Optimization",
            "NOC Terminal-style Log Viewer"
        ],
        fixes: [
            "Middleware redirect loop on mobile browsers",
            "Database connection pooling during high concurrency"
        ]
    },
    {
        version: "v1.11.5",
        date: "February 2026",
        features: [
            "Deepgram Nova-2 Support",
            "Multi-tenant Workspace Isolation",
            "Custom Logo & Branding Uplift"
        ],
        fixes: [
            "SIP DTMF tone detection calibration",
            "Agent memory leak on long-running calls"
        ]
    }
];

export function SettingsNotes() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500 pb-10">
            {/* Main Documentation Section */}
            <div className="lg:col-span-2 space-y-6">
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2 text-white">
                            <BookOpen className="w-6 h-6 text-blue-500" />
                            Knowledge Base & Documentation
                        </CardTitle>
                        <CardDescription className="text-zinc-500 font-medium">Official guides for building and scaling voice AI infrastructure.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-2 bg-zinc-950/50 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-all text-left group">
                            <div className="flex items-center justify-between w-full">
                                <FileCode className="w-5 h-5 text-purple-400" />
                                <Download className="w-4 h-4 text-zinc-500 group-hover:text-blue-400" />
                            </div>
                            <span className="text-sm font-bold text-zinc-200 uppercase tracking-tight">API Reference</span>
                            <span className="text-[11px] text-zinc-500">Full specification for REST, WebSocket, and MCP interfaces.</span>
                        </Button>

                        <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-2 bg-zinc-950/50 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-all text-left group">
                            <div className="flex items-center justify-between w-full">
                                <Cpu className="w-5 h-5 text-green-400" />
                                <Download className="w-4 h-4 text-zinc-500 group-hover:text-blue-400" />
                            </div>
                            <span className="text-sm font-bold text-zinc-200 uppercase tracking-tight">Deployment Guide</span>
                            <span className="text-[11px] text-zinc-500">Production-ready setups using Docker, K8s, and PM2.</span>
                        </Button>

                        <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-2 bg-zinc-950/50 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-all text-left group">
                            <div className="flex items-center justify-between w-full">
                                <Shield className="w-5 h-5 text-orange-400" />
                                <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-blue-400" />
                            </div>
                            <span className="text-sm font-bold text-zinc-200 uppercase tracking-tight">Security Standards</span>
                            <span className="text-[11px] text-zinc-500">Encryption, RBAC, and SOC-2 compliance overview.</span>
                        </Button>

                        <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-2 bg-zinc-950/50 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-all text-left group">
                            <div className="flex items-center justify-between w-full">
                                <MessageSquare className="w-5 h-5 text-blue-400" />
                                <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-blue-400" />
                            </div>
                            <span className="text-sm font-bold text-zinc-200 uppercase tracking-tight">Agent Prompts</span>
                            <span className="text-[11px] text-zinc-500">Curated collection of system instructions for vertical niches.</span>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-white">
                            <History className="w-5 h-5 text-zinc-400" />
                            Release Changelog
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        {RELEASE_NOTES.map((note, idx) => (
                            <div key={note.version} className="relative pl-8 border-l border-zinc-800 space-y-3">
                                <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                <div className="flex items-center gap-3">
                                    <h3 className="text-md font-bold text-white font-mono">{note.version}</h3>
                                    <Badge variant="outline" className="text-[10px] bg-zinc-950 border-zinc-800 text-zinc-500">{note.date}</Badge>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-2">Key Features</p>
                                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 list-disc list-inside text-xs text-zinc-300">
                                            {note.features.map(f => <li key={f} className="marker:text-blue-500/50">{f}</li>)}
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-green-400 uppercase tracking-wider mb-2">Stable Fixes</p>
                                        <ul className="list-disc list-inside text-xs text-zinc-400">
                                            {note.fixes.map(f => <li key={f} className="marker:text-green-500/50">{f}</li>)}
                                        </ul>
                                    </div>
                                </div>
                                {idx < RELEASE_NOTES.length - 1 && <div className="h-8" />}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Sidebar Resources */}
            <div className="space-y-6">
                <Card className="bg-zinc-900 border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-900/50">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-yellow-400" />
                            Operational Intelligence
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg text-xs leading-relaxed text-zinc-400">
                            <strong>Global Access AI Agent</strong> leverages the <strong>LiveKit protocol</strong> for ultra-low latency sub-1s TTFB performance.
                            <br /><br />
                            For mission-critical environments, ensure your <strong>TURN servers</strong> are correctly provisioned in your Engine settings.
                        </div>
                        <Button className="w-full bg-zinc-800 hover:bg-zinc-750 text-white gap-2 border border-zinc-700">
                            <Globe className="w-4 h-4 text-blue-400" />
                            Global Status Page
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                            <Github className="w-4 h-4" />
                            Open Source Ecosystem
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-xs text-zinc-500">Contribute to our core plugins or report infrastructure anomalies.</p>
                        <div className="flex flex-col gap-2">
                            <Button variant="ghost" size="sm" className="justify-start text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 gap-2">
                                <FileText className="w-3.5 h-3.5" /> Core SDK Repository
                            </Button>
                            <Button variant="ghost" size="sm" className="justify-start text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 gap-2">
                                <History className="w-3.5 h-3.5" /> Development Roadmap
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
