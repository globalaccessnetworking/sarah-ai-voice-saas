"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneNumber, Agent } from "@/db/schema";
import { Route } from "lucide-react";

interface AssignRuleModalProps {
    isOpen: boolean;
    onClose: () => void;
    numbers: PhoneNumber[];
    agents: Agent[];
    onSuccess: (newRule: any) => void;
}

export default function AssignRuleModal({ isOpen, onClose, numbers, agents, onSuccess }: AssignRuleModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        phoneNumberId: "",
        agentId: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch("/api/telephony/rules", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create dispatch rule");
            }

            const newRule = await res.json();

            // Enrich with joined data for the UI
            const enrichedRule = {
                ...newRule,
                phoneNumber: numbers.find(n => n.id === newRule.phoneNumberId)?.number || newRule.phoneNumberId,
                agentName: agents.find(a => a.id === newRule.agentId)?.name || newRule.agentId
            };

            onSuccess(enrichedRule);
            setFormData({ name: "", phoneNumberId: "", agentId: "" });
            onClose();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-slate-200">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl text-white">
                        <Route className="w-5 h-5 text-purple-400" />
                        Assign Dispatch Rule
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Map an inbound phone number directly to an AI Agent.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Rule Name (Optional)</Label>
                        <Input
                            id="name"
                            placeholder="e.g. Sales Line Routing"
                            className="bg-slate-950 border-slate-800"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phoneNumberId">Phone Number (DID)</Label>
                        <select
                            id="phoneNumberId"
                            className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.phoneNumberId}
                            onChange={(e) => setFormData({ ...formData, phoneNumberId: e.target.value })}
                            required
                        >
                            <option value="" disabled>Select a number...</option>
                            {numbers.map(n => (
                                <option key={n.id} value={n.id}>
                                    {n.number} {n.friendlyName ? `(${n.friendlyName})` : ""}
                                </option>
                            ))}
                        </select>
                        {numbers.length === 0 && (
                            <p className="text-xs text-red-400">You must add a Phone Number first.</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="agentId">AI Agent to Answer</Label>
                        <select
                            id="agentId"
                            className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.agentId}
                            onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
                            required
                        >
                            <option value="" disabled>Select an agent...</option>
                            {agents.map(a => (
                                <option key={a.id} value={a.id}>
                                    {a.name} ({a.slug})
                                </option>
                            ))}
                        </select>
                        {agents.length === 0 && (
                            <p className="text-xs text-red-400">You must create an Agent first.</p>
                        )}
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={isLoading || numbers.length === 0 || agents.length === 0}>
                            {isLoading ? "Saving..." : "Save Rule"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
