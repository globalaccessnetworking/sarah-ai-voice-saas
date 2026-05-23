"use client";
import React, { useState } from "react";
import {
    Code2, GripVertical, Plus, Trash2, Eye, GitCompare, Sparkles,
    Copy, CheckCircle, RotateCcw, Variable, ChevronDown, ChevronUp,
    AlertCircle, Info, Zap, BarChart3
} from "lucide-react";

type BlockType = "role" | "task" | "tone" | "rules" | "examples" | "variables";

interface Block {
    id: string;
    type: BlockType;
    content: string;
    enabled: boolean;
}

const BLOCK_CONFIGS: Record<BlockType, { label: string; color: string; placeholder: string; tip: string }> = {
    role: { label: "Role", color: "#6366f1", placeholder: 'You are [name], a [role] at [company]. Your primary purpose is to...', tip: "Define who the agent is and their core purpose." },
    task: { label: "Task", color: "#10b981", placeholder: 'Your job is to: 1) ... 2) ... 3) ...', tip: "List the specific tasks the agent must perform." },
    tone: { label: "Tone", color: "#f59e0b", placeholder: "Be friendly, professional, and empathetic. Speak clearly and avoid jargon...", tip: "Define how the agent should sound and communicate." },
    rules: { label: "Rules", color: "#ef4444", placeholder: "ALWAYS: 1) Confirm the caller's name before booking. NEVER: 1) Provide medical advice...", tip: "Hard rules the agent must always or never do." },
    examples: { label: "Examples", color: "#06b6d4", placeholder: 'Caller: "I need an appointment"\nAgent: "Of course! I can help with that..."', tip: "Show sample conversations to guide the agent's style." },
    variables: { label: "Variables", color: "#a855f7", placeholder: "Business Name: {{business_name}}\nHours: {{operating_hours}}\nLocation: {{location}}", tip: "Dynamic values that get replaced at runtime." },
};

const DEFAULT_BLOCKS: Block[] = [
    { id: "b1", type: "role", enabled: true, content: "You are Sarah, a professional receptionist for {{business_name}} located in {{location}}. Your primary purpose is to book appointments, answer enquiries, and provide excellent customer service." },
    { id: "b2", type: "task", enabled: true, content: "Your job is to:\n1) Greet callers warmly and identify their needs\n2) Book appointments using the Booking Tool\n3) Answer FAQs about services and pricing\n4) Capture caller name and phone number" },
    { id: "b3", type: "tone", enabled: true, content: "Be warm, professional, and empathetic. Keep responses concise — no more than 2 sentences per turn. Use Australian English. Never use technical jargon." },
    { id: "b4", type: "rules", enabled: true, content: "ALWAYS:\n- Confirm the caller's name before booking\n- Read back appointment time for confirmation\n\nNEVER:\n- Provide pricing without checking current rates\n- Book outside of business hours: {{operating_hours}}" },
    { id: "b5", type: "variables", enabled: true, content: "{{business_name}} = Sydney Dental Group\n{{location}} = 42 George St, Sydney CBD\n{{operating_hours}} = Mon-Fri 8am-6pm, Sat 9am-1pm" },
];

let idCounter = 100;

function BlockCard({ block, onChange, onDelete, onToggle }: {
    block: Block;
    onChange: (id: string, content: string) => void;
    onDelete: (id: string) => void;
    onToggle: (id: string) => void;
}) {
    const cfg = BLOCK_CONFIGS[block.type];
    const [expanded, setExpanded] = useState(true);

    return (
        <div className={`border rounded-xl overflow-hidden transition-all ${block.enabled ? "border-zinc-700" : "border-zinc-800 opacity-50"}`} style={{ borderLeftWidth: 3, borderLeftColor: cfg.color }}>
            <div className="flex items-center gap-3 px-4 py-3 bg-zinc-800/50 cursor-pointer" onClick={() => setExpanded(p => !p)}>
                <GripVertical className="w-4 h-4 text-zinc-600 shrink-0 cursor-grab" />
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.color }} />
                <span className="text-xs font-bold text-zinc-200 flex-1">{cfg.label}</span>
                <button onClick={e => { e.stopPropagation(); onToggle(block.id); }} className={`w-7 h-4 rounded-full transition-all relative ${block.enabled ? "bg-emerald-600" : "bg-zinc-600"}`}>
                    <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${block.enabled ? "right-0.5" : "left-0.5"}`} />
                </button>
                <button onClick={e => { e.stopPropagation(); onDelete(block.id); }} className="text-zinc-600 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                {expanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
            </div>
            {expanded && (
                <div className="px-4 pb-4 pt-2 bg-zinc-900">
                    <div className="flex items-start gap-2 mb-2 text-[10px] text-zinc-500">
                        <Info className="w-3 h-3 mt-0.5 shrink-0" style={{ color: cfg.color }} /> {cfg.tip}
                    </div>
                    <textarea
                        value={block.content}
                        onChange={e => onChange(block.id, e.target.value)}
                        placeholder={cfg.placeholder}
                        rows={4}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono resize-y"
                    />
                </div>
            )}
        </div>
    );
}

function computeHealthScore(blocks: Block[]): { score: number; issues: string[] } {
    const issues: string[] = [];
    let score = 100;
    const enabled = blocks.filter(b => b.enabled);
    if (!enabled.find(b => b.type === "role")) { issues.push("Missing Role block"); score -= 25; }
    if (!enabled.find(b => b.type === "task")) { issues.push("No Task block defined"); score -= 20; }
    if (!enabled.find(b => b.type === "rules")) { issues.push("No guardrails (Rules block missing)"); score -= 10; }
    const emptyBlocks = enabled.filter(b => b.content.trim().length < 20);
    if (emptyBlocks.length) { issues.push(`${emptyBlocks.length} block(s) have very little content`); score -= emptyBlocks.length * 10; }
    const hasVars = enabled.find(b => b.content.includes("{{"));
    if (!hasVars) { issues.push("Consider adding variables for dynamic content"); score -= 5; }
    return { score: Math.max(0, Math.min(100, score)), issues };
}

export default function PromptStudioPage() {
    const [blocks, setBlocks] = useState<Block[]>(DEFAULT_BLOCKS);
    const [abMode, setAbMode] = useState(false);
    const [copied, setCopied] = useState(false);
    const [activeVersion, setActiveVersion] = useState<"A" | "B">("A");

    const addBlock = (type: BlockType) => {
        setBlocks(p => [...p, { id: `b${++idCounter}`, type, content: "", enabled: true }]);
    };
    const updateBlock = (id: string, content: string) => setBlocks(p => p.map(b => b.id === id ? { ...b, content } : b));
    const deleteBlock = (id: string) => setBlocks(p => p.filter(b => b.id !== id));
    const toggleBlock = (id: string) => setBlocks(p => p.map(b => b.id === id ? { ...b, enabled: !b.enabled } : b));

    const compiledPrompt = blocks
        .filter(b => b.enabled && b.content.trim())
        .map(b => `## ${BLOCK_CONFIGS[b.type].label.toUpperCase()}\n${b.content}`)
        .join("\n\n");

    const { score, issues } = computeHealthScore(blocks);
    const scoreColor = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";

    const handleCopy = () => {
        navigator.clipboard.writeText(compiledPrompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-black text-zinc-200">
            <div className="w-full overflow-y-auto bg-zinc-950 p-8 md:p-10">
                <div className="max-w-[1600px] mx-auto space-y-6">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-950/40 to-violet-950/30 border border-indigo-900/30 rounded-2xl p-6 flex items-center gap-5">
                        <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center">
                            <Code2 className="w-7 h-7 text-indigo-400" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold text-white mb-1">Visual Prompt Studio</h1>
                            <p className="text-xs text-zinc-400">Build agent system prompts with modular blocks. Live preview, variable injection, A/B testing, and AI health scoring.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <div className="text-3xl font-bold font-mono" style={{ color: scoreColor }}>{score}</div>
                                <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Prompt Score</div>
                            </div>
                            <button
                                onClick={() => setAbMode(p => !p)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${abMode ? "bg-orange-600 border-orange-500 text-white" : "border-zinc-700 text-zinc-400 hover:text-zinc-200"}`}
                            >
                                <GitCompare className="w-4 h-4" /> {abMode ? "A/B ON" : "A/B Test"}
                            </button>
                        </div>
                    </div>

                    {/* A/B Toggle */}
                    {abMode && (
                        <div className="flex items-center gap-3 bg-orange-950/20 border border-orange-900/30 rounded-xl p-4">
                            <GitCompare className="w-4 h-4 text-orange-400" />
                            <span className="text-xs text-orange-300 font-medium flex-1">A/B Testing Mode: Two prompt variants will be deployed to alternating calls.</span>
                            <div className="flex gap-2">
                                {(["A", "B"] as const).map(v => (
                                    <button key={v} onClick={() => setActiveVersion(v)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeVersion === v ? "bg-orange-600 text-white" : "bg-zinc-800 text-zinc-400"}`}>
                                        Version {v}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid lg:grid-cols-2 gap-6">
                        {/* Block Builder */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-bold text-white">Prompt Blocks {abMode && <span className="ml-2 text-orange-400">— Version {activeVersion}</span>}</h2>
                                <div className="flex gap-2">
                                    {(Object.keys(BLOCK_CONFIGS) as BlockType[]).map(t => (
                                        <button
                                            key={t}
                                            onClick={() => addBlock(t)}
                                            className="text-[10px] font-bold px-2 py-1 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                                            style={{ borderColor: BLOCK_CONFIGS[t].color + "40", color: BLOCK_CONFIGS[t].color }}
                                        >
                                            + {BLOCK_CONFIGS[t].label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-3">
                                {blocks.map(block => (
                                    <BlockCard key={block.id} block={block} onChange={updateBlock} onDelete={deleteBlock} onToggle={toggleBlock} />
                                ))}
                            </div>
                        </div>

                        {/* Live Preview & Health */}
                        <div className="space-y-4">
                            {/* Health Score Card */}
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-sm font-bold text-white flex items-center gap-2"><Sparkles className="w-4 h-4 text-yellow-400" /> Prompt Health Score</h2>
                                    <div className="text-2xl font-bold font-mono" style={{ color: scoreColor }}>{score}/100</div>
                                </div>
                                <div className="w-full bg-zinc-800 rounded-full h-2 mb-4">
                                    <div className="h-2 rounded-full transition-all" style={{ width: `${score}%`, background: scoreColor }} />
                                </div>
                                {issues.length > 0 ? (
                                    <div className="space-y-2">
                                        {issues.map(issue => (
                                            <div key={issue} className="flex items-center gap-2 text-[11px] text-yellow-400">
                                                <AlertCircle className="w-3 h-3 shrink-0" /> {issue}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-emerald-400 text-xs">
                                        <CheckCircle className="w-3.5 h-3.5" /> Excellent prompt structure!
                                    </div>
                                )}
                            </div>

                            {/* Compiled Preview */}
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                                    <div className="flex items-center gap-2">
                                        <Eye className="w-4 h-4 text-indigo-400" />
                                        <span className="text-xs font-bold text-white">Live Compiled Prompt</span>
                                    </div>
                                    <button onClick={handleCopy} className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all ${copied ? "text-emerald-400 bg-emerald-500/10" : "text-zinc-400 hover:text-zinc-200 bg-zinc-800"}`}>
                                        {copied ? <><CheckCircle className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                                    </button>
                                </div>
                                <pre className="p-4 text-[11px] text-zinc-300 font-mono leading-relaxed overflow-y-auto max-h-80 whitespace-pre-wrap">{compiledPrompt || "Add blocks to build your prompt..."}</pre>
                            </div>

                            {/* Token estimate */}
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { label: "Characters", value: compiledPrompt.length.toLocaleString() },
                                    { label: "Est. Tokens", value: Math.round(compiledPrompt.length / 4).toLocaleString() },
                                    { label: "Est. Cost/call", value: `$${(Math.round(compiledPrompt.length / 4) * 0.000015).toFixed(5)}` },
                                ].map(m => (
                                    <div key={m.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
                                        <div className="text-base font-bold font-mono text-white">{m.value}</div>
                                        <div className="text-[10px] text-zinc-500">{m.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Save Bar */}
                    <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <div className="text-xs text-zinc-500">Version history: Auto-saved every 60 seconds. Last saved 2 min ago.</div>
                        <div className="flex gap-3">
                            <button onClick={() => setBlocks(DEFAULT_BLOCKS)} className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5">
                                <RotateCcw className="w-3.5 h-3.5" /> Reset
                            </button>
                            <button className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5">
                                <CheckCircle className="w-3.5 h-3.5" /> Save & Apply to Agents
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
