import os
import json
import logging
from typing import Optional, Any, Dict
from app.services.agent_storage import get_redis_client

logger = logging.getLogger("config-service")

class ConfigService:
    _instance = None
    _cache: Dict[str, Any] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ConfigService, cls).__new__(cls)
        return cls._instance

    def get_integration(self, provider: str) -> Dict[str, Any]:
        """
        Fetch integration settings for a provider from Redis.

        Priority (GUI is the absolute source of truth):
          1. integration:{provider}  — string key written by the frontend GUI Save action
          2. api_keys hash           — raw key hash also written by the frontend GUI
          3. system:integrations     — legacy hash (kept for backward compatibility)
          4. .env file               — final fallback, never removed

        Falls back to environment variables if nothing is found in Redis.
        """
        provider = provider.lower()

        try:
            r = get_redis_client()
            if r:
                # --- TIER 1: GUI primary key (integration:{provider}) ---
                raw = r.get(f"integration:{provider}")
                if raw:
                    try:
                        data = json.loads(raw)
                        api_key = data.get("api_key") or data.get("apiKey")
                        if api_key:
                            logger.debug(f"[ConfigService] GUI key resolved for '{provider}' via integration: prefix")
                            return {
                                "provider_name": provider,
                                "api_key": api_key,
                                "config_json": {k: v for k, v in data.items() if k not in ("api_key", "apiKey")},
                                "region": data.get("region"),
                                "is_active": data.get("isActive", True),
                            }
                    except (json.JSONDecodeError, Exception) as e:
                        logger.warning(f"[ConfigService] Failed to parse integration:{provider} — {e}")

                # --- TIER 2: GUI secondary key (api_keys hash) ---
                raw_key = r.hget("api_keys", provider)
                if raw_key:
                    api_key = raw_key if isinstance(raw_key, str) else raw_key.decode("utf-8", errors="replace")
                    if api_key:
                        logger.debug(f"[ConfigService] GUI key resolved for '{provider}' via api_keys hash")
                        return {
                            "provider_name": provider,
                            "api_key": api_key,
                            "config_json": {},
                            "region": None,
                            "is_active": True,
                        }

                # --- TIER 3: Legacy system:integrations hash (backward compat) ---
                legacy = r.hget("system:integrations", provider)
                if legacy:
                    try:
                        integration = json.loads(legacy)
                        if integration.get("is_active"):
                            logger.debug(f"[ConfigService] Key resolved for '{provider}' via legacy system:integrations hash")
                            return integration
                    except Exception:
                        pass

        except Exception as e:
            logger.error(f"[ConfigService] Redis lookup failed for '{provider}': {e}")

        # --- TIER 4: .env file fallback ---
        logger.debug(f"[ConfigService] Falling back to .env for '{provider}'")
        return self._get_env_fallback(provider)

    def _get_env_fallback(self, provider: str) -> Dict[str, Any]:
        """Map legacy environment variables to the standard integration format."""
        integration = {
            "provider_name": provider,
            "api_key": None,
            "config_json": {},
            "region": None,
            "is_active": True
        }

        if provider == "openai":
            integration["api_key"] = os.getenv("OPENAI_API_KEY")
        elif provider == "deepgram":
            integration["api_key"] = os.getenv("DEEPGRAM_API_KEY")
        elif provider == "cartesia":
            integration["api_key"] = os.getenv("CARTESIA_API_KEY")
        elif provider == "elevenlabs":
            integration["api_key"] = os.getenv("ELEVEN_LABS_API_KEY")
        elif provider == "anthropic":
            integration["api_key"] = os.getenv("ANTHROPIC_API_KEY")
        elif provider == "groq":
            integration["api_key"] = os.getenv("GROQ_API_KEY")
        elif provider == "xai":
            integration["api_key"] = os.getenv("XAI_API_KEY")
        elif provider == "google" or provider == "google_cloud":
            integration["api_key"] = os.getenv("GOOGLE_API_KEY")
            integration["region"] = os.getenv("GOOGLE_CLOUD_LLM_REGION", "us-central1")
        elif provider == "google_gemini":
            integration["api_key"] = os.getenv("GOOGLE_GEMINI_API_KEY")
        elif provider == "deepseek":
            integration["api_key"] = os.getenv("DEEPSEEK_API_KEY")
        elif provider == "mistral":
            integration["api_key"] = os.getenv("MISTRAL_API_KEY")
        elif provider == "together_ai":
            integration["api_key"] = os.getenv("TOGETHER_API_KEY")
        elif provider == "azure" or provider == "azure_openai":
            integration["api_key"] = os.getenv("AZURE_OPENAI_API_KEY")
            integration["config_json"] = {
                "endpoint": os.getenv("AZURE_OPENAI_ENDPOINT"),
                "apiVersion": os.getenv("AZURE_OPENAI_API_VERSION", "2025-04-01-preview")
            }
        elif provider == "aws":
            integration["api_key"] = os.getenv("AWS_SECRET_ACCESS_KEY")
            integration["region"] = os.getenv("AWS_REGION", "us-east-1")
            integration["config_json"] = {
                "accessKeyId": os.getenv("AWS_ACCESS_KEY_ID"),
                "pollyRegion": os.getenv("AWS_REGION", "us-east-1")
            }

        return integration

    def get_api_key(self, provider: str) -> Optional[str]:
        integration = self.get_integration(provider)
        return integration.get("api_key")

# Global instance
config_service = ConfigService()
