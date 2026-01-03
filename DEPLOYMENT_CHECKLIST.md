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
- [x] Code repository cloned/pulled on Pi

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

### 3. Get Code to Pi

```bash
# Option A: If you haven't cloned yet
git clone https://github.com/rioredwards/pi-site.git
cd pi-site

# Option B: If already cloned, pull latest
cd ~/pi-site
git pull origin main  # or dev, depending on your branch
```

### 4. Build and Start Docker Container on Pi

```bash
# Build the Docker image
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
Desktop                    GitHub                    Raspberry Pi
  │                          │                          │
  │  git push                │                          │
  ├─────────────────────────>│                          │
  │                          │                          │
  │                          │  git pull                │
  │                          ├─────────────────────────>│
  │                          │                          │
  │                          │                          │ docker compose build
  │                          │                          │ docker compose up
```

**Important:** Docker Compose does NOT push code to your Pi. The workflow is:

1. **Desktop:** Develop and test locally with `npm run dev`
2. **Desktop:** Commit and push to GitHub
3. **Pi:** Pull latest code from GitHub
4. **Pi:** Build and run Docker container

### Docker Container Explanation

When you run `docker compose up`:

1. **Build Phase** (first time or after changes):

   - Docker reads `Dockerfile`
   - Downloads Node.js 22 base image
   - Installs dependencies (`npm ci`)
   - Generates Prisma Client
   - Builds Next.js app (`npm run build`)
   - Creates a production-ready image

2. **Run Phase**:

   - Docker creates a container from the image
   - Mounts volumes (database, images) from your Pi's filesystem
   - Loads environment variables from `.env`
   - Starts the app with `npm start`
   - Exposes port 3000

3. **Persistence**:
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

1. **Test Docker Build Locally First:**

   ```bash
   # On desktop, test the Docker build
   docker compose up --build
   # If it works, you know it'll work on Pi
   ```

2. **Use Git Branches:**

   - `dev` branch for development
   - `main` branch for production
   - Pi pulls from `main`

3. **Environment-Specific Files:**

   - Never commit `.env` or `.env.local`
   - Keep OAuth credentials separate per environment
   - Document required env vars in `OAUTH_SETUP.md`

4. **Database Migrations:**
   - Run migrations on Pi after pulling new code
   - Use `prisma migrate deploy` in production (not `migrate dev`)

## 🚀 Quick Update Workflow

When you make changes and want to deploy:

```bash
# On Desktop
git add .
git commit -m "your changes"
git push origin main

# On Pi (SSH in)
cd /path/to/pi-site
git pull origin main
docker compose up -d --build  # Rebuilds and restarts
docker compose logs -f        # Watch logs
```

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
