import { db } from "./index";
import { sql } from "drizzle-orm";

async function migrate() {
    console.log("🛠️  Manually Migrating call_logs table...");

    try {
        // Check if columns exist and rename/add them
        await db.execute(sql`
            DO $$ 
            BEGIN 
                -- Rename duration_s if it exists
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_logs' AND column_name='duration_s') THEN
                    ALTER TABLE call_logs RENAME COLUMN duration_s TO duration_seconds;
                END IF;

                -- Rename caller_number if it exists
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_logs' AND column_name='caller_number') THEN
                    ALTER TABLE call_logs RENAME COLUMN caller_number TO from_number;
                END IF;

                -- Add new columns if they don't exist
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_logs' AND column_name='to_number') THEN
                    ALTER TABLE call_logs ADD COLUMN to_number TEXT;
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_logs' AND column_name='session_id') THEN
                    ALTER TABLE call_logs ADD COLUMN session_id TEXT;
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_logs' AND column_name='room_name') THEN
                    ALTER TABLE call_logs ADD COLUMN room_name TEXT;
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_logs' AND column_name='direction') THEN
                    ALTER TABLE call_logs ADD COLUMN direction TEXT DEFAULT 'inbound';
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_logs' AND column_name='summary') THEN
                    ALTER TABLE call_logs ADD COLUMN summary TEXT;
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_logs' AND column_name='recording_url') THEN
                    ALTER TABLE call_logs ADD COLUMN recording_url TEXT;
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_logs' AND column_name='metadata') THEN
                    ALTER TABLE call_logs ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
                END IF;

                -- Change transcript type to JSONB
                -- Note: This is destructive if data exists, but we are in a dev environment
                ALTER TABLE call_logs ALTER COLUMN transcript TYPE JSONB USING (CASE WHEN transcript IS NULL THEN '[]'::jsonb ELSE transcript::jsonb END);
                ALTER TABLE call_logs ALTER COLUMN transcript SET DEFAULT '[]'::jsonb;

            END $$;
        `);
        console.log("✅ Manual migration successful.");
    } catch (e) {
        console.error("❌ Manual migration failed:", e);
    }
}

migrate().catch(console.error);
