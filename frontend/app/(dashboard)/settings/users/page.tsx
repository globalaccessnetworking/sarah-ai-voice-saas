"use client";

import { useState, useEffect } from "react";
import { UserPlus, Search, Edit2, Trash2, Key, Shield, Clock, Loader2 } from "lucide-react";
import CreateUserModal from "./CreateUserModal";

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.displayName.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="w-full h-full overflow-y-auto bg-zinc-950 p-8 md:p-10 text-slate-200">
            <div className="max-w-[1600px] mx-auto flex flex-col gap-8">

                {/* Header Region */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Shield className="w-8 h-8 text-blue-500" />
                            User Management
                        </h1>
                        <p className="text-zinc-400 mt-2">Manage sub-accounts, roles, and granular platform permissions.</p>
                    </div>
                    <button
                        onClick={() => { setSelectedUser(null); setIsCreateModalOpen(true); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors"
                    >
                        <UserPlus className="w-4 h-4" />
                        Create User
                    </button>
                </div>

                {/* Search Bar */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                    <div className="relative">
                        <Search className="w-5 h-5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Find user by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded pl-10 pr-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-zinc-950/50 text-zinc-400 text-xs uppercase font-semibold border-b border-zinc-800">
                                <tr>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">2FA</th>
                                    <th className="px-6 py-4">Quota</th>
                                    <th className="px-6 py-4">Created</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                            Loading users...
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                                            No users found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-zinc-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-200">{user.displayName}</div>
                                                <div className="text-xs text-zinc-500">{user.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.isActive ? (
                                                    <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs border border-green-500/20">Active</span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-zinc-800 text-zinc-400 rounded text-xs border border-zinc-700">Inactive</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.twoFactorEnabled ? (
                                                    <span className="flex items-center gap-1 text-green-400 text-xs"><Key className="w-3 h-3" /> Enabled</span>
                                                ) : (
                                                    <span className="text-zinc-500 text-xs">Disabled</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-zinc-400">
                                                {user.monthlyMinutesQuota > 0 ? `${user.monthlyMinutesQuota} min/mo` : 'Unlimited'}
                                            </td>
                                            <td className="px-6 py-4 text-zinc-400">
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(user.createdAt).toLocaleDateString()}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => { setSelectedUser(user); setIsCreateModalOpen(true); }}
                                                        className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors"
                                                        title="Edit User"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isCreateModalOpen && (
                <CreateUserModal
                    user={selectedUser}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSaved={fetchUsers}
                />
            )}
        </div>
    );
}
