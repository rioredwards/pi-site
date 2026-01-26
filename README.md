# DogTown - Dog Photo Gallery

A Next.js 15 portfolio website for showcasing dog photos with AI-powered validation. Built for self-hosting on a Raspberry Pi using Docker, PostgreSQL, and Cloudflare Tunnel.

## Features

- **Photo Gallery**: Responsive grid with infinite scroll pagination
- **Lightbox Viewing**: Full-screen photo viewing with navigation
- **AI Image Validation**: NSFW detection + dog verification via FastAPI service
- **Authentication**: NextAuth with GitHub and Google OAuth
- **User Profiles**: View any user's profile and their uploaded photos
- **Profile Editing**: Users can customize their display name and profile picture
- **Admin System**: Configurable admin users who can delete any photo
- **Photo Upload**: Upload dog photos with AI validation and celebratory confetti
- **Stats Dashboard**: Live system monitoring with 3D Raspberry Pi model
- **About Page**: MDX-powered with lightbox galleries and interactive components
- **Analytics**: Umami self-hosted analytics integration
- **PostgreSQL Database**: Drizzle ORM with migration support
- **Self-Hosted**: Runs on Raspberry Pi with Docker + Nginx

## Prerequisites

1. A Linux server (Raspberry Pi, Ubuntu, etc.)
2. Domain name with Cloudflare DNS (for tunnel)
3. GitHub and/or Google OAuth apps configured
4. SSH access to your server

## Quick Start (Local Development)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.local.example .env.local
# Edit .env.local with your values
```

### 3. Start Services

```bash
# Start all services (Postgres, AI validator, Next.js) via Docker
npm run dev

# Or run separately:
docker compose up -d             # Start services only
npm run db:push                  # Push database schema (first time)
npm run dev:next                 # Start Next.js dev server
```

Visit http://localhost:3000

### 4. Stop Services

```bash
npm run dev:stop
```

## Production Deployment

### Initial Setup

1. **Create your production env file locally**:

   ```bash
   cp .env.example .env.prod
   # Edit .env.prod with production values
   ```

2. **Sync env file to your server**:

   ```bash
   rsync -avz .env.prod pi@your-server:~/pi-site/.env.prod
   ```

3. **SSH into your server and deploy**:

   ```bash
   ssh your-server
   git clone https://github.com/rioredwards/pi-site.git ~/pi-site
   cd ~/pi-site
   chmod +x deploy.sh
   ./deploy.sh
   ```

   The deployment script will:
   - Install Docker if needed
   - Set up Nginx reverse proxy
   - Build and start all containers
   - Run database migrations automatically
   - Clean up old Docker images

### Updating Production

```bash
# On your server
cd ~/pi-site
./update.sh
```

Or simply re-run `./deploy.sh` - it's safe to run repeatedly.

## Project Structure

```
pi-site/
├── app/                      # Next.js App Router
│   ├── db/                   # Database schema, client, and migrations
│   │   ├── schema.ts         # Drizzle schema (photos, users tables)
│   │   ├── drizzle.ts        # Database client
│   │   ├── actions.ts        # Server actions
│   │   └── migrations/       # SQL migration files
│   ├── lib/                  # Utilities and types
│   ├── api/                  # API routes
│   ├── profile/              # User profile pages
│   │   ├── [userId]/         # View any user's profile
│   │   └── edit/             # Edit own profile
│   ├── stats/                # System stats dashboard
│   ├── about/                # About page (MDX)
│   └── auth.ts               # NextAuth configuration
├── components/               # React components
├── scripts/                  # Build and deployment scripts
│   ├── run-migrations.js     # Production migration runner
│   └── docker-entrypoint.sh  # Container startup script
├── ai-img-validator/         # FastAPI image validation service
├── docker-compose.yml        # Production services
├── docker-compose.dev.yml    # Development services
├── docker-compose.staging.yml # Staging services
├── Dockerfile                # Next.js app container
├── deploy.sh                 # Initial deployment script
└── update.sh                 # Update script
```

## Environment Variables

### Required

```bash
# Database
POSTGRES_USER=myuser
POSTGRES_PASSWORD=your-password
POSTGRES_DB=mydatabase
DATABASE_URL=postgres://myuser:password@db:5432/mydatabase

# NextAuth
AUTH_SECRET=your-secret-here
NEXTAUTH_URL=https://your-domain.com
GITHUB_CLIENT_ID=your-github-id
GITHUB_CLIENT_SECRET=your-github-secret
GOOGLE_CLIENT_ID=your-google-id
GOOGLE_CLIENT_SECRET=your-google-secret

# Image handling
PUBLIC_IMG_VALIDATOR_BASE_URL=http://ai-img-validator:8000  # prod
IMG_UPLOAD_DIR=/data/uploads/images                          # prod

# App keys
SECRET_KEY=your-secret-key
NEXT_PUBLIC_SAFE_KEY=your-public-key

# System Profiler (for /stats page)
SYSTEM_PROFILER_BASE_URL=http://system-profiler:8787  # prod
SYSTEM_PROFILER_AUTH_TOKEN=your-auth-token
```

### Development vs Production

| Variable                        | Development              | Production                     |
| ------------------------------- | ------------------------ | ------------------------------ |
| `DATABASE_URL`                  | `...@localhost:5432/...` | `...@db:5432/...`              |
| `PUBLIC_IMG_VALIDATOR_BASE_URL` | `http://localhost:8000`  | `http://ai-img-validator:8000` |
| `IMG_UPLOAD_DIR`                | `./.data/uploads/images` | `/data/uploads/images`         |

### Optional

```bash
# Admin users (comma-separated provider-accountId format)
ADMIN_USER_IDS=github-123456,google-789012

# Umami Analytics
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your-website-id
NEXT_PUBLIC_UMAMI_URL=https://your-umami-instance.com
```

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS v4, Three.js
- **Content**: MDX for rich content pages
- **Backend**: Next.js Server Actions, NextAuth v4
- **Database**: PostgreSQL 17 + Drizzle ORM
- **AI Service**: FastAPI (Python) with NSFW + dog detection
- **Analytics**: Umami (self-hosted)
- **Deployment**: Docker, Nginx, Cloudflare Tunnel
- **Icons**: Lucide React, Hugeicons

## Development Commands

```bash
# Development (Docker-based)
npm run dev                    # Start all services (Postgres, AI validator, etc.) via Docker
npm run dev:next               # Start Next.js dev server only (if services already running)
npm run dev:stop               # Stop dev services
npm run dev:logs               # View dev service logs

# Staging (full stack locally in Docker)
npm run staging                # Start all services in Docker (staging config)
npm run staging:stop           # Stop staging
npm run staging:logs           # View staging logs
npm run staging:reset          # Wipe staging (including volumes)

# Database
npm run db:generate            # Generate migrations from schema changes
npm run db:migrate             # Run pending migrations
npm run db:push                # Push schema directly (dev only)
npm run db:studio              # Open Drizzle Studio

# Build
npm run build                  # Build for production
npm run start                  # Start production server
npm run lint                   # Run ESLint
npm run typecheck              # Run TypeScript check
```

## Database Management

### Migration Workflow

1. Make changes to `app/db/schema.ts`
2. Generate migration: `npm run db:generate`
3. Commit the migration files in `app/db/migrations/`
4. Deploy - migrations run automatically at container startup

### Local Development

```bash
# Quick schema sync (no migrations)
npm run db:push

# View database in browser
npm run db:studio

# Direct database access
docker exec -it pi_site_dev-db-1 psql -U myuser -d mydatabase
```

### Production

```bash
# SSH into server
ssh your-server
cd ~/pi-site

# Access database
docker compose exec db psql -U myuser -d mydatabase
```

## OAuth Setup

### GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Create a new OAuth App
3. Set **Authorization callback URL** to:
   ```
   https://your-domain.com/api/auth/callback/github
   ```
4. Add Client ID and Secret to `.env.prod`

### Google OAuth App

1. Go to https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID
3. Add to **Authorized redirect URIs**:
   ```
   https://your-domain.com/api/auth/callback/google
   ```
4. Add Client ID and Secret to `.env.prod`

## Admin Users

To make a user an admin:

1. Sign in to the app
2. Check your user ID in the database:
   ```sql
   SELECT DISTINCT user_id FROM photos;
   ```
3. Add your user ID to `.env.prod`:
   ```bash
   ADMIN_USER_IDS=github-123456,google-789012
   ```
4. Restart the app

Admins can delete any photo; regular users can only delete their own.

## Troubleshooting

### Database Connection Issues

- Ensure DATABASE_URL uses `db` as hostname in production (Docker network)
- Use `localhost` only in development
- Restart containers: `docker compose down && docker compose up -d`

### Auth Issues

- Ensure `AUTH_SECRET` is set
- Ensure `NEXTAUTH_URL` matches your actual domain
- Restart containers after changing env vars

### Image Upload Fails

- Check AI validator is running: `docker compose ps`
- View logs: `docker compose logs ai-img-validator`
- Ensure images are < 5MB and are JPEG/PNG/WebP format

### Docker IPv6 Issues

If Docker can't pull images due to IPv6 issues:

```bash
# Disable IPv6 for Docker
sudo tee /etc/docker/daemon.json > /dev/null <<'EOF'
{
  "ip6tables": false,
  "ipv6": false
}
EOF
sudo systemctl restart docker
```

### Disk Space (Old Docker Images)

The deploy script automatically prunes old images. For manual cleanup:

```bash
docker image prune -f           # Remove unused images
docker system prune -af         # Remove everything unused (careful!)
```

## License

MIT

## Credits

Based on the [Next.js Self-Hosting Example](https://github.com/leerob/next-self-host) by Lee Robinson.
