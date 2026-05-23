"use client";

import { useState, useRef, useEffect } from "react";
import { User, KeyRound, LogOut, ChevronDown } from "lucide-react";

interface TopBarProps {
    title: string;
    subtitle?: string;
}

export default function TopBar({ title, subtitle }: TopBarProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div className="topbar">
            <div className="topbar-title-group">
                <h1 className="page-title">{title}</h1>
                {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>

            <div className="topbar-actions">
                {/* User dropdown */}
                <div style={{ position: "relative" }} ref={ref}>
                    <button
                        className="user-dropdown-trigger"
                        onClick={() => setOpen((v) => !v)}
                    >
                        <User size={15} />
                        <span>Administrator</span>
                        <ChevronDown size={13} style={{ opacity: 0.6 }} />
                    </button>

                    {open && (
                        <div
                            style={{
                                position: "absolute",
                                top: "calc(100% + 6px)",
                                right: 0,
                                minWidth: "180px",
                                background: "var(--bg-card)",
                                border: "1px solid var(--border-color)",
                                borderRadius: "var(--radius)",
                                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                                zIndex: 50,
                                overflow: "hidden",
                            }}
                        >
                            <div
                                style={{
                                    padding: "0.6rem 0.875rem",
                                    fontSize: "0.78rem",
                                    color: "var(--text-muted)",
                                    borderBottom: "1px solid var(--border-color)",
                                }}
                            >
                                <User size={12} style={{ display: "inline", marginRight: 4 }} />
                                Administrator
                            </div>
                            <button
                                className="btn btn-secondary"
                                style={{
                                    width: "100%",
                                    borderRadius: 0,
                                    justifyContent: "flex-start",
                                    border: "none",
                                    borderBottom: "1px solid var(--border-color)",
                                    background: "transparent",
                                }}
                                onClick={() => setOpen(false)}
                            >
                                <KeyRound size={13} />
                                Change Password
                            </button>
                            <a
                                href="/logout"
                                className="btn btn-secondary"
                                style={{
                                    width: "100%",
                                    borderRadius: 0,
                                    justifyContent: "flex-start",
                                    border: "none",
                                    background: "transparent",
                                    color: "var(--danger)",
                                }}
                                onClick={() => setOpen(false)}
                            >
                                <LogOut size={13} />
                                Logout
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
