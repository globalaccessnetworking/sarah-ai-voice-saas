import json
import logging
import os
import redis
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# --- Configuration & Logging ---
load_dotenv()
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("RedisRehydration")

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))

DATABASE_URL = os.getenv("DATABASE_URL")

def rehydrate():
    if not DATABASE_URL:
        logger.error("DATABASE_URL not set in environment. Cannot rehydrate.")
        return

    redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True)
    
    try:
        # 1. Connect to PostgreSQL
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # 2. Fetch all dispatch rules
        cursor.execute("SELECT * FROM dispatch_rules")
        rules = cursor.fetchall()
        
        if not rules:
            logger.info("No dispatch rules found in database to rehydrate.")
            return

        # 3. Fetch Agents to resolve slugs
        cursor.execute("SELECT id, slug, name FROM agents")
        agents = {str(a['id']): a for a in cursor.fetchall()}
        
        # 4. Sync to Redis
        count = 0
        for rule in rules:
            did = rule.get('did')
            if not did:
                continue
                
            agent_id = str(rule.get('agent_id'))
            agent = agents.get(agent_id)
            
            # Build payload mimicking what the webhook expects
            payload = {
                "did": did,
                "agent_id": agent_id,
                "agent_slug": agent.get('slug') if agent else None,
                "agent_name": agent.get('name') if agent else None,
                "sip_trunk_id": rule.get('sip_trunk_id'),
                "priority": rule.get('priority', 0),
                "active": rule.get('active', True),
                "created_at": str(rule.get('created_at'))
            }
            
            redis_key = f"dispatch_rule:{did}"
            redis_client.set(redis_key, json.dumps(payload))
            count += 1
            
        logger.info(f"Successfully rehydrated {count} dispatch rules to Redis.")
        
    except Exception as e:
        logger.error(f"Failed to rehydrate Redis: {e}")
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    rehydrate()
