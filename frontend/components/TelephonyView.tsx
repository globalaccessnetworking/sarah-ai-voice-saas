"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Route, Plus, Trash2, Settings, User, PhoneCall, Zap, Play } from "lucide-react";
import { PhoneNumber, SipTrunk, Agent } from "@/db/schema";
import AddNumberModal from "./AddNumberModal";
import AssignRuleModal from "./AssignRuleModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

interface TelephonyViewProps {
    initialNumbers: PhoneNumber[];
    initialRules: any[];
    trunks: SipTrunk[];
    agents: Agent[];
}

export default function TelephonyView({ initialNumbers, initialRules, trunks, agents }: TelephonyViewProps) {
    const [numbers, setNumbers] = useState<PhoneNumber[]>(initialNumbers);
    const [rules, setRules] = useState<any[]>(initialRules);

    const [isAddNumberOpen, setIsAddNumberOpen] = useState(false);
    const [isAssignRuleOpen, setIsAssignRuleOpen] = useState(false);

    // Dispatcher State
    const [targetPhone, setTargetPhone] = useState("");
    const [selectedAgentId, setSelectedAgentId] = useState("");
    const [selectedTrunkId, setSelectedTrunkId] = useState("");
    const [contactName, setContactName] = useState("");
    const [openingMessage, setOpeningMessage] = useState("");
    const [callGoal, setCallGoal] = useState("Test outbound AI call");
    const [isDialing, setIsDialing] = useState(false);

    const handleDeleteNumber = async (id: string) => {
        if (!confirm("Are you sure you want to delete this phone number? Any associated rules will also be deleted.")) return;

        try {
            const res = await fetch(`/api/telephony/numbers/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete number");

            setNumbers((prev) => prev.filter((n) => n.id !== id));
            setRules((prev) => prev.filter((r) => r.phoneNumberId !== id));
        } catch (error) {
            alert("Error deleting number.");
            console.error(error);
        }
    };

    const handleDeleteRule = async (id: string) => {
        if (!confirm("Are you sure you want to delete this dispatch rule?")) return;

        try {
            const res = await fetch(`/api/telephony/rules/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete rule");

            setRules((prev) => prev.filter((r) => r.id !== id));
        } catch (error) {
            alert("Error deleting rule.");
            console.error(error);
        }
    };

    const getTrunkName = (id: string) => trunks.find(t => t.id === id)?.name || id;

    const handleDial = async () => {
        if (!targetPhone || !selectedAgentId) {
            toast.error("Phone number and Agent are required.");
            return;
        }

        setIsDialing(true);
        try {
            const res = await fetch("/api/telephony/dial", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phoneNumber: targetPhone,
                    agentId: selectedAgentId,
                    trunkId: selectedTrunkId || undefined,
                    openingMessage: openingMessage || undefined,
                    callGoal: callGoal || undefined,
                    contactData: { Name: contactName || "Customer" }
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to Dial");

            toast.success(`Dialing ${targetPhone}...`, {
                description: `Room: ${data.roomName}`,
            });

            // Keep form mostly filled for easy re-testing, just clear the phone if you want
            // setTargetPhone("");
            // setContactName("");
        } catch (error: any) {
            toast.error("Dialing Failed", { description: error.message });
            console.error(error);
        } finally {
            setIsDialing(false);
        }
    };

    return (
        <div className="space-y-6">
            <Tabs defaultValue="numbers" className="w-full">
                <TabsList className="bg-slate-900 border border-slate-800">
                    <TabsTrigger value="numbers" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                        <Phone className="w-4 h-4 mr-2" />
                        Phone Numbers
                    </TabsTrigger>
                    <TabsTrigger value="rules" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                        <Route className="w-4 h-4 mr-2" />
                        Dispatch Rules
                    </TabsTrigger>
                    <TabsTrigger value="dispatcher" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                        <Zap className="w-4 h-4 mr-2" />
                        Outbound Dispatcher
                    </TabsTrigger>
                </TabsList>

                {/* --- Phone Numbers Tab --- */}
                <TabsContent value="numbers" className="mt-6">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-xl text-white flex items-center gap-2">
                                <Phone className="w-5 h-5 text-blue-400" />
                                Phone Number Inventory
                            </CardTitle>
                            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsAddNumberOpen(true)}>
                                <Plus className="w-4 h-4 mr-2" /> Add Number
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {numbers.length > 0 ? (
                                <div className="border border-slate-800 rounded-md overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-800">
                                            <tr>
                                                <th className="px-4 py-3 font-medium">Phone Number (DID)</th>
                                                <th className="px-4 py-3 font-medium">Friendly Name</th>
                                                <th className="px-4 py-3 font-medium">Associated Trunk</th>
                                                <th className="px-4 py-3 font-medium text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {numbers.map((n) => (
                                                <tr key={n.id} className="bg-slate-900 hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <span className="font-mono text-blue-400 bg-blue-400/10 px-2 py-1 rounded">
                                                            {n.number}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-300">{n.friendlyName || "-"}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2 text-slate-400">
                                                            <Settings className="w-3 h-3" />
                                                            {getTrunkName(n.trunkId)}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={() => handleDeleteNumber(n.id)}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12 border border-slate-800 border-dashed rounded-lg bg-slate-900/50">
                                    <Phone className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-slate-300">No Phone Numbers</h3>
                                    <p className="text-slate-500 mt-2 mb-4">Add your first DID to route inbound calls.</p>
                                    <Button onClick={() => setIsAddNumberOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                                        <Plus className="w-4 h-4 mr-2" /> Add Number
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- Dispatch Rules Tab --- */}
                <TabsContent value="rules" className="mt-6">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-xl text-white flex items-center gap-2">
                                <Route className="w-5 h-5 text-purple-400" />
                                Dispatch Rules
                            </CardTitle>
                            <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setIsAssignRuleOpen(true)}>
                                <Plus className="w-4 h-4 mr-2" /> Assign Rule
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {rules.length > 0 ? (
                                <div className="border border-slate-800 rounded-md overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-800">
                                            <tr>
                                                <th className="px-4 py-3 font-medium">Rule Name</th>
                                                <th className="px-4 py-3 font-medium">Phone Number (DID)</th>
                                                <th className="px-4 py-3 font-medium">Mapped Agent</th>
                                                <th className="px-4 py-3 font-medium text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {rules.map((r) => (
                                                <tr key={r.id} className="bg-slate-900 hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-4 py-3 font-medium text-slate-200">{r.name || "Unnamed Rule"}</td>
                                                    <td className="px-4 py-3">
                                                        <span className="font-mono text-blue-400 bg-blue-400/10 px-2 py-1 rounded">
                                                            {r.phoneNumber || r.phoneNumberId}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2 text-emerald-400">
                                                            <User className="w-4 h-4" />
                                                            {r.agentName || r.agentId}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={() => handleDeleteRule(r.id)}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12 border border-slate-800 border-dashed rounded-lg bg-slate-900/50">
                                    <Route className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-slate-300">No Dispatch Rules</h3>
                                    <p className="text-slate-500 mt-2 mb-4">Assign a Phone Number to an AI Agent to enable answering inbound calls.</p>
                                    <Button onClick={() => setIsAssignRuleOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                                        <Plus className="w-4 h-4 mr-2" /> Assign Rule
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- Outbound Dispatcher Tab --- */}
                <TabsContent value="dispatcher" className="mt-6">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader>
                            <CardTitle className="text-xl text-white flex items-center gap-2">
                                <PhoneCall className="w-5 h-5 text-emerald-400" />
                                Manual Outbound Dialing
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 max-w-2xl">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-slate-300">Target Phone Number</Label>
                                        <Input
                                            id="phone"
                                            placeholder="+1234567890"
                                            className="bg-slate-950 border-slate-800 text-white font-mono"
                                            value={targetPhone}
                                            onChange={(e) => setTargetPhone(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="agent" className="text-slate-300">Select AI Agent</Label>
                                        <Select value={selectedAgentId} onValueChange={(v) => setSelectedAgentId(v || "")}>
                                            <SelectTrigger id="agent" className="bg-slate-950 border-slate-800 text-white">
                                                <SelectValue placeholder="Select an agent" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                                {agents.map(agent => (
                                                    <SelectItem key={agent.id} value={agent.id}>
                                                        {agent.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="trunk" className="text-slate-300">SIP Trunk (Caller ID) - Optional</Label>
                                        <Select value={selectedTrunkId} onValueChange={(v) => setSelectedTrunkId(v || "")}>
                                            <SelectTrigger id="trunk" className="bg-slate-950 border-slate-800 text-white">
                                                <SelectValue placeholder="Default Trunk" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                                <SelectItem value="">Default Trunk</SelectItem>
                                                {trunks.map(t => (
                                                    <SelectItem key={t.id} value={t.id}>
                                                        {t.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-slate-300">Contact Name (Optional)</Label>
                                        <Input
                                            id="name"
                                            placeholder="John Doe"
                                            className="bg-slate-950 border-slate-800 text-white"
                                            value={contactName}
                                            onChange={(e) => setContactName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="goal" className="text-slate-300">Call Goal (Optional)</Label>
                                        <Input
                                            id="goal"
                                            placeholder="Test outbound AI call"
                                            className="bg-slate-950 border-slate-800 text-white"
                                            value={callGoal}
                                            onChange={(e) => setCallGoal(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="openingMsg" className="text-slate-300">Opening Message Override (Optional)</Label>
                                        <Textarea
                                            id="openingMsg"
                                            placeholder="Hi, this is a test call..."
                                            className="bg-slate-950 border-slate-800 text-white resize-none"
                                            rows={2}
                                            value={openingMessage}
                                            onChange={(e) => setOpeningMessage(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <Button
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-lg font-semibold shadow-lg shadow-emerald-900/20"
                                onClick={handleDial}
                                disabled={isDialing || !targetPhone || !selectedAgentId}
                            >
                                {isDialing ? (
                                    <>Dialing...</>
                                ) : (
                                    <>
                                        <Play className="w-5 h-5 mr-2 fill-current" />
                                        Start AI Call
                                    </>
                                )}
                            </Button>

                            <p className="text-xs text-slate-500 italic text-center">
                                Note: This will create a LiveKit room and trigger a SIP participant from your outbound
                                trunk to dial the target number. The agent will greet using the contact name if provided.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Modals */}
            <AddNumberModal
                isOpen={isAddNumberOpen}
                onClose={() => setIsAddNumberOpen(false)}
                trunks={trunks}
                onSuccess={(newNumber) => setNumbers(prev => [newNumber, ...prev])}
            />

            <AssignRuleModal
                isOpen={isAssignRuleOpen}
                onClose={() => setIsAssignRuleOpen(false)}
                numbers={numbers}
                agents={agents}
                onSuccess={(newRule) => setRules(prev => [newRule, ...prev])}
            />
        </div>
    );
}

