"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
    PhoneCall, Bot, PhoneOutgoing, ShieldAlert, CheckCircle2, 
    ArrowLeft, Loader2, Sparkles, Plus, Trash2, HelpCircle 
} from "lucide-react";

interface Agent {
    id: string;
    name: string;
    slug: string;
    initialGreeting: string;
    systemPrompt: string;
    ttsProvider: string;
    ttsModel: string;
    ttsVoiceId: string | null;
    pipelineMode?: string;
}

interface SipTrunk {
    id: string;
    name: string;
    type: string;
    numbers: string[] | null;
}

interface LeadDataField {
    key: string;
    value: string;
}

function PreviewDialerContent() {
    const searchParams = useSearchParams();
    const campaignIdParam = searchParams.get("campaign_id");

    const [agents, setAgents] = useState<Agent[]>([]);
    const [trunks, setTrunks] = useState<SipTrunk[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Form fields
    const [selectedAgentId, setSelectedAgentId] = useState("");
    const [selectedTrunkId, setSelectedTrunkId] = useState("");
    const [selectedCallerId, setSelectedCallerId] = useState("");
    
    const [phone, setPhone] = useState("");
    const [leadName, setLeadName] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [openingMessage, setOpeningMessage] = useState("");
    const [callGoal, setCallGoal] = useState("Preview Click-to-Dial Test");
    const [script, setScript] = useState("");
    
    // Dynamic lead_data key-value pairs
    const [leadDataFields, setLeadDataFields] = useState<LeadDataField[]>([
        { key: "business_nature", value: "Managed IT Services" },
        { key: "pain_point", value: "cybersecurity support" }
    ]);

    // Status tracking
    const [submitting, setSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [statusType, setStatusType] = useState<"success" | "error" | "info" | "">("");
    const [previewCallId, setPreviewCallId] = useState("");

    // 1. Initial Data Fetch
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Agents
                const agentsRes = await fetch("/api/agents");
                const agentsData = await agentsRes.json();
                const agentsList = Array.isArray(agentsData) ? agentsData : (agentsData.agents || []);
                setAgents(agentsList);

                // Fetch Trunks
                const trunksRes = await fetch("/api/sip-trunks");
                const trunksData = await trunksRes.json();
                let trunksList = Array.isArray(trunksData) ? trunksData : (trunksData.trunks || []);
                // Filter to outbound or compatible trunks
                trunksList = trunksList.filter((t: any) => t.type === 'outbound' || t.type === 'both' || !t.type);
                setTrunks(trunksList);

                // Autofill if campaign_id is provided in URL
                if (campaignIdParam) {
                    const campaignRes = await fetch(`/api/campaigns/${campaignIdParam}`);
                    if (campaignRes.ok) {
                        const campaign = await campaignRes.json();
                        setSelectedAgentId(campaign.agentId || "");
                        setSelectedTrunkId(campaign.sipTrunkId || "");
                        setSelectedCallerId(campaign.callerId || "");
                        setOpeningMessage(campaign.openingMessage || "");
                        setCallGoal(campaign.callGoal || `Preview Campaign Test - ${campaign.name}`);
                        setScript(campaign.script || "");
                    }
                }
            } catch (error) {
                console.error("Error loading preview dialer data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [campaignIdParam]);

    // Selected helper hooks
    const selectedAgent = agents.find(a => a.id === selectedAgentId);
    const selectedTrunk = trunks.find(t => t.id === selectedTrunkId);

    // Auto pre-fill from Agent selection if not editing already
    useEffect(() => {
        if (selectedAgent && !openingMessage) {
            setOpeningMessage(selectedAgent.initialGreeting || "");
        }
        if (selectedAgent && !script) {
            setScript(selectedAgent.systemPrompt || "");
        }
    }, [selectedAgentId]);

    // Auto-select first outbound number when SIP Trunk changes
    useEffect(() => {
        if (selectedTrunk) {
            if (Array.isArray(selectedTrunk.numbers) && selectedTrunk.numbers.length > 0) {
                setSelectedCallerId(selectedTrunk.numbers[0]);
            } else {
                setSelectedCallerId(selectedTrunk.name);
            }
        } else {
            setSelectedCallerId("");
        }
    }, [selectedTrunkId]);

    // 2. Dynamic Key-Value Operations
    const addField = () => {
        setLeadDataFields([...leadDataFields, { key: "", value: "" }]);
    };

    const updateField = (index: number, fieldKey: "key" | "value", val: string) => {
        const updated = [...leadDataFields];
        updated[index][fieldKey] = val;
        setLeadDataFields(updated);
    };

    const removeField = (index: number) => {
        setLeadDataFields(leadDataFields.filter((_, i) => i !== index));
    };

    // 3. Template Parsing & Rendering
    const getRenderedMessage = () => {
        let text = openingMessage;
        if (!text) return "";

        // Standard prefilled fields
        text = text.replace(/\{\{name\}\}/gi, leadName || "[Lead Name]");
        text = text.replace(/\{\{company_name\}\}/gi, companyName || "[Company Name]");

        // Dynamic fields
        leadDataFields.forEach(f => {
            if (f.key.trim()) {
                const regex = new RegExp(`\\{\\{${f.key.trim()}\\}\\}`, "gi");
                text = text.replace(regex, f.value || `[${f.key}]`);
            }
        });

        return text;
    };

    // 4. Submission
    const handleDial = async () => {
        if (!selectedAgentId || !selectedTrunkId || !selectedCallerId || !phone || !openingMessage) return;

        setSubmitting(true);
        setStatusMessage("Queueing preview job...");
        setStatusType("info");
        setPreviewCallId("");

        try {
            // Build lead_data dict
            const leadDataObj: Record<string, string> = {};
            leadDataFields.forEach(f => {
                if (f.key.trim()) {
                    leadDataObj[f.key.trim()] = f.value;
                }
            });

            const payload = {
                agent_id: selectedAgentId,
                sip_trunk_id: selectedTrunkId,
                caller_id: selectedCallerId,
                phone,
                lead_name: leadName || "Valued Customer",
                company_name: companyName,
                opening_message: openingMessage,
                call_goal: callGoal,
                script,
                lead_data: leadDataObj
            };

            const res = await fetch("/api/telephony/preview-dial", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setStatusType("success");
                setStatusMessage(`Preview call enqueued successfully!`);
                setPreviewCallId(data.preview_call_id);
            } else {
                setStatusType("error");
                setStatusMessage(data.error || "Failed to trigger preview call");
            }
        } catch (err: any) {
            console.error(err);
            setStatusType("error");
            setStatusMessage(err.message || "Failed to trigger preview call");
        } finally {
            setSubmitting(false);
        }
    };

    const isFormValid = selectedAgentId && selectedTrunkId && selectedCallerId && phone && openingMessage;

    return (
        <div className="w-full h-full overflow-y-auto bg-zinc-950 p-8 md:p-10">
            <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
                
                {/* Navigation Back */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/telephony/campaigns" className="btn-secondary px-3 py-2 flex items-center gap-2">
                            <ArrowLeft size={16} />
                            <span>Campaigns</span>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                                <Sparkles className="h-6 w-6 text-blue-500" />
                                Preview Click-to-Dial
                            </h1>
                            <p className="text-zinc-400 text-sm">Instantly dial a single lead to verify prewarm, greetings, and barge-in.</p>
                        </div>
                    </div>
                </div>

                {statusType && (
                    <div className={`p-4 rounded-lg flex items-center gap-3 border ${
                        statusType === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                        statusType === "error" ? "bg-red-500/10 border-red-500/30 text-red-400" :
                        "bg-blue-500/10 border-blue-500/30 text-blue-400"
                    }`}>
                        {statusType === "success" ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />}
                        <div className="flex-1 text-sm font-medium">
                            {statusMessage}
                            {previewCallId && (
                                <div className="mt-1 text-xs opacity-80 font-mono">
                                    Call ID: {previewCallId} | Status: Dialing (Check PM2 logs for voice pipeline trace)
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Loading state */}
                {loading ? (
                    <div className="card p-12 flex flex-col items-center justify-center gap-4 min-h-[400px]">
                        <Loader2 className="animate-spin text-blue-500 h-8 w-8" />
                        <span className="text-zinc-400">Loading telephony configuration...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* LEFT COLUMN: TELEPHONY & ROUTING */}
                        <div className="lg:col-span-2 flex flex-col gap-6">
                            
                            {/* Card 1: Routing Configuration */}
                            <div className="card p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                                <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                                    <PhoneOutgoing size={18} className="text-blue-500" />
                                    Telephony & Trunk Setup
                                </h2>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    
                                    {/* Agent Selection */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white flex items-center gap-1.5">
                                            Voice Agent <span className="text-red-500">*</span>
                                        </label>
                                        <select 
                                            value={selectedAgentId} 
                                            onChange={(e) => setSelectedAgentId(e.target.value)}
                                            className="input-field w-full"
                                        >
                                            <option value="">Select AI Agent</option>
                                            {agents.map(a => (
                                                <option key={a.id} value={a.id}>{a.name} ({a.slug})</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* SIP Trunk Selection */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white">
                                            SIP Trunk <span className="text-red-500">*</span>
                                        </label>
                                        <select 
                                            value={selectedTrunkId} 
                                            onChange={(e) => setSelectedTrunkId(e.target.value)}
                                            className="input-field w-full"
                                        >
                                            <option value="">Select Carrier Trunk</option>
                                            {trunks.map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Caller ID */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white">
                                            Caller ID <span className="text-red-500">*</span>
                                        </label>
                                        <input 
                                            type="text" 
                                            value={selectedCallerId}
                                            onChange={(e) => setSelectedCallerId(e.target.value)}
                                            placeholder="Trunk Number / Identity"
                                            className="input-field w-full"
                                        />
                                    </div>

                                </div>

                                {/* Active Agent TTS Config Box */}
                                {selectedAgent && (
                                    <div className="mt-4 p-3 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2 text-zinc-400">
                                            <Bot size={14} className="text-blue-500" />
                                            <span>Active TTS Engine:</span>
                                            <span className="text-white font-medium capitalize">{selectedAgent.ttsProvider}</span>
                                            <span className="text-zinc-600">|</span>
                                            <span>Model:</span>
                                            <span className="text-white font-mono">{selectedAgent.ttsModel}</span>
                                        </div>
                                        <div className="text-zinc-500 font-mono">
                                            Voice: {selectedAgent.ttsVoiceId || "Default"}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Card 2: Lead Context Info */}
                            <div className="card p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                                <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                                    <Bot size={18} className="text-blue-500" />
                                    Lead Information & Variable Context
                                </h2>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    
                                    {/* Lead Phone */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white">
                                            Lead Phone Number <span className="text-red-500">*</span>
                                        </label>
                                        <input 
                                            type="text" 
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="e.g. +923312229050"
                                            className="input-field w-full"
                                        />
                                    </div>

                                    {/* Lead Name */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white">
                                            Lead Name <span className="text-zinc-500">(name)</span>
                                        </label>
                                        <input 
                                            type="text" 
                                            value={leadName}
                                            onChange={(e) => setLeadName(e.target.value)}
                                            placeholder="e.g. Hamza Noor"
                                            className="input-field w-full"
                                        />
                                    </div>

                                    {/* Company Name */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white">
                                            Company Name <span className="text-zinc-500">(company_name)</span>
                                        </label>
                                        <input 
                                            type="text" 
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            placeholder="e.g. Global Access"
                                            className="input-field w-full"
                                        />
                                    </div>

                                </div>

                                {/* Dynamic Variable Editor */}
                                <div className="mt-6 border-t border-zinc-800 pt-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                            Dynamic lead_data Fields
                                            <span title="Key-value variables injected into Mustache template and system prompt context" className="cursor-help">
                                                <HelpCircle size={12} className="text-zinc-500" />
                                            </span>
                                        </h3>
                                        <button 
                                            onClick={addField}
                                            className="btn-secondary px-2.5 py-1 text-xs flex items-center gap-1 bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                                        >
                                            <Plus size={12} />
                                            <span>Add Field</span>
                                        </button>
                                    </div>

                                    {leadDataFields.length === 0 ? (
                                        <div className="text-center py-4 bg-zinc-950 border border-dashed border-zinc-800 rounded-lg text-xs text-zinc-500">
                                            No custom lead fields added yet. Add some to support personalization!
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {leadDataFields.map((field, idx) => (
                                                <div key={idx} className="flex items-center gap-2 bg-zinc-950/50 p-2 border border-zinc-800 rounded-lg">
                                                    <input 
                                                        type="text" 
                                                        value={field.key}
                                                        onChange={(e) => updateField(idx, "key", e.target.value)}
                                                        placeholder="Field key (e.g. designation)"
                                                        className="input-field w-[40%] text-xs font-mono"
                                                    />
                                                    <span className="text-zinc-600 font-mono">:</span>
                                                    <input 
                                                        type="text" 
                                                        value={field.value}
                                                        onChange={(e) => updateField(idx, "value", e.target.value)}
                                                        placeholder="Value"
                                                        className="input-field flex-1 text-xs"
                                                    />
                                                    <button 
                                                        onClick={() => removeField(idx)}
                                                        className="text-zinc-500 hover:text-red-400 p-1.5 hover:bg-zinc-800 rounded transition-colors"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Card 3: Conversation Setup */}
                            <div className="card p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                                <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                                    <Sparkles size={18} className="text-blue-500" />
                                    Opening Greeting & Script
                                </h2>
                                
                                <div className="space-y-6">
                                    
                                    {/* Opening Message */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white flex justify-between">
                                            <span>Opening Greeting Message <span className="text-red-500">*</span></span>
                                            <span className="text-xs text-zinc-500">Supports mustache e.g. {"{{company_name}}"}</span>
                                        </label>
                                        <textarea 
                                            rows={3}
                                            value={openingMessage}
                                            onChange={(e) => setOpeningMessage(e.target.value)}
                                            placeholder="Hi {{name}}, this is the AI assistant calling..."
                                            className="input-field w-full font-sans text-sm resize-none"
                                        />
                                    </div>

                                    {/* Call Goal */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white">Call Goal / Objective</label>
                                        <input 
                                            type="text"
                                            value={callGoal}
                                            onChange={(e) => setCallGoal(e.target.value)}
                                            placeholder="e.g. Schedule health assessment appointment"
                                            className="input-field w-full text-sm"
                                        />
                                    </div>

                                    {/* Agent Script / Prompt Instructions */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white">Agent Script Instructions</label>
                                        <textarea 
                                            rows={6}
                                            value={script}
                                            onChange={(e) => setScript(e.target.value)}
                                            placeholder="System guidelines, questions to ask, objection handling, scheduling rules..."
                                            className="input-field w-full font-mono text-xs resize-none"
                                        />
                                    </div>

                                </div>
                            </div>

                        </div>

                        {/* RIGHT COLUMN: ACTION PANEL & LIVE RENDERING PREVIEW */}
                        <div className="flex flex-col gap-6">
                            
                            {/* Panel: Live Greeting Preview */}
                            <div className="card p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                                <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
                                    <Sparkles size={18} className="text-emerald-500" />
                                    Personalization Engine
                                </h2>
                                <p className="text-xs text-zinc-400 mb-4">Real-time greeting rendering compiled with mustache context.</p>

                                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col gap-3">
                                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                                        <span>Rendered Greeting Preview</span>
                                        <span className="text-emerald-500">Live Compile</span>
                                    </div>
                                    <p className="text-sm text-zinc-100 italic leading-relaxed">
                                        {getRenderedMessage() ? `"${getRenderedMessage()}"` : <span className="text-zinc-600">Enter an opening greeting message to preview compilation...</span>}
                                    </p>
                                </div>

                                <div className="mt-4 p-3 bg-blue-950/20 border border-blue-900/30 rounded-lg text-xs text-zinc-400 flex flex-col gap-1">
                                    <span className="font-semibold text-blue-400 flex items-center gap-1">
                                        <HelpCircle size={12} />
                                        Personalization Hierarchy:
                                    </span>
                                    <span>Mustache replacements are compiled on the prewarm queue *before* the call starts so that binary-perfect cached greeting PCM waves are generated. All custom keys are fully supported.</span>
                                </div>
                            </div>

                            {/* Panel: Execution Action */}
                            <div className="card p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col gap-4">
                                <h2 className="text-base font-semibold text-white">Call Execution</h2>
                                <p className="text-xs text-zinc-400">Preview dialing routes the call through the outbound Redis queue using the high-performance prewarm cache and answer gate architecture.</p>

                                <button 
                                    onClick={handleDial}
                                    disabled={!isFormValid || submitting}
                                    className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all text-sm ${
                                        isFormValid && !submitting 
                                        ? "bg-blue-600 text-white hover:bg-blue-500 cursor-pointer shadow-lg shadow-blue-500/20" 
                                        : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50"
                                    }`}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>Enqueuing call...</span>
                                        </>
                                    ) : (
                                        <>
                                            <PhoneCall size={16} />
                                            <span>Call Now (Preview Test)</span>
                                        </>
                                    )}
                                </button>

                                <div className="flex flex-col gap-1.5 text-xs border-t border-zinc-800 pt-4 mt-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-zinc-500">Pipeline Mode:</span>
                                        <span className="text-zinc-300 font-semibold uppercase">{selectedAgent?.pipelineMode || "standard"}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-zinc-500">Cached Greeting:</span>
                                        <span className="text-zinc-300 font-semibold">Enabled (PCM)</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-zinc-500">Answer Gate Polling:</span>
                                        <span className="text-zinc-300 font-semibold">Enabled</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-zinc-500">Record Campaign Stats:</span>
                                        <span className="text-zinc-500 font-semibold line-through">Disabled</span>
                                    </div>
                                </div>
                            </div>

                        </div>

                    </div>
                )}

            </div>
        </div>
    );
}

export default function PreviewDialerPage() {
    return (
        <Suspense fallback={
            <div className="w-full h-full bg-zinc-950 p-8 flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="animate-spin text-blue-500 h-8 w-8" />
                <span className="text-zinc-500 text-sm">Loading Preview Dialer...</span>
            </div>
        }>
            <PreviewDialerContent />
        </Suspense>
    );
}
