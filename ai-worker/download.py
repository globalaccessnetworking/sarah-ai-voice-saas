from livekit.agents import cli, WorkerOptions
import sys
sys.argv = ["download", "download-files"]
cli.run_app(WorkerOptions())
