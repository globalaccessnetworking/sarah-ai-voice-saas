"use client";

import { useState, useEffect } from "react";
import { SipTrunk } from "@/db/schema";
import { X, Check, Code, LayoutList } from "lucide-react";

interface SipTrunkModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: "create" | "edit";
    initialData: Partial<SipTrunk>;
    onSave: (trunk: SipTrunk, isNew: boolean) => void;
}

export default function SipTrunkModal({ isOpen, onClose, mode, initialData, onSave }: SipTrunkModalProps) {
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"form" | "json">("form");

    const [formData, setFormData] = useState<Partial<SipTrunk>>({
        type: "inbound",
        name: "",
        transport: "tcp",
        numbers: [],
        allowedAddresses: [],
        authUsername: "",
        authPassword: "",
        address: "",
        metadata: {
            outbound_caller_id: ""
        }
    });

    const [jsonString, setJsonString] = useState("");
    const [jsonError, setJsonError] = useState<string | null>(null);

    // Sync formData when modal opens
    useEffect(() => {
        if (isOpen) {
            const initialForm = {
                type: initialData.type || "inbound",
                name: initialData.name || "",
                transport: initialData.transport || "tcp",
                numbers: initialData.numbers || [],
                allowedAddresses: initialData.allowedAddresses || [],
                authUsername: initialData.authUsername || "",
                authPassword: initialData.authPassword || "",
                address: initialData.address || "",
                id: initialData.id,
                metadata: initialData.metadata || { outbound_caller_id: "" }
            };
            setFormData(initialForm);
            setJsonString(JSON.stringify(initialForm, null, 4));
            setErrorMsg(null);
            setJsonError(null);
            setSubmitting(false);
            setViewMode("form");
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const isOutbound = formData.type === "outbound";

    // Form Change Handlers
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const newForm = { ...formData, [e.target.name]: e.target.value };
        setFormData(newForm);
        setJsonString(JSON.stringify(newForm, null, 4));
    };

    const handleArrayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const arr = val.split(",").map(s => s.trim()).filter(Boolean);
        const newForm = { ...formData, [e.target.name]: arr };
        setFormData(newForm);
        setJsonString(JSON.stringify(newForm, null, 4));
    };

    const handleTypeChange = (newType: string) => {
        const newForm = { ...formData, type: newType as any };
        setFormData(newForm);
        setJsonString(JSON.stringify(newForm, null, 4));
    };

    // JSON Change Handler
    const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setJsonString(val);
        try {
            const parsed = JSON.parse(val);
            setFormData(parsed);
            setJsonError(null);
        } catch (err) {
            setJsonError("Invalid JSON syntax.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (jsonError) {
            setErrorMsg("Cannot save: Invalid JSON format.");
            return;
        }

        setSubmitting(true);
        setErrorMsg(null);

        try {
            const url = mode === "create" ? "/api/sip-trunks" : `/api/sip-trunks/${formData.id}`;
            const method = mode === "create" ? "POST" : "PATCH";

            const payload = viewMode === "json" ? JSON.parse(jsonString) : formData;

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to save trunk");
            }

            // Success
            onSave({ ...payload, id: mode === "create" ? data.id : payload.id } as SipTrunk, mode === "create");
            onClose();
        } catch (err: any) {
            setErrorMsg(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !submitting && onClose()} />

            {/* Modal Content */}
            <div className="relative w-full max-w-3xl bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
                    <h2 className="text-xl font-semibold text-white">
                        {mode === "create" ? "Create New Trunk" : "Edit Trunk"}
                    </h2>

                    {/* View Toggle */}
                    <div className="absolute left-1/2 -translate-x-1/2 flex bg-[var(--bg-tertiary)] p-1 rounded-lg border border-[var(--border-color)]">
                        <button
                            onClick={() => setViewMode("form")}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "form"
                                ? "bg-[var(--bg-primary)] text-white shadow"
                                : "text-gray-400 hover:text-white"
                                }`}
                        >
                            <LayoutList className="w-4 h-4" /> Form UI
                        </button>
                        <button
                            onClick={() => setViewMode("json")}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "json"
                                ? "bg-[var(--brand-primary)]/20 text-[var(--brand-primary)] shadow"
                                : "text-gray-400 hover:text-white"
                                }`}
                        >
                            <Code className="w-4 h-4" /> Raw JSON
                        </button>
                    </div>

                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {errorMsg && (
                        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm flexitems-center gap-2">
                            {errorMsg}
                        </div>
                    )}
                    {jsonError && viewMode === "json" && (
                        <div className="mb-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm">
                            {jsonError}
                        </div>
                    )}

                    <form id="trunk-form" onSubmit={handleSubmit} className="h-full">
                        {viewMode === "form" ? (
                            <div className="space-y-6">
                                {/* Type Toggle. Only editable on Create */}
                                {mode === "create" && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Trunk Direction</label>
                                        <div className="flex p-1 bg-[var(--bg-tertiary)] rounded-lg">
                                            <button
                                                type="button"
                                                onClick={() => handleTypeChange("inbound")}
                                                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${!isOutbound
                                                    ? "bg-[var(--bg-primary)] text-white shadow"
                                                    : "text-gray-400 hover:text-white"
                                                    }`}
                                            >
                                                Inbound
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleTypeChange("outbound")}
                                                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${isOutbound
                                                    ? "bg-[var(--bg-primary)] text-white shadow"
                                                    : "text-gray-400 hover:text-white"
                                                    }`}
                                            >
                                                Outbound
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Trunk Name *</label>
                                    <input
                                        required
                                        name="name"
                                        value={formData.name || ""}
                                        onChange={handleChange}
                                        placeholder="My Office Trunk"
                                        className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Phone Numbers</label>
                                    <input
                                        name="numbers"
                                        value={(formData.numbers as string[])?.join(", ") || ""}
                                        onChange={handleArrayChange}
                                        placeholder="e.g., 18005550123, 18005550124"
                                        className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Comma-separated list in E.164 format (without +)</p>
                                </div>

                                {/* Outbound Specific Fields */}
                                {isOutbound && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1">Address *</label>
                                            <input
                                                required={isOutbound}
                                                name="address"
                                                value={formData.address || ""}
                                                onChange={handleChange}
                                                placeholder="sip.provider.com"
                                                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                                            />
                                            <p className="mt-1 text-xs text-gray-500">SIP server address/IP</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1">Outbound Caller ID</label>
                                            <input
                                                name="outbound_caller_id"
                                                value={(formData.metadata as any)?.outbound_caller_id || ""}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    const newForm = {
                                                        ...formData,
                                                        metadata: {
                                                            ...((formData.metadata as any) || {}),
                                                            outbound_caller_id: val
                                                        }
                                                    };
                                                    setFormData(newForm);
                                                    setJsonString(JSON.stringify(newForm, null, 4));
                                                }}
                                                placeholder="e.g., 18005550123"
                                                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                                            />
                                            <p className="mt-1 text-xs text-gray-500">Number to display to lead</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1">Transport</label>
                                            <select
                                                name="transport"
                                                value={formData.transport || "tcp"}
                                                onChange={handleChange}
                                                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                                            >
                                                <option value="tcp">TCP</option>
                                                <option value="udp">UDP</option>
                                                <option value="tls">TLS</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* Inbound Specific Fields */}
                                {!isOutbound && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Allowed IP Addresses</label>
                                        <input
                                            name="allowedAddresses"
                                            value={(formData.allowedAddresses as string[])?.join(", ") || ""}
                                            onChange={handleArrayChange}
                                            placeholder="e.g., 192.168.1.1, 10.0.0.0/8"
                                            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">Comma-separated list. Leave empty to allow any IP. (Automatically whitelisted in Fail2ban)</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[var(--border-color)]">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Auth Username</label>
                                        <input
                                            name="authUsername"
                                            value={formData.authUsername || ""}
                                            onChange={handleChange}
                                            placeholder="Optional"
                                            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Auth Password</label>
                                        <input
                                            name="authPassword"
                                            type="password"
                                            value={formData.authPassword || ""}
                                            onChange={handleChange}
                                            placeholder={mode === "edit" ? "Leave blank to keep existing" : "Optional"}
                                            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col h-[450px]">
                                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                                    <Code size={14} className="text-[var(--brand-primary)]" />
                                    JSON Configuration Payload
                                </label>
                                <textarea
                                    value={jsonString}
                                    onChange={handleJsonChange}
                                    className="w-full flex-1 bg-[#1e1e1e] border border-[var(--border-color)] rounded-lg p-4 font-mono text-sm text-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] resize-none"
                                    spellCheck={false}
                                />
                                <p className="mt-2 text-xs text-gray-500">
                                    Top-level fields define the `SipTrunk` model. Direct modifications here immediately reflect in the Form UI state.
                                </p>
                            </div>
                        )}
                    </form>
                </div>

                <div className="p-6 border-t border-[var(--border-color)] flex justify-end gap-3 bg-[var(--bg-card)]">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="px-5 py-2.5 font-medium text-gray-300 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="trunk-form"
                        disabled={submitting || !!jsonError}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        <Check className="w-4 h-4" />
                        {submitting ? "Saving..." : "Save Trunk"}
                    </button>
                </div>
            </div>
        </div>
    );
}
