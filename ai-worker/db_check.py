import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def check_tables():
    db_url = os.getenv('DATABASE_URL')
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    tables = ['agents', 'complaints']
    for table in tables:
        print(f"\nTable: {table}")
        cur.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table}'")
        cols = cur.fetchall()
        for col in cols:
            print(f"  - {col[0]} ({col[1]})")
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    check_tables()
