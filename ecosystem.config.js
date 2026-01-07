// Get the directory where this config file is located
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");
const configDir = path.dirname(__filename);
const projectRoot = path.resolve(configDir);

module.exports = {
  apps: [
    {
      name: "pi-site",
      script: ".next/standalone/server.js",
      cwd: projectRoot,
      instances: 1,
      exec_mode: "fork",
      env: {
        // Only set runtime-specific vars here
        // All other vars (AUTH_SECRET, GITHUB_CLIENT_ID, etc.) come from .env
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
      },
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      max_memory_restart: "500M",
    },
    // Debug configuration - use with: pm2 start ecosystem.config.js --only pi-site-debug
    {
      name: "pi-site-debug",
      script: "node",
      args: "--inspect=0.0.0.0:9229 .next/standalone/server.js",
      cwd: projectRoot,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
      },
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: false, // Don't auto-restart during debugging
      max_restarts: 0,
    },
  ],
};
