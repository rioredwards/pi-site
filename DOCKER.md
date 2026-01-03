# Docker Setup

This guide explains how to deploy and run the pi-site application using Docker.

## Prerequisites

- Docker installed on your Raspberry Pi
- Docker Compose (usually included with Docker)
- Docker buildx on your development machine (comes with Docker Desktop)
- SSH access to your Raspberry Pi configured

## Quick Start

### One-Command Deployment (Recommended)

Deploy your application with a single command from your development machine:

```bash
./scripts/deploy.sh
```

This script:

1. Builds the Docker image for ARM64 on your desktop
2. Transfers it to your Raspberry Pi
3. Restarts the container
4. Runs database migrations if needed

**First time setup:**

```bash
chmod +x scripts/deploy.sh
chmod +x scripts/build-and-transfer.sh
```

**Update Pi hostname:** Edit `PI_HOST` in `scripts/build-and-transfer.sh` if your Pi hostname isn't `raspberrypi`.

## Environment Variables

Create a `.env` file in the project root on your Raspberry Pi:

```env
NEXTAUTH_URL=https://your-domain.com
AUTH_SECRET=your-secret-here
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
ADMIN_USER_IDS=github-your_id
DATABASE_URL=file:./prisma/dev.db
```

The `.env` file is automatically loaded by `docker-compose.yml`.

## First-Time Setup

### 1. Initial Deployment

```bash
# On your development machine
./scripts/deploy.sh
```

The deploy script automatically runs database migrations on first deploy.

### 2. Access the Application

Once running, access the app at:

- Local: `http://localhost:3000` (on the Pi)
- Production: `https://your-domain.com` (via Cloudflare Tunnel)

## Daily Workflow

### Development

```bash
npm run dev  # Local development as usual
```

### Deployment

```bash
./scripts/deploy.sh  # One command to deploy
```

## Manual Operations (on Raspberry Pi)

If you need to manage the container manually on the Pi:

```bash
# View logs
docker compose logs -f

# Stop the container
docker compose down

# Start the container
docker compose up -d

# Restart the container
docker compose restart
```

## Database Management

### Run Migrations

Migrations run automatically during deployment, but you can run them manually:

```bash
# On Raspberry Pi
docker compose exec app npx prisma migrate deploy
```

### Access Prisma Studio

```bash
# On Raspberry Pi
docker compose exec app npx prisma studio
```

Then access it at `http://localhost:5555` (you may need to port forward via SSH).

### Run Database Scripts

```bash
# Get user IDs
docker compose exec app npm run get-user-id

# Test database
docker compose exec app npx tsx scripts/test-db.ts
```

## Advanced Usage

### Build and Transfer Only (No Restart)

If you want to build and transfer without restarting:

```bash
./scripts/build-and-transfer.sh
```

Then manually restart on the Pi:

```bash
ssh raspberrypi 'cd ~/pi-site && docker compose up -d'
```

### Build with Auto-Restart

```bash
./scripts/build-and-transfer.sh --restart
```

## Troubleshooting

### Container won't start

Check logs:

```bash
docker compose logs app
```

### Container is unhealthy

Check health status:

```bash
docker compose ps
```

View detailed logs:

```bash
docker compose logs -f app
```

### Database issues

Ensure the `prisma` directory has correct permissions:

```bash
chmod -R 755 prisma
```

### Image upload issues

Ensure the `public/images` directory exists and has correct permissions:

```bash
mkdir -p public/images
chmod -R 755 public/images
```

### Port already in use

Change the port in `docker-compose.yml`:

```yaml
ports:
  - "3001:3000" # Use port 3001 on host
```

### SSH connection issues

Verify SSH access:

```bash
ssh raspberrypi
```

If using a different hostname, update `PI_HOST` in `scripts/build-and-transfer.sh`.

## Architecture

The Docker setup uses:

- **Multi-stage build**: Smaller final image, faster builds
- **Health checks**: Automatic container health monitoring
- **Volume mounts**: Database and images persist on the host
- **Non-root user**: Runs as `nextjs` user for security
- **ARM64 platform**: Optimized for Raspberry Pi

## Benefits

- ✅ **Consistent Node.js version** (22 LTS) - no version conflicts
- ✅ **Isolated environment** - no system-wide dependencies
- ✅ **Easy deployment** - one command from dev to production
- ✅ **Fast builds** - build on powerful desktop, run on Pi
- ✅ **Automatic restarts** - container restarts on failure
- ✅ **Health monitoring** - built-in health checks
