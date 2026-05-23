const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function applyMigration() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();
        console.log('Connected to DB');
        
        console.log('Adding duration column...');
        await client.query('ALTER TABLE "call_logs" ADD COLUMN IF NOT EXISTS "duration" integer DEFAULT 0;');
        
        console.log('Adding total_cost column...');
        await client.query('ALTER TABLE "call_logs" ADD COLUMN IF NOT EXISTS "total_cost" numeric(10, 2) DEFAULT \'0.00\';');
        
        console.log('Schema successfully updated!');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await client.end();
    }
}

applyMigration();
