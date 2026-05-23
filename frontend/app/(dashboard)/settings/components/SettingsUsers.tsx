"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Users, UserPlus, Shield, History, RefreshCw,
    MoreVertical, Edit2, Trash2, Key, Info,
    UserCheck, UserX, Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface User {
    id: string;
    email: string;
    role: 'Admin' | 'Operator' | 'Viewer';
    status: 'Active' | 'Inactive';
    lastLogin: string;
}

const MOCK_USERS: User[] = [
    { id: "1", email: "operator@globalaccess.ai", role: "Admin", status: "Active", lastLogin: "2026-03-08 10:30:00" },
    { id: "2", email: "support@globalaccess.ai", role: "Operator", status: "Active", lastLogin: "2026-03-07 15:20:00" },
    { id: "3", email: "viewer@globalaccess.ai", role: "Viewer", status: "Inactive", lastLogin: "2026-02-15 09:12:00" },
];

interface AuditEntry {
    id: string;
    timestamp: string;
    user: string;
    action: string;
    resource: string;
    ip: string;
}

const MOCK_AUDIT: AuditEntry[] = [
    { id: "a1", timestamp: "2026-03-08 10:45:12", user: "operator@globalaccess.ai", action: "UPDATE_SETTING", resource: "Integrations/OpenAI", ip: "192.168.1.50" },
    { id: "a2", timestamp: "2026-03-08 10:42:05", user: "operator@globalaccess.ai", action: "CREATE_AGENT", resource: "Customer Support L3", ip: "192.168.1.50" },
    { id: "a3", timestamp: "2026-03-08 10:30:00", user: "operator@globalaccess.ai", action: "LOGIN_SUCCESS", resource: "Auth System", ip: "192.168.1.50" },
    { id: "a4", timestamp: "2026-03-07 15:25:00", user: "support@globalaccess.ai", action: "DELETE_RECORDING", resource: "REC_82312.mp4", ip: "10.0.4.12" },
];

export function SettingsUsers() {
    const [users, setUsers] = useState<User[]>(MOCK_USERS);
    const [refreshing, setRefreshing] = useState(false);
    const [auditRefreshing, setAuditRefreshing] = useState(false);

    const handleRefreshUsers = () => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
            toast.success("User list synchronized.");
        }, 1000);
    };

    const handleRefreshAudit = () => {
        setAuditRefreshing(true);
        setTimeout(() => {
            setAuditRefreshing(false);
            toast.info("Latest audit trails fetched.");
        }, 1200);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-500" />
                        Access Management Center
                    </h2>
                    <p className="text-sm text-zinc-500">Control role-based access and audit platform usage.</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    <UserPlus className="w-4 h-4" /> Add Sub-Account
                </Button>
            </div>

            {/* Users Table */}
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle className="text-lg flex items-center gap-2 text-white font-medium">
                        Authorized Operators
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={handleRefreshUsers} disabled={refreshing} className="border-zinc-700 text-zinc-400 hover:text-white">
                        <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Sync Registry
                    </Button>
                </CardHeader>
                <CardContent className="p-0 border-t border-zinc-800">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-zinc-950 text-zinc-500 text-[11px] uppercase tracking-wider border-b border-zinc-800">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Identity / Email</th>
                                    <th className="px-6 py-4 font-medium">Privilege Level</th>
                                    <th className="px-6 py-4 font-medium">Engine Status</th>
                                    <th className="px-6 py-4 font-medium">Access History</th>
                                    <th className="px-6 py-4 font-medium text-right">Control</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800 bg-zinc-950/20">
                                {users.map((user) => (
                                    <tr key={user.id} className="group hover:bg-zinc-900/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                                                    {user.email.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-zinc-200">{user.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Shield className={`w-3.5 h-3.5 ${user.role === 'Admin' ? 'text-purple-400' : 'text-zinc-500'}`} />
                                                <span className="text-zinc-300">{user.role}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.status === 'Active' ? (
                                                <Badge className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20 px-2 py-0">
                                                    <UserCheck className="w-3 h-3 mr-1" /> Active
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-zinc-800 text-zinc-500 border-zinc-700 px-2 py-0">
                                                    <UserX className="w-3 h-3 mr-1" /> Revoked
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-zinc-500 font-mono text-[11px]">
                                            {user.lastLogin}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
                                                Manage
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Audit Log Card */}
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle className="text-lg flex items-center gap-2 text-white font-medium">
                        <History className="w-5 h-5 text-purple-400" /> System Audit Trail
                    </CardTitle>
                    <div className="flex items-center gap-3">
                        <div className="relative w-64 hidden md:block">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                            <Input placeholder="Search logs..." className="h-8 pl-8 bg-zinc-950 border-zinc-800 text-xs text-zinc-300" />
                        </div>
                        <Button variant="outline" size="sm" onClick={handleRefreshAudit} disabled={auditRefreshing} className="border-zinc-700 text-zinc-400 hover:text-white">
                            <RefreshCw className={`w-4 h-4 mr-2 ${auditRefreshing ? 'animate-spin' : ''}`} />
                            Refresh Trails
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0 border-t border-zinc-800">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-zinc-950 text-zinc-500 text-[11px] uppercase tracking-wider border-b border-zinc-800">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Timestamp</th>
                                    <th className="px-6 py-4 font-medium">Identity</th>
                                    <th className="px-6 py-4 font-medium">Operation</th>
                                    <th className="px-6 py-4 font-medium">Resource Payload</th>
                                    <th className="px-6 py-4 font-medium">Source IP</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800 bg-zinc-950/20 font-mono text-[11px]">
                                {MOCK_AUDIT.map((log) => (
                                    <tr key={log.id} className="hover:bg-zinc-900/50 transition-colors">
                                        <td className="px-6 py-4 text-zinc-400">{log.timestamp}</td>
                                        <td className="px-6 py-4 text-blue-400/80">{log.user}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-200">{log.resource}</td>
                                        <td className="px-6 py-4 text-zinc-500">{log.ip}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
                <CardFooter className="py-3 border-t border-zinc-800/50 justify-center">
                    <Button variant="link" className="text-zinc-500 text-xs hover:text-blue-400">View Full Sovereign Audit History</Button>
                </CardFooter>
            </Card>

            {/* Requirements Alert */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-4 items-start">
                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <h4 className="text-blue-500 font-semibold text-sm">Security Policy Enforcement</h4>
                    <p className="text-xs text-blue-400/80 leading-relaxed">
                        Default password policy requires <strong>minimum 8 characters</strong>, including <strong>uppercase</strong>, <strong>lowercase</strong>, and <strong>numerical</strong> tokens.
                        Multi-Factor Authentication (2FA) is automatically mandated for all Admin-level identities.
                    </p>
                </div>
            </div>
        </div>
    );
}
