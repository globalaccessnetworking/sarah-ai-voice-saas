"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Radio, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useBranding } from "../AuthLayoutClient";

export default function LoginClient() {
    const router = useRouter();
    const branding = useBranding();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        setTimeout(() => {
            const isOperator = email === "operator@globalaccess.ai" && password === "Sovereign-2026";
            const isAdmin = email === "admin@globalaccess.ai" && password === "password";

            if (isOperator || isAdmin) {
                toast.success(`Access Granted: ${isOperator ? 'OPERATOR' : 'ADMIN'}. Initializing Session...`);
                // Set the cookie with a broad path and max-age so middleware definitely sees it
                document.cookie = "auth-token=admin-token; path=/; max-age=86400; SameSite=Lax";

                // Force a hard browser redirect to the root dashboard, bypassing Next.js router cache
                setTimeout(() => {
                    window.location.replace('/');
                }, 500);
            } else {
                setLoading(false);
                toast.error("Invalid Credentials. Access Denied.");
            }
        }, 1500);
    };

    return (
        <div className="w-full max-w-[420px] p-8 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl relative z-10 mx-auto">
            <div className="flex flex-col items-center mb-8">
                <div className="flex items-center justify-center gap-2 text-2xl font-bold text-white mb-2">
                    <Radio className="w-8 h-8 text-blue-500" />
                    <span>{branding.dashboardName || "Global Access AI"}</span>
                </div>
                <p className="text-zinc-400 text-sm">Dashboard Login</p>
            </div>

            <form onSubmit={handleLogin}>
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
                <div className="mb-4">
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Password</label>
                    <input
                        type="password"
                        placeholder="Enter your password"
                        className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 text-white rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors relative z-20"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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
                            <LogIn className="w-5 h-5" /> Sign In
                        </>
                    )}
                </button>
            </form>

            <div className="mt-6 text-center z-20 relative">
                <Link
                    href="/forgot-password"
                    className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                    Forgot Password?
                </Link>
            </div>

            {/* Secure Credential Hint */}
            <div className="mt-8 text-center bg-zinc-950 p-3 rounded-lg border border-zinc-800/50">
                <p className="text-xs text-zinc-500 mb-1">Demo Credentials:</p>
                <p className="text-xs text-zinc-400">
                    <span className="text-blue-400">operator@globalaccess.ai</span> / <span className="text-blue-400">Sovereign-2026</span>
                </p>
            </div>
        </div>
    );
}

