# BIG REFACTOR PLAN FOR PI-SITE

## Overview

I am doing a project, where I am self hosting a next.js application on my raspberry pi for fun and learning purposes. I have a working version of the application, but getting all of the build/infra setup was a headache, so I want to recreate the build/infra/deployment setup from scratch, however, I will likely reuse some pieces such as the self-hosted github actions runner. All of the application code should remain the same if possible.

In the following document, I will outline the current state of the application/Infrastructure/Deployment setup/Scripts/Tech Stack/etc.. and then outline the plan for the big refactor.

## Main Goals of the Big Refactor

I found a tutorial on how to self-host a next.js application and want to somewhat start from scratch using that tutorial as a guide so that I can know that I am starting from a good foundation. That tutorial is [Self-Hosting Next.js](https://www.youtube.com/watch?v=sIVL4JMqRfc). The GitHub repository for the tutorial is [Next.js Self Hosting Example](https://github.com/leerob/next-self-host?tab=readme-ov-file). This should be referenced when building out the new infrastructure. We will need to adapt it work in the context of my project.

My current application is great, but the infra/deployment setup is a mess, so I want to recreate it from scratch using the tutorial as a guide. We will want to carry over some of the pieces such as the self-hosted github actions runner, but we will want to do the following:

- Follow the tutorial as a guide for the most part (and reference the example repo)
- Adapt the tutorial to work in the context of my project... This will entail:
  - Using a raspberry pi to host the next.js application instead of a vps
  - Using cloudflare tunnels to route traffic to the self-hosted next.js application (nginx will still be used internally as a reverse proxy, but Cloudflare Tunnel will handle external routing)
  - Using Docker and nginx to manage the next.js application (similar to tutorial architecture)
  - Using prisma and sqlite for the database instead of postgres (note: this means we don't need a database server)
  - Possibly other things I haven't thought of yet.. feel free to suggest things if you catch anything that is ambiguous or needs to be updated.
- Add an additional backend for content moderation (My AI Image Validation Service) - this will be internal-only, not exposed publicly
- Re-introduce the github actions workflow within the new infrastructure

## Current state of the application

## Current Network Architecture (rioedwards.com):

Architecture summary (rioedwards.com):
• DNS and SSL are managed by Cloudflare (authoritative nameservers).
• SSL/TLS mode is Full; Cloudflare encrypts both visitor → Cloudflare and Cloudflare → origin.
• The canonical public site is www.rioedwards.com, hosted on Vercel.
• The apex domain rioedwards.com performs a 308 redirect to www.rioedwards.com.
• Cloudflare is configured DNS-only (not proxied) for Vercel traffic to avoid conflicts.
• Vercel production deploys from the main branch and serves the portfolio site.

Vercel DNS details:
• @ → A record to Vercel (76.76.21.21)
• www → CNAME to cname.vercel-dns.com
• \_vercel TXT record used for domain verification
• Vercel recommends updated DNS targets due to IP expansion, but current records function.

Non-Vercel service:
• pi.rioedwards.com is not hosted on Vercel.
• It is routed through a Cloudflare Tunnel (cloudflared).
• Traffic flows Cloudflare → tunnel → http://localhost:3000 on the tunnel host.
• The tunnel is healthy and exposes no public IP.
• Tunnel traffic is Cloudflare-proxied and isolated from the Vercel setup.
• nginx acts as reverse proxy between Cloudflare Tunnel and Next.js container only.

# Next.js Application Summary

## Key Features

### 1. Dog Photo Gallery (KEEP)

- Users can upload photos of their dogs
- Photos are displayed in a responsive grid layout on the home page
- Users can delete their own photos (or any photos if admin)

### 2. Authentication & Authorization (KEEP)

- GitHub and Google OAuth via NextAuth.js
- Admin users configured via `ADMIN_USER_IDS` environment variable
- JWT-based sessions

### 3. Content Moderation (REPLACE)

- Was using NSFWJS, but decided to create a standalone backend to provide this service (more on this below under "My AI Image Validation Service")

### 5. Ancillary Pages (KEEP)

- `/stats` page displays some system information about the Raspberry Pi
- `/about` page is a personal story and technical details about the project

---

## Tech Stack Overview

### Frontend (KEEP)

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **ShadCN UI** components

### Backend (UPDATE)

- **Next.js API Routes & Server Actions** (UPDATE: Needs to be linked up to use the new separate backend for content moderation (My AI Image Validation Service))
- **NextAuth.js v4** (GitHub/Google OAuth)
- **Prisma ORM** with SQLite
- **Better-SQLite3** adapter

### Infrastructure (UPDATE)

- **Self-hosted on Raspberry Pi** (KEEP)
- **PM2** for process management (KEEP)
- **Cloudflare Tunnels** for public access (KEEP)
- **GitHub Actions** with self-hosted runner (UPDATE: after integrating the new deployment workflow, we will need to re-introduce the github actions workflow within the new infrastructure)
- **TODO**: Need to clean up and extend current infra/scripts to accomodate new backend for content moderation (My AI Image Validation Service) as well as the new deployment workflow.

### Storage (KEEP)

- **SQLite database** (`prisma/dev.db`)
- **Filesystem storage** (`public/images/`)
- Image metadata stored in database

---

## Current Build/Infrastructure/Deployment Setup (UPDATE)

MOST OF THIS SHOULD BE SCRAPPED IN FAVOR OF THE NEW INFRASTRUCTURE AND DEPLOYMENT WORKFLOW. keeping it here for reference because we will need to modify the deployment workflow from the tutorial to work in the context of my project.

### Development Environment (iMac)

#### Local Development

```bash
npm run dev  # Standard Next.js dev server on localhost:3000
```

#### Build Process

- `npm run build` → calls `scripts/build-prod.sh`
- Build script does:
  1. Cleans `.next` directory
  2. Runs `next build` (creates standalone output)
  3. Copies static files to `.next/standalone/.next/static`
  4. Copies `public/` folder to `.next/standalone/public`
  5. Copies `prisma/` directory (database + migrations) to `.next/standalone/prisma`

#### Configuration

- **`next.config.ts`**: Standalone output, source maps enabled, server actions body size limit 5MB
- **`ecosystem.config.js`**: PM2 config with two apps:
  - `pi-site`: Production app
  - `pi-site-debug`: Debug config (not used... should be removed)

#### Environment Variables

- `.env.local` for local dev
- `.env` for production-like testing
- Required vars: `AUTH_SECRET`, `GITHUB_CLIENT_ID/SECRET`, `GOOGLE_CLIENT_ID/SECRET`, `ADMIN_USER_IDS`, `DATABASE_URL`, `NEXTAUTH_URL`

---

### Production Environment (Raspberry Pi) (UPDATE: follow tutorial)

#### Deployment Workflow

**1. Development → GitHub:**

- Code written on iMac
- Push to `main` branch

**2. GitHub Actions Trigger:**

- Workflow: `.github/workflows/deploy.yml`
- Trigger: Push to `main` branch
- Runner: **Self-hosted runner** on Pi
- Security: Only runs if actor is repo owner and not a fork

**3. GitHub Actions Steps:**

- Checkout code
- Setup Node.js 20
- `npm ci` (clean install)
- Generate Prisma client
- Test build
- Deploy application:
  - Navigate to `~/pi-site`
  - `git pull origin main`
  - `npm install` (rebuilds native modules for ARM)
  - `npm rebuild better-sqlite3`
  - Setup directories (`public/images`)
  - Generate Prisma client
  - `npm run build`
  - PM2: delete old process, start new, save

#### PM2 Configuration

- **Docker Compose**: Orchestrates both Next.js and FastAPI services
- **Next.js Container**:
  - **Dockerfile**: Multi-stage build for Next.js application
  - **Port**: 3000 (exposed to host for nginx)
  - **Restart policy**: `unless-stopped` (auto-restart on failure)
  - **Volumes**:
    - Database: `prisma/dev.db` (persistent storage)
    - Images: `public/images/` (persistent storage)
    - Models: `public/models/` (persistent storage)
- **FastAPI Container**:
  - **Dockerfile**: Python 3.11 with FastAPI dependencies
  - **Port**: 8000 (internal Docker network only, not exposed to host)
  - **Restart policy**: `unless-stopped` (auto-restart on failure)
  - **Volumes**: Model files for ML inference
- **Docker Network**: Both containers on shared bridge network for internal communication
  - Next.js calls FastAPI using service name: `http://fastapi:8000/analyze`

#### nginx Configuration

- **Reverse proxy**: Routes traffic from Cloudflare Tunnel to Next.js container only
- **Upstream**: `http://localhost:3000` (Next.js Docker container)
- **SSL/TLS**: Handled by Cloudflare (Full mode)
- **Configuration**: `/etc/nginx/sites-available/pi-site` (UPDATE: follow tutorial)
- **Note**: FastAPI is not exposed through nginx - it's only accessible internally via Docker network

#### Docker Internal Networking

- **Shared Docker Network**: Both Next.js and FastAPI containers run on the same Docker bridge network
- **Service Discovery**: Containers can communicate using service names defined in `docker-compose.yml`
- **Next.js → FastAPI Communication**:
  - Next.js calls FastAPI using: `http://fastapi:8000/analyze`
  - The hostname `fastapi` resolves to the FastAPI container's IP on the Docker network
  - No need for CORS since both services are on the same network
  - FastAPI port 8000 is not exposed to the host - only accessible from other containers
- **Benefits**:
  - FastAPI is not publicly accessible (security)
  - Simple service-to-service communication
  - No need for complex routing rules in nginx
  - Follows microservices best practices

#### System Dependencies (Pi)

- Docker and Docker Compose
- nginx
- Checked/installed via setup scripts (UPDATE: follow tutorial)

#### Database (UPDATE: there are a lot of database scripts to manage... we could simplify this)

- SQLite file: `prisma/dev.db`
- Migrations: `prisma/migrations/`
- Prisma client generated during build
- Migrations run automatically (via `prisma migrate deploy` in deployment)

#### File Storage

- Images: `public/images/`
- Model files: `public/models/mobilenet_v2_mid/`
- Metadata: Database (migrated from JSON files)

---

## Scripts Analysis (Current vs Outdated)

MOST OF THESE SHOULD BE SCRAPPED IN FAVOR OF THE NEW INFRASTRUCTURE AND DEPLOYMENT WORKFLOW.

### Currently Used Scripts

1. **`deploy.sh`** - Manual deployment from desktop (UPDATE: adapt for Docker)
   - Tests build locally first
   - Commits and pushes to GitHub
   - SSHs to Pi, pulls code, builds Docker image, restarts container
   - Used for feature branches

2. **`deploy-from-github.sh`** - Called by GitHub Actions (UPDATE: adapt for Docker)
   - Runs on Pi during GitHub Actions workflow
   - Pulls code, builds Docker image, restarts container

3. **`build-prod.sh`** - Production build script
   - Called by `npm run build`
   - Handles standalone output and file copying

4. **`setup-pi.sh`** - One-time Pi setup (UPDATE: adapt for Docker and nginx)
   - Installs Docker, Docker Compose, nginx, system dependencies, creates directories

5. **`check-system-deps.sh`** - System dependency checker
   - Checks/installs canvas dependencies
   - Called during deployment

6. **`start-server.sh` / `stop-server.sh` / `check-server.sh`** - Docker container management (UPDATE: adapt for Docker)
   - Helper scripts for managing Docker containers

7. **`update-server.sh`** - Pull code and optionally rebuild
   - For manual updates when already on Pi

8. **`rebuild-native-modules.sh`** - Rebuild native modules
   - For fixing native module issues (better-sqlite3, canvas)

9. **`migrate-to-db.ts`** - Data migration script
   - Migrates old JSON metadata to database (one-time use)

10. **`test-db.ts`** - Database connection test
    - Utility for testing database connectivity

11. **`get-user-id.ts`** - Get user ID utility
    - Helper for finding user IDs for admin config

### Potentially Outdated/Misleading

1. **`download-model.sh`** - Model download script
   - Comment says "DIDN'T WORK"
   - Model files already exist in `public/models/`
   - Can be ignored or removed

2. **Docker References:**
   - Comments in `test-db.ts`, `migrate-to-db.ts`, `get-user-id.ts` mention Docker
   - These are outdated comments (you're not using Docker)
   - Scripts still work, just ignore Docker instructions

3. **Debug Configuration:**
   - `ecosystem.config.js` has `pi-site-debug` config
   - `package.json` has `start:debug` script
   - You mentioned debugging didn't work, so these are likely unused

4. **`setup-mac.sh`** - Mac setup script (UPDATE: adapt for Docker)
   - Still relevant if you want production-like testing on Mac
   - Uses Docker like the Pi setup

5. **`fix-database.sh` / `check-database.sh`** - Database utilities
   - May be useful for troubleshooting, but not part of regular workflow

---

## Environment Setup Summary

### Development (iMac)

- Node.js 20+, npm 10+
- Standard Next.js dev workflow
- Local SQLite database
- `.env.local` for secrets

### Production (Raspberry Pi)

- Docker and Docker Compose
- nginx as reverse proxy
- System dependencies for canvas (included in Docker image)
- `.env` file with production secrets
- Self-hosted GitHub Actions runner
- Cloudflare Tunnel for public access

### Build Artifacts

- **Docker images**:
  - Next.js application container (public-facing)
  - FastAPI backend container (internal-only)
- **Next.js container includes**: server.js, static files, public folder, prisma directory
- **FastAPI container includes**: Python runtime, ML models, FastAPI application
- Built using multi-stage Dockerfiles and orchestrated with Docker Compose (UPDATE: follow tutorial)

### Deployment Flow (UPDATE: follow tutorial)

```
iMac (dev)
  → git push main
  → GitHub
  → Self-hosted runner on Pi
  → git pull
  → docker-compose build (builds Next.js and FastAPI containers)
  → docker-compose down (stop old containers)
  → docker-compose up -d (start new containers)
  → nginx reload (if config changed)
```

---

## Notes for Your Changes

1. **Docker and nginx will be used** - Following the tutorial architecture with Docker for containerization and nginx as reverse proxy
2. **PM2 will be removed** - Replaced with Docker's built-in restart policies and nginx for reverse proxying
3. **Current workflow**: iMac → GitHub → Self-hosted runner → Pi deployment (UPDATE: follow tutorial to get basic Docker/nginx deployment working, then extend it to re-introduce the github actions workflow)
4. **Scripts are a mix of current and legacy** - many are from experimentation (UPDATE: simplify and clean up the scripts, most of these should be scrapped in favor of the new Docker/nginx infrastructure and deployment workflow)
5. **Database migrated from JSON** - old JSON metadata system replaced with Prisma/SQLite. The seed data is still sourced from those JSON metadata files... this is annoying to manage. I would like to stop supporting the old JSON metadata system and only use the database. We should use the images in the public/images folder as the seed data.
6. **Cloudflare Tunnel integration** - nginx will run internally on the Pi, and Cloudflare Tunnel will route external traffic to nginx (which then proxies to the Next.js Docker container). FastAPI backend is internal-only and not exposed publicly. This maintains the security benefits of Cloudflare Tunnel while using nginx for routing to the public-facing Next.js app.
7. **Internal service communication** - Next.js container communicates with FastAPI container via Docker's internal network using service names (e.g., `http://fastapi:8000`). This keeps the FastAPI service secure and not publicly accessible.

# AI Image Validation Service Summary

A lean microservice for analyzing images for NSFW content and dog detection, with a Next.js frontend. Also includes a next.js application for the frontend which is linked up to the backend for testing and development purposes.

NOTE: This will need to be adapted slightly to work in the context of the Dog Photo Gallery application. Specifically, we will scrap the frontend in this package and only keep the backend. The FastAPI backend will be containerized and orchestrated alongside the Next.js app using Docker Compose. **IMPORTANT**: The FastAPI service will be internal-only (not exposed through nginx or Cloudflare Tunnel). It will only be accessible from the Next.js container via Docker's internal network. This provides better security by keeping the content moderation service private.

NOTE 2: The required version of python is 3.11. This is essential for the app to work correctly. The libraries are also bound to specifc versions which must not be changed. The app will break if the version of these libraries is not correct.

## Architecture

- **Backend**: FastAPI service (optimized for Raspberry Pi)
- **Frontend**: Next.js 16 application with Tailwind CSS 4
- **Models**:
  - OpenNSFW for NSFW detection
  - MobileNetV2 (ImageNet) for dog detection

## Backend Setup (Raspberry Pi)

1. **Navigate to backend directory:**

   ```bash
   cd backend
   ```

2. **Create and activate virtual environment:**

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

   **Note for Raspberry Pi:** If PyTorch installation fails, you may need to install it separately first:

   ```bash
   # Install PyTorch (check https://pytorch.org/get-started/locally/ for ARM-specific builds)
   pip install torch torchvision

   # Then install remaining dependencies
   pip install -r requirements.txt
   ```

4. **Run the service:**

   ```bash
   python main.py
   ```

   Or with uvicorn directly:

   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

   **Note**: In production, the FastAPI service will be containerized and only accessible internally via Docker network (not exposed publicly). The Next.js app will call it using the Docker service name: `http://fastapi:8000`

5. **Test the service:**

   ```bash
   curl http://localhost:8000/
   ```

   Expected response:

   ```json
   {
     "status": "ok",
     "service": "NSFW + Dog Filter API",
     "nsfw_model_loaded": true,
     "dog_model_loaded": true
   }
   ```

## Frontend Setup

**NOTE**: The frontend in this package will be scrapped. Only the FastAPI backend will be used. The Next.js Dog Photo Gallery app will call the FastAPI service internally via Docker network.

**For Next.js App Integration:**

The Next.js app will communicate with FastAPI using Docker service names when running in production:

```typescript
// In Next.js API routes or server actions
const response = await fetch("http://fastapi:8000/analyze", {
  method: "POST",
  body: formData,
});
```

The hostname `fastapi` resolves to the FastAPI container because both containers are on the same Docker network defined in `docker-compose.yml`.

## API Endpoints

### `GET /`

Health check endpoint that returns service status and model loading state.

**Response:**

```json
{
  "status": "ok",
  "service": "NSFW + Dog Filter API",
  "nsfw_model_loaded": true,
  "dog_model_loaded": true
}
```

### `POST /analyze`

Analyze an uploaded image

**Request:**

- Content-Type: `multipart/form-data`
- Body: `file` (image file)

**Response:**

```json
{
  "filename": "image.jpg",
  "nsfw_score": 0.0234,
  "is_nsfw": false,
  "dog_probability": 0.8567,
  "is_dog": true
}
```

## Dependencies

### Backend Requirements

- Python 3.11+
- FastAPI 0.115.0
- uvicorn[standard] 0.32.0
- python-multipart 0.0.12
- PyTorch (version resolved automatically)
- torchvision (version resolved automatically)
- opennsfw-standalone 0.0.6
- Pillow 8.4.0
- numpy < 2.0.0

### Frontend Requirements

- Node.js 18+
- Next.js 16.1.1
- React 19.2.3
- Tailwind CSS 4.x

## Deployment Notes

### Raspberry Pi Considerations

- Models are loaded once at startup (memory efficient)
- Docker will handle process management with restart policies
- For better performance, consider using a GPU if available
- PyTorch installation on ARM may require special builds (handled in Dockerfile)
- Backend service will be containerized alongside the Next.js app

### Production Checklist

- **CORS configuration**: Not needed for FastAPI since it's internal-only (Next.js calls it directly via Docker network)
- **Environment variables**: Passed to Docker containers via `.env` file or Docker Compose environment section
- **SSL/TLS certificates**: Handled by Cloudflare (Full mode) - only applies to Next.js app
- **nginx configuration**: Routes external traffic to Next.js container only (FastAPI is not exposed)
- **Docker volumes**: Persistent storage for database, images, and models
- **Docker network**: Both containers on shared bridge network for internal communication
- **Service discovery**: Next.js uses Docker service name `fastapi` to communicate with FastAPI container

## Development

### Development

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

# Raspberry Pi Specifications

rio-raspberry-pi
description: Computer
product: Raspberry Pi 5 Model B Rev 1.0
Static hostname: rio-raspberry-pi
Icon name: computer
Operating System: Debian GNU/Linux 13 (trixie)
Kernel: Linux 6.12.47+rpt-rpi-2712
Architecture: arm64
Linux rio-raspberry-pi 6.12.47+rpt-rpi-2712 #1 SMP PREEMPT Debian 1:6.12.47-1+rpt1 (2025-09-16) aarch64 GNU/Linux
IP Address: 192.168.0.151

# Additional Notes

My mac has an ssh config that allows me to ssh into the raspberry pi using the command `ssh pi`. If you are an agentic AI model, feel free to use this to ssh into the raspberry pi. If that doesn't work, you might need to use the ip address of the raspberry pi which is `192.168.0.151`. If you have any issues, feel free to ask me for help. It's important that you can ssh into the raspberry pi to troubleshoot any issues.
