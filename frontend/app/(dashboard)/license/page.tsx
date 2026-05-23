"use client";

import React, { useState } from "react";
import { ShieldAlert, Fingerprint, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LicenseActivationPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [isActivated, setIsActivated] = useState(false);

    const hardwareId = "HW-9F8A-2B1C-X77Y-LKT3";

    const handleActivate = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        setTimeout(() => {
            setLoading(false);
            if (email) {
                setIsActivated(true);
                toast.success("License Activated Successfully!");
                setTimeout(() => {
                    window.location.href = "/overview";
                }, 1500);
            } else {
                toast.error("Invalid License Email");
            }
        }, 2000);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 relative overflow-hidden">
            {/* Ambient Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            <div className="w-full max-w-[480px] p-8 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl relative z-10">
                <div className="flex flex-col items-center mb-8 text-center">
                    <div className="flex items-center justify-center gap-2 text-2xl font-bold text-white mb-2">
                        {isActivated ? (
                            <CheckCircle2 className="w-10 h-10 text-green-500 mb-2" />
                        ) : (
                            <ShieldAlert className="w-10 h-10 text-orange-500 mb-2" />
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-1">
                        {isActivated ? "System Verified" : "License Activation Required"}
                    </h1>
                    <p className="text-zinc-400 text-sm">
                        {isActivated ? "Your dashboard is fully unlocked." : "A valid enterprise license is required to use this software."}
                    </p>
                </div>

                {!isActivated && (
                    <div className="mb-6 p-4 bg-orange-950/30 border border-orange-900/50 rounded-lg flex items-start gap-3">
                        <ShieldAlert className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                        <div className="text-sm">
                            <strong className="text-orange-400 block mb-1">Grace Period Active</strong>
                            <span className="text-orange-200/80">
                                License verification failed or is missing. The system will lock in 3 days unless a valid license is applied.
                            </span>
                        </div>
                    </div>
                )}

                <form onSubmit={handleActivate} className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-zinc-300 flex items-center justify-between">
                            Machine ID / Hardware Fingerprint
                            <Fingerprint className="w-4 h-4 text-zinc-500" />
                        </Label>
                        <div className="w-full px-4 py-3 bg-zinc-950 border-2 border-dashed border-zinc-800 text-zinc-300 rounded-md font-mono text-center tracking-widest text-lg">
                            {hardwareId}
                        </div>
                        <p className="text-xs text-zinc-500 text-center">Provide this ID to support if you need to perform an offline activation.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-zinc-300">Registered License Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="admin@yourcompany.com"
                            className="bg-zinc-950 border-zinc-700 text-white px-4 py-6"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isActivated}
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading || isActivated}
                        className={`w-full py-6 text-lg font-medium transition-colors ${isActivated
                                ? "bg-green-600 hover:bg-green-700 text-white"
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                            }`}
                    >
                        {loading ? (
                            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                        ) : isActivated ? (
                            "Activated"
                        ) : (
                            "Activate License"
                        )}
                    </Button>
                </form>

                <div className="mt-8 text-center border-t border-zinc-800/50 pt-6">
                    <a href="https://globalaccess.ai" target="_blank" rel="noreferrer" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                        Global Access AI Core Infrastructure &copy; 2026
                    </a>
                </div>
            </div>
        </div>
    );
}
