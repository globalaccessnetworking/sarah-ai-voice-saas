import hashlib
from typing import Tuple, Dict, Any

def resolve_effective_tts_config(payload: Dict[str, Any], agent_config: Dict[str, Any]) -> Tuple[str, str, str]:
    """Resolves exactly the same provider, model, and voice_id for prewarm and runtime."""
    tts_config = payload.get("tts_config", {}) or agent_config.get("tts_config", {})
    
    tts_provider = tts_config.get("provider") or payload.get("tts_provider") or agent_config.get("tts_config", {}).get("provider") or "deepgram"
    raw_model = tts_config.get("model") or payload.get("tts_model") or agent_config.get("tts_config", {}).get("model")
    raw_voice = tts_config.get("voice_id") or payload.get("tts_voice_id") or agent_config.get("tts_config", {}).get("voice_id")
    
    effective_model = raw_model
    effective_voice = raw_voice
    
    if not effective_model or str(effective_model) in ("N/A", "None"):
        if tts_provider.lower() == "deepgram":
            effective_model = "aura-asteria-en"
            
    if not effective_voice or str(effective_voice) in ("N/A", "None"):
        if tts_provider.lower() == "cartesia":
            effective_voice = "79a125e8-cd45-4c13-8a67-188112f4dd22"
        elif tts_provider.lower() == "elevenlabs":
            effective_voice = "jBpfuIE2acCO8z3wKNLl"
            
    # Normalize string conversions for consistent hashing
    effective_model = str(effective_model) if effective_model else "None"
    effective_voice = str(effective_voice) if effective_voice else "None"
    
    return str(tts_provider), effective_model, effective_voice

def get_greeting_cache_key(rendered_text: str, provider: str, model: str, voice_id: str) -> str:
    """Consistently hashes the greeting text and configuration."""
    hash_str = f"{rendered_text}_{provider}_{model}_{voice_id}"
    return hashlib.sha256(hash_str.encode()).hexdigest()[:16]
