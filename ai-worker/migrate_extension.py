import psycopg2

DB_URL = 'postgresql://postgres:pakistansuthrapunjab@115.186.170.43:5432/global_access'

def add_extension_column():
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        # Add escalation_extension column to agents table
        sql = "ALTER TABLE agents ADD COLUMN IF NOT EXISTS escalation_extension TEXT DEFAULT 'sip:101@172.29.24.63';"
        cur.execute(sql)
        print("Agents table updated with escalation_extension column.")
        
        conn.commit()
        cur.close()
        conn.close()
        print("Database Extension Migration Successful!")
    except Exception as e:
        print(f"Migration Failed: {e}")

if __name__ == "__main__":
    add_extension_column()
