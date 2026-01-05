# PM2 Deployment Setup

Simple, straightforward deployment without Docker.

## Initial Setup (One Time)

### On Your Raspberry Pi

1. **Install Node.js** (if not already installed):

   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Run the setup script**:

   ```bash
   cd ~/pi-site
   bash scripts/setup-pi.sh
   ```

3. **Follow the PM2 startup instructions** - it will show you a command to run with `sudo`

4. **Create your `.env` file** in `~/pi-site/` with your environment variables

## Daily Deployment

### From Your Desktop

Just run:

```bash
npm run deploy
```

That's it! The script will:

1. Build your app locally
2. Sync files to Pi
3. Install dependencies on Pi
4. Restart the app with PM2
5. Run database migrations

## Managing the App on Pi

```bash
# View logs
ssh raspberrypi 'pm2 logs pi-site'

# Restart
ssh raspberrypi 'pm2 restart pi-site'

# Stop
ssh raspberrypi 'pm2 stop pi-site'

# Status
ssh raspberrypi 'pm2 status'

# View all logs
ssh raspberrypi 'pm2 logs'
```

## What Changed from Docker

- ✅ No Docker images to build/transfer
- ✅ No docker-compose.yml
- ✅ Direct Node.js execution
- ✅ PM2 handles process management
- ✅ Much faster deployments
- ✅ Easier to debug

## Troubleshooting

**App won't start?**

```bash
ssh raspberrypi 'pm2 logs pi-site --err'
```

**Need to rebuild Prisma client?**

```bash
ssh raspberrypi 'cd ~/pi-site && npx prisma generate'
```

**Need to run migrations manually?**

```bash
ssh raspberrypi 'cd ~/pi-site && npx prisma migrate deploy'
```
