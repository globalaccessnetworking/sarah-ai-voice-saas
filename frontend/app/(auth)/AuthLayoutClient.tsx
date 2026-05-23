"use client";

import React, { createContext, useContext } from "react";

const BrandingContext = createContext<any>({});

export const useBranding = () => useContext(BrandingContext);

interface AuthLayoutClientProps {
    children: React.ReactNode;
    branding: any;
}

export default function AuthLayoutClient({ children, branding }: AuthLayoutClientProps) {
    const dashboardName = branding.dashboardName || "Global Access AI";
    const footerText = branding.footerText || "Global Access © 2026 Admin Panel";

    return (
        <BrandingContext.Provider value={branding}>
            <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 px-4 font-sans">
                <div className="w-full max-w-[420px]">
                    {children}

                    {/* Simple Footer */}
                    <div className="text-center space-y-2 mt-6 relative z-10">
                        <p className="text-xs text-zinc-500">
                            {footerText}
                        </p>
                        <div className="flex items-center justify-center gap-4 text-xs text-zinc-600">
                            <span className="hover:text-zinc-400 cursor-pointer transition-colors">Privacy Policy</span>
                            <span>•</span>
                            <span className="hover:text-zinc-400 cursor-pointer transition-colors">Terms of Service</span>
                        </div>
                    </div>
                </div>
            </div>
        </BrandingContext.Provider>
    );
}
