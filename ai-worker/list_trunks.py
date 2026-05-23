from livekit.agents.pipeline import VoicePipelineAgent
import inspect

print("Args:")
for param in inspect.signature(VoicePipelineAgent.__init__).parameters:
    print(param)
