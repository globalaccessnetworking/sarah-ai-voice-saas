import livekit.agents.voice as voice
import inspect

print(f"LiveKit Agents Voice module: {voice}")
agent_class = getattr(voice, 'Agent', None)
if agent_class:
    print(f"Agent class found. Methods: {[m[0] for m in inspect.getmembers(agent_class, predicate=inspect.isfunction)]}")
    # Also check if 'prewarm' is in the class dict or inherited
    print(f"Has 'prewarm' attribute: {hasattr(agent_class, 'prewarm')}")
else:
    print("Agent class not found in livekit.agents.voice")
