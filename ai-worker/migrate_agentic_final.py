import psycopg2
import json

DB_URL = 'postgresql://postgres:pakistansuthrapunjab@115.186.170.43:5432/global_access'

def verify_and_migrate():
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        # 1. Check for tools_config in agents
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'agents'")
        agent_cols = [row[0] for row in cur.fetchall()]
        print("Agents Columns:", agent_cols)
        
        if 'tools_config' not in agent_cols:
            print("Missing 'tools_config' column in agents. Adding it now...")
            # Note: The user said 'existing tool_config JSONB column', but my previous list showed 'tools_config' (plural).
            # I will ensure 'tools_config' exists as JSONB.
            cur.execute("ALTER TABLE agents ADD COLUMN IF NOT EXISTS tools_config JSONB DEFAULT '{}';")
        
        # 2. Update complaints table
        print("Updating complaints table schema...")
        cur.execute("""
            ALTER TABLE complaints 
            ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending',
            ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Normal',
            ADD COLUMN IF NOT EXISTS notes TEXT,
            ADD COLUMN IF NOT EXISTS ticket_id TEXT;
        """)
        
        # 3. Create knowledge_base table
        print("Creating knowledge_base table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS knowledge_base (
                id SERIAL PRIMARY KEY,
                agent_id TEXT REFERENCES agents(id),
                category TEXT,
                question TEXT,
                answer TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        conn.commit()
        cur.close()
        conn.close()
        print("Sovereign Agentic Migration Successful!")
    except Exception as e:
        print(f"Migration Failed: {e}")

if __name__ == "__main__":
    verify_and_migrate()
