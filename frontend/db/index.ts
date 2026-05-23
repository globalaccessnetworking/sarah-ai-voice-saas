/**
 * Global Access AI Engine — Drizzle DB Singleton
 *
 * Uses a module-level singleton so we don't open a new pg pool on every
 * hot-reload in development and don't exhaust connections in production.
 *
 * Requires DATABASE_URL in .env.local:
 *   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/global_access
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import * as dotenv from "dotenv";

// Auto-load .env.local if not already loaded (for standalone scripts)
dotenv.config({ path: ".env.local" });

// ── Singleton pool ───────────────────────────────────────────────────────────
declare global {
    // Prevent multiple Pool instances during Next.js hot-reload
    // eslint-disable-next-line no-var
    var __pgPool: Pool | undefined;
}

function getPool(): Pool {
    if (!global.__pgPool) {
        const connectionString = process.env.DATABASE_URL;
        console.log("[Global Access DB] Connecting with URL present:", !!connectionString);
        
        if (!connectionString) {
            console.warn(
                "[Global Access DB] DATABASE_URL is not set in environment variables.\n" +
                "Database queries will fail. Add it to frontend/.env.local."
            );
            global.__pgPool = new Pool({});
        } else {
            global.__pgPool = new Pool({
                connectionString,
                max: 10,
                idleTimeoutMillis: 30_000,
                connectionTimeoutMillis: 5_000,
            });
        }
    }
    return global.__pgPool;
}

// ── Drizzle instance (exported and reused everywhere) ───────────────────────
export const db = drizzle(getPool(), { schema });

// ── Re-export schema for convenience ─────────────────────────────────────────
export { schema };
