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
# Start everything via Docker (Postgres, AI validator, system-profiler, Next.js)
npm run dev

# Or run separately:
docker compose up -d     # Start services only
npm run db:push          # Push database schema (first time or after schema changes)
npm run dev:next         # Start Next.js dev server (http://localhost:3000)

# Stop services
npm run dev:stop

# View service logs
npm run dev:logs
```

### Staging & Production

```bash
# Staging
npm run staging          # Start staging environment
npm run staging:stop     # Stop staging
npm run staging:logs     # View logs

# Production
npm run prod             # Start production environment
npm run prod:stop        # Stop production
npm run prod:logs        # View logs
```

### Database Operations

```bash
npm run db:generate     # Generate migrations from schema changes (dev only)
npm run db:migrate      # Run pending migrations
npm run db:push         # Push schema directly (dev only, skips migrations)
npm run db:studio       # Open Drizzle Studio (http://localhost:4983)

# Direct Postgres access (dev)
docker compose exec db psql -U myuser -d mydatabase
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
- **MDX**: Rich content pages (about page)
- **Three.js**: 3D graphics (Raspberry Pi model on stats page)
- **Umami**: Self-hosted analytics

### Project Structure

```
app/
├── db/
│   ├── schema.ts          # Drizzle schema (photos, users tables)
│   ├── drizzle.ts         # Database client setup
│   ├── actions.ts         # Server actions for photo/user CRUD
│   └── migrations/        # SQL migration files
├── lib/                   # Utility functions and types
├── api/                   # API routes
├── profile/
│   ├── [userId]/          # User profile page
│   └── edit/              # Profile editing page
├── stats/                 # System stats dashboard
├── about/                 # About page (MDX)
├── auth.ts                # NextAuth configuration
└── page.tsx               # Home page (photo gallery)

components/
├── main.tsx               # Main gallery with infinite scroll
├── photo-grid.tsx         # Grid layout for photos
├── dog-card/              # Individual photo card component
├── profile-photos-grid.tsx # Photo grid for profile pages
├── lightbox/              # Full-screen photo viewer
├── photo-upload.tsx       # Upload modal with AI validation
└── ui/                    # Shared UI components

ai-img-validator/              # FastAPI service for image validation
docker-compose.yml             # Base configuration (shared)
docker-compose.override.yml    # Dev overrides (auto-loaded)
docker-compose.staging.yml     # Staging overrides
docker-compose.prod.yml        # Production overrides
```

### Database Schema

Schema is defined in `app/db/schema.ts` using Drizzle ORM:

- **`photos`**: Dog photo records with UUID primary keys, user references, ordering
- **`users`**: User profiles with OAuth-synced display names and profile pictures

The app uses environment-based connection strings:

- **`DATABASE_URL`**: Used when running inside Docker (points to `db` service)

### Authentication System

NextAuth is configured in `app/auth.ts` with:

- **Providers**: GitHub and Google OAuth
- **Session Strategy**: JWT-based
- **User IDs**: Format is `{provider}-{accountId}` (e.g., "github-123456")
- **OAuth Profile Sync**: On sign-in, user's name and profile picture are automatically saved to the database from OAuth provider data
- **Admin System**: Set `ADMIN_USER_IDS` env var with comma-separated provider-accountId values. Admins get userId "admin" and can delete any photo.

### Server Actions Pattern

Server actions are defined in `app/db/actions.ts` and follow this pattern:

```typescript
export type APIResponse<T> =
  | { data: T; error: undefined }
  | { data: undefined; error: string };
```

All actions return `APIResponse<T>` for consistent error handling.

Key actions:

- `getPhotos(limit, offset)`: Paginated photo fetching for infinite scroll
- `getPhotosByUserId(userId)`: Get all photos for a specific user (profile pages)
- `uploadPhoto(formData)`: Upload with AI validation
- `deletePhoto(id)`: Delete photo (owner or admin only)
- `getUserProfile(userId)`: Get user profile data
- `updateUserProfile(displayName)`: Update user's display name
- `uploadProfilePicture(formData)`: Upload custom profile picture

### User Profiles

- **Profile Page** (`/profile/[userId]`): Displays user info and their uploaded photos
- **Profile Edit** (`/profile/edit`): Allows users to update display name and profile picture
- **Profile Links**: Dog cards in the gallery link to the uploader's profile

### Photo Gallery

The main gallery (`components/main.tsx`) features:

- **Infinite Scroll**: Photos load progressively using Intersection Observer (12 photos per batch)
- **Lightbox**: Click any photo to view full-screen with navigation (`components/lightbox/`)
- **Profile Links**: User info panel links to uploader's profile page
- **Delete**: Owners can delete their photos; admins can delete any photo

### Stats Dashboard

The `/stats` page (`app/stats/`) displays live system metrics:

- **3D Raspberry Pi Model**: Interactive Three.js visualization with depth-map displacement
- **Live Metrics**: CPU, memory, disk usage streamed via Server-Sent Events (SSE)
- **Service Health**: Container status and health checks
- **Charts**: ReCharts-powered visualizations

Metrics are gathered by a separate system-profiler service that reads from `/proc`, `/sys`, and the Docker socket.

### About Page

The about page (`app/about/page.mdx`) uses MDX for rich content:

- Embedded React components within markdown
- Lightbox galleries for images and videos
- Interactive elements (rotating gradient border, 3D model)

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

# System Profiler (for /stats page)
SYSTEM_PROFILER_BASE_URL=http://system-profiler:8787
SYSTEM_PROFILER_AUTH_TOKEN=dev-token

# Analytics (optional)
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your-website-id
NEXT_PUBLIC_UMAMI_URL=https://your-umami-instance.com
```

For production (`.env.prod`), key differences:

- `DATABASE_URL` uses `db` hostname instead of `localhost`
- `PUBLIC_IMG_VALIDATOR_BASE_URL=http://ai-img-validator:8000`
- `IMG_UPLOAD_DIR=/data/uploads/images`

## Icon Usage

This project uses **lucide-react** and **hugeicons** for icons:

```typescript
// Lucide icons
import { IconName } from "lucide-react";
<IconName className="h-4 w-4" />

// Hugeicons
import { IconName } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
<HugeiconsIcon icon={IconName} size={16} />
```

## Project Philosophy

- **Keep it simple**: This is a personal portfolio site, not an enterprise application
- **Don't overengineer**: Avoid unnecessary abstractions and premature optimization
- **Ask for clarification**: When requirements are unclear, ask before implementing
- **Small, focused changes**: Avoid sweeping refactors without explicit approval
- **Consistent with existing patterns**: Follow the established code style and architecture

## Common Issues & Solutions

### Postgres 18+ Volume Path

If Postgres container fails to start, ensure `docker-compose.override.yml` uses the correct volume path:

```yaml
volumes:
  - postgres_data_dev:/var/lib/postgresql # NOT /var/lib/postgresql/data
```

### Drizzle Kit Environment Loading

`drizzle.config.ts` should load `.env.local` for local development. If environment variables aren't found, verify the config loads dotenv properly.

### Connection Refused Errors

Ensure Postgres container is running and healthy before running `db:push`:

```bash
docker compose ps          # Check status
docker compose logs db     # Check logs
```

## Deployment

The project includes deployment scripts for self-hosting on Ubuntu:

- `deploy.sh`: Initial deployment (installs dependencies, sets up Docker, Nginx, SSL)
- `update.sh`: Push updates to running production environment

See README.md for detailed deployment instructions.
