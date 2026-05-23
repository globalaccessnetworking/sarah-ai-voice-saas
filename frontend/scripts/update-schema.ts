import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const DB_URL = process.env.DATABASE_URL || "postgresql://postgres:pakistansuthrapunjab@115.186.170.43:5432/global_access";

const SQL_SCHEMA = `
-- ─── Complaints Table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS complaints (
    id SERIAL PRIMARY KEY,
    ticket_id TEXT,
    name TEXT,
    phone TEXT,
    issue TEXT,
    district TEXT,
    address TEXT,
    landmark TEXT,
    status TEXT DEFAULT 'Pending',
    priority TEXT DEFAULT 'Normal',
    notes TEXT,
    sentiment TEXT,
    recording_id TEXT,
    room_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Migration: Add Sentiment & Recording to Complaints ──────────────────────
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='complaints' AND column_name='sentiment') THEN
        ALTER TABLE complaints ADD COLUMN sentiment TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='complaints' AND column_name='recording_id') THEN
        ALTER TABLE complaints ADD COLUMN recording_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='complaints' AND column_name='room_name') THEN
        ALTER TABLE complaints ADD COLUMN room_name TEXT;
    END IF;
END $$;

-- ─── Agent Tools Mapping (Legacy Compatibility) ─────────────────────────────
CREATE TABLE IF NOT EXISTS agent_tools (
    id TEXT PRIMARY KEY DEFAULT 'agt_' || encode(gen_random_bytes(12), 'hex'),
    agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    tool_id TEXT NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure agents table has tools_config JSONB column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agents' AND column_name='tools_config') THEN
        ALTER TABLE agents ADD COLUMN tools_config JSONB DEFAULT '[]';
    END IF;
END $$;
`;

async function updateSchema() {
    console.log("🚀 Syncing Database Schema...");
    const client = new Client({ connectionString: DB_URL });
    
    try {
        await client.connect();
        console.log("✅ Connected to PostgreSQL.");

        await client.query(SQL_SCHEMA);
        console.log("🎉 Schema Update Complete! Missing tables created.");

    } catch (err) {
        console.error("❌ Error during schema update:", err);
    } finally {
        await client.end();
    }
}

updateSchema();
