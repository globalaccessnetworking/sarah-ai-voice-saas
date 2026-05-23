import psycopg2
import json

DB_URL = 'postgresql://postgres:pakistansuthrapunjab@115.186.170.43:5432/global_access'

def verify_migration():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    
    # Check agents table columns
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'agents'")
    cols = [row[0] for row in cur.fetchall()]
    print("Agents Columns:", cols)
    
    # Check for complaints table
    cur.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'complaints')")
    exists = cur.fetchone()[0]
    print("Complaints Table Exists:", exists)
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    verify_migration()
