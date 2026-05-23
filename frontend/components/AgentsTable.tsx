/**
 * Global Access AI Engine — Agents Table (Client Component)
 *
 * Receives the initial agent list from the Server Component parent.
 * Handles all interactive features: Start/Stop (PATCH /api/agents/:id),
 * Delete (DELETE /api/agents/:id), and modal dialogs.
 *
 * Optimistic UI: the table updates instantly while the API call runs in the
 * background. On error, the original state is restored.
 */

"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Agent as DBAgent } from "@/db/schema";
import {
    Bot, PlayCircle, StopCircle, Play, Square, Pencil, Copy, Download,
    Code2, ListTree, Trash2, Upload, Info, CheckCircle2, AlertTriangle,
    X, Clipboard, RefreshCw, Link2, LayoutTemplate, WifiOff,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
// We use a UI-level union so pages that haven't migrated yet can still pass
// mock objects without TypeScript complaining.
type AgentRow = {
    id: string;
    name: string;
    slug: string;
    status: string;
    // health is computed from DB columns in a future phase; default healthy
    health?: string;
    healthErrors?: string[];
    llmProvider?: string | null;
    sttProvider?: string | null;
    ttsProvider?: string | null;
    [key: string]: unknown;
};

function toAgentRow(a: DBAgent): AgentRow {
    return {
        ...a,
        health: "healthy", // Phase 4 will compute this from env check
        healthErrors: [],
        llmProvider: a.llmProvider,
        sttProvider: a.sttProvider,
        ttsProvider: a.ttsProvider,
    };
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    if (status === "running")
        return <span className="badge badge-success"><span className="pulsing-dot" />Running</span>;
    if (status === "restarting")
        return <span className="badge badge-warning"><span className="pulsing-dot" />Restarting</span>;
    return <span className="badge badge-secondary">Stopped</span>;
}

// ── Health Badge ──────────────────────────────────────────────────────────────
function HealthBadge({ agent, onClickError }: { agent: AgentRow; onClickError: (a: AgentRow) => void }) {
    if (!agent.health || agent.health === "healthy")
        return <span className="badge badge-success"><CheckCircle2 size={11} />Healthy</span>;
    return (
        <button className="badge badge-danger" style={{ cursor: "pointer", border: "none" }}
            onClick={() => onClickError(agent)} title="View config errors">
            <AlertTriangle size={11} />Config Error
        </button>
    );
}

// ── Modal Wrapper ─────────────────────────────────────────────────────────────
function Modal({ open, onClose, size, children }: {
    open: boolean; onClose: () => void; size?: "lg" | "xl"; children: React.ReactNode;
}) {
    if (!open) return null;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className={`modal-box${size ? ` modal-${size}` : ""}`} onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
}

// ── DB Error Banner ──────────────────────────────────────────────────────────
function DbErrorBanner({ error }: { error: string }) {
    return (
        <div className="alert alert-warning" style={{ marginBottom: "1rem" }}>
            <WifiOff size={14} style={{ flexShrink: 0 }} />
            <span>
                <strong>Database not connected.</strong> Showing empty state. To connect PostgreSQL,
                add <code style={{ background: "var(--bg-tertiary)", padding: "0 3px", borderRadius: 3 }}>DATABASE_URL</code> to{" "}
                <code style={{ background: "var(--bg-tertiary)", padding: "0 3px", borderRadius: 3 }}>frontend/.env.local</code> and restart the dev server.
                <br />
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{error}</span>
            </span>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AgentsTable({
    initialAgents,
    dbError,
}: {
    initialAgents: DBAgent[];
    dbError: string | null;
}) {
    const router = useRouter();
    const [agents, setAgents] = useState<AgentRow[]>(initialAgents.map(toAgentRow));
    const [loading, setLoading] = useState<Record<string, boolean>>({});

    // Modal state
    const [codeModal, setCodeModal] = useState<AgentRow | null>(null);
    const [logsModal, setLogsModal] = useState<AgentRow | null>(null);
    const [deleteModal, setDeleteModal] = useState<AgentRow | null>(null);
    const [healthModal, setHealthModal] = useState<AgentRow | null>(null);
    const [importModal, setImportModal] = useState(false);

    // Computed stats
    const totalAgents = agents.length;
    const runningCount = agents.filter(a => a.status === "running").length;
    const stoppedCount = agents.filter(a => a.status === "stopped").length;

    // ── Optimistic status toggle ─────────────────────────────────────────────
    const toggleStatus = useCallback(async (agentId: string, action: "start" | "stop") => {
        const newStatus = action === "start" ? "running" : "stopped";
        const prev = agents;

        // Optimistic update
        setAgents(cur => cur.map(a => a.id === agentId ? { ...a, status: newStatus } : a));
        setLoading(l => ({ ...l, [agentId]: true }));

        try {
            const res = await fetch(`/api/agents/${agentId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error(await res.text());
        } catch {
            // Rollback on error
            setAgents(prev);
        } finally {
            setLoading(l => ({ ...l, [agentId]: false }));
        }
    }, [agents]);

    // ── Duplicate ─────────────────────────────────────────────────────────────
    const duplicateAgent = useCallback(async (agent: AgentRow) => {
        if (!confirm(`Duplicate agent "${agent.name}"?`)) return;
        try {
            const res = await fetch("/api/agents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...agent,
                    name: `${agent.name} (Copy)`,
                    slug: `${agent.slug}-copy-${Date.now().toString(36)}`,
                    status: "stopped",
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                alert(err.error ?? "Failed to duplicate agent.");
                return;
            }
            // Refresh from server
            router.refresh();
        } catch {
            alert("Network error while duplicating agent.");
        }
    }, [router]);

    // ── Delete ───────────────────────────────────────────────────────────────
    const deleteAgent = useCallback(async (agentId: string) => {
        const prev = agents;
        setAgents(cur => cur.filter(a => a.id !== agentId));
        setDeleteModal(null);

        try {
            const res = await fetch(`/api/agents/${agentId}`, { method: "DELETE" });
            if (!res.ok) {
                setAgents(prev);
                alert("Failed to delete agent.");
            }
        } catch {
            setAgents(prev);
        }
    }, [agents]);

    const copyToClipboard = (text: string) => navigator.clipboard.writeText(text).catch(() => { });

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <>
            {dbError && <DbErrorBanner error={dbError} />}

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: "1rem" }}>
                <div className="stat-card">
                    <div className="stat-label"><Bot size={13} /> Total Agents</div>
                    <div className="stat-value info">{totalAgents}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label"><PlayCircle size={13} /> Running</div>
                    <div className="stat-value success">{runningCount}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label"><StopCircle size={13} /> Stopped</div>
                    <div className="stat-value">{stoppedCount}</div>
                </div>
            </div>

            {/* Info alert */}
            <div className="alert alert-info">
                <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                    <strong>Agent Management:</strong> Create and configure AI voice agents with customizable
                    LLM, STT, and TTS providers. Changes take effect immediately when the agent is restarted.
                </span>
            </div>

            {/* Table card */}
            <div className="card">
                <div className="card-header">
                    <h5 className="card-title"><Bot size={16} /> AI Agents</h5>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => alert("Template selector — coming soon.")}>
                            <LayoutTemplate size={13} /> Templates
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setImportModal(true)}>
                            <Upload size={13} /> Import
                        </button>
                        <Link href="/agents/create" className="btn btn-primary btn-sm">
                            <Bot size={13} /> Create Agent
                        </Link>
                    </div>
                </div>

                <div className="card-body" style={{ padding: 0 }}>
                    {agents.length > 0 ? (
                        <div className="table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: "18%" }}>ID</th>
                                        <th style={{ width: "24%" }}>Name</th>
                                        <th style={{ width: "13%" }}>Status</th>
                                        <th style={{ width: "13%" }}>Health</th>
                                        <th style={{ width: "32%", textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {agents.map(agent => (
                                        <tr key={agent.id}>
                                            <td>
                                                <code className="id-chip" title={agent.id}>
                                                    {agent.id.slice(0, 20)}…
                                                </code>
                                            </td>

                                            <td>
                                                <div className="agent-name">{agent.name}</div>
                                                <div className="agent-slug">
                                                    <Link2 size={11} style={{ display: "inline", marginRight: 3, verticalAlign: "middle" }} />
                                                    {agent.slug}
                                                </div>
                                            </td>

                                            <td><StatusBadge status={agent.status} /></td>
                                            <td><HealthBadge agent={agent} onClickError={setHealthModal} /></td>

                                            <td>
                                                <div className="btn-group">
                                                    {agent.status === "running" ? (
                                                        <button className="btn btn-outline-danger btn-sm"
                                                            disabled={loading[agent.id]}
                                                            onClick={() => toggleStatus(agent.id, "stop")} title="Stop agent">
                                                            <Square size={12} /> Stop
                                                        </button>
                                                    ) : (
                                                        <button className="btn btn-outline-success btn-sm"
                                                            disabled={loading[agent.id]}
                                                            onClick={() => toggleStatus(agent.id, "start")} title="Start agent">
                                                            <Play size={12} /> Start
                                                        </button>
                                                    )}
                                                    <Link href={`/agents/edit/${agent.id}`} className="btn btn-outline-primary btn-sm" title="Edit">
                                                        <Pencil size={12} />
                                                    </Link>
                                                    <button className="btn btn-outline-secondary btn-sm" onClick={() => duplicateAgent(agent)} title="Duplicate">
                                                        <Copy size={12} />
                                                    </button>
                                                    <a href={`/api/agents/${agent.id}/export`} className="btn btn-outline-secondary btn-sm" title="Export">
                                                        <Download size={12} />
                                                    </a>
                                                    <button className="btn btn-outline-info btn-sm" onClick={() => setCodeModal(agent)} title="View Config JSON">
                                                        <Code2 size={12} />
                                                    </button>
                                                    <button className="btn btn-outline-warning btn-sm" onClick={() => setLogsModal(agent)} title="View Logs">
                                                        <ListTree size={12} />
                                                    </button>
                                                    <button className="btn btn-outline-danger btn-sm" onClick={() => setDeleteModal(agent)} title="Delete">
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon"><Bot size={52} strokeWidth={1.2} /></div>
                            <div className="empty-state-title">No agents configured</div>
                            <div className="empty-state-description">
                                {dbError
                                    ? "Connect PostgreSQL to persist agents, or create one now — it will appear here after the database is wired."
                                    : "Create an AI voice agent to handle automated interactions through the Global Access AI Engine."}
                            </div>
                            <Link href="/agents/create" className="btn btn-primary">
                                <Bot size={14} /> Create Your First Agent
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* ══ MODALS ══════════════════════════════════════════════════════════ */}

            {/* Code / Config JSON */}
            <Modal open={!!codeModal} onClose={() => setCodeModal(null)} size="lg">
                <div className="modal-header">
                    <span className="modal-title"><Code2 size={16} /> Agent Configuration (JSON)</span>
                    <button className="modal-close-btn" onClick={() => setCodeModal(null)}><X size={16} /></button>
                </div>
                <div className="modal-body">
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.5rem" }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => copyToClipboard(JSON.stringify(codeModal, null, 2))}>
                            <Clipboard size={12} /> Copy
                        </button>
                    </div>
                    <div className="code-box">{JSON.stringify(codeModal, null, 2)}</div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={() => setCodeModal(null)}>Close</button>
                </div>
            </Modal>

            {/* Logs viewer */}
            <Modal open={!!logsModal} onClose={() => setLogsModal(null)} size="xl">
                <div className="modal-header" style={{ background: "#000", borderColor: "#333" }}>
                    <span className="modal-title" style={{ color: "#00ff41" }}>
                        <ListTree size={16} /> Agent Logs — {logsModal?.name}
                    </span>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <button className="btn btn-outline-success btn-sm"
                            onClick={() => alert(`GET /api/agents/${logsModal?.id}/logs — Phase 4`)}>
                            <RefreshCw size={12} /> Refresh
                        </button>
                        <button className="modal-close-btn" onClick={() => setLogsModal(null)}>
                            <X size={16} style={{ color: "#8b949e" }} />
                        </button>
                    </div>
                </div>
                <div className="modal-body" style={{ background: "#000", padding: "1rem" }}>
                    <div className="terminal-box" style={{ maxHeight: "500px" }}>
                        {`[2026-03-07 02:54:00] [INFO] Global Access AI Engine — Starting agent process
[2026-03-07 02:54:00] [INFO] Agent: ${logsModal?.name} (${logsModal?.id})
[2026-03-07 02:54:00] [INFO] LLM Provider  : ${logsModal?.llmProvider ?? "unknown"}
[2026-03-07 02:54:00] [INFO] STT Provider  : ${logsModal?.sttProvider ?? "unknown"}
[2026-03-07 02:54:00] [INFO] TTS Provider  : ${logsModal?.ttsProvider ?? "unknown"}
[2026-03-07 02:54:01] [INFO] Connecting to voice pipeline...
[2026-03-07 02:54:01] [INFO] Pipeline initialised successfully.
[2026-03-07 02:54:01] [INFO] Waiting for inbound connections...`}
                    </div>
                </div>
            </Modal>

            {/* Import */}
            <Modal open={importModal} onClose={() => setImportModal(false)}>
                <div className="modal-header">
                    <span className="modal-title"><Upload size={16} /> Import Agent</span>
                    <button className="modal-close-btn" onClick={() => setImportModal(false)}><X size={16} /></button>
                </div>
                <div className="modal-body">
                    <div className="alert alert-info">
                        <Info size={14} style={{ flexShrink: 0 }} />
                        <span>Upload a JSON file exported from another Global Access AI Engine deployment.</span>
                    </div>
                    <div style={{ marginTop: "1rem" }}>
                        <label style={{ display: "block", marginBottom: "0.375rem", fontSize: "0.875rem", color: "var(--text-primary)" }}>
                            Select JSON File
                        </label>
                        <input type="file" accept=".json" style={{
                            display: "block", width: "100%", padding: "0.5rem",
                            background: "var(--bg-tertiary)", border: "1px solid var(--border-color)",
                            borderRadius: "var(--radius)", color: "var(--text-primary)",
                        }} />
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={() => setImportModal(false)}>Cancel</button>
                    <button className="btn btn-primary" onClick={() => setImportModal(false)}>
                        <Upload size={13} /> Import
                    </button>
                </div>
            </Modal>

            {/* Delete confirm */}
            <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)}>
                <div className="modal-header">
                    <span className="modal-title"><Trash2 size={16} /> Confirm Delete Agent</span>
                    <button className="modal-close-btn" onClick={() => setDeleteModal(null)}><X size={16} /></button>
                </div>
                <div className="modal-body">
                    <p style={{ color: "var(--text-primary)", marginBottom: "1rem" }}>
                        Delete agent <strong style={{ color: "var(--danger)" }}>{deleteModal?.name}</strong>?
                    </p>
                    <div className="alert alert-warning">
                        <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                        <span>This action cannot be undone. All associated call logs will also be deleted.</span>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={() => setDeleteModal(null)}>Cancel</button>
                    <button className="btn btn-outline-danger" onClick={() => deleteModal && deleteAgent(deleteModal.id)}>
                        <Trash2 size={13} /> Delete Agent
                    </button>
                </div>
            </Modal>

            {/* Health error */}
            <Modal open={!!healthModal} onClose={() => setHealthModal(null)}>
                <div className="modal-header">
                    <span className="modal-title">
                        <AlertTriangle size={16} style={{ color: "var(--danger)" }} /> Configuration Error
                    </span>
                    <button className="modal-close-btn" onClick={() => setHealthModal(null)}><X size={16} /></button>
                </div>
                <div className="modal-body">
                    <p style={{ color: "var(--text-primary)", marginBottom: "0.75rem" }}>
                        The following environment variables are missing or not configured:
                    </p>
                    <ul style={{ listStyle: "none", padding: 0, marginBottom: "1rem" }}>
                        {(healthModal?.healthErrors ?? ["Unknown configuration error"]).map((err, i) => (
                            <li key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0", borderBottom: "1px solid var(--border-color)", color: "var(--danger)", fontSize: "0.875rem" }}>
                                <AlertTriangle size={13} />
                                <code style={{ background: "var(--bg-tertiary)", padding: "0.1rem 0.4rem", borderRadius: "4px", fontSize: "0.8rem" }}>{err}</code>
                            </li>
                        ))}
                    </ul>
                    <div className="alert alert-info">
                        <Info size={14} style={{ flexShrink: 0 }} />
                        <span><strong>Fix:</strong> Add the missing API keys to <code style={{ background: "var(--bg-tertiary)", padding: "0 3px", borderRadius: 3 }}>.env</code> and restart.</span>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={() => setHealthModal(null)}>Close</button>
                </div>
            </Modal>
        </>
    );
}
