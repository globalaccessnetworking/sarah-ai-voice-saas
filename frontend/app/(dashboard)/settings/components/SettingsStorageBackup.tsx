"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { HardDrive, Cloud, Download, Clock, Database } from "lucide-react";

export function SettingsStorageBackup() {
    const aiSummaryProviders = ["OpenAI (GPT-4o-mini)", "Anthropic (Claude 3 Haiku)", "Groq (Llama 3)", "Google (Gemini Flash)"];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Storage Configuration */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-white">
                            <HardDrive className="w-5 h-5 text-purple-500" /> Storage Backend
                        </CardTitle>
                        <CardDescription className="text-zinc-400">Configure where recordings and system logs are kept.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
                            <div>
                                <h4 className="text-white font-medium">Use Local Server File System</h4>
                                <p className="text-sm text-zinc-500 mt-1">Saves to local Docker volumes.</p>
                            </div>
                            <Switch />
                        </div>

                        <div className="space-y-4 pt-4 border-t border-zinc-800">
                            <h4 className="text-white font-medium flex items-center gap-2">
                                <Cloud className="w-4 h-4 text-blue-500" /> Cloud Object Storage (S3 / GCS)
                            </h4>
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Bucket Name (Recordings)</Label>
                                <Input defaultValue="livekit-recordings-prod-blue" className="bg-zinc-950 border-zinc-800 text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Default Region</Label>
                                <Input defaultValue="us-east-1" className="bg-zinc-950 border-zinc-800 text-white" />
                            </div>
                            <Button variant="outline" className="w-full text-zinc-300 border-zinc-700 hover:bg-zinc-800">
                                Verify Bucket Access
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Database Backup System */}
                <Card className="bg-zinc-900 border-zinc-800 flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-white">
                            <Database className="w-5 h-5 text-green-500" /> Postgres Core Backup
                        </CardTitle>
                        <CardDescription className="text-zinc-400">Automated dumps of agents, users, and billing data.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 flex-1">
                        <div className="space-y-2">
                            <Label className="text-zinc-300">Cloud Sync Schedule</Label>
                            <Select defaultValue="daily">
                                <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                                    <SelectItem value="hourly">Hourly</SelectItem>
                                    <SelectItem value="daily">Daily at 00:00 UTC</SelectItem>
                                    <SelectItem value="weekly">Weekly (Sundays)</SelectItem>
                                    <SelectItem value="manual">Manual Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-zinc-300">Retention Period (Days)</Label>
                            <Input type="number" defaultValue="30" className="bg-zinc-950 border-zinc-800 text-white font-mono" />
                        </div>

                        <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg mt-auto">
                            <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-zinc-400" /> Last Known Good Backup
                            </h4>
                            <p className="text-green-400 text-sm font-mono mb-1">pg_dump_20260308_0000.sql.gz</p>
                            <p className="text-xs text-zinc-500 mb-4">Size: 42.8 MB • Uploaded: 3 hours ago</p>

                            <div className="flex gap-2">
                                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                    <Database className="w-4 h-4 mr-2" /> Dump Now
                                </Button>
                                <Button variant="outline" className="w-full text-red-400 border-red-900/30 hover:bg-red-950/20 hover:text-red-300">
                                    Restore DB
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* AI Summary Settings */}
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-lg text-white">Post-Call AI Data Summarization</CardTitle>
                    <CardDescription className="text-zinc-400">Configure global settings for generating insights after WebRTC sessions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-lg mb-4">
                        <div>
                            <h4 className="text-white font-medium">Auto-Generate Summaries</h4>
                            <p className="text-sm text-zinc-500 mt-1">Run LLM prompt asynchronously after call ends.</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                    <div className="space-y-2 max-w-sm">
                        <Label className="text-zinc-300">Routing Provider / Model</Label>
                        <Select defaultValue="openai">
                            <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                                {aiSummaryProviders.map(p => <SelectItem key={p} value={p.split(' ')[0].toLowerCase()}>{p}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
