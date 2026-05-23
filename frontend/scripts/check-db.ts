import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const DB_URL = process.env.DATABASE_URL || "postgresql://postgres:pakistansuthrapunjab@115.186.170.43:5432/global_access";

async function check() {
    console.log("🚀 Checking Database Status...");
    const client = new Client({ connectionString: DB_URL });
    
    try {
        await client.connect();
        console.log("✅ Connected to PostgreSQL.");

        const tables = ['agents', 'tools', 'tool_assignments', 'complaints'];
        for (const table of tables) {
            const res = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = $1
                );
            `, [table]);
            console.log(`- Table '${table}': ${res.rows[0].exists ? '✅ FOUND' : '❌ MISSING'}`);
        }

        // Check assigned tools for Sarah (Pioneer)
        const sarahId = 'ag_u5q4ujfji_sarah-pioneer-urdu-punjabi'; // Approximate ID
        // Let's find the correct ID first
        const sarahRes = await client.query("SELECT id, name FROM agents WHERE name LIKE '%Sarah (Pioneer)%' LIMIT 1");
        if (sarahRes.rows.length > 0) {
            const actualId = sarahRes.rows[0].id;
            console.log(`\n🔍 Checking assignments for Agent ID: ${actualId} (${sarahRes.rows[0].name})`);
            
            // Check tool_assignments table
            const assignmentsRes = await client.query("SELECT tool_id FROM tool_assignments WHERE agent_id = $1", [actualId]);
            console.log(`- Tool Assignments (DB Table): ${assignmentsRes.rows.length} tools found.`);
            assignmentsRes.rows.forEach(r => console.log(`  - ${r.tool_id}`));

            // Check toolsConfig column in agents table (if exists)
            const configRes = await client.query("SELECT \"toolsConfig\" FROM agents WHERE id = $1", [actualId]);
            if (configRes.rows.length > 0) {
                const config = configRes.rows[0].toolsConfig || [];
                console.log(`- toolsConfig (JSONB column): ${config.length} entries.`);
                console.log(JSON.stringify(config, null, 2));
            }
        }

    } catch (err) {
        console.error("❌ Error during check:", err);
    } finally {
        await client.end();
    }
}

check();
