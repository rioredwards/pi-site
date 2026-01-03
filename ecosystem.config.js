module.exports = {
  apps: [
    {
      name: 'pi-site',
      script: 'npm',
      args: 'start',
      cwd: (process.env.HOME || '/home/rioredwards') + '/pi-site',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
        UPLOAD_DIR: (process.env.HOME || '/home/rioredwards') + '/pi-site/public/images',
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
    },
  ],
};

