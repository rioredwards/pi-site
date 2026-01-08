# Deployment Guide

## Script Overview

### 1. `deploy.sh` - Initial Setup (Run ONCE on Pi)
**When to use:** First time setting up the Raspberry Pi
**Where to run:** Directly on the Pi (via SSH)
**What it does:**
- Installs Docker, Docker Compose, Nginx, Cloudflare Tunnel
- Sets up swap space
- Clones the repository
- Creates `.env` file
- Builds and starts containers

**Usage:**
```bash
# On the Pi
curl -o ~/deploy.sh https://raw.githubusercontent.com/rioredwards/pi-site/main/deploy.sh
chmod +x ~/deploy.sh
./deploy.sh
```

### 2. `update.sh` - Update Script (Runs on Pi)
**When to use:** Automatically called by `deploy-to-pi.sh`
**Where to run:** On the Pi (downloaded from GitHub)
**What it does:**
- Pulls latest code from GitHub
- Updates `.env` file (preserves existing password)
- Rebuilds Docker containers
- Runs database migrations

**Note:** This script is downloaded from GitHub by `deploy-to-pi.sh`, so any local changes must be committed and pushed first.

### 3. `deploy-to-pi.sh` - Local Deployment (Run from Dev Machine)
**When to use:** For all subsequent deployments after initial setup
**Where to run:** From your local development machine
**What it does:**
- Commits all changes
- Pushes to GitHub
- SSHs to Pi
- Downloads and runs `update.sh` from GitHub

**Usage:**
```bash
# From your dev machine
./deploy-to-pi.sh "Your commit message"
```

## Deployment Workflow

### First Time Setup
1. SSH into your Pi
2. Run `deploy.sh` (downloads and runs the script)

### Regular Updates
1. Make changes locally
2. Run `./deploy-to-pi.sh` from your dev machine
3. That's it! The script handles everything

## Common Issues & Solutions

### Docker Cache Issues

If you've changed the Dockerfile (like adding node_modules), Docker might use cached layers. 

**Solution 1: Force rebuild (recommended for Dockerfile changes)**
```bash
# On the Pi, manually run:
cd ~/pi-site
sudo docker compose down
sudo docker compose build --no-cache web
sudo docker compose up -d
```

**Solution 2: Clear all Docker cache (nuclear option)**
```bash
# On the Pi
sudo docker system prune -a --volumes
# Then rebuild
cd ~/pi-site
sudo docker compose up --build -d
```

### Migration Script Not Found

If you see "Cannot find module 'drizzle-orm/postgres-js'":
- This means the Dockerfile changes haven't been applied
- The Docker image needs to be rebuilt without cache
- See "Docker Cache Issues" above

### Changes to `update.sh` Not Taking Effect

**Important:** `deploy-to-pi.sh` downloads `update.sh` from GitHub, not your local copy!

If you modified `update.sh` locally:
1. Commit and push it first:
   ```bash
   git add update.sh
   git commit -m "Update deployment script"
   git push
   ```
2. Then run `deploy-to-pi.sh` again

### Database Migration Failures

If migrations fail:
1. Check the error message (now visible thanks to improved error handling)
2. Verify database is running: `sudo docker compose ps`
3. Check database connection: `sudo docker exec pi-site-web-1 env | grep DATABASE_URL`
4. Verify migration files exist: `sudo docker exec pi-site-web-1 ls -la app/db/migrations/`

## Quick Reference

### Check Container Status
```bash
sudo docker compose ps
```

### View Logs
```bash
# Web container logs
sudo docker compose logs web

# Database logs
sudo docker compose logs db

# All logs
sudo docker compose logs
```

### Rebuild After Dockerfile Changes
```bash
cd ~/pi-site
sudo docker compose down
sudo docker compose build --no-cache web
sudo docker compose up -d
```

### Manual Migration (if needed)
```bash
sudo docker exec pi-site-web-1 bun run db:migrate
```

### Check Database Tables
```bash
sudo docker exec -i pi-site-db-1 psql -U myuser -d mydatabase -c '\dt'
```

