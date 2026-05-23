import sys
import livekit.plugins.silero
import livekit.plugins.turn_detector
from livekit.agents import cli, WorkerOptions

async def dummy_entrypoint(ctx):
    pass

if __name__ == "__main__":
    sys.argv = ["dl.py", "download-files"]
    cli.run_app(WorkerOptions(entrypoint_fnc=dummy_entrypoint))
