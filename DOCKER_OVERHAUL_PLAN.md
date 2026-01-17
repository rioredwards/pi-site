# Docker Overhaul - Comprehensive Phased Implementation Plan

## ✅ Phase 1: Foundation & Security (1-2 hours)

**Deliverables**:
1. ✅  Restructured `docker-compose.yml` as base/shared configuration
2. ✅ Remove all explicit `networks:` sections
3. ✅ Updated Dockerfile with non-root user (nextjs:nodejs) and proper ownership
4. ✅ New `.env.local.example` file

**Key Changes**:
- Dockerfile: Add user creation, use `--chown` in COPY, proper npm install for migrations
- docker-compose.yml: Only shared service definitions, no env-specific values
- Remove: All `networks:` configuration

**Validation**: ✅ `npm run dev:services && docker compose ps && npm run dev:services:stop`

**Commit**: ✅ `"Phase 1: Foundation & security hardening"`

---

## ✅ Phase 2: Environment Separation (1 hour)

**Deliverables**:
1. ✅ `docker-compose.override.yml` (dev - auto-loaded, bind mounts)
2. ✅ `docker-compose.prod.yml` (named volumes, restart: unless-stopped)
3. ✅ `docker-compose.staging.yml` (like prod but staging-named volumes)
4. ~~`docker-compose.test.yml` (for CI/CD)~~ Out of scope for now

**Key Strategy**:
- Base file (`docker-compose.yml`) = shared, no env vars
- Override file (dev) = auto-loaded, no `-f` needed
- Each env has separate file for layering: `docker compose -f docker-compose.yml -f docker-compose.staging.yml`

**Backup**: ✅ Moved old `docker-compose.dev.yml` → `docker-compose.dev.yml.bak`

**Validation**: ✅
```bash
docker compose config > /dev/null  # Dev
docker compose -f docker-compose.yml -f docker-compose.prod.yml config > /dev/null  # Prod
```

**Commit**: `"Phase 2: Environment separation"`

---

## ✅ Phase 3: Simplify npm Scripts (45 minutes)

**Updates to `package.json`**: ✅
```json
"dev": "docker compose up -d && npm run dev:next",
"dev:next": "next dev --turbopack",
"dev:stop": "docker compose down",
"dev:logs": "docker compose logs -f",
"staging": "docker compose -f docker-compose.yml -f docker-compose.staging.yml up -d --build",
"staging:stop": "...",
"staging:logs": "...",
"prod": "docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build",
"prod:stop": "...",
"prod:logs": "..."
```

**Update `scripts/logs-fzf.sh`**: ✅ Updated to use new compose file structure

**Update `.gitignore`**: ✅ Added `*.bak`, `!.env.local.example`

**Remove from package.json**: ✅ Removed all `--env-file`, `-p pi_site_dev`, `-f docker-compose.dev.yml` flags

**Validation**: ✅ All compose configs valid

**Commit**: `"Phase 3: Simplify scripts"`

---

## Phase 4: Deployment Modernization (1.5 hours)

**Create `scripts/deploy-prod.sh`**:
- Git pull & merge
- Validate .env.prod exists & has required vars
- Docker Compose up with build
- Wait for health checks
- Cleanup old images

**Create `scripts/update-prod.sh`**:
- Quick update: git pull, compose up --build

**Improve `scripts/cleanup-prod.sh`**:
- Use Compose commands instead of raw docker

**Update `deploy.sh`**:
- Make it a wrapper that calls `scripts/deploy-prod.sh`

**Key Philosophy**: Use Compose for all orchestration, not custom bash

**Validation**: `docker compose -f docker-compose.yml -f docker-compose.prod.yml config > /dev/null`

**Commit**: `"Phase 4: Modernize deployment"`

---

## Phase 5: Production Hardening (1.5 hours)

**Deliverables**:
1. `nginx/nginx.conf` (reverse proxy, image serving)
2. `.env.prod.example` (production template)
3. `DEPLOYMENT.md` (quick-start guide)

**Updates to `docker-compose.prod.yml`**:
- Add nginx service (reverse proxy)
- Add health checks to all services
- Add resource limits (cpus/memory)

**Health Checks Needed**:
- web: `wget -q --spider http://localhost:3000`
- ai-img-validator: `curl -f http://localhost:8000/health`
- system-profiler: `curl -f http://localhost:8787/health`

**Optional**: Add health endpoints to your services if they don't have them

**Validation**: 
```bash
docker run --rm -v $(pwd)/nginx:/etc/nginx:ro nginx:alpine nginx -t
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d && sleep 5 && docker compose -f docker-compose.yml -f docker-compose.prod.yml down
```

**Commit**: `"Phase 5: Production hardening"`

---

## Recommended Timeline

| When | What | Time |
|------|------|------|
| **Day 1** | Phase 1 + 2 | 2-3 hours |
| **Day 2** | Phase 3 + 4 | 2.5 hours |
| **Day 3** | Phase 5 | 1.5 hours |

Or do all in one sitting (6 hours total).

---

## Testing Each Phase

After each phase:
```bash
# Validate compose syntax
docker compose config > /dev/null && echo "✅ Valid"

# Try starting services
docker compose up -d && sleep 3 && docker compose ps && docker compose down
```

---

## Rollback Safety

Each phase = one git commit. If something breaks:
```bash
git log --oneline | head -10
git revert <commit-hash>
```

---

## Final Result

After all 5 phases you'll have:

✅ Single `docker compose up -d` starts all services  
✅ Environment configs cleanly separated  
✅ Security hardening (non-root, health checks)  
✅ Modern deployment scripts using Compose  
✅ Nginx as service (not managed via deploy script)  
✅ Following standard Docker/Compose patterns  
✅ Much easier for new team members to understand  

Would you like me to help you start with Phase 1? I can provide the exact Dockerfile changes and new files to create.
