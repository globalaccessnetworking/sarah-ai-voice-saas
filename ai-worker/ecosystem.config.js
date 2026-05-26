module.exports = {
  apps : [
    {
      name: "sarah-inbound",
      script: "run_inbound.py",
      interpreter: "/opt/global-access/livekit-dashboard/venv_prod/bin/python",
      instances: 2,
      exec_mode: "fork",
      cwd: "/opt/global-access/livekit-dashboard/ai-worker"
    },
    {
      name: "sarah-outbound",
      script: "run_outbound.py",
      interpreter: "/opt/global-access/livekit-dashboard/venv_prod/bin/python",
      instances: 1,
      exec_mode: "fork",
      cwd: "/opt/global-access/livekit-dashboard/ai-worker"
    },
    {
      name: "sarah-outbound-dialer",
      script: "outbound_dialer.py",
      interpreter: "/opt/global-access/livekit-dashboard/venv_prod/bin/python",
      instances: 1,
      exec_mode: "fork",
      cwd: "/opt/global-access/livekit-dashboard/ai-worker"
    },
    {
      name: "sarah-outbound-handler",
      script: "outbound_handler.py",
      interpreter: "/opt/global-access/livekit-dashboard/venv_prod/bin/python",
      instances: 1,
      exec_mode: "fork",
      cwd: "/opt/global-access/livekit-dashboard/ai-worker"
    },
    {
      name: "sarah-outbound-watcher",
      script: "outbound_watcher.py",
      interpreter: "/opt/global-access/livekit-dashboard/venv_prod/bin/python",
      instances: 1,
      exec_mode: "fork",
      cwd: "/opt/global-access/livekit-dashboard/ai-worker"
    },
    {
      name: "sarah-campaign-refill",
      script: "campaign_refill.py",
      interpreter: "/opt/global-access/livekit-dashboard/venv_prod/bin/python",
      instances: 1,
      exec_mode: "fork",
      cwd: "/opt/global-access/livekit-dashboard/ai-worker"
    }
  ]
}
