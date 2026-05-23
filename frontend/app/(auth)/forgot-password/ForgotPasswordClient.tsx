"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, Key } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useBranding } from "../AuthLayoutClient";

export default function ForgotPasswordClient() {
    const router = useRouter();
    const branding = useBranding();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [email, setEmail] = useState("");
    const [countdown, setCountdown] = useState(5);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        setTimeout(() => {
            setLoading(false);
            setSuccess(true);
            toast.success("Recovery Link sent to " + email);
        }, 1500);
    };

    useEffect(() => {
        if (success && countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (success && countdown === 0) {
            window.location.href = "/login?message=password_reset_sent";
        }
    }, [success, countdown, router]);

    return (
        <div className="w-full max-w-[420px] p-8 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl relative z-10 mx-auto">
            <div className="flex flex-col items-center mb-8">
                <div className="flex items-center justify-center gap-2 text-2xl font-bold text-white mb-2">
                    <Key className="w-8 h-8 text-blue-500" />
                    <span>{branding.dashboardName || "Global Access AI"}</span>
                </div>
                <p className="text-zinc-400 text-sm">Target Recovery Link</p>
            </div>

            {!success ? (
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-zinc-400 mb-1.5">Email</label>
                        <input
                            type="email"
                            placeholder="Enter your email address"
                            className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 text-white rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors relative z-20"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors flex items-center justify-center gap-2"
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                Send Recovery Link
                            </>
                        )}
                    </button>

                    <div className="mt-6 text-center z-20 relative">
                        <Link
                            href="/login"
                            className="text-sm text-zinc-400 hover:text-white transition-colors"
                        >
                            Return to Login
                        </Link>
                    </div>
                </form>
            ) : (
                <div className="py-2 flex flex-col items-center justify-center space-y-6">
                    <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
                        <CheckCircle2 className="w-8 h-8 text-blue-500" />
                    </div>
                    <div className="text-center w-full">
                        <p className="text-sm text-zinc-400 mb-2">Redirecting to login in</p>
                        <p className="text-3xl font-bold text-white tabular-nums">{countdown}</p>
                    </div>

                    <button
                        className="w-full py-3 mt-4 bg-transparent border border-zinc-700 hover:bg-zinc-800 text-white font-medium rounded-md flex items-center justify-center transition-colors z-20 relative"
                        onClick={() => window.location.href = "/login?message=password_reset_sent"}
                    >
                        Return to Login Now
                    </button>
                </div>
            )}
        </div>
    );
}
