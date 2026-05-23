import os
import json
import redis
import asyncpg
import logging

logger = logging.getLogger("ai_worker.services.agent_storage")

DB_URL = os.getenv("DATABASE_URL")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Use a connection pool for Redis to prevent 'Bad file descriptor' errors
redis_pool = redis.ConnectionPool.from_url(REDIS_URL, decode_responses=True, socket_keepalive=True)

def get_redis_client():
    return redis.Redis(connection_pool=redis_pool)

def is_redis_available():
    try:
        client = get_redis_client()
        return client.ping()
    except:
        return False

async def get_all_agents():
    """
    Fetches all agents directly from PostgreSQL (Sovereign Dashboard Sync).
    Returns nested config (llm_config, stt_config, tts_config) for worker compatibility.
    """
    if not DB_URL:
        logger.error("DATABASE_URL not set. Falling back to empty agent list.")
        return []

    try:
        conn = await asyncpg.connect(DB_URL)
        try:
            rows = await conn.fetch("""
                SELECT 
                    id, name, slug, system_prompt, initial_greeting, knowledge_base, 
                    tool_instructions, status, pipeline_mode, 
                    llm_provider, llm_model, llm_temperature,
                    stt_provider, stt_model, stt_language, stt_responsiveness, stt_custom_vocab,
                    tts_provider, tts_model, tts_voice_id,
                    eligibility_rules,
                    tools_config as "toolsConfig", extra_config as "extra_config"
                FROM agents
            """)
            
            agents = []
            for row in rows:
                raw = dict(row)
                
                # Transform flat DB row into nested dictionary
                agent = {
                    "id": raw.get("id"),
                    "name": raw.get("name"),
                    "slug": raw.get("slug"),
                    "system_prompt": raw.get("system_prompt"),
                    "initial_greeting": raw.get("initial_greeting"),
                    "knowledge_base": raw.get("knowledge_base"),
                    "tool_instructions": raw.get("tool_instructions"),
                    "status": raw.get("status"),
                    "pipeline_mode": raw.get("pipeline_mode"),
                    "llm_config": {
                        "provider": raw.get("llm_provider"),
                        "model": raw.get("llm_model"),
                        "temperature": float(raw.get("llm_temperature", 0.8))
                    },
                    "stt_config": {
                        "provider": raw.get("stt_provider"),
                        "model": raw.get("stt_model"),
                        "language": raw.get("stt_language"),
                        "responsiveness": float(raw.get("stt_responsiveness", 0.6)),
                        "custom_vocab": raw.get("stt_custom_vocab"),
                    },
                    "tts_config": {
                        "provider": raw.get("tts_provider"),
                        "model": raw.get("tts_model"),
                        "voice_id": raw.get("tts_voice_id")
                    },
                    "extra_config": raw.get("extra_config") or {}
                }

                # Extract and parse toolsConfig
                tc = raw.get("toolsConfig")
                if isinstance(tc, str):
                    try: tc = json.loads(tc)
                    except: tc = {}
                elif tc is None: tc = {}
                
                agent["tools_config"] = tc

                if isinstance(tc, list):
                    tool_ids = []
                    for item in tc:
                        if isinstance(item, dict):
                            t_id = item.get("id") or item.get("toolId")
                            if t_id: tool_ids.append(t_id)
                        elif isinstance(item, str):
                            tool_ids.append(item)
                    agent["toolsConfig"] = tool_ids
                else:
                    agent["toolsConfig"] = []

                agents.append(agent)
            
            logger.info(f"Fetched {len(agents)} agents from PostgreSQL (Resilient Tool Sync).")
            return agents
        finally:
            await conn.close()
    except Exception as e:
        logger.error(f"Error fetching all agents: {e}")
        return []

async def get_agent_config_by_id_or_slug(id_or_slug: str):
    """
    Fetches a specific agent configuration by its ID or Slug.
    Used for real-time dynamic configuration loading per job.
    """
    if not DB_URL or not id_or_slug:
        return None

    try:
        conn = await asyncpg.connect(DB_URL)
        try:
            # Try lookup by ID first, then by slug
            row = await conn.fetchrow("""
                SELECT 
                    id, name, slug, system_prompt, initial_greeting, knowledge_base, 
                    tool_instructions, status, pipeline_mode, 
                    llm_provider, llm_model, llm_temperature,
                    stt_provider, stt_model, stt_language, stt_responsiveness, stt_custom_vocab,
                    tts_provider, tts_model, tts_voice_id,
                    eligibility_rules,
                    tools_config as "toolsConfig", extra_config as "extra_config"
                FROM agents
                WHERE id = $1 OR slug = $1
                LIMIT 1
            """, id_or_slug)
            
            if not row:
                return None
                
            raw = dict(row)
            return _transform_agent_row(raw)
        finally:
            await conn.close()
    except Exception as e:
        logger.error(f"Error fetching specific agent {id_or_slug}: {e}")
        return None

async def get_first_running_agent():
    """
    Fetches the first agent with status 'running' from the database.
    Used as a smart fallback for specialized workers when no routing slug is provided.
    """
    if not DB_URL:
        return None

    try:
        conn = await asyncpg.connect(DB_URL)
        try:
            row = await conn.fetchrow("""
                SELECT 
                    id, name, slug, system_prompt, initial_greeting, knowledge_base, 
                    tool_instructions, status, pipeline_mode, 
                    llm_provider, llm_model, llm_temperature,
                    stt_provider, stt_model, stt_language, stt_responsiveness, stt_custom_vocab,
                    tts_provider, tts_model, tts_voice_id,
                    eligibility_rules,
                    tools_config as "toolsConfig", extra_config as "extra_config"
                FROM agents
                WHERE status = 'running'
                ORDER BY created_at ASC
                LIMIT 1
            """)
            
            if not row:
                return None
                
            raw = dict(row)
            return _transform_agent_row(raw)
        finally:
            await conn.close()
    except Exception as e:
        logger.error(f"Error fetching first running agent: {e}")
        return None

def _transform_agent_row(raw):
    """Internal helper to transform flat DB row into nested dictionary"""
    agent = {
        "id": raw.get("id"),
        "name": raw.get("name"),
        "slug": raw.get("slug"),
        "system_prompt": raw.get("system_prompt"),
        "initial_greeting": raw.get("initial_greeting"),
        "knowledge_base": raw.get("knowledge_base"),
        "tool_instructions": raw.get("tool_instructions"),
        "status": raw.get("status"),
        "pipeline_mode": raw.get("pipeline_mode"),
        "llm_config": {
            "provider": raw.get("llm_provider"),
            "model": raw.get("llm_model"),
            "temperature": float(raw.get("llm_temperature", 0.8))
        },
        "stt_config": {
            "provider": raw.get("stt_provider"),
            "model": raw.get("stt_model"),
            "language": raw.get("stt_language"),
            "responsiveness": float(raw.get("stt_responsiveness", 0.6)),
            "custom_vocab": raw.get("stt_custom_vocab"),
        },
        "tts_config": {
            "provider": raw.get("tts_provider"),
            "model": raw.get("tts_model"),
            "voice_id": raw.get("tts_voice_id")
        },
        "eligibility_rules": (json.loads(raw.get("eligibility_rules")) if isinstance(raw.get("eligibility_rules"), str) else (raw.get("eligibility_rules") or {})),
        "extra_config": raw.get("extra_config") or {}
    }

    tc = raw.get("toolsConfig")
    if isinstance(tc, str):
        try: tc = json.loads(tc)
        except: tc = {}
    elif tc is None: tc = {}
    agent["tools_config"] = tc

    if isinstance(tc, list):
        tool_ids = []
        for item in tc:
            if isinstance(item, dict):
                t_id = item.get("id") or item.get("toolId")
                if t_id: tool_ids.append(t_id)
            elif isinstance(item, str):
                tool_ids.append(item)
        agent["toolsConfig"] = tool_ids
    else:
        agent["toolsConfig"] = []

    return agent

def get_agents_from_redis_legacy():
    logger.warning("Falling back to legacy Redis agent storage.")
    client = get_redis_client()
    try:
        keys = client.keys("agent:*")
        agents = []
        for key in keys:
            data = client.get(key)
            if data:
                agents.append(json.loads(data))
        return agents
    except Exception as e:
        logger.error(f"Error fetching agents from Redis: {e}")
        return []

def get_min_duration_settings(): return {}
def get_ai_summary_settings(): return {"auto_generate": False}
