import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
worker_dir = Path(__file__).parent
load_dotenv(worker_dir / ".env")

# Use DATABASE_URL from frontend/.env.local if not in .env
database_url = os.getenv("DATABASE_URL")
if not database_url:
    # Try to find it in the project root or frontend dir
    try:
        frontend_env = worker_dir.parent / "frontend" / ".env.local"
        if frontend_env.exists():
            with open(frontend_env, "r") as f:
                for line in f:
                    if line.startswith("DATABASE_URL="):
                        database_url = line.strip().split("=", 1)[1].strip('"')
                        break
    except Exception:
        pass

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

def sync_agents():
    print(f"Connecting to PostgreSQL...")
    try:
        conn = psycopg2.connect(database_url)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        print(f"Fetching agents from database...")
        cur.execute("SELECT * FROM agents")
        agents = cur.fetchall()
        
        print(f"Connecting to Redis at {redis_url}...")
        r = redis.from_url(redis_url, decode_responses=True)
        
        # Clear existing agent keys to ensure consistency
        existing_keys = r.keys("agent:*")
        if existing_keys:
            print(f"Clearing {len(existing_keys)} existing agent keys...")
            r.delete(*existing_keys)

        print(f"Synchronizing {len(agents)} agents...")
        
        for agent in agents:
            # Map database columns to worker-expected JSON structure
            agent_data = {
                "id": agent["id"],
                "name": agent["name"],
                "slug": agent["slug"],
                "status": agent["status"],
                "system_prompt": agent["system_prompt"],
                "initial_greeting": agent["initial_greeting"],
                "knowledge_base": agent["knowledge_base"],
                "tool_instructions": agent["tool_instructions"],
                "pipeline_mode": agent["pipeline_mode"],
                "llm_config": {
                    "provider": agent["llm_provider"],
                    "model": agent["llm_model"],
                    "temperature": float(agent["llm_temperature"]) if agent["llm_temperature"] else 0.8,
                    "azure_deployment": agent["llm_azure_deployment"]
                },
                "stt_config": {
                    "provider": agent["stt_provider"],
                    "model": agent["stt_model"],
                    "language": agent["stt_language"],
                    "responsiveness": float(agent["stt_responsiveness"]) if agent["stt_responsiveness"] else 0.6,
                    "detect_language": agent["stt_detect_language"],
                    "custom_vocab": agent["stt_custom_vocab"],
                    "smart_formatting": agent["stt_smart_formatting"],
                    "remove_fillers": agent["stt_remove_fillers"],
                    "azure_deployment": agent["stt_azure_deployment"]
                },
                "tts_config": {
                    "provider": agent["tts_provider"],
                    "model": agent["tts_model"],
                    "voice": agent["tts_voice_id"], # Note: worker uses 'voice' key in tts_config
                    "language": agent["tts_language"],
                    "speed": float(agent["tts_speed"]) if agent["tts_speed"] else 1.0,
                    "stability": float(agent["elevenlabs_stability"]) if agent["elevenlabs_stability"] else 0.5,
                    "similarity": float(agent["elevenlabs_similarity"]) if agent["elevenlabs_similarity"] else 0.75,
                    "azure_deployment": agent["tts_azure_deployment"]
                },
                "realtime_config": {
                    "enabled": agent["pipeline_mode"] == "realtime",
                    "provider": agent["rt_provider"],
                    "model": agent["rt_model"],
                    "voice": agent["rt_voice"],
                    "language": agent["rt_language"],
                    "modalities": agent["rt_modalities"],
                    "proactivity": agent["rt_proactivity"],
                    "affective_dialog": agent["rt_affective_dialog"],
                    "noise_reduction": agent["rt_noise_reduction"],
                    "thinking_budget": agent["rt_thinking_budget"],
                    "max_output_tokens": agent["rt_max_output_tokens"],
                    "top_p": float(agent["rt_top_p"]) if agent["rt_top_p"] else None,
                    "temperature": float(agent["rt_temperature"]) if agent["rt_temperature"] else 0.8,
                    "speed": float(agent["rt_speed"]) if agent["rt_speed"] else 1.0,
                    "turn_detection": agent["rt_turn_detection"],
                    "turn_detection_eagerness": agent["rt_turn_detection_eagerness"],
                    "ctx_compression_enabled": agent["rt_ctx_compression_enabled"],
                    "ctx_compression_trigger": agent["rt_ctx_compression_trigger"],
                    "ctx_compression_target": agent["rt_ctx_compression_target"],
                    "azure_deployment": agent["rt_azure_deployment"]
                },
                "tools_config": agent["tools_config"] if isinstance(agent["tools_config"], list) else [],
                "extra_config": agent["extra_config"] if isinstance(agent["extra_config"], dict) else {}
            }
            
            # Store in Redis
            agent_json = json.dumps(agent_data)
            r.set(f"agent:{agent['id']}", agent_json)
            r.set(f"agent:{agent['slug']}", agent_json)
            print(f"  - Synced agent: {agent['name']} ({agent['slug']}) [Status: {agent['status']}]")
            
        print(f"\nFetching dispatch rules from database...")
        cur.execute("""
            SELECT dr.agent_id, pn.number 
            FROM dispatch_rules dr
            JOIN phone_numbers pn ON dr.phone_number_id = pn.id
        """)
        rules = cur.fetchall()
        
        # Clear existing rule keys
        existing_rule_keys = r.keys("dispatch_rule:*")
        if existing_rule_keys:
            print(f"Clearing {len(existing_rule_keys)} existing dispatch rules...")
            r.delete(*existing_rule_keys)
            
        for rule in rules:
            r.set(f"dispatch_rule:{rule['number']}", rule['agent_id'])
            print(f"  - Synced rule: {rule['number']} -> {rule['agent_id']}")

        print(f"\n✅ Synchronization complete.")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error during synchronization: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    sync_agents()
