const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log("🚀 Starting Phase 4 Manual Migration...");

        // 1. Create sms_jobs table
        await client.query(`
            CREATE TABLE IF NOT EXISTS "sms_jobs" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "recipient" text NOT NULL,
                "ticket_id" text,
                "content" text NOT NULL,
                "trigger_type" text,
                "attempt_count" integer DEFAULT 0,
                "max_retries" integer DEFAULT 3,
                "next_attempt_at" timestamp with time zone DEFAULT now(),
                "status" text DEFAULT 'PENDING',
                "last_error" text,
                "created_at" timestamp with time zone DEFAULT now()
            );
        `);
        console.log("✅ Table 'sms_jobs' created or already exists.");

        // 2. Patch sms_configurations
        await client.query(`
            DO $$ 
            BEGIN 
                BEGIN
                    ALTER TABLE "sms_configurations" ADD COLUMN "credit_threshold" integer DEFAULT 500;
                EXCEPTION
                    WHEN duplicate_column THEN RAISE NOTICE 'column credit_threshold already exists in sms_configurations';
                END;
                
                BEGIN
                    ALTER TABLE "sms_configurations" ADD COLUMN "low_credit_alert_sent" boolean DEFAULT false;
                EXCEPTION
                    WHEN duplicate_column THEN RAISE NOTICE 'column low_credit_alert_sent already exists in sms_configurations';
                END;
            END $$;
        `);
        console.log("✅ Table 'sms_configurations' patched with credit monitoring columns.");

        console.log("\n🎊 Phase 4 Migration Successful!");

    } catch (err) {
        console.error("❌ Migration Failed:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
