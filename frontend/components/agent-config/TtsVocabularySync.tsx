"use client";

import React, { useState, useEffect } from "react";
import { BookA, RefreshCw, Trash2, Plus } from "lucide-react";

export function TtsVocabularySync({ agentId, defaultMasterId, onMasterIdChange }: { agentId: string, defaultMasterId: string, onMasterIdChange: (id: string) => void }) {
    const [words, setWords] = useState<any[]>([]);
    const [masterId, setMasterId] = useState(defaultMasterId || "");
    const [phrase, setPhrase] = useState("");
    const [replacement, setReplacement] = useState("");
    const [isSyncing, setIsSyncing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!agentId) return;
        fetch(`/api/agents/${agentId}/vocabulary`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setWords(data);
            })
            .catch(err => console.error("Failed to fetch vocabulary", err));
    }, [agentId]);

    const addWord = async () => {
        if (!phrase.trim() || !replacement.trim()) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/agents/${agentId}/vocabulary`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phrase, replacement })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setWords([...words, data]);
            setPhrase("");
            setReplacement("");
        } catch (err: any) {
            alert(err.message || "Failed to add word");
        } finally {
            setIsSaving(false);
        }
    };

    const deleteWord = async (id: string) => {
        try {
            await fetch(`/api/agents/${agentId}/vocabulary?wordId=${id}`, { method: "DELETE" });
            setWords(words.filter(w => w.id !== id));
        } catch (err) {
            console.error("Failed to delete", err);
        }
    };

    const handleSync = async () => {
        if (!masterId) {
            alert("Please provide the Uplift Master Config ID above before syncing!");
            return;
        }

        // Parent form needs the new master ID to save it
        onMasterIdChange(masterId);

        setIsSyncing(true);
        try {
            const res = await fetch(`/api/agents/${agentId}/vocabulary/sync`, { method: "POST" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Sync failed");
            
            alert(data.message);
            // Re-fetch to update the synced status
            const refetched = await fetch(`/api/agents/${agentId}/vocabulary`);
            const newData = await refetched.json();
            if (Array.isArray(newData)) setWords(newData);
            
        } catch (err: any) {
            alert(err.message || "Sync failed");
        } finally {
            setIsSyncing(false);
        }
    };

    // Calculate core remaining assuming 3600 base
    const totalCustom = words.length;
    const TOTAL_BUDGET = 1400; // 5000 max - ~3600 core
    
    return (
        <div style={{ marginTop: "1.5rem", borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                <BookA size={16} /> Uplift AI Custom Dictionary
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                Train Sarah to pronounce specific Urdu/Punjabi terms correctly. Enter the term and the phonetic spelling below.
            </p>

            <div style={{ display: "grid", gap: "1rem", background: "var(--bg-tertiary)", padding: "1.25rem", borderRadius: "calc(var(--radius) * 1.5)", border: "1px solid var(--border-color)" }}>
                <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Uplift Master Config ID</label>
                    <input 
                        type="text" 
                        placeholder="e.g. 09167623-bfb3-4dcf-8941-25a8d66d3bb0"
                        value={masterId}
                        onChange={(e) => {
                            setMasterId(e.target.value);
                            onMasterIdChange(e.target.value);
                        }}
                        style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "var(--radius)", border: "1px solid var(--border-color)", background: "var(--bg-primary)", fontSize: "0.85rem", color: "var(--text-primary)" }}
                    />
                    <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
                        The UUID configuration ID provided by Uplift Dashboard. This must be set to sync.
                    </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "0.75rem", alignItems: "end", marginTop: "0.5rem" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Word / Phrase</label>
                        <input type="text" placeholder="e.g., کوڑا کرکٹ " value={phrase} onChange={e => setPhrase(e.target.value)} style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius)", border: "1px solid var(--border-color)", background: "var(--bg-primary)", fontSize: "0.85rem", color: "var(--text-primary)" }} />
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Pronunciation</label>
                        <input type="text" placeholder="e.g., کورا کرکٹ" value={replacement} onChange={e => setReplacement(e.target.value)} style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius)", border: "1px solid var(--border-color)", background: "var(--bg-primary)", fontSize: "0.85rem", color: "var(--text-primary)" }} />
                    </div>
                    <button onClick={addWord} disabled={isSaving || totalCustom >= TOTAL_BUDGET} style={{ height: "36px", padding: "0 1rem", background: "var(--bg-secondary)", borderRadius: "var(--radius)", border: "1px solid var(--border-color)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-primary)", fontWeight: 600, fontSize: "0.8rem" }}>
                        <Plus size={14} /> Add
                    </button>
                </div>

                <div style={{ background: "var(--bg-primary)", borderRadius: "var(--radius)", overflow: "hidden", border: "1px solid var(--border-color)" }}>
                    {words.length === 0 ? (
                        <div style={{ padding: "1.5rem", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                            No custom words added yet.
                        </div>
                    ) : (
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                            <thead>
                                <tr style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)" }}>
                                    <th style={{ padding: "0.6rem 1rem", textAlign: "left", fontWeight: 600, color: "var(--text-secondary)" }}>Phrase</th>
                                    <th style={{ padding: "0.6rem 1rem", textAlign: "left", fontWeight: 600, color: "var(--text-secondary)" }}>Pronunciation</th>
                                    <th style={{ padding: "0.6rem 1rem", textAlign: "left", fontWeight: 600, color: "var(--text-secondary)" }}>Status</th>
                                    <th style={{ padding: "0.6rem 1rem", textAlign: "right" }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {words.map(w => (
                                    <tr key={w.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                                        <td style={{ padding: "0.6rem 1rem", color: "var(--text-primary)" }}>{w.phrase}</td>
                                        <td style={{ padding: "0.6rem 1rem", color: "var(--text-primary)" }}>{w.replacement}</td>
                                        <td style={{ padding: "0.6rem 1rem" }}>
                                            {w.isSynced ? 
                                                <span style={{ color: "#22c55e", fontSize: "0.75rem", fontWeight: 600 }}>Synced</span> : 
                                                <span style={{ color: "var(--brand-primary)", fontSize: "0.75rem", fontWeight: 600 }}>Pending Sync</span>
                                            }
                                        </td>
                                        <td style={{ padding: "0.6rem 1rem", textAlign: "right" }}>
                                            <button onClick={() => deleteWord(w.id)} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer" }}>
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ width: "120px", height: "6px", background: "var(--bg-secondary)", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{ width: `${Math.min(100, (totalCustom / TOTAL_BUDGET) * 100)}%`, height: "100%", background: totalCustom >= TOTAL_BUDGET ? "var(--danger)" : "var(--brand-primary)" }} />
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                            {totalCustom} / {TOTAL_BUDGET} Used
                        </span>
                    </div>

                    <button onClick={handleSync} disabled={isSyncing} className={`btn ${isSyncing ? "btn-disabled" : "btn-primary"}`} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1rem", fontSize: "0.85rem" }}>
                        <RefreshCw size={14} className={isSyncing ? "spin" : ""} />
                        {isSyncing ? "Syncing with Uplift AI..." : "Push Synced Dictionary"}
                    </button>
                </div>
            </div>
        </div>
    );
}
