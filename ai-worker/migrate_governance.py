import psycopg2
import os
from pathlib import Path

# Database URL
db_url = "postgresql://postgres:pakistansuthrapunjab@115.186.170.43:5432/global_access"

sql_commands = [
    "ALTER TABLE agents ADD COLUMN IF NOT EXISTS outbound_batch_limit INTEGER DEFAULT 5;",
    "ALTER TABLE agents ADD COLUMN IF NOT EXISTS outbound_retry_interval INTEGER DEFAULT 120;",
    "ALTER TABLE agents ADD COLUMN IF NOT EXISTS outbound_max_retries INTEGER DEFAULT 3;",
    "ALTER TABLE agents ADD COLUMN IF NOT EXISTS outbound_allowed_start TEXT DEFAULT '09:00';",
    "ALTER TABLE agents ADD COLUMN IF NOT EXISTS outbound_allowed_end TEXT DEFAULT '20:00';"
]

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    for cmd in sql_commands:
        print(f"Executing: {cmd}")
        cur.execute(cmd)
    conn.commit()
    print("Migration successful!")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Migration failed: {e}")
