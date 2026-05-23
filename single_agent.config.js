module.exports = {
  apps: [
    {
      name: "sarah-inbound",
      script: "ai-worker/run_inbound.py",
      args: "start",
      interpreter: "venv_prod/bin/python",
      env: {
        LIVEKIT_URL: "ws://127.0.0.1:7880",
        LIVEKIT_API_KEY: "gl0bal_acc3ss_key",
        LIVEKIT_API_SECRET: "gL8#zP2!vN9Q&kR5*xT0^mB7@jA4(sE1"
      }
    },
    {
      name: "sarah-outbound",
      script: "ai-worker/run_outbound.py",
      args: "start",
      interpreter: "venv_prod/bin/python",
      env: {
        LIVEKIT_URL: "ws://127.0.0.1:7880",
        LIVEKIT_API_KEY: "gl0bal_acc3ss_key",
        LIVEKIT_API_SECRET: "gL8#zP2!vN9Q&kR5*xT0^mB7@jA4(sE1"
      }
    },
    {
      name: "sarah-outbound-dialer",
      script: "ai-worker/outbound_dialer.py",
      interpreter: "venv_prod/bin/python",
      env: {
        LIVEKIT_URL: "ws://127.0.0.1:7880",
        LIVEKIT_API_KEY: "gl0bal_acc3ss_key",
        LIVEKIT_API_SECRET: "gL8#zP2!vN9Q&kR5*xT0^mB7@jA4(sE1"
      }
    },
    {
      name: "sarah-outbound-handler",
      script: "ai-worker/outbound_handler.py",
      args: "start",
      interpreter: "venv_prod/bin/python",
      env: {
        LIVEKIT_URL: "ws://127.0.0.1:7880",
        LIVEKIT_API_KEY: "gl0bal_acc3ss_key",
        LIVEKIT_API_SECRET: "gL8#zP2!vN9Q&kR5*xT0^mB7@jA4(sE1",
        HTTP_SERVER_PORT: 8110
      }
    },
    {
      name: "sarah-outbound-trigger",
      script: "ai-worker/outbound_watcher.py",
      interpreter: "venv_prod/bin/python",
      env: {
        LIVEKIT_URL: "ws://127.0.0.1:7880",
        LIVEKIT_API_KEY: "gl0bal_acc3ss_key",
        LIVEKIT_API_SECRET: "gL8#zP2!vN9Q&kR5*xT0^mB7@jA4(sE1"
      }
    }
  ]
};
