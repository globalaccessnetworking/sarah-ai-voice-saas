"use client";

import { useState } from "react";
import { SipTrunk } from "@/db/schema";
import SipTrunkModal from "./SipTrunkModal";
import Link from "next/link";
import { Copy, Plus, MoreHorizontal, Edit2, Trash2, ShieldCheck, PhoneOutgoing, PhoneIncoming } from "lucide-react";

export default function SipTrunksView({ initialTrunks }: { initialTrunks: SipTrunk[] }) {
    const [trunks, setTrunks] = useState<SipTrunk[]>(initialTrunks);
    const [activeTab, setActiveTab] = useState<"inbound" | "outbound">("inbound");

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [editingTrunk, setEditingTrunk] = useState<SipTrunk | null>(null);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [trunkToDelete, setTrunkToDelete] = useState<SipTrunk | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const inboundTrunks = trunks.filter(t => t.type === "inbound");
    const outboundTrunks = trunks.filter(t => t.type === "outbound");

    const openCreateModal = () => {
        setModalMode("create");
        setEditingTrunk(null);
        setIsModalOpen(true);
    };

    const openEditModal = (trunk: SipTrunk) => {
        setModalMode("edit");
        setEditingTrunk(trunk);
        setIsModalOpen(true);
    };

    const confirmDelete = (trunk: SipTrunk) => {
        setTrunkToDelete(trunk);
        setIsDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!trunkToDelete) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/sip-trunks/${trunkToDelete.id}`, { method: 'DELETE' });
            if (res.ok) {
                setTrunks(prev => prev.filter(t => t.id !== trunkToDelete.id));
                setIsDeleteModalOpen(false);
            } else {
                alert("Failed to delete trunk.");
            }
        } catch (err) {
            console.error(err);
            alert("Error deleting trunk.");
        } finally {
            setIsDeleting(false);
            setTrunkToDelete(null);
        }
    };

    const handleSave = (savedTrunk: SipTrunk, isNew: boolean) => {
        if (isNew) {
            setTrunks([savedTrunk, ...trunks]);
        } else {
            setTrunks(trunks.map(t => t.id === savedTrunk.id ? savedTrunk : t));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex bg-[var(--bg-tertiary)] p-1 rounded-lg border border-[var(--border-color)]">
                    <button
                        onClick={() => setActiveTab("inbound")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "inbound"
                            ? "bg-[var(--brand-primary)]/20 text-[var(--brand-primary)]"
                            : "text-gray-400 hover:text-white hover:bg-[var(--bg-card)]"
                            }`}
                    >
                        <PhoneIncoming className="w-4 h-4" />
                        Inbound Trunks
                        <span className="ml-1 px-2 py-0.5 rounded-full bg-black/20 text-xs">
                            {inboundTrunks.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab("outbound")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "outbound"
                            ? "bg-[var(--brand-primary)]/20 text-[var(--brand-primary)]"
                            : "text-gray-400 hover:text-white hover:bg-[var(--bg-card)]"
                            }`}
                    >
                        <PhoneOutgoing className="w-4 h-4" />
                        Outbound Trunks
                        <span className="ml-1 px-2 py-0.5 rounded-full bg-black/20 text-xs">
                            {outboundTrunks.length}
                        </span>
                    </button>
                </div>

                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" /> Create Trunk
                </button>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-center">
                    <h2 className="font-semibold text-white flex items-center gap-2">
                        {activeTab === 'inbound' ? <PhoneIncoming className="w-4 h-4 text-blue-400" /> : <PhoneOutgoing className="w-4 h-4 text-green-400" />}
                        {activeTab === "inbound" ? "Inbound Routing" : "Outbound Connections"}
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-300">
                        <thead className="text-xs uppercase bg-[var(--bg-tertiary)] text-gray-400 border-b border-[var(--border-color)]">
                            <tr>
                                <th className="px-6 py-4 font-medium">Trunk ID</th>
                                <th className="px-6 py-4 font-medium">Name</th>
                                <th className="px-6 py-4 font-medium">Numbers</th>
                                {activeTab === "inbound" ? (
                                    <>
                                        <th className="px-6 py-4 font-medium">Allowed Config</th>
                                        <th className="px-6 py-4 font-medium">Auth Username</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="px-6 py-4 font-medium">Address</th>
                                        <th className="px-6 py-4 font-medium">Transport</th>
                                    </>
                                )}
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {(activeTab === "inbound" ? inboundTrunks : outboundTrunks).map(trunk => (
                                <tr key={trunk.id} className="hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400">{trunk.id.substring(0, 16)}...</span>
                                            <button
                                                onClick={() => navigator.clipboard.writeText(trunk.id)}
                                                className="text-gray-500 hover:text-white"
                                                title="Copy ID"
                                            >
                                                <Copy className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-white">
                                        {trunk.name}
                                    </td>
                                    <td className="px-6 py-4">
                                        {Array.isArray(trunk.numbers) && trunk.numbers.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {trunk.numbers.map((n, i) => (
                                                    <span key={i} className="px-2 py-1 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded text-xs">{n}</span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-gray-500 italic">None</span>
                                        )}
                                    </td>

                                    {activeTab === "inbound" ? (
                                        <>
                                            <td className="px-6 py-4">
                                                {Array.isArray(trunk.allowedAddresses) && trunk.allowedAddresses.length > 0 ? (
                                                    <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded border border-green-400/20 max-w-fit">
                                                        <ShieldCheck className="w-3 h-3" />
                                                        {trunk.allowedAddresses.length} IP(s) Allowlisted
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500">Any IP</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {trunk.authUsername ? (
                                                    <span className="text-gray-300">{trunk.authUsername}</span>
                                                ) : (
                                                    <span className="text-gray-500 italic">None</span>
                                                )}
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="px-6 py-4">
                                                <span className="text-gray-300">{trunk.address || <span className="text-gray-500 italic">Unset</span>}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-gray-800 rounded uppercase text-xs font-semibold">{trunk.transport}</span>
                                            </td>
                                        </>
                                    )}

                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(trunk)}
                                                className="p-1.5 text-gray-400 hover:text-white hover:bg-[var(--bg-tertiary)] rounded transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => confirmDelete(trunk)}
                                                className="p-1.5 text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {(activeTab === "inbound" ? inboundTrunks : outboundTrunks).length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            {activeTab === 'inbound' ? <PhoneIncoming className="w-12 h-12 mb-4 opacity-20" /> : <PhoneOutgoing className="w-12 h-12 mb-4 opacity-20" />}
                                            <p className="text-lg font-medium text-gray-400">No {activeTab} trunks found</p>
                                            <p className="mt-1">Create your first {activeTab} trunk to enable telephony.</p>
                                            <button
                                                onClick={openCreateModal}
                                                className="mt-6 font-medium text-[var(--brand-primary)] hover:underline"
                                            >
                                                Create {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Trunk
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create / Edit Modal */}
            <SipTrunkModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                mode={modalMode}
                initialData={(editingTrunk || { type: activeTab }) as any}
                onSave={handleSave}
            />

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6">
                            <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                                <Trash2 className="w-5 h-5 text-red-500" />
                                Delete SIP Trunk
                            </h3>
                            <p className="text-gray-400 mt-2">
                                Are you sure you want to delete <strong className="text-white">{trunkToDelete?.name}</strong>? This action cannot be undone and will disrupt any incoming/outgoing calls configured to use it.
                            </p>
                        </div>
                        <div className="bg-[var(--bg-tertiary)] p-4 flex justify-end gap-3 border-t border-[var(--border-color)]">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                disabled={isDeleting}
                                className="px-4 py-2 font-medium text-gray-300 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                {isDeleting ? "Deleting..." : "Confirm Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
