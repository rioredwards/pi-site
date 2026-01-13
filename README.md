# DogTownUSA - Dog Photo Gallery

A Next.js 15 portfolio website for showcasing dog photos with AI-powered validation. Built for self-hosting on a Raspberry Pi using Docker, PostgreSQL, and Cloudflare Tunnel.

## Features

- **Photo Gallery**: Responsive grid display of dog photos (shuffled on load)
- **AI Image Validation**: NSFW detection + dog verification via FastAPI service
- **Authentication**: NextAuth with GitHub and Google OAuth
- **Admin System**: Configurable admin users who can delete any photo
- **Photo Upload**: Users can upload dog photos with automatic validation
- **PostgreSQL Database**: Drizzle ORM with proper schema management
- **Self-Hosted**: Runs on Raspberry Pi with Docker + Cloudflare Tunnel

## Prerequisites

1. A Linux server (Raspberry Pi, Ubuntu droplet, etc.)
2. Domain name with Cloudflare DNS
3. GitHub and/or Google OAuth apps configured
4. Docker and Docker Compose installed on server

## Quick Start (Local Development)

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Services

```bash
# Start PostgreSQL and AI validator services
npm run dev:services

# Push database schema (first time only)
npm run db:push

# Start Next.js dev server
npm run dev
```

Visit http://localhost:3000

### 3. Stop Services

```bash
npm run dev:services:stop
```

## Production Deployment

### Initial Setup

1. **SSH into your server**:
   ```bash
   ssh your-server
   ```

2. **Clone and deploy**:
   ```bash
   git clone https://github.com/rioredwards/pi-site.git
   cd pi-site
   chmod +x deploy.sh
   ./deploy.sh
   ```

   The deployment script will:
   - Install Docker and dependencies
   - Set up Nginx reverse proxy
   - Configure Cloudflare Tunnel
   - Create PostgreSQL database
   - Build and start all services

3. **Configure environment variables**:
   Edit `.env` on the server with your OAuth credentials:
   ```bash
   AUTH_SECRET=your-secret-here
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

4. **Restart services**:
   ```bash
   sudo docker compose down
   sudo docker compose up -d
   ```

### Updating Production

```bash
cd ~/pi-site
./update.sh
```

This will pull latest changes, rebuild containers, and restart services.

## Project Structure

```
pi-site/
├── app/                      # Next.js App Router
│   ├── db/                   # Database schema and actions
│   │   ├── schema.ts         # Drizzle schema
│   │   ├── drizzle.ts        # Database client
│   │   └── actions.ts        # Server actions
│   ├── components/           # React components
│   ├── lib/                  # Utilities and types
│   ├── api/                  # API routes
│   └── auth.ts              # NextAuth configuration
├── ai-img-validator/        # FastAPI image validation service
├── components/              # Shared components
├── public/                  # Static assets
├── types/                   # TypeScript type definitions
├── docker-compose.yml       # Production services
├── docker-compose.dev.yml   # Development services
├── Dockerfile              # Next.js app container
├── deploy.sh               # Initial deployment script
└── update.sh               # Update script
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
```

### Optional

```bash
# Admin users (comma-separated provider-accountId format)
ADMIN_USER_IDS=github-123456,google-789012

# AI Validator URL (defaults to http://ai-img-validator:8000 in Docker)
NSFW_API_URL=http://localhost:8000
```

## Tech Stack

- **Frontend**: Next.js 15, React, Tailwind CSS v4
- **Backend**: Next.js Server Actions, NextAuth v4
- **Database**: PostgreSQL 17 + Drizzle ORM
- **AI Service**: FastAPI (Python) with NSFW + dog detection
- **Deployment**: Docker, Nginx, Cloudflare Tunnel
- **Icons**: @hugeicons (not lucide-react!)

## Development Commands

```bash
# Package management
npm install              # Install dependencies
npm update              # Update packages

# Development
npm run dev             # Start dev server
npm run dev:services    # Start Postgres + AI validator
npm run dev:services:stop  # Stop services
npm run dev:services:logs  # View service logs

# Database
npm run db:push         # Push schema changes
npm run db:generate     # Generate migrations
npm run db:studio       # Open Drizzle Studio

# Build
npm run build           # Build for production
npm run start           # Start production server
```

## Database Management

### Local Development

```bash
# Push schema
npm run db:push

# View database in browser
npm run db:studio

# Direct database access
docker exec -it pi-site-db-1 psql -U myuser -d mydatabase
```

### Production

```bash
# SSH into server
ssh your-server
cd ~/pi-site

# Access database
sudo docker compose exec db psql -U myuser -d mydatabase
```

## OAuth Setup

### GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Create a new OAuth App
3. Set **Authorization callback URL** to:
   ```
   https://your-domain.com/api/auth/callback/github
   ```
4. Add Client ID and Secret to `.env`

### Google OAuth App

1. Go to https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID
3. Add to **Authorized redirect URIs**:
   ```
   https://your-domain.com/api/auth/callback/google
   ```
4. Add Client ID and Secret to `.env`

## Admin Users

To make a user an admin:

1. Sign in to the app
2. Check the database for your user ID:
   ```sql
   SELECT * FROM photos WHERE user_id LIKE 'github-%' OR user_id LIKE 'google-%';
   ```
3. Add your user ID to `.env`:
   ```bash
   ADMIN_USER_IDS=github-123456,google-789012
   ```
4. Restart the app

Admins can delete any photo; regular users can only delete their own.

## Troubleshooting

### Database Connection Issues

If you see "Failed query" errors:
- Ensure `DATABASE_URL_EXTERNAL` is NOT set in production `.env`
- Use `DATABASE_URL=postgres://...@db:5432/...` (points to Docker service)
- Restart containers: `sudo docker compose down && sudo docker compose up -d`

### Auth Issues

If you get "NO_SECRET" errors:
- Ensure `AUTH_SECRET` is set in `.env`
- Restart containers after changing `.env`

### Image Upload Fails

- Check AI validator is running: `sudo docker compose ps`
- View logs: `sudo docker compose logs ai-img-validator`
- Ensure images are < 5MB and are JPEG/PNG/WebP format

## License

MIT

## Credits

Based on the [Next.js Self-Hosting Example](https://github.com/leerob/next-self-host) by Lee Robinson.
