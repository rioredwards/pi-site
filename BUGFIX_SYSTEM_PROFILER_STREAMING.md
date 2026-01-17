# Bug Fix: System Profiler Streaming 404 Error

## Problem

The `/streamText` endpoint on system-profiler was returning 404 errors when the web service ran in a Docker container, but worked fine when running on the host machine.

## Root Cause

**Hardcoded localhost URL** in `app/api/stats/stream/route.ts`:

```typescript
// BEFORE (hardcoded)
const response = await fetch("http://localhost:8787/streamText");
```

### Why This Failed in Docker

When Next.js runs in different environments:

| Environment | Next.js Location | Hardcoded `localhost:8787` Points To | Result |
|-------------|------------------|--------------------------------------|--------|
| **Dev** (host) | Host machine | ✅ Host's port 8787 (system-profiler container) | Works |
| **Staging/Prod** (container) | Docker container | ❌ Port 8787 inside web container itself | 404 Error |

In Docker, `localhost` always refers to **the container itself**, not other containers or the host machine.

## Solution

Use the existing `SYSTEM_PROFILER_BASE_URL` environment variable:

```typescript
// AFTER (environment-aware)
const systemProfilerUrl = process.env.SYSTEM_PROFILER_BASE_URL || "http://localhost:8787";
const response = await fetch(`${systemProfilerUrl}/streamText`);
```

### Environment Variables by Environment

**Development** (`.env.local`):
```bash
SYSTEM_PROFILER_BASE_URL=http://localhost:8787
# Works because Next.js runs on host, and system-profiler is exposed to host
```

**Staging/Production** (`.env.staging`, `.env.prod`):
```bash
SYSTEM_PROFILER_BASE_URL=http://system-profiler:8787
# Works because both services are in Docker and use Docker service names
```

## How Docker Networking Works

### Service-to-Service Communication in Docker

When services are in the same Docker Compose project:
- They're on the same network (auto-created by Compose)
- They can talk to each other using **service names** as hostnames
- Example: `http://system-profiler:8787`, `http://db:5432`, `http://ai-img-validator:8000`

### Host-to-Container Communication

When services are exposed to the host via `ports`:
- Host can access via `localhost:<port>` or `127.0.0.1:<port>`
- Example: `http://localhost:8787` (from your development machine)

### Container-to-Host Communication

When a container needs to call something on the host:
- Use special hostname: `host.docker.internal` (Docker Desktop)
- Or: Use the host's IP address on the Docker bridge network
- **NOT**: `localhost` (that's the container itself!)

## Why /debug/stats Worked But /streamText Didn't

Good question! Let me check if `/debug/stats` is also hardcoded or uses the env var:

```bash
# Check if there are other endpoints calling system-profiler
grep -r "debug/stats\|system-profiler" app
```

If `/debug/stats` was being called from the **client-side** (browser):
- Browser runs on your host machine
- `localhost:8787` from browser = your host's port 8787 ✅ Works

If `/streamText` was being called **server-side** (Next.js API route):
- Runs inside the container
- `localhost:8787` from container = container's own port 8787 ❌ Fails

## Files Changed

1. **app/api/stats/stream/route.ts**
   - Changed hardcoded URL to use `process.env.SYSTEM_PROFILER_BASE_URL`

2. **.env.example**
   - Added comments explaining the difference between dev and prod URLs

## Testing

### Development (Next.js on host)
```bash
# .env.local should have:
SYSTEM_PROFILER_BASE_URL=http://localhost:8787

# Test streaming endpoint
curl http://localhost:3000/api/stats/stream
```

### Staging (Next.js in container)
```bash
# .env.staging should have:
SYSTEM_PROFILER_BASE_URL=http://system-profiler:8787

# Start staging
npm run staging:services

# Test streaming endpoint
curl http://localhost:3000/api/stats/stream
```

## Prevention

**Always use environment variables for service URLs**, not hardcoded values:

✅ **Good**:
```typescript
const url = process.env.SERVICE_URL || "http://localhost:8787";
fetch(url);
```

❌ **Bad**:
```typescript
fetch("http://localhost:8787");
```

This allows the same code to work in:
- Local development
- Docker containers
- Staging environments
- Production deployments

## Related Environment Variables

All service-to-service communication should use env vars:

```bash
# System Profiler
SYSTEM_PROFILER_BASE_URL=http://system-profiler:8787  # Prod
SYSTEM_PROFILER_BASE_URL=http://localhost:8787        # Dev

# AI Image Validator
PUBLIC_IMG_VALIDATOR_BASE_URL=http://ai-img-validator:8000  # Prod
PUBLIC_IMG_VALIDATOR_BASE_URL=http://localhost:8000         # Dev

# Database
DATABASE_URL=postgres://user:pass@db:5432/dbname         # Prod
DATABASE_URL=postgres://user:pass@localhost:5432/dbname  # Dev
```

Notice the pattern:
- **Prod/Staging**: Use Docker service names (`system-profiler`, `db`, `ai-img-validator`)
- **Dev**: Use `localhost` (because services are exposed to host and Next.js runs on host)
