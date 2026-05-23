import asyncio
import asyncpg
import os
import uuid

# Configuration — Environment MUST have DATABASE_URL
DB_URL = "postgresql://postgres:pakistansuthrapunjab@115.186.170.43:5432/global_access"

# Professional Core Tools to be Seeded
ENTERPRISE_TOOLS = [
    {
        "id": "tl_esc_101",
        "name": "Escalate to Specialist",
        "description": "Seamlessly transfer the citizen to a human representative (Ext 101) for advanced support.",
        "type": "native",
        "endpoint_url": None,
        "parameters_schema": {
            "category": "communication",
            "action": "transfer",
            "speech": "براہ کرم تھوڑا انتظار کریں، میں آپ کی کال متعلقہ نمائندے کو ٹرانسفر کر رہی ہوں۔"
        }
    },
    {
        "id": "tl_ext_trans",
        "name": "External Number Transfer",
        "description": "Blind transfer the current caller to any external mobile or landline number.",
        "type": "native",
        "endpoint_url": None,
        "parameters_schema": {
            "category": "communication",
            "action": "blind_transfer"
        }
    },
    {
        "id": "tl_rec_compliance",
        "name": "Compliance Recording",
        "description": "Trigger an encrypted session recording for quality and compliance purposes.",
        "type": "native",
        "endpoint_url": None,
        "parameters_schema": {
            "category": "system",
            "action": "start_recording"
        }
    },
    {
        "id": "tl_bill_mtrx",
        "name": "Citizen Billing & Arrears",
        "description": "Real-time lookup of municipal billing records, taxes, and payment history by CNIC or Phone.",
        "type": "webhook",
        "endpoint_url": "http://115.186.170.43:3000/api/mock/billing",
        "parameters_schema": {
            "category": "data"
        }
    },
    {
        "id": "tl_knw_core",
        "name": "Enterprise Knowledge Core",
        "description": "High-speed semantic search across the entire municipal knowledge base (SOPs, Laws, Procedures).",
        "type": "static",
        "endpoint_url": None,
        "parameters_schema": {
            "category": "data"
        }
    },
    {
        "id": "tl_sms_relay",
        "name": "Global SMS Relay",
        "description": "Send instant Urdu/English SMS alerts to the caller with ticket numbers or payment links.",
        "type": "static",
        "endpoint_url": None,
        "parameters_schema": {
            "category": "communication"
        }
    },
    {
        "id": "tl_crm_notes",
        "name": "Enterprise CRM Sync",
        "description": "Automatically sync call summaries and citizen feedback into the central CRM system.",
        "type": "static",
        "endpoint_url": None,
        "parameters_schema": {
            "category": "system"
        }
    }
]

async def seed_tools():
    print("🚀 Initializing Enterprise Tool Seeding...")
    try:
        conn = await asyncpg.connect(DB_URL)
        print("✅ Connected to PostgreSQL.")
        
        for tool in ENTERPRISE_TOOLS:
            # Check if exists
            exists = await conn.fetchval("SELECT COUNT(*) FROM tools WHERE id = $1", tool["id"])
            if exists:
                print(f"ℹ️ Tool '{tool['name']}' already exists. Updating...")
                await conn.execute("""
                    UPDATE tools 
                    SET name = $2, description = $3, type = $4, endpoint_url = $5, parameters_schema = $6, updated_at = NOW()
                    WHERE id = $1
                """, tool["id"], tool["name"], tool["description"], tool["type"], tool["endpoint_url"], tool["parameters_schema"])
            else:
                print(f"➕ Adding Tool: {tool['name']}")
                await conn.execute("""
                    INSERT INTO tools (id, name, description, type, endpoint_url, parameters_schema)
                    VALUES ($1, $2, $3, $4, $5, $6)
                """, tool["id"], tool["name"], tool["description"], tool["type"], tool["endpoint_url"], tool["parameters_schema"])
        
        print("\n🎉 Seeding Complete! Refresh your Dashboard to see the new Enterprise Tool Suite.")
        await conn.close()
    except Exception as e:
        print(f"❌ Error during seeding: {e}")

if __name__ == "__main__":
    asyncio.run(seed_tools())
