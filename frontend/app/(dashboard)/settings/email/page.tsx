"use client";

import React, { useState, useEffect } from "react";
import { 
    Mail, 
    Shield, 
    Save, 
    Server, 
    Globe, 
    Lock, 
    CheckCircle2, 
    AlertCircle, 
    Send, 
    Zap, 
    X, 
    Plus, 
    Trash2, 
    Activity,
    ChevronRight,
    ArrowUp,
    ArrowDown,
    RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function EmailSettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [isHeartbeating, setIsHeartbeating] = useState(false);
    const [showTestModal, setShowTestModal] = useState(false);
    const [testRecipient, setTestRecipient] = useState("");
    
    const [configs, setConfigs] = useState<any[]>([]);
    const [editingConfig, setEditingConfig] = useState<any>(null);

    const emptyConfig = {
        enableService: true,
        provider: "SMTP",
        smtpHost: "",
        smtpPort: 587,
        username: "",
        password: "",
        useTls: true,
        fromEmail: "",
        fromName: "Global Access AI",
        replyToEmail: "",
        priority: 1
    };

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/settings/email");
            const data = await res.json();
            if (data && !data.error) {
                setConfigs(data);
                if (data.length > 0 && !editingConfig) {
                    setEditingConfig({ ...data[0], password: "" });
                }
            }
        } catch (error) {
            console.error("Failed to fetch email configs:", error);
            toast.error("Failed to load email configurations");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingConfig) return;

        setIsSaving(true);
        try {
            const res = await fetch("/api/settings/email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editingConfig)
            });
            
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            
            toast.success("Configuration saved successfully");
            fetchConfigs();
        } catch (error: any) {
            toast.error(error.message || "Failed to save configuration");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this provider configuration?")) return;
        
        try {
            const res = await fetch(`/api/settings/email?id=${id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            
            toast.success("Provider deleted");
            if (editingConfig?.id === id) setEditingConfig(null);
            fetchConfigs();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete provider");
        }
    };

    const handleHeartbeat = async () => {
        setIsHeartbeating(true);
        const toastId = toast.loading("Executing global health check...");
        try {
            const res = await fetch("/api/settings/email/heartbeat", { method: "POST" });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            
            toast.success("Health check completed", { id: toastId });
            fetchConfigs();
        } catch (error: any) {
            toast.error(`Heartbeat Failed: ${error.message}`, { id: toastId });
        } finally {
            setIsHeartbeating(false);
        }
    };

    const handleTestEmail = async () => {
        if (!testRecipient) {
            toast.error("Please enter a recipient email");
            return;
        }

        setIsTesting(true);
        const toastId = toast.loading("Executing test protocol...");

        try {
            const res = await fetch("/api/settings/email/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ recipientEmail: testRecipient })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Test failed");

            toast.success("Test email sent successfully", { id: toastId });
            setShowTestModal(false);
            setTestRecipient("");
        } catch (error: any) {
            toast.error(`Protocol Failed: ${error.message}`, { 
                id: toastId,
                duration: 5000 
            });
        } finally {
            setIsTesting(false);
        }
    };

    if (isLoading && configs.length === 0) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin" />
                    <p className="text-zinc-500 text-sm animate-pulse">Loading system architecture...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto relative">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Email & Notifications</h1>
                    <p className="text-zinc-400 text-sm">Configure your outbound delivery engine and priority-based failover.</p>
                </div>
                <div className="flex gap-3">
                    <Button 
                        variant="outline" 
                        onClick={handleHeartbeat}
                        disabled={isHeartbeating}
                        className="bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-emerald-500 h-10 px-4 rounded-xl"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isHeartbeating ? 'animate-spin' : ''}`} />
                        {isHeartbeating ? "Checking..." : "Verify Health"}
                    </Button>
                    <Button 
                        onClick={() => setEditingConfig({ ...emptyConfig })}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-10 px-4 rounded-xl shadow-lg"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Provider
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side: Provider List */}
                <div className="space-y-4">
                    <div className="bg-zinc-950/40 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
                        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6">Distribution Nodes</h2>
                        <div className="space-y-3">
                            {configs.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => setEditingConfig({ ...c, password: "" })}
                                    className={`w-full group text-left p-4 rounded-xl border transition-all relative ${
                                        editingConfig?.id === c.id 
                                        ? "bg-emerald-500/5 border-emerald-500/40 ring-1 ring-emerald-500/20" 
                                        : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700"
                                    }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${
                                                c.healthStatus === 'HEALTHY' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'
                                            }`} />
                                            <span className="text-sm font-bold text-zinc-200">{c.provider}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase">P{c.priority}</span>
                                            {editingConfig?.id === c.id && (
                                                <ChevronRight className="w-4 h-4 text-emerald-500" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-[11px] text-zinc-500 truncate mb-1">{c.smtpHost || c.provider}</div>
                                    <div className="flex items-center justify-between text-[9px] font-mono text-zinc-600 uppercase">
                                        <span>Status: {c.healthStatus}</span>
                                        <span className="group-hover:text-zinc-400">
                                            {c.lastCheckedAt ? new Date(c.lastCheckedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never Check'}
                                        </span>
                                    </div>
                                    
                                    {configs.length > 1 && (
                                        <div onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }} className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110">
                                            <X className="w-3 h-3" />
                                        </div>
                                    )}
                                </button>
                            ))}
                            {configs.length === 0 && (
                                <div className="p-8 text-center border border-dashed border-zinc-800 rounded-xl">
                                    <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest">No nodes active</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Operational Protocols */}
                    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
                        <h3 className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                            <Shield className="w-4 h-4 text-emerald-400" />
                            Reliability Protocol
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex gap-3">
                                <Zap className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">Automatic failover triggers after 10s of connection latency.</p>
                            </li>
                            <li className="flex gap-3">
                                <Activity className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">Heartbeat engine verifies provider endpoints every 15 minutes.</p>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Right Side: Configuration Form */}
                <div className="lg:col-span-2 space-y-6">
                    {editingConfig ? (
                        <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/5 blur-[100px] pointer-events-none" />
                            
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                                        <Server className="w-5 h-5 text-zinc-300" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">Node Properties</h2>
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Configure Distribution Parameters</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 bg-zinc-950/40 p-1.5 px-3 rounded-full border border-zinc-800/50">
                                    <Label htmlFor="node-toggle" className="text-[11px] font-bold text-zinc-500 cursor-pointer">
                                        {editingConfig.enableService ? "Node Online" : "Node Standby"}
                                    </Label>
                                    <Switch
                                        id="node-toggle"
                                        checked={editingConfig.enableService}
                                        onCheckedChange={(checked) => setEditingConfig({ ...editingConfig, enableService: checked })}
                                        className="data-[state=checked]:bg-emerald-500"
                                    />
                                </div>
                            </div>

                            <form onSubmit={handleSave} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Active Engine</Label>
                                        <Select
                                            value={editingConfig.provider}
                                            onValueChange={(val) => setEditingConfig({ ...editingConfig, provider: val })}
                                        >
                                            <SelectTrigger className="bg-zinc-950/50 border-zinc-800 h-11 text-zinc-300">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                                                <SelectItem value="SMTP">Standard SMTP</SelectItem>
                                                <SelectItem value="AWS_SES">AWS SES Protocol</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Failover Priority</Label>
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1">
                                                <Input 
                                                    type="number" 
                                                    min="1" 
                                                    max="10" 
                                                    value={editingConfig.priority}
                                                    onChange={(e) => setEditingConfig({ ...editingConfig, priority: parseInt(e.target.value) })}
                                                    className="bg-zinc-950/30 border-zinc-800 h-11"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <Button size="icon" variant="ghost" className="h-5 w-5 hover:text-emerald-500" onClick={() => setEditingConfig({ ...editingConfig, priority: Math.max(1, editingConfig.priority - 1) })}>
                                                    <ArrowUp className="w-3 h-3" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-5 w-5 hover:text-emerald-500" onClick={() => setEditingConfig({ ...editingConfig, priority: editingConfig.priority + 1 })}>
                                                    <ArrowDown className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-zinc-800/50">
                                    {editingConfig.provider === "SMTP" ? (
                                        <>
                                            <div className="space-y-2">
                                                <Label className="text-[11px] text-zinc-500">SMTP Endpoint</Label>
                                                <Input
                                                    placeholder="smtp.provider.com"
                                                    value={editingConfig.smtpHost}
                                                    onChange={(e) => setEditingConfig({ ...editingConfig, smtpHost: e.target.value })}
                                                    className="bg-zinc-950/30 border-zinc-800 h-11"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[11px] text-zinc-500">Security Port</Label>
                                                <Input
                                                    type="number"
                                                    value={editingConfig.smtpPort}
                                                    onChange={(e) => setEditingConfig({ ...editingConfig, smtpPort: parseInt(e.target.value) })}
                                                    className="bg-zinc-950/30 border-zinc-800 h-11"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[11px] text-zinc-500">Access Identity (User)</Label>
                                                <Input
                                                    value={editingConfig.username}
                                                    onChange={(e) => setEditingConfig({ ...editingConfig, username: e.target.value })}
                                                    className="bg-zinc-950/30 border-zinc-800 h-11"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[11px] text-zinc-500">Access Token (Password)</Label>
                                                <Input
                                                    type="password"
                                                    placeholder="••••••••"
                                                    value={editingConfig.password}
                                                    onChange={(e) => setEditingConfig({ ...editingConfig, password: e.target.value })}
                                                    className="bg-zinc-950/30 border-zinc-800 h-11"
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="space-y-2">
                                                <Label className="text-[11px] text-zinc-500">AWS Access Key</Label>
                                                <Input
                                                    value={editingConfig.username}
                                                    onChange={(e) => setEditingConfig({ ...editingConfig, username: e.target.value })}
                                                    className="bg-zinc-950/30 border-zinc-800 h-11"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[11px] text-zinc-500">AWS Secret Access Token</Label>
                                                <Input
                                                    type="password"
                                                    placeholder="••••••••"
                                                    value={editingConfig.password}
                                                    onChange={(e) => setEditingConfig({ ...editingConfig, password: e.target.value })}
                                                    className="bg-zinc-950/30 border-zinc-800 h-11"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-zinc-800/50">
                                    <div className="space-y-2">
                                        <Label className="text-[11px] text-zinc-500">Official From Name</Label>
                                        <Input
                                            value={editingConfig.fromName}
                                            onChange={(e) => setEditingConfig({ ...editingConfig, fromName: e.target.value })}
                                            className="bg-zinc-950/30 border-zinc-800 h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[11px] text-zinc-500">Official From Email</Label>
                                        <Input
                                            value={editingConfig.fromEmail}
                                            onChange={(e) => setEditingConfig({ ...editingConfig, fromEmail: e.target.value })}
                                            className="bg-zinc-950/30 border-zinc-800 h-11"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 pt-8">
                                    <Button 
                                        type="submit"
                                        disabled={isSaving}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 px-8 rounded-xl transition-all shadow-xl hover:shadow-emerald-500/20 disabled:opacity-50"
                                    >
                                        <Save className={`w-4 h-4 mr-2 ${isSaving ? 'animate-spin' : ''}`} />
                                        {isSaving ? "Syncing..." : "Sync Node Properties"}
                                    </Button>
                                    
                                    <Button 
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowTestModal(true)}
                                        className="bg-zinc-800/50 hover:bg-zinc-800 border-zinc-700 text-zinc-300 font-bold h-12 px-6 rounded-xl transition-all flex items-center gap-2"
                                    >
                                        <Zap className="w-4 h-4" />
                                        Manual Test Fire
                                    </Button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="h-full min-h-[500px] border border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center p-8 bg-zinc-950/20">
                            <Server className="w-16 h-16 text-zinc-800 mb-6" />
                            <h3 className="text-lg font-bold text-zinc-400 mb-2">No Node Selected</h3>
                            <p className="text-zinc-600 text-sm mb-8 text-center max-w-xs">Select an existing distribution node from the left or add a new one to begin configuration.</p>
                            <Button 
                                onClick={() => setEditingConfig({ ...emptyConfig })}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 px-8 rounded-xl transition-all"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Initialize New Node
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Test Connection Modal */}
            {showTestModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl shadow-3xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                            <h3 className="text-white font-bold flex items-center gap-2 uppercase tracking-widest text-xs">
                                <Send className="w-4 h-4 text-emerald-500" />
                                Manual Test Protocol
                            </h3>
                            <button onClick={() => setShowTestModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-8 space-y-6">
                            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                                Execute an immediate test fire to verify the current node's distribution capability.
                            </p>
                            
                            <div className="space-y-2">
                                <Label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Target Recipient</Label>
                                <Input
                                    autoFocus
                                    placeholder="admin@example.com"
                                    value={testRecipient}
                                    onChange={(e) => setTestRecipient(e.target.value)}
                                    className="bg-zinc-950 border-zinc-800 h-12 focus:border-emerald-500/50 font-medium"
                                />
                            </div>

                            <div className="flex items-center gap-4 pt-4">
                                <Button 
                                    variant="ghost" 
                                    onClick={() => setShowTestModal(false)}
                                    className="flex-1 text-zinc-500 hover:text-white hover:bg-zinc-800 font-bold h-12"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    onClick={handleTestEmail}
                                    disabled={isTesting || !testRecipient}
                                    className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 rounded-xl shadow-lg disabled:opacity-50"
                                >
                                    {isTesting ? "Firing..." : "Execute Protocol"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
