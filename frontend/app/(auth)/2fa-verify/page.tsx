"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useBranding } from "../AuthLayoutClient";

export default function TwoFactorVerifyPage() {
    const router = useRouter();
    const branding = useBranding();
    const [loading, setLoading] = useState(false);
    const [code, setCode] = useState("");

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();

        if (code.length !== 6) {
            toast.error("Please enter a valid 6-digit code.");
            return;
        }

        setLoading(true);

        setTimeout(() => {
            setLoading(false);
            if (code === "123456") { // mock validation
                toast.success("Verification successful");
                document.cookie = "auth-token=admin-token; path=/; max-age=86400";
                window.location.href = "/overview";
            } else {
                toast.error("Invalid verification code");
                setCode("");
            }
        }, 1500);
    };

    return (
        <div className="w-full max-w-[420px] p-8 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl relative z-10 mx-auto">
            <div className="flex flex-col items-center mb-8">
                <div className="flex items-center justify-center gap-2 text-2xl font-bold text-white mb-2">
                    <ShieldCheck className="w-8 h-8 text-blue-500" />
                    <span>{branding.dashboardName || "Global Access AI"}</span>
                </div>
                <p className="text-zinc-400 text-sm">Two-Factor Authentication</p>
            </div>

            <form onSubmit={handleVerify}>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-zinc-400 mb-4 text-center">
                        Enter 6-digit code from your authenticator app
                    </label>
                    <input
                        type="text"
                        maxLength={6}
                        placeholder="000000"
                        className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 text-white rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors relative z-20 text-center text-3xl tracking-[0.5em] font-mono"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="w-full py-3 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed z-20 relative"
                    disabled={loading || code.length !== 6}
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        "Verify and Login"
                    )}
                </button>
            </form>

            <div className="mt-8 text-center bg-zinc-950 p-3 rounded-lg border border-zinc-800/50">
                <p className="text-xs text-zinc-500 mb-1">Demo Code:</p>
                <p className="text-xs text-zinc-400">
                    <span className="text-blue-400 tracking-widest font-mono">123456</span>
                </p>
            </div>
        </div>
    );
}
