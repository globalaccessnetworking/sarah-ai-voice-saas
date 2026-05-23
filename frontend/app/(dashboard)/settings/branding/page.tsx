"use client";

import React, { useState, useEffect } from "react";
import { 
    Palette, 
    Globe, 
    CheckCircle, 
    ShieldCheck, 
    Save, 
    Mail, 
    ExternalLink,
    AlertCircle,
    Info
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function BrandingSettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [branding, setBranding] = useState({
        companyName: "Global Access AI",
        logoUrl: "",
        primaryColor: "#22c55e",
        supportEmail: "",
        customDomain: "",
        isDomainVerified: false
    });

    useEffect(() => {
        fetchBranding();
    }, []);

    const fetchBranding = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/settings/branding");
            const data = await res.json();
            if (data && !data.error) {
                setBranding(data);
            }
        } catch (error) {
            console.error("Failed to fetch branding:", error);
            toast.error("Failed to load branding configuration");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await fetch("/api/settings/branding", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(branding)
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            toast.success("Branding configuration saved successfully");
        } catch (error: any) {
            toast.error(error.message || "Failed to save branding");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                    <p className="text-zinc-500 text-sm animate-pulse">Initializing Tronic Engine...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1400px] mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                        <Palette className="w-8 h-8 text-emerald-500" />
                        Email Branding & Deliverability
                    </h1>
                    <p className="text-zinc-400 text-sm">White-label your outbound communications and verify sending domains.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Brand Aesthetics Card */}
                <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Info className="w-12 h-12 text-emerald-500" />
                    </div>
                    
                    <h2 className="text-lg font-bold text-zinc-100 mb-6 flex items-center gap-2">
                        <Palette className="w-5 h-5 text-emerald-500" />
                        Brand Aesthetics
                    </h2>

                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Company Name</Label>
                            <Input 
                                value={branding.companyName}
                                onChange={(e) => setBranding({ ...branding, companyName: e.target.value })}
                                className="bg-zinc-950/50 border-zinc-800 focus:border-emerald-500/50 h-11 text-zinc-300"
                                placeholder="Global Access AI"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Brand Logo URL</Label>
                            <Input 
                                value={branding.logoUrl}
                                onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
                                className="bg-zinc-950/50 border-zinc-800 focus:border-emerald-500/50 h-11 text-zinc-300"
                                placeholder="https://your-storage.com/logo.png"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Primary Brand Color</Label>
                            <div className="flex gap-3">
                                <div 
                                    className="w-11 h-11 rounded-xl border border-zinc-800 overflow-hidden relative"
                                    style={{ backgroundColor: branding.primaryColor }}
                                >
                                    <input 
                                        type="color"
                                        value={branding.primaryColor}
                                        onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                </div>
                                <Input 
                                    value={branding.primaryColor}
                                    onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                                    className="bg-zinc-950/50 border-zinc-800 focus:border-emerald-500/50 h-11 font-mono text-zinc-300 uppercase"
                                    maxLength={7}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Support Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                <Input 
                                    value={branding.supportEmail}
                                    onChange={(e) => setBranding({ ...branding, supportEmail: e.target.value })}
                                    className="bg-zinc-950/50 border-zinc-800 focus:border-emerald-500/50 h-11 pl-10 text-zinc-300"
                                    placeholder="support@yourdomain.com"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-zinc-800/50">
                            <Button 
                                type="submit"
                                disabled={isSaving}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 rounded-xl transition-all shadow-xl hover:shadow-blue-500/20"
                            >
                                <Save className={`w-4 h-4 mr-2 ${isSaving ? 'animate-spin' : ''}`} />
                                {isSaving ? "Saving..." : "Save Branding Configuration"}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Right Column: DNS Verification Suite */}
                <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Globe className="w-12 h-12 text-blue-500" />
                    </div>

                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-blue-500" />
                            Domain Authentication (SPF/DKIM)
                        </h2>
                        {branding.isDomainVerified ? (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                <CheckCircle className="w-3 h-3 text-emerald-500" />
                                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">Verified</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded-full">
                                <div className="w-2 h-2 rounded-full bg-zinc-600 animate-pulse" />
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Pending Verification</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Custom Domain</Label>
                            <Input 
                                value={branding.customDomain}
                                onChange={(e) => setBranding({ ...branding, customDomain: e.target.value })}
                                className="bg-zinc-950/50 border-zinc-800 focus:border-blue-500/50 h-11 text-zinc-300"
                                placeholder="client-company.com"
                            />
                        </div>

                        <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-xl overflow-hidden">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-zinc-800">
                                        <th className="text-left p-3 text-zinc-500 font-bold uppercase tracking-widest text-[9px]">Type</th>
                                        <th className="text-left p-3 text-zinc-500 font-bold uppercase tracking-widest text-[9px]">Name</th>
                                        <th className="text-left p-3 text-zinc-500 font-bold uppercase tracking-widest text-[9px]">Value</th>
                                    </tr>
                                </thead>
                                <tbody className="text-zinc-400 divide-y divide-zinc-800/50">
                                    <tr>
                                        <td className="p-3 font-mono text-blue-400">TXT</td>
                                        <td className="p-3 font-mono">@</td>
                                        <td className="p-3 font-mono break-all text-[10px]">
                                            v=spf1 include:amazonses.com ~all
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="p-3 font-mono text-blue-400">CNAME</td>
                                        <td className="p-3 font-mono">ga._domainkey</td>
                                        <td className="p-3 font-mono break-all text-[10px]">
                                            dkim.globalaccess.ai
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" />
                            <div>
                                <h4 className="text-xs font-bold text-blue-400 mb-1">Verify Ownership</h4>
                                <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                                    Add these records to your DNS provider to enable white-label delivery. Changes may take up to 24 hours to propagate.
                                </p>
                            </div>
                        </div>

                        <Button 
                            variant="outline"
                            className="w-full border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/50 h-11 text-xs font-bold gap-2"
                        >
                            <ExternalLink className="w-4 h-4" />
                            View Integration Guide
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
