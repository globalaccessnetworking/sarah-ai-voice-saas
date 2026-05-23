import os
import json
from sqlalchemy import create_engine, inspect
from dotenv import load_dotenv

load_dotenv()

def get_schema():
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        return "DATABASE_URL not found in .env"
    
    engine = create_engine(db_url)
    insp = inspect(engine)
    
    schema = {}
    for table in ['agents', 'complaints']:
        try:
            columns = insp.get_columns(table)
            schema[table] = [c['name'] for c in columns]
        except Exception as e:
            schema[table] = f"Error: {e}"
            
    return schema

if __name__ == "__main__":
    print(json.dumps(get_schema(), indent=2))
