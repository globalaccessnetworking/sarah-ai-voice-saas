import os
import sys
import subprocess

# Map names to ports
port_map = {
    "sarah-inbound-0": "8081",
    "sarah-inbound-2": "8082",
    "sarah-inbound-4": "8083",
    "sarah-inbound-6": "8084",
    "sarah-outbound-1": "8101",
    "sarah-outbound-3": "8102"
}

name = os.environ.get("PM2_NAME")
if name in port_map:
    os.environ["HTTP_SERVER_PORT"] = port_map[name]

# Run the target script
script_path = sys.argv[1]
subprocess.run([sys.executable, script_path, "start"], env=os.environ)
