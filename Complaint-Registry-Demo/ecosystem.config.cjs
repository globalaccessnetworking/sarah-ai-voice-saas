// PM2 Ecosystem — Complaint Registry Demo
// Usage:
//   Development: pm2 start ecosystem.config.cjs --env development
//   Production:  npm run build && pm2 start ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'complaint-registry-demo',
      script: 'npx',
      args: 'serve dist -l 5600 --single',
      cwd: '/opt/global-access/livekit-dashboard/Complaint-Registry-Demo',
      env: {
        NODE_ENV: 'production',
      },
      // Restart policy
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
    },
  ],
};
