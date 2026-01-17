# Docker Setup Review & Best Practices Recommendations

## Executive Summary

Your Docker setup demonstrates good understanding of containerization, but there are several areas where you're working against Docker/Compose conventions. The main issues are:

1. **Inconsistent environment management** across dev/staging/prod
2. **Volume management confusion** between named volumes and bind mounts
3. **Missing production compose file** (docker-compose.prod.yml)
4. **Script complexity** that could be replaced by compose features
5. **Network configuration** that's unnecessarily explicit

---

## Critical Issues

### 1. Missing `docker-compose.prod.yml`

**Problem**: Your `logs-fzf.sh` script references a `docker-compose.prod.yml` file that doesn't exist. You're using `docker-compose.yml` for production, which is unconventional.

**Standard Practice**:
- `docker-compose.yml` = base configuration (shared across environments)
- `docker-compose.override.yml` = local development overrides (auto-loaded)
- `docker-compose.prod.yml` = production-specific config
- `docker-compose.staging.yml` = staging-specific config

**Recommendation**:
```yaml
# docker-compose.yml (base - shared config)
services:
  web:
    build:
      context: .
      args:
        NEXT_PUBLIC_SAFE_KEY: ${NEXT_PUBLIC_SAFE_KEY}
    ports:
      - '3000:3000'
    depends_on:
      db:
        condition: service_healthy
      ai-img-validator:
        condition: service_started
      system-profiler:
        condition: service_started

  db:
    image: postgres:17
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 5s
      timeout: 5s
      retries: 10

  system-profiler:
    build: ./system-profiler

  ai-img-validator:
    build: ./ai-img-validator

# docker-compose.override.yml (auto-loaded in dev)
services:
  web:
    env_file: .env.local
    volumes:
      - ./.data/uploads/images:/data/uploads/images
  
  db:
    env_file: .env.local
    ports:
      - "127.0.0.1:5432:5432"
    volumes:
      - postgres_data_dev:/var/lib/postgresql/data

volumes:
  postgres_data_dev:

# docker-compose.prod.yml
services:
  web:
    env_file: .env.prod
    environment:
      NODE_ENV: production
    volumes:
      - uploads_data:/data/uploads/images
    restart: unless-stopped

  db:
    env_file: .env.prod
    ports:
      - "127.0.0.1:5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
  uploads_data:
```

### 2. Network Configuration is Unnecessary

**Problem**: You're explicitly creating and naming a network `my_network`, but Docker Compose automatically creates a network for each project.

**Current**:
```yaml
networks:
  my_network:
    name: my_network
    driver: bridge
```

**Standard Practice**: Delete all network configuration. Compose creates `<project>_default` automatically, and all services can communicate by service name.

**Why this matters**:
- Simpler configuration
- Less to maintain
- No risk of network name conflicts across projects
- Services still communicate via service names (e.g., `http://db:5432`)

### 3. Inconsistent Volume Strategies

**Problem**: You mix bind mounts and named volumes inconsistently:
- **Staging**: Uses bind mount `./.data/uploads/images:/data/uploads/images`
- **Production**: Uses named volume `uploads_data:/data/uploads/images`

**Issues**:
- Bind mounts in staging won't behave like production
- Nginx in production serves from a named volume path that's hard to access

**Recommendation**:
```yaml
# Production (docker-compose.prod.yml)
services:
  web:
    volumes:
      - uploads_data:/data/uploads/images

volumes:
  uploads_data:
    name: pi_site_uploads  # Named for easier identification

# Development (docker-compose.override.yml)
services:
  web:
    volumes:
      - ./.data/uploads/images:/data/uploads/images  # Bind mount for dev

# Staging (docker-compose.staging.yml)  
services:
  web:
    volumes:
      - uploads_data:/data/uploads/images  # Use named volume like prod

volumes:
  uploads_data:
    name: pi_site_staging_uploads
```

---

## Major Improvements

### 4. Simplify npm Scripts Using Compose Profiles

**Problem**: You have many npm scripts managing different environments. This is reinventing Compose features.

**Current** (package.json):
```json
"dev:services": "docker compose --env-file .env.local -p pi_site_dev -f docker-compose.dev.yml up -d",
"staging:services": "docker compose --env-file .env.staging -p pi_site_staging -f docker-compose.staging.yml up -d --build"
```

**Better Approach**: Use Compose [profiles](https://docs.docker.com/compose/profiles/) and standard file layering:

```yaml
# docker-compose.yml
services:
  web:
    profiles: ["prod", "staging"]
    # ... config

  db:
    # No profile = always runs

# docker-compose.override.yml (dev only)
services:
  web:
    profiles: ["dev"]
    command: npm run dev
```

**Updated npm scripts**:
```json
{
  "dev": "docker compose up -d && npm run dev:watch",
  "dev:watch": "next dev --turbopack",
  "staging": "docker compose -f docker-compose.yml -f docker-compose.staging.yml --profile staging up -d --build",
  "prod": "docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile prod up -d --build"
}
```

### 5. Use Compose's `env_file` Directive Properly

**Problem**: You're passing `--env-file` via CLI, which works but isn't conventional.

**Current**:
```bash
docker compose --env-file .env.local -p pi_site_dev -f docker-compose.dev.yml up -d
```

**Better**:
```yaml
# docker-compose.override.yml
services:
  web:
    env_file:
      - .env.local
      - .env  # Fallback
```

Then just run:
```bash
docker compose up -d
```

### 6. Improve Dockerfile Optimization

Your main Dockerfile is good, but has room for improvement:

**Current Issues**:
```dockerfile
# Copying dependencies from deps stage - good!
COPY --from=deps /app/node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --from=deps /app/node_modules/postgres ./node_modules/postgres

# But: This is fragile and hard to maintain
```

**Better Approach**:
```dockerfile
# Stage 3: Production server
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy Next.js standalone build
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy migrations and scripts
COPY --from=builder --chown=nextjs:nodejs /app/app/db/migrations ./app/db/migrations
COPY --from=builder --chown=nextjs:nodejs /app/scripts/run-migrations.js ./scripts/run-migrations.js
COPY --from=builder --chown=nextjs:nodejs /app/scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh
RUN chmod +x ./scripts/docker-entrypoint.sh

# Install ONLY runtime dependencies for migrations
# Create a minimal package.json for migration deps
RUN echo '{"dependencies":{"drizzle-orm":"^0.45.1","postgres":"^3.4.5"}}' > package.json && \
    npm install --omit=dev --ignore-scripts && \
    rm package.json

USER nextjs

EXPOSE 3000
ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
```

**Why**:
- Uses non-root user (security best practice)
- Installs migration deps properly via npm (not manual copying)
- Sets proper ownership

### 7. Deployment Scripts Should Use Compose

**Problem**: Your `deploy.sh` and `update.sh` scripts manually orchestrate Docker, which is error-prone.

**Current Issues**:
- Manual nginx configuration (should be in compose)
- Hardcoded paths
- No health checks after deployment
- No rollback strategy

**Better Approach**:

Create a `docker-compose.prod.yml` with nginx as a service:

```yaml
# docker-compose.prod.yml
services:
  web:
    # ... existing config
    restart: unless-stopped
    labels:
      - "com.pi-site.service=web"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - uploads_data:/var/lib/docker/volumes/pi-site_uploads/_data:ro
      - certbot_www:/var/www/certbot:ro
      - certbot_conf:/etc/nginx/ssl:ro
    depends_on:
      - web
    restart: unless-stopped

  db:
    # ... existing config
    restart: unless-stopped

volumes:
  uploads_data:
  certbot_www:
  certbot_conf:
```

**Simplified deploy.sh**:
```bash
#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${HOME}/pi-site"
ENV_FILE="$APP_DIR/.env.prod"

# Update repo
git -C "$APP_DIR" pull

# Validate env file exists
[[ -f "$ENV_FILE" ]] || { echo "Missing $ENV_FILE"; exit 1; }

# Deploy with compose
cd "$APP_DIR"
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build --remove-orphans

# Wait for health checks
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# Cleanup
docker image prune -f
```

---

## Minor Improvements

### 8. `.dockerignore` Optimization

**Issue**: You're ignoring `system-profiler/*` and `ai-img-validator/*`, but also building them in compose.

**Fix**: Remove these from `.dockerignore` since they have their own Dockerfiles and contexts:

```dockerignore
# Remove these lines:
# ai-img-validator
# system-profiler
```

### 9. Health Check Configuration

**Good**: You have health checks on postgres.

**Better**: Add health checks to all services:

```yaml
services:
  web:
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  ai-img-validator:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  system-profiler:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8787/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

Then add health endpoints to your services.

### 10. Development Workflow Improvements

**Problem**: Running Next.js dev server outside Docker but services inside creates complexity.

**Better**: Run everything in Docker for consistency:

```yaml
# docker-compose.override.yml (dev)
services:
  web:
    build:
      target: development  # New dev stage
    command: npm run dev
    volumes:
      - .:/app
      - /app/node_modules  # Prevent overwriting
      - /app/.next
    environment:
      - NODE_ENV=development
      - WATCHPACK_POLLING=true  # For file watching in Docker
```

**Add dev stage to Dockerfile**:
```dockerfile
FROM base AS development
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

**Or**: Use the approach you have (Next.js on host, services in Docker) but document it clearly.

### 11. Environment File Management

**Current Issues**:
- No clear .env.local (referenced but not in .env.example)
- Comments in .env.example are helpful but could be clearer

**Recommendation**:
Create environment-specific example files:

```
.env.example            # Base template
.env.local.example      # Local dev template
.env.staging.example    # Staging template  
.env.prod.example       # Production template
```

### 12. Use Compose `extends` for DRY Configuration

**Problem**: Duplicate configuration across docker-compose files.

**Solution**:
```yaml
# docker-compose.base.yml
services:
  web-base:
    build:
      context: .
    depends_on:
      db:
        condition: service_healthy

# docker-compose.yml
services:
  web:
    extends:
      file: docker-compose.base.yml
      service: web-base
    # Only prod-specific config here
```

---

## Recommendations Summary

### Immediate Actions (High Impact)

1. **Create `docker-compose.prod.yml`** and restructure your compose files
2. **Remove explicit network configuration** - use Compose defaults
3. **Standardize volume strategy** - named volumes for prod/staging, bind mounts for dev
4. **Add non-root user to Dockerfile** for security
5. **Fix migration dependencies** in Dockerfile (use npm install, not manual copy)

### Medium Priority

6. **Add nginx as a compose service** instead of managing it via deploy script
7. **Simplify deployment scripts** to use compose commands
8. **Add health checks** to all services
9. **Add restart policies** to production services
10. **Use compose profiles** to reduce npm script complexity

### Nice to Have

11. **Run dev server in Docker** for full environment parity
12. **Add docker-compose.test.yml** for CI/CD
13. **Use `.env` file hierarchy** more consistently
14. **Add resource limits** to production services:
    ```yaml
    services:
      web:
        deploy:
          resources:
            limits:
              cpus: '2'
              memory: 1G
    ```

---

## What You're Doing Well

1. ✅ **Multi-stage Dockerfile** - Good separation of build stages
2. ✅ **Next.js standalone output** - Optimal for production
3. ✅ **Health checks on database** - Ensures proper startup ordering
4. ✅ **Separate Dockerfiles** for microservices
5. ✅ **Database migrations in entrypoint** - Ensures schema is up-to-date
6. ✅ **Comprehensive .dockerignore** - Reduces build context size
7. ✅ **Environment-specific compose files** - Good separation of concerns

---

## Proposed Final Structure

```
├── docker-compose.yml              # Base configuration (shared)
├── docker-compose.override.yml     # Dev (auto-loaded)
├── docker-compose.prod.yml         # Production
├── docker-compose.staging.yml      # Staging
├── docker-compose.test.yml         # CI/CD
├── Dockerfile                      # Improved with security
├── .env.example
├── .env.local.example
├── .env.staging.example
├── .env.prod.example
├── nginx/
│   └── nginx.conf                  # Extracted from deploy.sh
├── scripts/
│   ├── deploy.sh                   # Simplified
│   ├── update.sh                   # Simplified
│   └── ...
```

**Benefits**:
- Standard Docker/Compose conventions
- Easier for new developers to understand
- Less custom scripting = less to maintain
- Better environment parity
- Simpler deployment process

---

## Migration Path

To avoid breaking your current setup:

1. Create new files alongside existing ones
2. Test thoroughly in development
3. Deploy to staging and validate
4. Update production deployment process
5. Archive old scripts/configs

Would you like me to help implement any of these recommendations?
