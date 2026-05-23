"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SipTrunk, PhoneNumber } from "@/db/schema";
import { Phone } from "lucide-react";

interface AddNumberModalProps {
    isOpen: boolean;
    onClose: () => void;
    trunks: SipTrunk[];
    onSuccess: (newNumber: PhoneNumber) => void;
}

export default function AddNumberModal({ isOpen, onClose, trunks, onSuccess }: AddNumberModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        number: "",
        friendlyName: "",
        trunkId: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch("/api/telephony/numbers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create number");
            }

            const newNumber = await res.json();
            onSuccess(newNumber);
            setFormData({ number: "", friendlyName: "", trunkId: "" });
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
                        <Phone className="w-5 h-5 text-blue-400" />
                        Add Phone Number
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Register a DID to route into a sovereign trunk.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="number">Phone Number (DID)</Label>
                        <Input
                            id="number"
                            placeholder="+1234567890"
                            className="bg-slate-950 border-slate-800 font-mono"
                            value={formData.number}
                            onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                            required
                        />
                        <p className="text-xs text-slate-500">Must be E.164 format and unique.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="friendlyName">Friendly Name (Optional)</Label>
                        <Input
                            id="friendlyName"
                            placeholder="e.g. Main Office Line"
                            className="bg-slate-950 border-slate-800"
                            value={formData.friendlyName}
                            onChange={(e) => setFormData({ ...formData, friendlyName: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="trunk">Associate SIP Trunk</Label>
                        <select
                            id="trunk"
                            className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.trunkId}
                            onChange={(e) => setFormData({ ...formData, trunkId: e.target.value })}
                            required
                        >
                            <option value="" disabled>Select a trunk...</option>
                            {trunks.map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.name} ({t.type})
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500">The inbound trunk configuration to apply to this number.</p>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                            {isLoading ? "Saving..." : "Add Number"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
