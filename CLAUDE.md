# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Next.js 15 portfolio website that showcases dog photos with AI-powered validation. The app uses PostgreSQL for data persistence, NextAuth for authentication, and a FastAPI service for image content validation. The project is designed for self-hosting on Ubuntu servers using Docker and Nginx.

## Development Commands

### Package Management

This project uses **npm** as the package manager (not Bun, despite references in README).

```bash
npm install              # Install dependencies
npm update              # Update all packages
```

### Development Workflow

```bash
# 1. Start supporting services (Postgres + AI validator)
npm run dev:services
# OR
docker-compose -f docker-compose.dev.yml up -d

# 2. Push database schema (first time or after schema changes)
npm run db:push

# 3. Start Next.js dev server
npm run dev             # Runs on http://localhost:3000 with Turbopack

# Stop services
npm run dev:services:stop
docker-compose -f docker-compose.dev.yml down

# View service logs
npm run dev:services:logs
docker-compose -f docker-compose.dev.yml logs -f
```

### Database Operations

```bash
npm run db:generate     # Generate migrations from schema changes (dev only)
npm run db:migrate      # Run pending migrations
npm run db:push         # Push schema directly (dev only, skips migrations)
npm run db:studio       # Open Drizzle Studio (http://localhost:4983)

# Direct Postgres access (dev)
docker exec -it pi_site_dev-db-1 psql -U myuser -d mydatabase
```

**Migration Workflow (Production):**
1. Make schema changes in `app/db/schema.ts`
2. Run `npm run db:generate` to create migration SQL files
3. Commit the migration files in `app/db/migrations/`
4. Deploy - migrations run automatically at container startup

Note: `db:push` is for development only. Production uses migrations which are safe and reversible.

### Build & Production

```bash
npm run build           # Build for production
npm run start           # Start production server (uses standalone output)
```

## Architecture

### Core Technologies

- **Next.js 15**: App Router, React Server Components, Server Actions
- **PostgreSQL**: Database with Drizzle ORM
- **NextAuth v4**: OAuth authentication (GitHub + Google)
- **FastAPI**: Python service for AI-powered image validation (NSFW + dog detection)
- **Tailwind CSS v4**: Styling with PostCSS
- **TypeScript**: Strict mode enabled

### Project Structure

```
app/
├── db/
│   ├── schema.ts          # Drizzle schema definitions
│   ├── drizzle.ts         # Database client setup
│   └── actions.ts         # Server actions for photo CRUD
├── components/            # React components
├── lib/                   # Utility functions and types
├── api/                   # API routes
├── auth.ts               # NextAuth configuration
└── [routes]/             # App Router pages

ai-img-validator/         # FastAPI service for image validation
docker-compose.dev.yml    # Local dev services
docker-compose.yml        # Production services
```

### Database Connection

The app uses environment-based connection strings:

- **`DATABASE_URL_EXTERNAL`**: Used when running outside Docker (local dev)
- **`DATABASE_URL`**: Used when running inside Docker (points to `db` service)

Schema is defined in `app/db/schema.ts` using Drizzle ORM. The main table is `photos` with UUID primary keys.

### Authentication System

NextAuth is configured in `app/auth.ts` with:

- **Providers**: GitHub and Google OAuth
- **Session Strategy**: JWT-based
- **User IDs**: Format is `{provider}-{accountId}` (e.g., "github-123456")
- **Admin System**: Set `ADMIN_USER_IDS` env var with comma-separated provider-accountId values. Admins get userId "admin" and can delete any photo.

### Server Actions Pattern

Server actions are defined in `app/db/actions.ts` and follow this pattern:

```typescript
export type APIResponse<T> = { data: T; error: undefined } | { data: undefined; error: string };
```

All actions return `APIResponse<T>` for consistent error handling.

### AI Image Validation

The `ai-img-validator` FastAPI service runs on port 8000 and validates:

1. **NSFW content detection**: Rejects inappropriate images
2. **Dog detection**: Ensures uploaded photos contain dogs

Service URL is configured via `PUBLIC_IMG_VALIDATOR_BASE_URL` env var:

- Development: `http://localhost:8000`
- Production: `http://ai-img-validator:8000`

The validation runs before file processing in `uploadPhoto()` server action.

### Static Asset Serving

Images use the path `/api/assets/images/{filename}` in all environments.

**Production**: Nginx intercepts `/api/assets/images/` requests and serves files directly from the Docker volume (`/var/lib/docker/volumes/pi-site_uploads_data/_data/`) with aggressive caching (1 year). This bypasses Node.js entirely.

**Development**: The Next.js API route at `app/api/assets/[...dir]/route.ts` serves files with streaming and proper caching headers.

Photos are stored in:
- **Upload path**: `process.env.IMG_UPLOAD_DIR` (dev: `./.data/uploads/images`, prod: `/data/uploads/images`)
- **Read path**: `/api/assets/images/{filename}` (both environments)

This architecture prevents 503 errors by keeping image requests off the Node.js event loop in production.

## Environment Variables

Required for local development (`.env.local`):

```bash
# Database
POSTGRES_USER=myuser
POSTGRES_PASSWORD=mypassword
POSTGRES_DB=mydatabase
DATABASE_URL=postgres://myuser:mypassword@localhost:5432/mydatabase
DATABASE_URL_EXTERNAL=postgres://myuser:mypassword@localhost:5432/mydatabase

# NextAuth
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=my-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Image handling
PUBLIC_IMG_VALIDATOR_BASE_URL=http://localhost:8000
IMG_UPLOAD_DIR=./.data/uploads/images

# App keys
SECRET_KEY=dev-secret
NEXT_PUBLIC_SAFE_KEY=dev-public

# Admin users (optional)
ADMIN_USER_IDS=github-123456,google-789012
```

For production (`.env.prod`), key differences:
- `DATABASE_URL` uses `db` hostname instead of `localhost`
- `PUBLIC_IMG_VALIDATOR_BASE_URL=http://ai-img-validator:8000`
- `IMG_UPLOAD_DIR=/data/uploads/images`

## Icon Usage

This project uses **lucide-react** for icons:

```typescript
import { IconName } from "lucide-react";

<IconName className="h-4 w-4" />
```

## Project Philosophy

- **Keep it simple**: This is a personal portfolio site, not an enterprise application
- **Don't overengineer**: Avoid unnecessary abstractions and premature optimization
- **Ask for clarification**: When requirements are unclear, ask before implementing
- **Small, focused changes**: Avoid sweeping refactors without explicit approval
- **Consistent with existing patterns**: Follow the established code style and architecture

## Common Issues & Solutions

### Postgres 18+ Volume Path

If Postgres container fails to start, ensure `docker-compose.dev.yml` uses the correct volume path:

```yaml
volumes:
  - postgres_data_dev:/var/lib/postgresql # NOT /var/lib/postgresql/data
```

### Drizzle Kit Environment Loading

`drizzle.config.ts` should load `.env.local` for local development. If environment variables aren't found, verify the config loads dotenv properly.

### Connection Refused Errors

Ensure Postgres container is running and healthy before running `db:push`:

```bash
docker-compose -f docker-compose.dev.yml ps  # Check status
docker-compose -f docker-compose.dev.yml logs db  # Check logs
```

## Deployment

The project includes deployment scripts for self-hosting on Ubuntu:

- `deploy.sh`: Initial deployment (installs dependencies, sets up Docker, Nginx, SSL)
- `update.sh`: Push updates to running production environment

See README.md for detailed deployment instructions.
