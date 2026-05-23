"use client";

import { useState, useEffect } from "react";
import { X, Shield, Users, Save, LayoutGrid } from "lucide-react";

export default function CreateUserModal({ user, onClose, onSaved }: { user?: any, onClose: () => void, onSaved: () => void }) {
    const isEdit = !!user;
    const [submitting, setSubmitting] = useState(false);

    // Basic Info State
    const [email, setEmail] = useState(user?.email || "");
    const [displayName, setDisplayName] = useState(user?.displayName || "");
    const [password, setPassword] = useState("");
    const [isActive, setIsActive] = useState(user?.isActive ?? true);

    // RBAC & Limits State
    const [monthlyMinutesQuota, setMonthlyMinutesQuota] = useState(user?.monthlyMinutesQuota || 0);
    const [marginEnabled, setMarginEnabled] = useState(user?.marginConfig?.enabled || false);
    const [marginType, setMarginType] = useState(user?.marginConfig?.type || "percentage");
    const [marginValue, setMarginValue] = useState(user?.marginConfig?.value || 0);

    // Complex Permissions matrix (simplified for POC rendering aesthetics per prompt)
    const [permissions, setPermissions] = useState<any>(user?.permissions || {});

    const pages = [
        "overview", "agents", "rooms", "telephony", "web_chat", "knowledge_base", "tools", "call_history"
    ];

    const actions = ["view", "create", "edit", "delete"];

    const handlePermissionToggle = (page: string, action: string) => {
        setPermissions((prev: any) => {
            const pagePerms = prev[page] || [];
            if (pagePerms.includes(action)) {
                return { ...prev, [page]: pagePerms.filter((a: string) => a !== action) };
            } else {
                return { ...prev, [page]: [...pagePerms, action] };
            }
        });
    };

    const applyTemplate = (template: string) => {
        if (template === "read_only") {
            const newPerms: any = {};
            pages.forEach(p => newPerms[p] = ["view"]);
            setPermissions(newPerms);
        } else if (template === "full_access") {
            const newPerms: any = {};
            pages.forEach(p => newPerms[p] = ["view", "create", "edit", "delete"]);
            setPermissions(newPerms);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const payload = {
            email,
            displayName,
            passwordHash: isEdit ? undefined : password,
            isActive,
            monthlyMinutesQuota: Number(monthlyMinutesQuota),
            marginConfig: { enabled: marginEnabled, type: marginType, value: Number(marginValue) },
            permissions
        };

        const method = isEdit ? "PUT" : "POST";
        const url = isEdit ? `/api/users/${user.id}` : `/api/users`;

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                onSaved();
                onClose();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-500" />
                        {isEdit ? "Edit Sub-User" : "Create New User"}
                    </h2>
                    <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body - Scrollable */}
                <div className="p-6 overflow-y-auto flex-1">
                    <form id="userForm" onSubmit={handleSave} className="space-y-8">

                        {/* Section: Basic Identity */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                <Shield className="w-4 h-4" /> Basic Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-zinc-300 mb-1">Email Address *</label>
                                    <input required type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={isEdit} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none disabled:opacity-50" />
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-300 mb-1">Display Name *</label>
                                    <input required type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" />
                                </div>
                                {!isEdit && (
                                    <div>
                                        <label className="block text-sm text-zinc-300 mb-1">Password *</label>
                                        <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" />
                                    </div>
                                )}
                                {isEdit && (
                                    <div className="flex items-center h-full pt-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="form-checkbox bg-zinc-950 border-zinc-800 rounded text-blue-500 focus:ring-0" />
                                            <span className="text-sm text-zinc-300">Account Active</span>
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section: RBAC Matrix */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                    <LayoutGrid className="w-4 h-4" /> Permission Matrix
                                </h3>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => applyTemplate("read_only")} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1 rounded">Preset: Read Only</button>
                                    <button type="button" onClick={() => applyTemplate("full_access")} className="text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1 rounded">Preset: Full Access</button>
                                </div>
                            </div>

                            <div className="border border-zinc-800 rounded-lg overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-zinc-950/50 text-zinc-400 border-b border-zinc-800">
                                        <tr>
                                            <th className="px-4 py-2 font-medium">Page Module</th>
                                            {actions.map(a => <th key={a} className="px-4 py-2 text-center font-medium capitalize">{a}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800 bg-zinc-900/50">
                                        {pages.map(page => (
                                            <tr key={page}>
                                                <td className="px-4 py-2 font-medium text-slate-300 capitalize">{page.replace("_", " ")}</td>
                                                {actions.map(action => {
                                                    const isChecked = permissions[page]?.includes(action) || false;
                                                    return (
                                                        <td key={action} className="px-4 py-2 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => handlePermissionToggle(page, action)}
                                                                className="w-4 h-4 bg-zinc-950 border-zinc-700 rounded text-blue-600 focus:ring-0"
                                                            />
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Section: Tenant Config (Limits & Margins) */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                <Users className="w-4 h-4" /> Multi-Tenant Configuration
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-lg border border-zinc-800 bg-zinc-950/50">
                                <div>
                                    <label className="block text-sm text-zinc-300 mb-1">Monthly Minutes Quota</label>
                                    <div className="flex bg-zinc-950 border border-zinc-800 rounded overflow-hidden">
                                        <input type="number" value={monthlyMinutesQuota} onChange={e => setMonthlyMinutesQuota(Number(e.target.value))} className="w-full bg-transparent px-3 py-2 text-sm text-white focus:outline-none" />
                                        <span className="bg-zinc-800 px-3 py-2 text-sm text-zinc-400 border-l border-zinc-800">min/mo</span>
                                    </div>
                                </div>

                                <div className="md:col-span-2 grid grid-cols-3 gap-4 border-l border-zinc-800 pl-6">
                                    <div className="col-span-3 pb-2 flex items-center justify-between">
                                        <label className="text-sm text-zinc-300 font-medium">Reseller Margin Settings</label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={marginEnabled} onChange={e => setMarginEnabled(e.target.checked)} className="form-checkbox bg-zinc-950 border-zinc-800 rounded text-blue-500 focus:ring-0" />
                                            <span className="text-xs text-zinc-400">Enable</span>
                                        </label>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs text-zinc-500 mb-1">Type</label>
                                        <select disabled={!marginEnabled} value={marginType} onChange={e => setMarginType(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none disabled:opacity-50">
                                            <option value="percentage">Percentage (%)</option>
                                            <option value="fixed">Fixed Rate ($)</option>
                                        </select>
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-xs text-zinc-500 mb-1">Value</label>
                                        <input type="number" disabled={!marginEnabled} value={marginValue} onChange={e => setMarginValue(Number(e.target.value))} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none disabled:opacity-50" />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-950 flex-shrink-0 rounded-b-lg">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors">
                        Cancel
                    </button>
                    <button type="submit" form="userForm" disabled={submitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors flex items-center gap-2">
                        {submitting && <Save className="w-4 h-4 animate-spin" />}
                        {isEdit ? "Save Changes" : "Create User"}
                    </button>
                </div>

            </div>
        </div>
    );
}
