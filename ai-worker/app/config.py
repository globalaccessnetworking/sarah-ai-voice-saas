from pathlib import Path
import os

RECORDING_PATH = Path("/tmp/recordings")
if not RECORDING_PATH.exists():
    try:
        RECORDING_PATH.mkdir(parents=True, exist_ok=True)
    except:
        # Fallback for Windows if /tmp doesn't work well
        RECORDING_PATH = Path("recordings")
        RECORDING_PATH.mkdir(parents=True, exist_ok=True)
