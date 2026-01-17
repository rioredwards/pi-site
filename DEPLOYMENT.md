# Deployment Guide

Quick-start guide for deploying pi-site to a Raspberry Pi (or any Debian-based server).

## Prerequisites

- Raspberry Pi (or Debian-based server) with SSH access
- Git installed on the server
- Domain name (optional, for SSL)

## First-Time Deployment

### 1. Prepare Environment File

On your **development machine**:

```bash
# Copy the template
cp .env.prod.example .env.prod

# Edit with your production values
# - Set secure passwords
# - Configure OAuth credentials for your domain
# - Generate secrets: openssl rand -base64 32
```

### 2. Sync to Server

```bash
# Sync env file (do this BEFORE running deploy.sh)
rsync -avz .env.prod pi:~/pi-site/.env.prod
```

### 3. Run Deployment

SSH into your server and run:

```bash
# Clone and deploy (first time)
git clone git@github.com:rioredwards/pi-site.git ~/pi-site
cd ~/pi-site
./deploy.sh
```

This will:
- Install Docker (if needed)
- Install and configure Nginx
- Build and start all containers
- Run database migrations

## Routine Updates

For code updates after initial deployment:

```bash
# Quick update (recommended)
./update.sh

# Or equivalently:
./scripts/update-prod.sh
```

This pulls the latest code and rebuilds `web` and `system-profiler`.

### Build Behavior

To speed up deploys, only frequently-changing services are rebuilt by default:

| Service | Default Build | Notes |
|---------|---------------|-------|
| `web` | Yes | Next.js app |
| `system-profiler` | Yes | Hono API |
| `ai-img-validator` | No | Uses cached `:stable` image |
| `db` | No | Uses `postgres:17` image |

### Selective Builds

```bash
# Default: build web + system-profiler
./update.sh

# Build only web
./update.sh web

# Build only system-profiler
./update.sh system-profiler

# Build both explicitly
./update.sh web system-profiler
```

### Rebuilding ai-img-validator

The AI image validator rarely changes, so it uses a cached image. When you do need to rebuild it:

```bash
./scripts/build-stable-services.sh
```

This builds and tags `pi-site/ai-img-validator:stable`. Run this:
- On first deployment (done automatically by `deploy.sh`)
- When `ai-img-validator/` code changes

## Manual Operations

### View Logs

```bash
# All services
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f web

# Or use the npm script (if on the server with npm)
npm run prod:logs
```

### Check Status

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

### Restart Services

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart
```

### Stop Everything

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
```

### Clean Up (Nuclear Option)

```bash
./scripts/cleanup-prod.sh
```

This interactively removes containers, images, and optionally volumes (database data).

## Nginx Configuration

Nginx runs on the host (not in Docker) and:
- Serves uploaded images directly from the Docker volume
- Proxies all other requests to the Next.js container

Config file: `nginx/pi-site.conf`

To update nginx config:
```bash
# Edit the config
vim nginx/pi-site.conf

# Apply changes
sudo cp nginx/pi-site.conf /etc/nginx/sites-available/pi-site
sudo nginx -t && sudo systemctl reload nginx
```

## SSL/HTTPS

To add SSL with Let's Encrypt:

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com

# Auto-renewal is configured automatically
```

## Troubleshooting

### Containers not starting

```bash
# Check logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs

# Check health status
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

### Database connection issues

```bash
# Check if db container is healthy
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps db

# Check db logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs db
```

### Permission errors on uploads

The web container runs as non-root user `nextjs`. The entrypoint script fixes volume permissions automatically. If issues persist:

```bash
# Check volume permissions
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec web ls -la /data/uploads/images
```

### Nginx 502 Bad Gateway

The Next.js container may not be ready yet:

```bash
# Check if web container is running
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps web

# Check web logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs web
```

## File Structure

```
pi-site/
├── deploy.sh                    # Full deployment (system setup + containers)
├── update.sh                    # Quick update wrapper
├── scripts/
│   ├── deploy-prod.sh          # Core deployment (compose orchestration)
│   ├── update-prod.sh          # Quick update (pull + rebuild web/system-profiler)
│   ├── cleanup-prod.sh         # Project cleanup
│   └── build-stable-services.sh # Rebuild ai-img-validator when needed
├── nginx/
│   └── pi-site.conf            # Nginx config (version controlled)
├── docker-compose.yml          # Base config (shared)
├── docker-compose.prod.yml     # Production overrides
├── .env.prod                   # Production secrets (not in git)
└── .env.prod.example           # Template for .env.prod
```
