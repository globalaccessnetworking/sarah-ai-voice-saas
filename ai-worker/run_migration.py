import psycopg2

DB_URL = 'postgresql://postgres:pakistansuthrapunjab@115.186.170.43:5432/global_access'

def run_migration():
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        # 1. Add SaaS columns to agents table
        sql_agents = """
        ALTER TABLE agents 
        ADD COLUMN IF NOT EXISTS escalation_triggers TEXT DEFAULT 'Billing, Bills, Electricity Bill, excessive charges, frustrated, abusive',
        ADD COLUMN IF NOT EXISTS escalation_speech TEXT DEFAULT 'میں سمجھتی ہوں۔ میں آپ کی کال ایک نمائندے کو ٹرانسفر کر رہی ہوں۔',
        ADD COLUMN IF NOT EXISTS hangup_triggers TEXT DEFAULT 'Goodbye, Allah Hafiz, Thank you, bye',
        ADD COLUMN IF NOT EXISTS hangup_speech TEXT DEFAULT 'پنجاب ہیلپ لائن پر رابطہ کرنے کا شکریہ۔ اللہ حافظ!';
        """
        cur.execute(sql_agents)
        print("Agents table migrated.")
        
        # 2. Create complaints table
        sql_complaints = """
        CREATE TABLE IF NOT EXISTS complaints (
            id SERIAL PRIMARY KEY,
            name TEXT,
            phone TEXT,
            district TEXT,
            address TEXT,
            landmark TEXT,
            issue TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        cur.execute(sql_complaints)
        print("Complaints table created.")
        
        conn.commit()
        cur.close()
        conn.close()
        print("SaaS Database Migration Successful!")
    except Exception as e:
        print(f"Migration Failed: {e}")

if __name__ == "__main__":
    run_migration()
