"use client";

import React, { useState, useEffect } from 'react';
import { Network, Zap, MessageSquare, Save, Plus, Trash2, Smartphone, Send, Tag, Activity } from 'lucide-react';
import { toast } from 'sonner';

interface WorkflowAction {
    type: string;
    target: string;
    template: string;
}

interface WorkflowCondition {
    type: string;
    operator: string;
    value: string;
}

interface Workflow {
    id: string;
    name: string;
    isActive: boolean;
    conditions: WorkflowCondition[];
    actions: WorkflowAction[];
}

export default function AutomatedWorkflows() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // New Action Form State
    const [showNewForm, setShowNewForm] = useState(false);
    const [newName, setNewName] = useState("");
    const [newConditionType, setNewConditionType] = useState("Tag");
    const [newConditionValue, setNewConditionValue] = useState("");
    const [newActionType, setNewActionType] = useState("WhatsApp");
    const [newActionTarget, setNewActionTarget] = useState("");
    const [newActionTemplate, setNewActionTemplate] = useState("New Alert: {{summary}}");

    const fetchData = async () => {
        try {
            const res = await fetch('/api/workflows/dispatch');
            const result = await res.json();
            setData(result);
            setIsLoading(false);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateWorkflow = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newConditionValue || !newActionTarget) {
            toast.error("Please fill all required fields");
            return;
        }

        setIsSaving(true);
        try {
            const newWorkflow = {
                name: newName,
                conditions: [{ type: newConditionType, operator: "CONTAINS", value: newConditionValue }],
                actions: [{ type: newActionType, target: newActionTarget, template: newActionTemplate }]
            };

            const res = await fetch('/api/workflows/dispatch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newWorkflow)
            });

            if (res.ok) {
                toast.success("Workflow created successfully");
                setShowNewForm(false);
                setNewName("");
                setNewConditionValue("");
                setNewActionTarget("");
                fetchData();
            }
        } catch (err) {
            toast.error("Failed to create workflow");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/workflows/dispatch?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Workflow deleted");
                fetchData();
            }
        } catch (err) {}
    };

    if (isLoading || !data) {
        return (
            <div className="flex justify-center items-center h-64 text-zinc-500 gap-2">
                <Activity className="w-5 h-5 animate-pulse" /> Loading workflows...
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                        <Zap className="w-6 h-6 text-yellow-400" /> Post-Call Action Webhooks
                    </h2>
                    <p className="text-zinc-400 text-sm mt-1">
                        Trigger real-world actions (SMS, WhatsApp, CRM) based on Claude 3.5's intent tags and sentiment scoring.
                    </p>
                </div>
                
                <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 p-2 rounded-lg pl-4 shadow-lg">
                    <div className="text-sm font-bold">
                        <span className="text-zinc-500">TODAY'S DISPATCHES: </span>
                        <span className="text-green-400">{data.dispatchStats.today}</span>
                    </div>
                    <div className="h-6 w-px bg-zinc-800"></div>
                    <div className="text-sm font-bold">
                        <span className="text-zinc-500">FAILED: </span>
                        <span className="text-zinc-400">{data.dispatchStats.failed}</span>
                    </div>
                    <button 
                        onClick={() => setShowNewForm(!showNewForm)}
                        className="ml-2 bg-yellow-600/20 text-yellow-500 border border-yellow-600/50 hover:bg-yellow-600 hover:text-white px-3 py-1.5 rounded transition-colors font-bold flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> New Rule
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Form / Info */}
                <div className="space-y-6">
                    {showNewForm ? (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 shadow-lg animate-in fade-in slide-in-from-left-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4 border-b border-zinc-800 pb-3">
                                <Plus className="w-5 h-5 text-yellow-400" /> Create Workflow Rule
                            </h3>
                            
                            <form onSubmit={handleCreateWorkflow} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Rule Name</label>
                                    <input 
                                        type="text" 
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder="e.g. Plumber Dispatch"
                                        className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:border-yellow-500 text-sm"
                                    />
                                </div>

                                <div className="bg-zinc-950 p-4 rounded border border-zinc-800 space-y-3">
                                    <div className="text-xs font-bold text-indigo-400 flex items-center gap-1">IF CONDITION MET:</div>
                                    <div className="flex gap-2">
                                        <select 
                                            value={newConditionType}
                                            onChange={(e) => setNewConditionType(e.target.value)}
                                            className="bg-black border border-zinc-700 rounded px-2 py-1.5 text-white focus:outline-none focus:border-yellow-500 text-sm"
                                        >
                                            <option value="Tag">Claude Tag</option>
                                            <option value="Sentiment">Sentiment &lt;</option>
                                            <option value="Location">Location</option>
                                        </select>
                                        <input 
                                            type="text" 
                                            value={newConditionValue}
                                            onChange={(e) => setNewConditionValue(e.target.value)}
                                            placeholder="e.g. EMERGENCY"
                                            className="flex-1 bg-black border border-zinc-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-yellow-500 text-sm uppercase"
                                        />
                                    </div>
                                </div>

                                <div className="bg-zinc-950 p-4 rounded border border-zinc-800 space-y-3">
                                    <div className="text-xs font-bold text-green-400 flex items-center gap-1">THEN FIRE ACTION:</div>
                                    <div className="flex gap-2 mb-2">
                                        <select 
                                            value={newActionType}
                                            onChange={(e) => setNewActionType(e.target.value)}
                                            className="bg-black border border-zinc-700 rounded px-2 py-1.5 text-white focus:outline-none focus:border-yellow-500 text-sm"
                                        >
                                            <option value="WhatsApp">WhatsApp Message</option>
                                            <option value="SMS">SMS Alert</option>
                                            <option value="Email">Email Support</option>
                                        </select>
                                        <input 
                                            type="text" 
                                            value={newActionTarget}
                                            onChange={(e) => setNewActionTarget(e.target.value)}
                                            placeholder="+92 300 1234567"
                                            className="flex-1 bg-black border border-zinc-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-yellow-500 text-sm font-mono"
                                        />
                                    </div>
                                    <textarea 
                                        value={newActionTemplate}
                                        onChange={(e) => setNewActionTemplate(e.target.value)}
                                        className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-zinc-300 focus:outline-none focus:border-yellow-500 text-xs font-mono h-16 resize-none"
                                    />
                                    <p className="text-[10px] text-zinc-500 font-mono">Variables: {"{{summary}}"}, {"{{caller_phone}}"}, {"{{location}}"}</p>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button 
                                        type="button"
                                        onClick={() => setShowNewForm(false)}
                                        className="flex-1 bg-transparent border border-zinc-700 text-zinc-400 hover:bg-zinc-800 font-bold py-2 rounded transition-colors text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-1 bg-yellow-600 outline-none hover:bg-yellow-500 text-white font-bold py-2 rounded transition-colors disabled:opacity-50 text-sm flex justify-center items-center gap-2"
                                    >
                                        <Save className="w-4 h-4" /> Save Rule
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="bg-indigo-950/20 border border-indigo-900/50 rounded-lg p-6 shadow-lg">
                            <h4 className="font-bold text-indigo-400 flex items-center gap-2 mb-3">
                                <Network className="w-5 h-5" /> Automation Engine
                            </h4>
                            <p className="text-sm text-indigo-200/70 leading-relaxed mb-4">
                                Actions run asynchronously parallel to the LiveKit voice response. 
                                By the time the AI says "I have dispatched the team," the WhatsApp message has already been delivered to the contractor.
                            </p>
                            <ul className="space-y-2 text-xs text-indigo-300/60 font-mono">
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> Native WhatsApp Business API</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> Local SMS Gateway (Telenor/Jazz)</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> Webhook POST to existing CRMs</li>
                            </ul>
                        </div>
                    )}
                </div>

                {/* Right Column: Workflow Rule List */}
                <div className="lg:col-span-2 space-y-4">
                    {data.workflows.length === 0 ? (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center text-zinc-500">
                            No active workflow rules. Create one to automate actions.
                        </div>
                    ) : (
                        data.workflows.map((flow: Workflow) => (
                            <div key={flow.id} className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg overflow-hidden transition-all hover:border-zinc-700">
                                <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${flow.isActive ? 'bg-green-500 animate-pulse' : 'bg-zinc-600'}`}></div>
                                        <h3 className="font-bold text-white tracking-wide">{flow.name}</h3>
                                    </div>
                                    <button 
                                        onClick={() => handleDelete(flow.id)}
                                        className="text-zinc-500 hover:text-red-400 hover:bg-red-400/10 p-1.5 rounded transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                
                                <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-zinc-800">
                                    {/* Conditions */}
                                    <div className="flex-1 p-5 space-y-3">
                                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">WHEN CLAUDE DETECTS:</div>
                                        {flow.conditions.map((cond, i) => (
                                            <div key={i} className="flex items-center gap-2 text-sm bg-black/50 border border-zinc-800 p-2 rounded">
                                                {cond.type === 'Tag' ? <Tag className="w-4 h-4 text-indigo-400" /> : <Activity className="w-4 h-4 text-indigo-400" />}
                                                <span className="text-zinc-400">{cond.type} {cond.operator === 'CONTAINS' ? 'includes' : cond.operator}</span>
                                                <span className="font-bold text-white bg-zinc-800 px-2 py-0.5 rounded text-xs">{cond.value}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex-1 p-5 space-y-3 bg-zinc-950/30">
                                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">THEN EXECUTE:</div>
                                        {flow.actions.map((act, i) => (
                                            <div key={i} className="flex flex-col gap-2 text-sm bg-blue-900/10 border border-blue-900/30 p-3 rounded">
                                                <div className="flex items-center gap-2">
                                                    {act.type === 'WhatsApp' ? <MessageSquare className="w-4 h-4 text-green-500" /> : 
                                                     act.type === 'SMS' ? <Smartphone className="w-4 h-4 text-blue-400" /> :
                                                     <Send className="w-4 h-4 text-indigo-400" />}
                                                    <span className="font-bold text-white">{act.type} Dispatched To:</span>
                                                    <span className="font-mono text-zinc-400 text-xs">{act.target}</span>
                                                </div>
                                                <div className="text-xs font-mono text-zinc-500 bg-black/80 p-2 rounded border border-zinc-800 overflow-hidden text-ellipsis whitespace-nowrap">
                                                    {act.template || 'No template specified'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
