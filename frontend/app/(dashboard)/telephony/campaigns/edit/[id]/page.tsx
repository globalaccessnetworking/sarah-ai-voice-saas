"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, FileText, Loader2, CheckCircle2, ChevronRight, ChevronLeft, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function EditCampaignPage() {
    const router = useRouter();
    const { id } = useParams();
    
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState(1);
    const totalSteps = 3; // Setup, Agent, Dialing (Review is folded into right panel)

    // Data from APIs
    const [agents, setAgents] = useState<any[]>([]);
    const [trunks, setTrunks] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [fetchError, setFetchError] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        campaignType: "progressive", 
        agentId: "",
        openingMessage: "",
        callGoal: "",
        script: "",
        sipTrunkId: "",
        callerId: "",
        concurrency: 1,
        callDelaySeconds: 0,
        dialingMode: "progressive",
        retryAttempts: 3,
        retryDelaySeconds: 3600,
        timezone: "UTC",
        callingWindowStart: "09:00",
        callingWindowEnd: "18:00",
        daysOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        recordingEnabled: true,
        transcriptionEnabled: true,
        vicidialCampaignId: "",
        vicidialIngroup: "",
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Agents
                const agentsRes = await fetch("/api/agents");
                if (!agentsRes.ok) throw new Error("Failed to load agents");
                const agentsPayload = await agentsRes.json();
                let agentsList = Array.isArray(agentsPayload) ? agentsPayload : (agentsPayload.agents || agentsPayload.data || []);
                agentsList.sort((a: any, b: any) => {
                    if (a.status === 'running' && b.status !== 'running') return -1;
                    if (a.status !== 'running' && b.status === 'running') return 1;
                    return 0;
                });
                setAgents(agentsList);
                
                // Fetch Trunks
                const trunksRes = await fetch("/api/sip-trunks");
                if (!trunksRes.ok) throw new Error("Failed to load trunks");
                const trunksPayload = await trunksRes.json();
                let trunksList = Array.isArray(trunksPayload) ? trunksPayload : (trunksPayload.trunks || trunksPayload.data || []);
                trunksList = trunksList.filter((t: any) => t.type === 'outbound' || t.type === 'both' || !t.type);
                setTrunks(trunksList);

                // Fetch Campaign
                if (id) {
                    const campRes = await fetch(`/api/campaigns/${id}`);
                    if (!campRes.ok) throw new Error("Failed to load campaign");
                    const campData = await campRes.json();
                    setFormData({
                        name: campData.name || "",
                        description: campData.description || "",
                        campaignType: campData.campaignType || "progressive",
                        agentId: campData.agentId || "",
                        openingMessage: campData.openingMessage || "",
                        callGoal: campData.callGoal || "",
                        script: campData.script || "",
                        sipTrunkId: campData.sipTrunkId || "",
                        callerId: campData.callerId || "",
                        concurrency: campData.concurrency || 1,
                        callDelaySeconds: campData.callDelaySeconds || 0,
                        dialingMode: campData.dialingMode || "progressive",
                        retryAttempts: campData.retryAttempts || 3,
                        retryDelaySeconds: campData.retryDelaySeconds || 3600,
                        timezone: campData.timezone || "UTC",
                        callingWindowStart: campData.callingWindowStart || "09:00",
                        callingWindowEnd: campData.callingWindowEnd || "18:00",
                        daysOfWeek: campData.daysOfWeek || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                        recordingEnabled: campData.recordingEnabled !== undefined ? campData.recordingEnabled : true,
                        transcriptionEnabled: campData.transcriptionEnabled !== undefined ? campData.transcriptionEnabled : true,
                        vicidialCampaignId: campData.vicidialCampaignId || "",
                        vicidialIngroup: campData.vicidialIngroup || "",
                    });
                }
            } catch (error: any) {
                console.error("Error fetching data:", error);
                setFetchError(error.message || "Failed to load data.");
            } finally {
                setLoadingData(false);
            }
        };
        fetchData();
    }, [id]);

    const selectedAgent = agents.find(a => a.id === formData.agentId);
    const selectedTrunk = trunks.find(t => t.id === formData.sipTrunkId);
    
    let availableCallerIds: string[] = [];
    if (selectedTrunk && selectedTrunk.numbers) {
        let rawNumbers = selectedTrunk.numbers;
        if (typeof rawNumbers === 'string') {
            try { rawNumbers = JSON.parse(rawNumbers); } catch { rawNumbers = rawNumbers.split(','); }
        }
        if (Array.isArray(rawNumbers)) {
            availableCallerIds = rawNumbers.map((n: any) => typeof n === 'string' ? n : n.number).filter(Boolean);
        }
    }

    const handleNextStep = () => {
        if (step === 1 && !formData.name.trim()) return alert("Campaign Name is required.");
        if (step === 2 && !formData.agentId) return alert("Please select a Voice Agent.");
        if (step === 3 && formData.campaignType !== 'vicidial') {
            if (!formData.sipTrunkId) return alert("Please select an Outbound Trunk.");
            if (availableCallerIds.length > 0 && !formData.callerId) return alert("Please select a Caller ID.");
        }
        setStep(s => Math.min(totalSteps, s + 1));
    };

    const prevStep = () => setStep(s => Math.max(1, s - 1));

    const handleSave = async () => {
        if (!formData.name) return alert("Campaign Name is required.");

        setSaving(true);
        try {
            const res = await fetch(`/api/campaigns/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                router.push("/telephony/campaigns");
            } else {
                const err = await res.json();
                alert(`Failed to update campaign: ${err.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Error updating campaign:", error);
            alert("Error updating campaign.");
        } finally {
            setSaving(false);
        }
    };

    const renderStepIndicator = () => {
        const steps = ["Setup", "Agent", "Dialing"];
        return (
            <div className="flex items-center justify-between mb-8 relative w-full">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-zinc-800 -z-10 rounded-full"></div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-500 -z-10 rounded-full transition-all duration-300" style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}></div>
                
                {steps.map((label, idx) => {
                    const stepNum = idx + 1;
                    const isActive = step === stepNum;
                    const isPassed = step > stepNum;
                    return (
                        <div key={label} className="flex flex-col items-center gap-2 bg-[#09090b] px-2" onClick={() => stepNum < step && setStep(stepNum)} style={{ cursor: stepNum < step ? 'pointer' : 'default' }}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors ${
                                isActive ? "bg-blue-500 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]" : 
                                isPassed ? "bg-blue-500/20 border-blue-500 text-blue-400" : 
                                "bg-zinc-900 border-zinc-700 text-zinc-500"
                            }`}>
                                {isPassed ? <CheckCircle2 size={16} /> : stepNum}
                            </div>
                            <span className={`text-xs font-medium ${isActive ? "text-white" : isPassed ? "text-zinc-300" : "text-zinc-500"}`}>
                                {label}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

    if (loadingData) {
        return <div className="flex items-center justify-center h-[50vh]"><Loader2 className="animate-spin text-zinc-500" /></div>;
    }

    if (fetchError) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-red-400 gap-4">
                <AlertCircle size={48} className="opacity-50" />
                <p>{fetchError}</p>
                <button onClick={() => window.location.reload()} className="btn-secondary">Retry</button>
            </div>
        );
    }

    return (
        <div className="w-full mx-auto p-8 flex flex-col gap-6 max-w-[1400px]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/telephony/campaigns" className="btn-secondary px-3">
                        <ArrowLeft size={16} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Edit Campaign</h1>
                        <p className="text-zinc-400 text-sm">Update your outbound dialer workflow</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {step === totalSteps && (
                        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Content Area */}
                <div className="flex-1 flex flex-col gap-6">
                    {renderStepIndicator()}

                    <div className="card p-8 min-h-[500px]">
                        {/* STEP 1: SETUP */}
                        {step === 1 && (
                            <div className="flex flex-col gap-6 max-w-2xl">
                                <div>
                                    <h2 className="text-lg font-semibold text-white mb-1">Campaign Setup</h2>
                                    <p className="text-sm text-zinc-400 mb-6">Basic details and campaign mode.</p>
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white">Campaign Name <span className="text-red-500">*</span></label>
                                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Q3 Healthcare Outreach" className="input-field w-full" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white">Description (Optional)</label>
                                    <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe the goal of this campaign..." className="input-field w-full h-24" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white">Campaign Type</label>
                                    <select value={formData.campaignType} onChange={(e) => setFormData({ ...formData, campaignType: e.target.value })} className="input-field w-full">
                                        <option value="progressive">AI Native Progressive (Auto-Dialer)</option>
                                        <option value="preview">AI Native Preview (Manual Click-to-Dial)</option>
                                        <option value="vicidial">ViciDial Predictive Mapping</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: VOICE AGENT */}
                        {step === 2 && (
                            <div className="flex flex-col gap-6 max-w-2xl">
                                <div>
                                    <h2 className="text-lg font-semibold text-white mb-1">Voice Agent & Script</h2>
                                    <p className="text-sm text-zinc-400 mb-6">Select the AI agent and configure what it should say.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white">Select Voice Agent <span className="text-red-500">*</span></label>
                                    <select value={formData.agentId} onChange={(e) => setFormData({ ...formData, agentId: e.target.value })} className="input-field w-full">
                                        <option value="">-- Choose an Agent --</option>
                                        {agents.map(a => (
                                            <option key={a.id} value={a.id} disabled={a.status !== 'running'}>
                                                {a.name} ({a.slug}) {a.status !== 'running' ? `[${a.status.toUpperCase()}]` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {agents.length === 0 && <p className="text-xs text-red-400 mt-1">No agents found. Please create one first.</p>}
                                </div>

                                {selectedAgent && (
                                    <div className="p-4 bg-zinc-900 rounded border border-zinc-800 flex flex-col gap-2 text-sm text-zinc-300">
                                        <div className="flex justify-between border-b border-zinc-800 pb-2">
                                            <span className="text-zinc-500">Provider Stack</span>
                                            <span className="font-medium">{selectedAgent.llmProvider} / {selectedAgent.ttsProvider} / {selectedAgent.sttProvider}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-zinc-800 pb-2">
                                            <span className="text-zinc-500">Language</span>
                                            <span className="font-medium">{selectedAgent.language || 'English'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500">Status</span>
                                            <span className="text-green-400 font-medium">Ready</span>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white">Opening Message <span className="text-zinc-500 font-normal text-xs">(Recommended)</span></label>
                                    <p className="text-xs text-zinc-400 mb-2">The deterministic greeting spoken as soon as the call connects. Use {'{{name}}'} as a variable.</p>
                                    <textarea value={formData.openingMessage} onChange={(e) => setFormData({ ...formData, openingMessage: e.target.value })} placeholder="Hi, is this {{name}}? I'm calling from..." className="input-field w-full h-20" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white">Campaign Objective / Call Goal</label>
                                    <p className="text-xs text-zinc-400 mb-2">Context injected into the agent prompt specific to this campaign run.</p>
                                    <textarea value={formData.callGoal} onChange={(e) => setFormData({ ...formData, callGoal: e.target.value })} placeholder="Your goal is to book a follow-up meeting..." className="input-field w-full h-20" />
                                </div>
                            </div>
                        )}

                        {/* STEP 3: CALLING & DIALING */}
                        {step === 3 && formData.campaignType !== 'vicidial' && (
                            <div className="flex flex-col gap-6 max-w-2xl">
                                <div>
                                    <h2 className="text-lg font-semibold text-white mb-1">Calling & Dialing</h2>
                                    <p className="text-sm text-zinc-400 mb-6">Trunk selection and concurrency settings.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white">Outbound Trunk <span className="text-red-500">*</span></label>
                                        <select value={formData.sipTrunkId} onChange={(e) => setFormData({ ...formData, sipTrunkId: e.target.value })} className="input-field w-full">
                                            <option value="">-- Choose a Trunk --</option>
                                            {trunks.map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                        {trunks.length === 0 && <p className="text-xs text-red-400 mt-1">No outbound trunks found.</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white">Caller ID</label>
                                        <select value={formData.callerId} onChange={(e) => setFormData({ ...formData, callerId: e.target.value })} className="input-field w-full" disabled={!formData.sipTrunkId || availableCallerIds.length === 0}>
                                            <option value="">-- Choose Caller ID --</option>
                                            {availableCallerIds.map((num: string, i: number) => (
                                                <option key={i} value={num}>{num}</option>
                                            ))}
                                        </select>
                                        {formData.sipTrunkId && availableCallerIds.length === 0 && (
                                            <p className="text-xs text-amber-500 mt-1">No numbers attached to this trunk.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-6 pt-4 border-t border-zinc-800/50">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white">Max Concurrency</label>
                                        <p className="text-xs text-zinc-400 mb-2">Number of simultaneous calls</p>
                                        <input type="number" min="1" max="100" value={formData.concurrency} onChange={(e) => setFormData({ ...formData, concurrency: parseInt(e.target.value) || 1 })} className="input-field w-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white">Retry Attempts</label>
                                        <p className="text-xs text-zinc-400 mb-2">If busy, no answer, or failed</p>
                                        <input type="number" min="0" value={formData.retryAttempts} onChange={(e) => setFormData({ ...formData, retryAttempts: parseInt(e.target.value) || 0 })} className="input-field w-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white">Retry Delay (Seconds)</label>
                                        <p className="text-xs text-zinc-400 mb-2">How long to wait before retrying busy/no-answer/failed leads.</p>
                                        <input type="number" min="0" value={formData.retryDelaySeconds} onChange={(e) => setFormData({ ...formData, retryDelaySeconds: parseInt(e.target.value) || 0 })} className="input-field w-full" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-6 pt-4 border-t border-zinc-800/50">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white">Timezone</label>
                                        <select value={formData.timezone} onChange={(e) => setFormData({ ...formData, timezone: e.target.value })} className="input-field w-full">
                                            <option value="UTC">UTC</option>
                                            <option value="America/New_York">EST</option>
                                            <option value="America/Chicago">CST</option>
                                            <option value="America/Denver">MST</option>
                                            <option value="America/Los_Angeles">PST</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white">Window Start</label>
                                        <input type="time" value={formData.callingWindowStart} onChange={(e) => setFormData({ ...formData, callingWindowStart: e.target.value })} className="input-field w-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white">Window End</label>
                                        <input type="time" value={formData.callingWindowEnd} onChange={(e) => setFormData({ ...formData, callingWindowEnd: e.target.value })} className="input-field w-full" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 3 ALT: VICIDIAL */}
                        {step === 3 && formData.campaignType === 'vicidial' && (
                            <div className="flex flex-col gap-6 max-w-2xl">
                                <div>
                                    <h2 className="text-lg font-semibold text-white mb-1">ViciDial Predictive Mapping</h2>
                                    <p className="text-sm text-zinc-400 mb-6">Route answered calls from ViciDial to this AI agent.</p>
                                </div>
                                
                                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm text-blue-200 mb-4">
                                    <strong className="text-blue-400">Note:</strong> ViciDial handles predictive dialing, lead management, and pacing. The AI Agent will only engage once ViciDial transfers an answered call to the SIP trunk.
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white">ViciDial Campaign ID</label>
                                        <input type="text" value={formData.vicidialCampaignId} onChange={(e) => setFormData({ ...formData, vicidialCampaignId: e.target.value })} placeholder="e.g. CAMP001" className="input-field w-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white">ViciDial Ingroup (Optional)</label>
                                        <input type="text" value={formData.vicidialIngroup} onChange={(e) => setFormData({ ...formData, vicidialIngroup: e.target.value })} placeholder="e.g. SALES_IN" className="input-field w-full" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Navigation */}
                    <div className="flex justify-between">
                        <button 
                            onClick={prevStep} 
                            disabled={step === 1}
                            className="btn-secondary px-6 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <ChevronLeft size={16} /> Back
                        </button>
                        
                        {step < totalSteps ? (
                            <button 
                                onClick={handleNextStep} 
                                className="btn-primary px-6 flex items-center gap-2"
                            >
                                Next <ChevronRight size={16} />
                            </button>
                        ) : (
                            <button 
                                onClick={handleSave} 
                                disabled={saving}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-md transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/20"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Save Changes
                            </button>
                        )}
                    </div>
                </div>

                {/* Right Live Summary Panel */}
                <div className="hidden lg:block w-80 shrink-0">
                    <div className="sticky top-8 flex flex-col gap-4">
                        <div className="card p-5">
                            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <FileText size={16} className="text-blue-500" /> Live Summary
                            </h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <div className="text-xs text-zinc-500 mb-1">Campaign Name</div>
                                    <div className="text-sm text-white font-medium break-words">{formData.name || <span className="text-zinc-600 italic">Not set</span>}</div>
                                </div>
                                <div className="border-t border-zinc-800 pt-3">
                                    <div className="text-xs text-zinc-500 mb-1">Voice Agent</div>
                                    <div className="text-sm text-white font-medium break-words">{selectedAgent?.name || <span className="text-zinc-600 italic">Not selected</span>}</div>
                                </div>
                                <div className="border-t border-zinc-800 pt-3">
                                    <div className="text-xs text-zinc-500 mb-1">Outbound Trunk</div>
                                    <div className="text-sm text-white font-medium break-words">{selectedTrunk?.name || <span className="text-zinc-600 italic">Not selected</span>}</div>
                                </div>
                                <div className="border-t border-zinc-800 pt-3">
                                    <div className="text-xs text-zinc-500 mb-1">Caller ID</div>
                                    <div className="text-sm text-white font-medium">{formData.callerId || <span className="text-zinc-600 italic">Not set</span>}</div>
                                </div>
                                <div className="border-t border-zinc-800 pt-3">
                                    <div className="text-xs text-zinc-500 mb-1">Concurrency</div>
                                    <div className="text-sm text-white font-medium">{formData.concurrency} call{formData.concurrency !== 1 ? 's' : ''} at once</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
