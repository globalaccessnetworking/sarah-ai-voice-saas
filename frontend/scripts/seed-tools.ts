import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const DB_URL = process.env.DATABASE_URL || "postgresql://postgres:pakistansuthrapunjab@115.186.170.43:5432/global_access";

const ENTERPRISE_TOOLS = [
    {
        id: "tl_esc_101",
        name: "Escalate to Specialist",
        description: "Seamlessly transfer the citizen to a human representative (Ext 101) for advanced support.",
        type: "native",
        endpoint_url: null,
        parameters_schema: {
            category: "communication",
            action: "transfer",
            speech: "براہ کرم تھوڑا انتظار کریں، میں آپ کی کال متعلقہ نمائندے کو ٹرانسفر کر رہی ہوں۔"
        }
    },
    {
        id: "tl_ext_trans",
        name: "External Number Transfer",
        description: "Blind transfer the current caller to any external mobile or landline number.",
        type: "native",
        endpoint_url: null,
        parameters_schema: {
            category: "communication",
            action: "blind_transfer"
        }
    },
    {
        id: "tl_rec_compliance",
        name: "Compliance Recording",
        description: "Trigger an encrypted session recording for quality and compliance purposes.",
        type: "native",
        endpoint_url: null,
        parameters_schema: {
            category: "system",
            action: "start_recording"
        }
    },
    {
        id: "tl_bill_mtrx",
        name: "Citizen Billing & Arrears",
        description: "Real-time lookup of municipal billing records, taxes, and payment history by CNIC or Phone.",
        type: "webhook",
        endpoint_url: "http://115.186.170.43:3000/api/mock/billing",
        parameters_schema: {
            category: "data"
        }
    },
    {
        id: "tl_knw_core",
        name: "Enterprise Knowledge Core",
        description: "High-speed semantic search across the entire municipal knowledge base (SOPs, Laws, Procedures).",
        type: "static",
        endpoint_url: null,
        parameters_schema: {
            category: "data"
        }
    },
    {
        id: "tl_sms_relay",
        name: "Global SMS Relay",
        description: "Send instant Urdu/English SMS alerts to the caller with ticket numbers or payment links.",
        type: "static",
        endpoint_url: null,
        parameters_schema: {
            category: "communication"
        }
    },
    {
        id: "tl_crm_notes",
        name: "Enterprise CRM Sync",
        description: "Automatically sync call summaries and citizen feedback into the central CRM system.",
        type: "static",
        endpoint_url: null,
        parameters_schema: {
            category: "system"
        }
    }
];

async function seed() {
    console.log("🚀 Initializing Enterprise Tool Seeding (Node.js)...");
    const client = new Client({ connectionString: DB_URL });
    
    try {
        await client.connect();
        console.log("✅ Connected to PostgreSQL.");

        for (const tool of ENTERPRISE_TOOLS) {
            console.log(`➕ Processing Tool: ${tool.name}`);
            await client.query(`
                INSERT INTO tools (id, name, description, type, endpoint_url, parameters_schema, enabled, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
                ON CONFLICT (id) DO UPDATE 
                SET name = EXCLUDED.name, 
                    description = EXCLUDED.description, 
                    type = EXCLUDED.type, 
                    endpoint_url = EXCLUDED.endpoint_url, 
                    parameters_schema = EXCLUDED.parameters_schema, 
                    updated_at = NOW();
            `, [tool.id, tool.name, tool.description, tool.type, tool.endpoint_url, tool.parameters_schema]);
        }

        console.log("\n🎉 Seeding Complete! Refresh your Dashboard.");
    } catch (err) {
        console.error("❌ Error during seeding:", err);
    } finally {
        await client.end();
    }
}

seed();
