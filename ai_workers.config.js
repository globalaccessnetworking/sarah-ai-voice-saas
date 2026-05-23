module.exports = {
  apps: [
    { name: "sarah-inbound-0", script: "ai-worker/run_inbound.py", interpreter: "venv_prod/bin/python", env: { HTTP_SERVER_PORT: 0, LIVEKIT_URL: "ws://127.0.0.1:7880", LIVEKIT_API_KEY: "gl0bal_acc3ss_key", LIVEKIT_API_SECRET: "gL8#zP2!vN9Q&kR5*xT0^mB7@jA4(sE1" } },
    { name: "sarah-inbound-2", script: "ai-worker/run_inbound.py", interpreter: "venv_prod/bin/python", env: { HTTP_SERVER_PORT: 0, LIVEKIT_URL: "ws://127.0.0.1:7880", LIVEKIT_API_KEY: "gl0bal_acc3ss_key", LIVEKIT_API_SECRET: "gL8#zP2!vN9Q&kR5*xT0^mB7@jA4(sE1" } },
    { name: "sarah-inbound-4", script: "ai-worker/run_inbound.py", interpreter: "venv_prod/bin/python", env: { HTTP_SERVER_PORT: 0, LIVEKIT_URL: "ws://127.0.0.1:7880", LIVEKIT_API_KEY: "gl0bal_acc3ss_key", LIVEKIT_API_SECRET: "gL8#zP2!vN9Q&kR5*xT0^mB7@jA4(sE1" } },
    { name: "sarah-inbound-6", script: "ai-worker/run_inbound.py", interpreter: "venv_prod/bin/python", env: { HTTP_SERVER_PORT: 0, LIVEKIT_URL: "ws://127.0.0.1:7880", LIVEKIT_API_KEY: "gl0bal_acc3ss_key", LIVEKIT_API_SECRET: "gL8#zP2!vN9Q&kR5*xT0^mB7@jA4(sE1" } },
    { name: "sarah-outbound-1", script: "ai-worker/run_outbound.py", interpreter: "venv_prod/bin/python", env: { HTTP_SERVER_PORT: 0, LIVEKIT_URL: "ws://127.0.0.1:7880", LIVEKIT_API_KEY: "gl0bal_acc3ss_key", LIVEKIT_API_SECRET: "gL8#zP2!vN9Q&kR5*xT0^mB7@jA4(sE1" } },
    { name: "sarah-outbound-3", script: "ai-worker/run_outbound.py", interpreter: "venv_prod/bin/python", env: { HTTP_SERVER_PORT: 0, LIVEKIT_URL: "ws://127.0.0.1:7880", LIVEKIT_API_KEY: "gl0bal_acc3ss_key", LIVEKIT_API_SECRET: "gL8#zP2!vN9Q&kR5*xT0^mB7@jA4(sE1" } },
    { name: "sarah-outbound-dialer-5", script: "ai-worker/outbound_dialer.py", interpreter: "venv_prod/bin/python", env: { LIVEKIT_URL: "ws://127.0.0.1:7880", LIVEKIT_API_KEY: "gl0bal_acc3ss_key", LIVEKIT_API_SECRET: "gL8#zP2!vN9Q&kR5*xT0^mB7@jA4(sE1" } },
    { name: "sarah-outbound-handler-7", script: "ai-worker/outbound_handler.py", interpreter: "venv_prod/bin/python", env: { HTTP_SERVER_PORT: 8110, LIVEKIT_URL: "ws://127.0.0.1:7880", LIVEKIT_API_KEY: "gl0bal_acc3ss_key", LIVEKIT_API_SECRET: "gL8#zP2!vN9Q&kR5*xT0^mB7@jA4(sE1" } },
    { name: "sarah-outbound-trigger-8", script: "ai-worker/outbound_watcher.py", interpreter: "venv_prod/bin/python", env: { LIVEKIT_URL: "ws://127.0.0.1:7880", LIVEKIT_API_KEY: "gl0bal_acc3ss_key", LIVEKIT_API_SECRET: "gL8#zP2!vN9Q&kR5*xT0^mB7@jA4(sE1" } }
  ]
};
