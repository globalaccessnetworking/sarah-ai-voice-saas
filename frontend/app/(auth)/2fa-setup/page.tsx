"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { QrCode, Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useBranding } from "../AuthLayoutClient";

export default function TwoFactorSetupPage() {
    const router = useRouter();
    const branding = useBranding();
    const [loading, setLoading] = useState(false);
    const [code, setCode] = useState("");

    const handleEnable = async (e: React.FormEvent) => {
        e.preventDefault();

        if (code.length !== 6) {
            toast.error("Please enter a valid 6-digit code.");
            return;
        }

        setLoading(true);

        setTimeout(() => {
            setLoading(false);
            if (code === "123456") { // mock validation
                toast.success("Two-Factor Authentication Enabled Successfully!");
                window.location.href = "/overview";
            } else {
                toast.error("Invalid verification code");
                setCode("");
            }
        }, 1500);
    };

    return (
        <div className="w-full max-w-[420px] p-8 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl relative z-10 mx-auto">
            <div className="flex flex-col items-center mb-6">
                <div className="flex items-center justify-center gap-2 text-2xl font-bold text-white mb-2">
                    <KeyRound className="w-8 h-8 text-blue-500" />
                    <span>{branding.dashboardName || "Global Access AI"}</span>
                </div>
                <p className="text-zinc-400 text-sm">Setup Two-Factor Authentication</p>
            </div>

            <div className="bg-white p-4 rounded-lg flex items-center justify-center mb-6 mx-auto w-48 h-48">
                {/* Mock QR Code */}
                <QrCode className="w-full h-full text-zinc-900" />
            </div>

            <p className="text-sm text-zinc-400 text-center mb-6">
                Scan this QR code with your authenticator app (e.g., Google Authenticator), then enter the generated 6-digit code below.
            </p>

            <form onSubmit={handleEnable}>
                <div className="mb-4">
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
                        "Enable 2FA"
                    )}
                </button>
            </form>

            <div className="mt-6 text-center z-20 relative">
                <button
                    type="button"
                    onClick={() => window.location.href = "/overview"}
                    className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                    Skip for now
                </button>
            </div>
        </div>
    );
}
