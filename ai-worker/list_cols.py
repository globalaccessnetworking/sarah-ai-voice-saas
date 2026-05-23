import psycopg2

DB_URL = 'postgresql://postgres:pakistansuthrapunjab@115.186.170.43:5432/global_access'

def list_columns():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    
    cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'agents'")
    cols = cur.fetchall()
    
    print("\n--- AGENTS TABLE COLUMNS ---")
    for col in cols:
        print(f"{col[0]} ({col[1]})")
        
    cur.close()
    conn.close()

if __name__ == "__main__":
    list_columns()
