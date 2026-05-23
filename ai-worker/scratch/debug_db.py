import os
import psycopg2
from psycopg2.extras import RealDictCursor

db_url = "postgresql://postgres:pakistansuthrapunjab@115.186.170.43:5432/global_access"
caller_phone = "+923044749779"

def _sync_query():
    phone_no_plus = caller_phone.replace("+", "")
    phone_local = "0" + phone_no_plus[2:] if phone_no_plus.startswith("92") else None
    
    conn = psycopg2.connect(db_url, cursor_factory=RealDictCursor)
    try:
        with conn.cursor() as cur:
            # First, just see the 10 most recent tickets for this asterisk_number
            print(f"--- Recent tickets for asterisk_number {phone_local} ---")
            cur.execute("""
                SELECT id, ticket_id, name, phone, asterisk_number, status, created_at 
                FROM complaints 
                WHERE asterisk_number = %s OR asterisk_number = %s
                ORDER BY created_at DESC LIMIT 10
            """, (phone_local, phone_no_plus))
            rows = cur.fetchall()
            for r in rows:
                # Convert datetime to string for easier printing
                r['created_at'] = str(r['created_at'])
                print(r)
            
            # Now see what the current query returns
            print(f"\n--- Current query result for {caller_phone} ---")
            cur.execute("""
                SELECT ticket_id, name, phone, asterisk_number, status, created_at FROM complaints
                WHERE (phone = %s OR phone = %s OR phone = %s)
                AND LOWER(status) NOT IN ('resolved', 'closed')
                ORDER BY created_at DESC LIMIT 1
            """, (caller_phone, phone_no_plus, phone_local or phone_no_plus))
            row = cur.fetchone()
            if row:
                row['created_at'] = str(row['created_at'])
            print(row)
            
    finally:
        conn.close()

if __name__ == "__main__":
    _sync_query()
