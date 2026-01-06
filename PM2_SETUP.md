# PM2 Deployment Setup

Simple, straightforward deployment using PM2 for process management.

## Overview

This project uses PM2 to manage the Next.js application on the Raspberry Pi. PM2 provides:

- Automatic restarts on failure
- Process monitoring and logging
- Easy management via command line
- Startup script integration

## Initial Setup (One Time)

### On Your Raspberry Pi

1. **Install Node.js** (if not already installed):

   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

   Verify installation:

   ```bash
   node --version  # Should show v20.x or higher
   npm --version
   ```

2. **Run the setup script**:

   ```bash
   cd ~/pi-site
   bash scripts/setup-pi.sh
   ```

   This script will:
   - Check Node.js installation
   - Install PM2 globally
   - Create logs directory
   - Set up PM2 startup script

3. **Follow the PM2 startup instructions** - The setup script will show you a command to run with `sudo` to enable PM2 to start on system boot.

4. **Create your `.env` file** in `~/pi-site/` with your production environment variables:

   ```env
   NODE_ENV=production
   NEXTAUTH_URL=https://your-production-domain.com
   AUTH_SECRET=your-secret-here
   GITHUB_CLIENT_ID=your_prod_github_client_id
   GITHUB_CLIENT_SECRET=your_prod_github_client_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ADMIN_USER_IDS=github-your_github_id
   DATABASE_URL=file:./prisma/dev.db
   ```

## Daily Deployment

### From Your Desktop (Recommended)

Deploy with a single command:

```bash
./scripts/deploy.sh
```

Or use the npm script:

```bash
npm run deploy
```

This script will:

1. **Test build locally** - Ensures the app builds successfully before deploying
2. **Commit and push to GitHub** - Saves your changes to version control
3. **Pull code on Pi** - Gets the latest code from GitHub
4. **Install dependencies** - Runs `npm install` on the Pi
5. **Set up directories** - Creates `public/images` with correct permissions
6. **Generate Prisma client** - Builds the database client
7. **Build the app** - Compiles Next.js for production
8. **Restart PM2** - Stops old process and starts new one
9. **Save PM2 config** - Ensures PM2 remembers the process

### Manual Deployment Steps

If you need to deploy manually:

```bash
# On your desktop
git add .
git commit -m "Your changes"
git push

# On Raspberry Pi (via SSH)
ssh raspberrypi
cd ~/pi-site
git pull
npm install --ignore-scripts
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate
npm run build
pm2 restart pi-site
```

## Managing the App on Pi

### Check Status

```bash
# From desktop
ssh raspberrypi 'pm2 status'

# Or use the helper script
./scripts/check-server.sh remote
```

### View Logs

```bash
# Real-time logs
ssh raspberrypi 'pm2 logs pi-site'

# Error logs only
ssh raspberrypi 'pm2 logs pi-site --err'

# Last 100 lines
ssh raspberrypi 'pm2 logs pi-site --lines 100'
```

### Restart the App

```bash
# From desktop
ssh raspberrypi 'pm2 restart pi-site'

# Or use the helper script
./scripts/start-server.sh remote
```

### Stop the App

```bash
# From desktop
ssh raspberrypi 'pm2 stop pi-site'

# Or use the helper script
./scripts/stop-server.sh remote
```

### Update Code Without Full Deploy

If you just want to pull code and restart:

```bash
# On Pi
cd ~/pi-site
./scripts/update-server.sh
```

Or to rebuild locally on Pi (slower, not recommended):

```bash
./scripts/update-server.sh --local
```

## Server Management Scripts

These helper scripts are available on both desktop and Pi:

- `./scripts/check-server.sh` - Check PM2 status
- `./scripts/start-server.sh` - Start the app
- `./scripts/stop-server.sh` - Stop the app
- `./scripts/update-server.sh` - Pull code and optionally rebuild

Add `remote` as an argument to run on Pi via SSH from your desktop.

## Database Management

### Run Migrations

Migrations run automatically during deployment. To run manually:

```bash
# On Raspberry Pi
cd ~/pi-site
npx prisma migrate deploy
```

### View Database

```bash
# On Raspberry Pi
cd ~/pi-site
npx prisma studio
```

Then access it at `http://localhost:5555` (you may need to port forward via SSH).

### Test Database Connection

```bash
# On Raspberry Pi
cd ~/pi-site
npx tsx scripts/test-db.ts
```

## Troubleshooting

### App Won't Start

1. **Check PM2 logs for errors:**

   ```bash
   ssh raspberrypi 'pm2 logs pi-site --err'
   ```

2. **Check if Node.js version is correct:**

   ```bash
   ssh raspberrypi 'node --version'
   ```

   Should be v20.x or higher.

3. **Verify environment variables:**

   ```bash
   ssh raspberrypi 'cd ~/pi-site && cat .env'
   ```

4. **Check if port 3000 is already in use:**
   ```bash
   ssh raspberrypi 'sudo lsof -i :3000'
   ```

### Build Fails on Pi

1. **Check Prisma client generation:**

   ```bash
   ssh raspberrypi 'cd ~/pi-site && PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate'
   ```

2. **Clear build cache:**

   ```bash
   ssh raspberrypi 'cd ~/pi-site && rm -rf .next node_modules && npm install'
   ```

3. **Check disk space:**
   ```bash
   ssh raspberrypi 'df -h'
   ```

### PM2 Process Keeps Crashing

1. **Check PM2 logs:**

   ```bash
   ssh raspberrypi 'pm2 logs pi-site --lines 50'
   ```

2. **Check PM2 process info:**

   ```bash
   ssh raspberrypi 'pm2 describe pi-site'
   ```

3. **Restart PM2 daemon:**
   ```bash
   ssh raspberrypi 'pm2 kill && pm2 resurrect'
   ```

### Image Upload Issues

1. **Check directory permissions:**

   ```bash
   ssh raspberrypi 'cd ~/pi-site && ls -la public/images'
   ```

2. **Fix permissions if needed:**
   ```bash
   ssh raspberrypi 'cd ~/pi-site && chmod -R 755 public/images'
   ```

### Database Issues

1. **Check database file exists:**

   ```bash
   ssh raspberrypi 'cd ~/pi-site && ls -la prisma/dev.db'
   ```

2. **Check database permissions:**

   ```bash
   ssh raspberrypi 'cd ~/pi-site && chmod 644 prisma/dev.db'
   ```

3. **Test database connection:**
   ```bash
   ssh raspberrypi 'cd ~/pi-site && npx tsx scripts/test-db.ts'
   ```

## Benefits of PM2 Over Docker

- ✅ **Simpler setup** - No Docker daemon or image building required
- ✅ **Faster deployments** - Direct file sync, no image transfer
- ✅ **Easier debugging** - Direct access to logs and process
- ✅ **Lower resource usage** - No container overhead
- ✅ **Direct file access** - Easy to inspect and modify files
- ✅ **Familiar workflow** - Standard Node.js deployment

## Workflow Summary

**Development:**

```bash
npm run dev  # Local development on desktop
```

**Deployment:**

```bash
./scripts/deploy.sh  # One command from desktop
```

**Management:**

```bash
ssh raspberrypi 'pm2 logs pi-site'  # View logs
ssh raspberrypi 'pm2 restart pi-site'  # Restart
```

That's it! Simple and straightforward.
