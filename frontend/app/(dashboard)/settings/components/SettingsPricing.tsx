"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DollarSign, Save, Phone, Cpu, Activity
} from "lucide-react";

export function SettingsPricing() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Global Pricing Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#1e1e1e] border border-zinc-800 rounded-lg shadow-sm flex flex-col">
                    <div className="px-5 py-3 border-b border-zinc-800 bg-[#252525] flex justify-between items-center rounded-t-lg">
                        <h3 className="text-md font-semibold text-gray-100 flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-emerald-500" /> Currency & Billing
                        </h3>
                    </div>
                    <div className="p-5 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Default Display Currency</Label>
                            <Select defaultValue="usd">
                                <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white w-full h-9">
                                    <SelectValue placeholder="Select Currency" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                                    <SelectItem value="usd">USD ($) - United States Dollar</SelectItem>
                                    <SelectItem value="aud">AUD (A$) - Australian Dollar</SelectItem>
                                    <SelectItem value="eur">EUR (€) - Euro</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-zinc-500 italic">Sets the terminal and client-facing billing currency across all active nodes.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-[#1e1e1e] border border-zinc-800 rounded-lg shadow-sm flex flex-col">
                    <div className="px-5 py-3 border-b border-zinc-800 bg-[#252525] flex justify-between items-center rounded-t-lg">
                        <h3 className="text-md font-semibold text-gray-100 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-purple-500" /> SIP Trunk Termination Rates
                        </h3>
                    </div>
                    <div className="p-5 flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Inbound ($/min)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-zinc-600 text-xs font-mono">$</span>
                                    <Input type="number" step="0.001" defaultValue="0.0085" className="bg-zinc-950 border-zinc-800 pl-7 text-white font-mono h-9 text-sm" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Outbound ($/min)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-zinc-600 text-xs font-mono">$</span>
                                    <Input type="number" step="0.001" defaultValue="0.0120" className="bg-zinc-950 border-zinc-800 pl-7 text-white font-mono h-9 text-sm" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Provider Pricing Matrix */}
            <div className="bg-[#1e1e1e] border border-zinc-800 rounded-lg shadow-sm flex flex-col">
                <div className="px-5 py-3 border-b border-zinc-800 bg-[#252525] flex justify-between items-center rounded-t-lg">
                    <h3 className="text-md font-semibold text-gray-100 flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-blue-500" /> AI Provider Margin Matrix
                    </h3>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase">
                        <Save className="w-3.5 h-3.5 mr-2" /> Commit Rates
                    </Button>
                </div>

                <div className="p-0">
                    <Tabs defaultValue="llm" className="w-full">
                        <div className="px-5 py-2 border-b border-zinc-800/50 bg-zinc-900/30">
                            <TabsList className="bg-transparent h-auto p-0 flex gap-4">
                                <TabsTrigger value="llm" className="px-0 py-2 bg-transparent h-auto data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none text-[10px] font-bold uppercase tracking-widest text-zinc-500 data-[state=active]:text-emerald-500 transition-all">Large Language Models</TabsTrigger>
                                <TabsTrigger value="stt" className="px-0 py-2 bg-transparent h-auto data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none text-[10px] font-bold uppercase tracking-widest text-zinc-500 data-[state=active]:text-emerald-500 transition-all">Speech Recognition</TabsTrigger>
                                <TabsTrigger value="tts" className="px-0 py-2 bg-transparent h-auto data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none text-[10px] font-bold uppercase tracking-widest text-zinc-500 data-[state=active]:text-emerald-500 transition-all">Speech Synthesis</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="llm" className="mt-0">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[#1a1a1a] text-zinc-500 text-[10px] uppercase tracking-widest border-b border-zinc-800">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold">Status</th>
                                        <th className="px-6 py-3 font-semibold">Model Identifier</th>
                                        <th className="px-6 py-3 font-semibold text-center">Input Rate (/1M)</th>
                                        <th className="px-6 py-3 font-semibold text-center">Output Rate (/1M)</th>
                                        <th className="px-6 py-3 font-semibold text-right">Profit Margin</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50">
                                    {[
                                        { model: "OpenAI GPT-4o", in: "5.00", out: "15.00", en: true, margin: "25%" },
                                        { model: "Claude 3.5 Sonnet", in: "3.00", out: "15.00", en: true, margin: "20%" },
                                        { model: "Gemini 1.5 Pro", in: "3.50", out: "10.50", en: true, margin: "15%" },
                                        { model: "LLaMA 3 70B (Groq)", in: "0.59", out: "0.79", en: true, margin: "40%" }
                                    ].map((row, i) => (
                                        <tr key={i} className="hover:bg-zinc-900/30 transition-colors">
                                            <td className="px-6 py-3"><Switch defaultChecked={row.en} className="scale-75" /></td>
                                            <td className="px-6 py-3 font-medium text-gray-200">{row.model}</td>
                                            <td className="px-6 py-3">
                                                <div className="relative w-24 mx-auto">
                                                    <span className="absolute left-2.5 top-1.5 text-zinc-600 text-[10px]">$</span>
                                                    <Input defaultValue={row.in} className="bg-zinc-950 border-zinc-800 h-7 pl-5 font-mono text-[11px] text-white text-center" />
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="relative w-24 mx-auto">
                                                    <span className="absolute left-2.5 top-1.5 text-zinc-600 text-[10px]">$</span>
                                                    <Input defaultValue={row.out} className="bg-zinc-950 border-zinc-800 h-7 pl-5 font-mono text-[11px] text-white text-center" />
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <span className="text-[11px] font-bold text-emerald-500 font-mono bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 rounded">
                                                    +{row.margin}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </TabsContent>

                        <TabsContent value="stt" className="mt-0">
                            <div className="p-20 text-center flex flex-col items-center gap-3">
                                <Activity className="w-8 h-8 text-zinc-800" />
                                <p className="text-zinc-500 text-xs italic">Speech-to-Text rate matrices are automatically derived from provider API responses.</p>
                            </div>
                        </TabsContent>

                        <TabsContent value="tts" className="mt-0">
                            <div className="p-20 text-center flex flex-col items-center gap-3">
                                <Activity className="w-8 h-8 text-zinc-800" />
                                <p className="text-zinc-500 text-xs italic">Text-to-Speech character billing is configured at the gateway level.</p>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
