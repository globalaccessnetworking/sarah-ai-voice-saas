import os
import sys
import asyncio
import aiohttp
from pathlib import Path
from dotenv import load_dotenv

async def main():
    print("Testing Deepgram REST TTS Synthesis...")
    
    env_path = Path(__file__).resolve().parent / ".env"
    load_dotenv(env_path, override=True)
    
    api_key = os.getenv("DEEPGRAM_API_KEY")
    print(f"DEEPGRAM_API_KEY present={bool(api_key)}")
    print(f"DEEPGRAM_API_KEY length={len(api_key or '')}")
    
    if not api_key:
        print("Error: No Deepgram API key found.")
        sys.exit(1)
        
    print("Calling Deepgram REST /v1/speak...")
    
    url = "https://api.deepgram.com/v1/speak?model=aura-asteria-en&encoding=linear16&sample_rate=24000"
    headers = {
        "Authorization": f"Token {api_key}",
        "Content-Type": "application/json"
    }
    payload_data = {
        "text": "Hi, this is a Deepgram REST standalone test. If you hear this, the cache generation is working perfectly."
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, headers=headers, json=payload_data, timeout=5.0) as resp:
                if resp.status == 200:
                    audio_bytes = await resp.read()
                    
                    import wave
                    import time
                    
                    cache_file = Path("/tmp/deepgram_tts_test.wav")
                    cache_file.parent.mkdir(parents=True, exist_ok=True)
                    
                    with wave.open(str(cache_file), 'wb') as wav:
                        wav.setnchannels(1)
                        wav.setsampwidth(2)
                        wav.setframerate(24000)
                        wav.writeframes(audio_bytes)
                        
                    print(f"Success! Status: {resp.status}")
                    print(f"Saved to: {cache_file}")
                    print(f"File size: {len(audio_bytes)} bytes")
                else:
                    error_text = await resp.text()
                    print(f"Synthesis failed. Status: {resp.status}")
                    print(f"Response: {error_text}")
    except Exception as e:
        print(f"Synthesis failed with error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
