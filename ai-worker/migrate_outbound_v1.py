import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def migrate():
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("Error: DATABASE_URL not found in .env")
        return

    commands = [
        # Agents Table additions
        "ALTER TABLE agents ADD COLUMN IF NOT EXISTS outbound_greeting_text TEXT;",
        "ALTER TABLE agents ADD COLUMN IF NOT EXISTS outbound_greeting_wav TEXT;",
        "ALTER TABLE agents ADD COLUMN IF NOT EXISTS resolved_farewell_text TEXT;",
        "ALTER TABLE agents ADD COLUMN IF NOT EXISTS resolved_farewell_wav TEXT;",
        "ALTER TABLE agents ADD COLUMN IF NOT EXISTS unresolved_farewell_text TEXT;",
        "ALTER TABLE agents ADD COLUMN IF NOT EXISTS unresolved_farewell_wav TEXT;",
        
        # Complaints Table additions
        "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS outbound_status VARCHAR(255) DEFAULT 'pending';",
        "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS citizen_feedback VARCHAR(255);",
        "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS outbound_retry_count INTEGER DEFAULT 0;",
        "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS last_called_at TIMESTAMP;"
    ]

    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        for cmd in commands:
            print(f"Executing: {cmd}")
            cur.execute(cmd)
        
        conn.commit()
        print("Migration completed successfully.")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
