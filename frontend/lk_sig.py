import inspect
from livekit import api
import sys

try:
    lkapi = api.LiveKitAPI("http://localhost:7880", "devkey", "secret")
    print(inspect.signature(lkapi.room.remove_participant))
except Exception as e:
    print("Error:", e)
