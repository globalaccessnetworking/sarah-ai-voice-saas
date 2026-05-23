"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldAlert, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useBranding } from "../AuthLayoutClient";

export default function ResetPasswordClient() {
    const searchParams = useSearchParams();
    const branding = useBranding();
    const token = searchParams.get("token");

    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Validation states
    const isMinLength = password.length >= 8;
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
    const isFormValid = isMinLength && passwordsMatch;

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;

        setLoading(true);

        setTimeout(() => {
            setLoading(false);
            toast.success("Password Updated Successfully.");
            window.location.href = "/login?success=password_reset";
        }, 1500);
    };

    if (!token && process.env.NODE_ENV === "production") {
        return (
            <div className="w-full max-w-[420px] p-8 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl relative z-10 mx-auto">
                <div className="flex flex-col items-center text-center space-y-4">
                    <XCircle className="w-12 h-12 text-red-500" />
                    <div>
                        <h3 className="text-xl font-bold text-white">Invalid Link</h3>
                        <p className="text-sm text-zinc-400 mt-2">This password reset link is invalid or has expired.</p>
                    </div>
                    <Link href="/forgot-password" className="mt-4 px-4 py-2 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-md transition-colors text-sm">
                        Request New Link
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-[420px] p-8 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl relative z-10 mx-auto">
            <div className="flex flex-col items-center mb-8">
                <div className="flex items-center justify-center gap-2 text-2xl font-bold text-white mb-2">
                    <ShieldAlert className="w-8 h-8 text-blue-500" />
                    <span>{branding.dashboardName || "Global Access AI"}</span>
                </div>
                <p className="text-zinc-400 text-sm">Reset Password</p>
            </div>

            <form onSubmit={handleReset}>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">New Password</label>
                    <input
                        type="password"
                        placeholder="New Password"
                        className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 text-white rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors relative z-20"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <div className="mt-2 text-xs text-zinc-400 flex items-center gap-2">
                        {isMinLength ? (
                            <CheckCircle2 className="w-3 h-3 text-blue-500" />
                        ) : (
                            <div className="w-3 h-3 rounded-full border border-zinc-700" />
                        )}
                        <span className={isMinLength ? "text-blue-500" : ""}>At least 8 characters</span>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Confirm New Password</label>
                    <input
                        type="password"
                        placeholder="Confirm New Password"
                        className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 text-white rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors relative z-20"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    {confirmPassword.length > 0 && (
                        <div className="mt-2 text-xs flex items-center gap-2">
                            {passwordsMatch ? (
                                <>
                                    <CheckCircle2 className="w-3 h-3 text-blue-500" />
                                    <span className="text-blue-500">Passwords match</span>
                                </>
                            ) : (
                                <>
                                    <XCircle className="w-3 h-3 text-red-500" />
                                    <span className="text-red-500">Passwords do not match</span>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    className="w-full py-3 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed z-20 relative"
                    disabled={loading || !isFormValid}
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        "Reset Password"
                    )}
                </button>
            </form>

            <div className="mt-6 text-center z-20 relative">
                <Link
                    href="/login"
                    className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                    Cancel and return to login
                </Link>
            </div>
        </div>
    );
}
