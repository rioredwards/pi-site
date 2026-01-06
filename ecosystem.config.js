// Get the directory where this config file is located
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");
const configDir = path.dirname(__filename);
const projectRoot = path.resolve(configDir);

module.exports = {
  apps: [
    {
      name: "pi-site",
      script: "node",
      args: ".next/standalone/server.js",
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
  ],
};
