import os
import asyncio
import sys
from dotenv import load_dotenv

load_dotenv()

from app.services.config_service import config_service

async def main():
    print("Testing Deepgram Prewarm TTS Synthesis...")
    api_key = config_service.get_api_key("deepgram") or os.getenv("DEEPGRAM_API_KEY")
    if not api_key:
        print("Error: No Deepgram API key found in config_service or DEEPGRAM_API_KEY env var.")
        sys.exit(1)
    
    print("API key loaded successfully. Initializing Deepgram TTS engine...")
    try:
        import livekit.plugins.deepgram as dg
        tts = dg.TTS(model="aura-asteria-en", api_key=api_key)
    except Exception as e:
        print(f"Failed to initialize TTS engine: {e}")
        sys.exit(1)
        
    print("Synthesizing test phrase...")
    raw_pcm = bytearray()
    try:
        # Simulate wait_for timeout wrapper matching our dialer implementation
        async def synthesize():
            async for audio_event in tts.synthesize("Hi, this is a standalone test for the Deepgram TTS cache prewarm process. Everything is functioning correctly."):
                if audio_event.frame:
                    raw_pcm.extend(audio_event.frame.data)
        
        await asyncio.wait_for(synthesize(), timeout=5.0)
        print(f"Success! Synthesized {len(raw_pcm)} bytes of raw PCM audio data.")
    except asyncio.TimeoutError:
        print("Synthesis timed out after 5 seconds.")
    except Exception as e:
        print(f"Synthesis failed with error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
