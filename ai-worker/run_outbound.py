#!/usr/bin/env python3
"""
Suthra Punjab - Outbound Pipeline Specialist
Dedicated worker for campaign dialer and outbound-agent jobs.
"""
import os
import sys
from pathlib import Path

# 1. Pipeline Isolation: Force Outbound Mode
os.environ["AGENT_NAME"] = "outbound-agent"
os.environ["WORKER_MODE"] = "outbound"

# 2. Path Alignment
worker_dir = Path(__file__).parent
sys.path.insert(0, str(worker_dir))

# 3. Execution
try:
    from run_agents import main
    if __name__ == "__main__":
        print("--- SARAH OUTBOUND PIPELINE STARTING ---")
        
        # PM2 assigns an instance ID (0, 1, 2, etc.) to each clone
        instance_id = int(os.getenv("NODE_APP_INSTANCE", 0))
        
        # Dynamically assign port to avoid collision in clustered mode
        base_port = 8100
        dynamic_port = base_port + instance_id
        
        print(f"Dynamic Port Assigned: {dynamic_port}")
        main(port=dynamic_port)
except ImportError as e:
    print(f"FAILED TO LOAD CORE WORKER: {e}")
    sys.exit(1)
