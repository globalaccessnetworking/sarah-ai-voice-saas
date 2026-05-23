"use client";
 
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tool } from "@/db/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 
interface CreateWebhookModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (tool: Tool) => void;
}
 
export default function CreateWebhookModal({ isOpen, onClose, onSuccess }: CreateWebhookModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState<"webhook" | "native" | "static">("webhook");
    const [endpointUrl, setEndpointUrl] = useState("");
    
    // Native properties
    const [nativeAction, setNativeAction] = useState<"transfer" | "hangup">("transfer");
    const [responseSpeech, setResponseSpeech] = useState("میں سمجھتی ہوں۔ میں آپ کی کال ایک نمائندے کو ٹرانسفر کر رہی ہوں۔");
 
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
 
        try {
            const body: any = {
                name,
                description,
                type,
            };
 
            if (type === "webhook") {
                body.endpointUrl = endpointUrl;
            } else if (type === "native") {
                body.parametersSchema = {
                    action: nativeAction,
                    speech: responseSpeech,
                };
            }
 
            const res = await fetch("/api/tools", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
 
            if (!res.ok) throw new Error("Failed to create tool");
 
            const newTool = await res.json();
            onSuccess(newTool);
 
            // Reset and close
            setName("");
            setDescription("");
            setEndpointUrl("");
            setType("webhook");
            onClose();
        } catch (error) {
            alert(`Error creating ${type} tool.`);
        } finally {
            setIsSubmitting(false);
        }
    };
 
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Agent Tool</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Define a capability that your AI Agents can trigger during a conversation.
                    </DialogDescription>
                </DialogHeader>
 
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Function Name <span className="text-red-500">*</span></Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., lookup_order"
                                className="bg-slate-950 border-slate-800 focus-visible:ring-blue-500"
                                required
                                pattern="[a-z_][a-z0-9_]*"
                                title="Lowercase letters, numbers, and underscores. Must start with a letter or underscore."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Tool Execution Type</Label>
                            <Select value={type} onValueChange={(val: any) => setType(val)}>
                                <SelectTrigger className="bg-slate-950 border-slate-800">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                    <SelectItem value="webhook">External Webhook</SelectItem>
                                    <SelectItem value="native">Native Telephony</SelectItem>
                                    <SelectItem value="static">Registry Tool (Static)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
 
                    <div className="space-y-2">
                        <Label htmlFor="description">AI Tool Description <span className="text-red-500">*</span></Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Instruct the AI when and how to use this tool."
                            className="bg-slate-950 border-slate-800 focus-visible:ring-blue-500 h-20"
                            required
                        />
                        <p className="text-[10px] text-slate-500">Crucial for LLM to understand when to invoke this tool.</p>
                    </div>
 
                    {type === "webhook" ? (
                        <div className="space-y-2 pt-2 border-t border-slate-800">
                            <Label htmlFor="url">Webhook URL <span className="text-red-500">*</span></Label>
                            <Input
                                id="url"
                                type="url"
                                value={endpointUrl}
                                onChange={(e) => setEndpointUrl(e.target.value)}
                                placeholder="https://api.yourdomain.com/webhook"
                                className="bg-slate-950 border-slate-800 focus-visible:ring-blue-500"
                                required={type === "webhook"}
                            />
                            <p className="text-[10px] text-slate-500">The API endpoint that will receive the JSON payload.</p>
                        </div>
                    ) : type === "native" ? (
                        <div className="space-y-4 pt-4 border-t border-slate-800 animate-in fade-in slide-in-from-top-2">
                            <div className="space-y-2">
                                <Label>Telephony Action</Label>
                                <Select value={nativeAction} onValueChange={(val: any) => {
                                    setNativeAction(val);
                                    if (val === "hangup") setResponseSpeech("پنجاب ہیلپ لائن پر رابطہ کرنے کا شکریہ۔ اللہ حافظ!");
                                    else setResponseSpeech("میں سمجھتی ہوں۔ میں آپ کی کال ایک نمائندے کو ٹرانسفر کر رہی ہوں۔");
                                }}>
                                    <SelectTrigger className="bg-slate-950 border-slate-800">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                        <SelectItem value="transfer">SIP Transfer (Ring Group 101)</SelectItem>
                                        <SelectItem value="hangup">End Call (Hangup)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="speech">Response Speech (AI Acknowledgment)</Label>
                                <Textarea
                                    id="speech"
                                    value={responseSpeech}
                                    onChange={(e) => setResponseSpeech(e.target.value)}
                                    placeholder="Enter Urdu or English speech phrase..."
                                    className="bg-slate-950 border-slate-800 focus-visible:ring-blue-500 h-24 font-mono text-xs"
                                    required={type === "native"}
                                />
                                <p className="text-[10px] text-slate-500 italic">This phrase will be spoken by Sarah immediately before the action executes.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 bg-blue-500/5 rounded-lg border border-blue-500/10 text-[11px] text-blue-400 space-y-2">
                            <p className="font-bold">Registry Tool Info:</p>
                            <p>This will bind to a built-in tool function in your Python backend (tools.py).</p>
                            <p>Common Names: <code className="text-white">submit_complaint</code>, <code className="text-white">mark_unresolved</code>, <code className="text-white">get_datetime</code>.</p>
                        </div>
                    )}
 
                    <DialogFooter className="pt-4 gap-2">
                        <Button type="button" variant="ghost" onClick={onClose} className="hover:bg-slate-800 text-slate-300">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 font-bold">
                            {isSubmitting ? "Creating..." : `Create ${type === 'native' ? 'Telephony' : 'Webhook'} Tool`}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
