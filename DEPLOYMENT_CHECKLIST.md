# Deployment Checklist

## ✅ What You Should Have Done So Far

### Development Environment (Desktop)

- [x] Installed Node.js (any version works for dev)
- [x] Set up `.env.local` with development OAuth credentials
- [x] Created separate GitHub OAuth app for development (`DEV-DogTownUSA`)
- [x] Database migrated from JSON to SQLite
- [x] Admin user configured via `ADMIN_USER_IDS` in `.env.local`
- [x] App working locally with `npm run dev`

### Production Environment (Raspberry Pi)

- [x] Docker daemon installed
- [x] Docker Compose installed (usually comes with Docker)
- [x] User added to docker group (run: `sudo usermod -aG docker $USER` then log out/in)
- [x] Production `.env` file created on Pi
- [x] Production GitHub OAuth app created (separate from dev app)
- [x] Code repository cloned on Pi (first time only - for docker-compose.yml and scripts)

## 📋 Next Steps

### 1. Verify Docker Setup on Pi

```bash
# SSH into your Pi
ssh raspberrypi

# Verify Docker works (should not require sudo after adding to docker group)
docker --version
docker compose version  # Modern Docker uses 'docker compose' (space, not hyphen)
docker ps
```

### 2. Set Up Production Environment Variables on Pi

```bash
# On your Pi, navigate to project directory
cd ~/pi-site

# Copy .env.prod to Pi
rsync -av --progress .env.prod rioredwards@raspberrypi:~/pi-site/.env
```

**Required variables for production:**

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

### 3. Get Code to Pi (First Time Only)

**Note:** With Docker, you only need the repository on the Pi for:

- `docker-compose.yml` file (synced automatically by deploy script)
- Helper scripts (optional, for manual operations)
- The actual application code is baked into the Docker image

```bash
# First time only - clone the repository
git clone https://github.com/rioredwards/pi-site.git
cd pi-site
```

**For subsequent deployments:** You don't need to pull code on the Pi! The deploy script from your desktop handles everything:

- Builds the image with latest code
- Transfers the image to Pi
- Syncs docker-compose.yml automatically

### 4. Deploy from Desktop (Recommended)

**The standard workflow is to build on your desktop and transfer to the Pi:**

```bash
# On your desktop (development machine)
cd ~/pi-site
./scripts/deploy.sh
```

This script:

1. Builds the Docker image for ARM64 on your desktop
2. Transfers it to your Raspberry Pi via SSH
3. Syncs `docker-compose.yml` and `scripts/` directory automatically
4. Restarts the container automatically
5. Runs database migrations if needed

**First time setup on desktop:**

```bash
chmod +x scripts/deploy.sh
chmod +x scripts/build-and-transfer.sh
```

### 4b. Build on Pi (Not Recommended - Only for Troubleshooting)

**⚠️ Building on the Pi is slow and not recommended for regular use.**

Only use this if you're troubleshooting or don't have access to your desktop:

```bash
# On Pi - build the Docker image (this will take 10-20 minutes)
docker compose build

# Start the container
docker compose up -d

# Check logs to ensure it started correctly
docker compose logs -f
```

### 5. Run Database Migrations (First Time Only)

```bash
# Run migrations
docker compose exec app npx prisma migrate deploy

# If you have existing data to migrate
docker compose exec app npx tsx scripts/migrate-to-db.ts
```

### 6. Verify Everything Works

```bash
# Check container is running
docker compose ps

# Check logs for errors
docker compose logs app

# Test the app (if accessible locally on Pi)
curl http://localhost:3000
```

## 🔄 How Docker Works in Your Setup

### Development vs Production

**Desktop (Development):**

- Use `npm run dev` for local development
- Hot reload, fast iteration
- Uses `.env.local` with dev OAuth credentials
- Database at `prisma/dev.db` (local file)

**Desktop (Testing Docker Build - Optional):**

- Use `docker compose up` to test production build locally
- Helps catch Docker-specific issues before deploying
- Uses same Docker setup as Pi

**Raspberry Pi (Production):**

- Use `docker compose up` to run production build
- Containerized, isolated environment
- Uses `.env` with production OAuth credentials
- Database persisted via volume mount

### Code Flow: Desktop → Pi

```
Desktop (Development Machine)          Raspberry Pi
  │                                        │
  │  npm run dev (local testing)           │
  │  git commit & push                    │
  │                                        │
  │  ./scripts/deploy.sh                   │
  │    ├─ Build Docker image (ARM64)      │
  │    ├─ Transfer image via SSH ─────────>│
  │    └─ Restart container ──────────────>│
  │                                        │
  │                                        │ docker compose up -d
  │                                        │ (container running)
```

**Recommended Workflow:**

1. **Desktop:** Develop and test locally with `npm run dev`
2. **Desktop:** Commit and push to GitHub
3. **Desktop:** Run `./scripts/deploy.sh` (builds, transfers, and restarts)
4. **Pi:** Container automatically restarts with new image

**Important:** You don't need to pull code on the Pi! The code is baked into the Docker image. The Pi only needs:

- `docker-compose.yml` (synced automatically by deploy script)
- `.env` file (production credentials)
- Volume mounts for database and images

**Alternative (if you're already on Pi and want to build there - not recommended):**

1. **Pi:** Pull latest code: `git pull origin main` (only needed if building on Pi)
2. **Pi:** Update container: `./scripts/update-server.sh --local` (slow, not recommended)
3. **Better:** Use `./scripts/deploy.sh` from desktop instead

### Docker Container Explanation

**Build Phase (on Desktop):**

When you run `./scripts/deploy.sh`, it builds the image on your desktop:

1. Docker reads `Dockerfile`
2. Downloads Node.js 22 base image
3. Installs dependencies (`npm ci`)
4. Generates Prisma Client
5. Builds Next.js app (`npm run build`)
6. Creates a production-ready ARM64 image
7. Transfers image to Pi via SSH

**Run Phase (on Pi):**

When the container starts on the Pi:

1. Docker loads the pre-built image
2. Creates a container from the image
3. Mounts volumes (database, images) from your Pi's filesystem
4. Loads environment variables from `.env`
5. Starts the app with `node server.js` (standalone mode)
6. Exposes port 3000

**Persistence:**

- Database (`prisma/dev.db`) is stored on Pi's filesystem (volume mount)
- Images (`public/images/`) are stored on Pi's filesystem (volume mount)
- Container can be stopped/restarted without losing data

## 🔧 Dev/Prod Interoperability

### Shared Code

- ✅ Same codebase (GitHub)
- ✅ Same Docker setup (Dockerfile, docker-compose.yml)
- ✅ Same database schema (Prisma migrations)

### Different Configurations

**Environment Variables:**

- Desktop: `.env.local` (gitignored, dev OAuth)
- Pi: `.env` (gitignored, prod OAuth)

**OAuth Apps:**

- Desktop: Development GitHub app (`DEV-DogTownUSA`)
- Pi: Production GitHub app

**Database:**

- Desktop: `prisma/dev.db` (local development data)
- Pi: `prisma/dev.db` (production data, persisted via Docker volume)

### Best Practices

1. **Always Build on Desktop:**

   - Building on Pi is slow (10-20 minutes) and not recommended
   - Use `./scripts/deploy.sh` from your desktop for all deployments
   - The script handles building, transferring, and restarting automatically

2. **Test Docker Build Locally First (Optional):**

   ```bash
   # On desktop, test the Docker build locally (for x86_64)
   docker compose up --build
   # This helps catch Docker-specific issues, but final build is for ARM64
   ```

3. **Use Git Branches:**

   - `dev` branch for development
   - `main` branch for production
   - Deploy script works with any branch

4. **Environment-Specific Files:**

   - Never commit `.env` or `.env.local`
   - Keep OAuth credentials separate per environment
   - Document required env vars in `OAUTH_SETUP.md`

5. **Database Migrations:**
   - Migrations run automatically during `./scripts/deploy.sh`
   - Or run manually: `docker compose exec app npx prisma migrate deploy`
   - Use `prisma migrate deploy` in production (not `migrate dev`)

## 🚀 Quick Update Workflow

When you make changes and want to deploy:

```bash
# On Desktop (recommended - one command does everything)
git add .
git commit -m "your changes"
git push origin main
./scripts/deploy.sh  # Builds, transfers, and restarts automatically
```

**That's it!** The deploy script handles everything:

- Builds the Docker image for ARM64
- Transfers it to your Pi
- Syncs `docker-compose.yml` and `scripts/` directory automatically
- Restarts the container
- Runs database migrations if needed

**You never need to pull code on the Pi!** Everything is synced automatically:

- Application code → Inside Docker image
- `docker-compose.yml` → Synced by deploy script
- Helper scripts → Synced by deploy script

**Alternative (only if building on Pi - not recommended):**

```bash
# On Pi (only needed if building locally on Pi)
cd ~/pi-site
git pull origin main  # Only needed if you're building on Pi
./scripts/update-server.sh --local  # Slow - builds on Pi (not recommended)
```

**Note:** For regular deployments, just use `./scripts/deploy.sh` from your desktop. The Pi doesn't need the latest code - it gets the code via the Docker image.

## 🐛 Troubleshooting

### Container won't start

```bash
docker compose logs app  # Check error messages
```

### Database issues

```bash
# Check database file exists and has correct permissions
ls -la prisma/dev.db
chmod 644 prisma/dev.db
```

### Port already in use

```bash
# Check what's using port 3000
sudo lsof -i :3000
# Or change port in docker-compose.yml
```

### Need to rebuild from scratch

```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Docker Compose command not found

If you get `docker-compose: command not found`, try using the modern plugin syntax:

```bash
# Try this instead (space, not hyphen)
docker compose version

# If that works, use 'docker compose' for all commands
docker compose up -d
docker compose build
docker compose logs -f
```

If `docker compose` also doesn't work, install Docker Compose plugin:

```bash
# On Raspberry Pi (Debian/Ubuntu)
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Verify installation
docker compose version
```
