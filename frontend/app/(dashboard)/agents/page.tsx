/**
 * Global Access AI Engine — Agents List Page
 *
 * Server Component: fetches live data from PostgreSQL via Drizzle.
 * Falls back to empty state + informative banner if DB is not yet configured.
 *
 * Client interactions (Start/Stop, Delete, Modals) are delegated to the
 * <AgentsTable> Client Component so we can use React state without
 * converting the whole page to "use client".
 */

import { Suspense } from "react";
import TopBar from "@/components/TopBar";
import AgentsTable from "@/components/AgentsTable";

// ── Lightweight DB fetch — isolated so error boundary works nicely ─────────
async function fetchAgents() {
    let dbAgents: any[] = [];
    let jsonAgents: any[] = [];
    let dbError: string | null = null;

    // 1. Fetch from Postgres (Drizzle)
    try {
        const { db, schema } = await import("@/db");
        dbAgents = await db.select().from(schema.agents).orderBy(schema.agents.createdAt);
    } catch (err) {
        dbError = err instanceof Error ? err.message : String(err);
    }

    // 2. Fetch from Local JSON - REMOVED (No more ghosts!)
    
    // Combine and return ONLY database agents
    return {
        agents: dbAgents.sort((a, b) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        ),
        dbError
    };
}

export const dynamic = "force-dynamic"; // always re-fetch on every request
export const metadata = { title: "Agents | Global Access AI Engine" };

export default async function AgentsPage() {
    const { agents, dbError } = await fetchAgents();

    return (
        <>
            <TopBar
                title="Agent Management"
                subtitle="Configure and monitor AI voice agents for Global Access AI Engine"
            />

            <main className="page-content">
                <Suspense fallback={null}>
                    <AgentsTable initialAgents={agents} dbError={dbError} />
                </Suspense>
            </main>

            <footer className="site-footer">
                <span>Global Access AI Engine &copy; {new Date().getFullYear()}</span>
                <span style={{ color: "var(--text-muted)" }}>
                    Sovereign Deployment — Air-Gapped
                </span>
            </footer>
        </>
    );
}
