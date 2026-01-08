# Database Migration Issues - Resolved ✅

The database schema is now set up correctly and migrations will run automatically in future deployments.

## Summary of what was fixed:

- ✅ Database migrations now run automatically in `update.sh`
- ✅ Migration files included in Docker image
- ✅ `.env` file creation/update added to `update.sh`
- ✅ `docker-compose.yml` uses `env_file` to load `.env` (matching example repo pattern)
- ✅ Migration script works without requiring `dotenv` package in production

---

# What went wrong and how we solved it

Refer to these next time, so that you don't run into the same issues again:

## Issues and Solutions

### 1. Missing database tables after deployment

**Issue:** Application was failing with error:

```
ERROR: relation "todos" does not exist
```

- Database container was running and initialized
- But the database schema (tables) was never created
- Application tried to query `todos` table that didn't exist
- This happened after database was reinitialized (volume was recreated or database was reset)

**Root Cause:**

- Migrations were never run automatically during deployment
- The `update.sh` script didn't include a migration step
- Even if migrations were run manually, they weren't part of the deployment process
- The example repo (`next-self-host`) also didn't run migrations automatically - it required manual setup

**Solution:**

1. **Immediate fix (manual):** Created the table directly using SQL:

   ```bash
   sudo docker exec -i pi-site-db-1 psql -U myuser -d mydatabase -c 'CREATE TABLE IF NOT EXISTS "todos" ("id" serial PRIMARY KEY NOT NULL, "content" varchar(255) NOT NULL, "completed" boolean DEFAULT false, "created_at" timestamp DEFAULT now());'
   ```

2. **Long-term fix:** Added automatic migrations to deployment process:
   - Updated `update.sh` to run migrations after containers start
   - Updated `Dockerfile` to include migration files in the image
   - Fixed migration script to work without `dotenv` in production

### 2. Migration script couldn't find `dotenv` package

**Issue:** Running migrations failed with:

```
error: Cannot find package 'dotenv' from '/app/app/db/migrate.ts'
```

- Next.js standalone build doesn't include all dependencies
- `dotenv` wasn't available in the production container
- Migration script tried to import `dotenv` which failed

**Solution:**

1. **Removed `dotenv` dependency from `drizzle.ts`:**

   - Next.js automatically loads `.env` files in development
   - Docker injects environment variables in production
   - No need for `dotenv` at runtime

2. **Made `dotenv` optional in `migrate.ts`:**
   - Try to load `dotenv` if available (for local dev)
   - Gracefully fail if not available (Docker provides env vars)
   - Uses dynamic import with try/catch

### 3. Missing `.env` file in deployment

**Issue:** `docker-compose.yml` was updated to use `env_file: - .env`, but `update.sh` didn't create the `.env` file.

- The example repo's `deploy.sh` creates `.env` file before running docker-compose
- Our `update.sh` script didn't create/update the `.env` file
- Without `.env`, the `DATABASE_URL` environment variable wasn't available to the container

**Solution:**

Updated `update.sh` to:

- Check if `.env` file exists
- Load existing values if present (preserves database password)
- Create/update `.env` file with `DATABASE_URL` before running docker-compose
- Matches the pattern from the example repo's `deploy.sh` script

### 4. Migration files not included in Docker image

**Issue:** Migration files weren't copied into the Docker image, so they weren't available when trying to run migrations.

- Next.js standalone build only includes what's needed to run the app
- Migration files in `app/db/migrations/` weren't included
- Migration script `app/db/migrate.ts` wasn't included

**Solution:**

Updated `Dockerfile` to explicitly copy migration files:

```dockerfile
COPY --from=builder /app/app/db/migrations ./app/db/migrations
COPY --from=builder /app/app/db/migrate.ts ./app/db/migrate.ts
COPY --from=builder /app/app/db/drizzle.ts ./app/db/drizzle.ts
COPY --from=builder /app/app/db/schema.ts ./app/db/schema.ts
```

### 5. Wrong migration path in migrate.ts

**Issue:** Migration script was looking for migrations in the wrong directory:

- Was looking in: `./lib/db/migrations`
- Should be: `./app/db/migrations`

**Solution:**
Fixed the path in `app/db/migrate.ts`:

```typescript
migrationsFolder: path.join(process.cwd(), "./app/db/migrations");
```

---

## Prevention Checklist for Future Deployments

### Before deploying:

- [ ] Verify migration files exist: `ls app/db/migrations/`
- [ ] Check that `update.sh` includes migration step
- [ ] Ensure `Dockerfile` copies migration files
- [ ] Verify `.env` file will be created/updated by `update.sh`

### After deployment:

- [ ] Check container logs: `sudo docker compose logs web`
- [ ] Verify no "relation does not exist" errors
- [ ] Test database connection: `sudo docker exec pi-site-db-1 psql -U myuser -d mydatabase -c '\dt'`
- [ ] Verify tables exist: Should see `todos` table listed

### If migrations fail:

- [ ] Check if migration files are in container: `sudo docker exec pi-site-web-1 ls -la app/db/migrations/`
- [ ] Verify `DATABASE_URL` is set: `sudo docker exec pi-site-web-1 env | grep DATABASE_URL`
- [ ] Check migration script exists: `sudo docker exec pi-site-web-1 ls -la app/db/migrate.ts`
- [ ] Try running migration manually: `sudo docker exec pi-site-web-1 bun run db:migrate`

### Manual fix commands (if needed):

If migrations fail and you need to create tables manually:

```bash
# Option 1: Run migration SQL directly
sudo docker exec -i pi-site-db-1 psql -U myuser -d mydatabase <<EOF
CREATE TABLE IF NOT EXISTS "todos" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" varchar(255) NOT NULL,
	"completed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
EOF

# Option 2: Use the migration SQL file (if available on Pi)
sudo docker exec -i pi-site-db-1 psql -U myuser -d mydatabase < ~/pi-site/app/db/migrations/0000_cynical_juggernaut.sql

# Option 3: Check what tables exist
sudo docker exec -i pi-site-db-1 psql -U myuser -d mydatabase -c '\dt'
```

### If database was reinitialized:

If you see "CREATE DATABASE" in the logs, the database was reset:

- [ ] Run migrations immediately after container starts
- [ ] Don't wait for the app to start - migrations should run first
- [ ] Check `update.sh` migration step executed successfully

---

## Key Changes Made

### 1. Updated `update.sh` (lines 18-43, 66-76)

- Added `.env` file creation/update before docker-compose
- Preserves existing database credentials if `.env` already exists
- Added automatic migration step after containers start
- Waits 5 seconds for database to be ready before running migrations

### 2. Updated `Dockerfile` (lines 23-26)

- Copies migration files into the Docker image
- Includes `migrate.ts`, `drizzle.ts`, and `schema.ts`
- Ensures migrations can run inside the container

### 3. Updated `docker-compose.yml` (lines 6-7)

- Changed from explicit `DATABASE_URL` environment variable
- To using `env_file: - .env` (matches example repo pattern)
- Loads all environment variables from `.env` file

### 4. Updated `app/db/migrate.ts`

- Fixed migration path: `./lib/db/migrations` → `./app/db/migrations`
- Made `dotenv` optional (gracefully fails if not available)
- Uses dynamic import for `dotenv` to avoid breaking in production

### 5. Updated `app/db/drizzle.ts`

- Removed `dotenv` dependency entirely
- Relies on Next.js/Docker to provide environment variables
- Simpler and more reliable in production

### 6. Added `db:migrate` script to `package.json`

- Added script: `"db:migrate": "bun run app/db/migrate.ts"`
- Makes it easy to run migrations manually if needed

---

## Comparison with Example Repo

The example repo (`next-self-host`) also doesn't run migrations automatically:

- Their `deploy.sh` creates `.env` file but doesn't run migrations
- They require manual database setup (either via Drizzle scripts or `psql`)
- Our solution improves on this by automating migrations

**Our improvements:**

- ✅ Automatic migrations in `update.sh`
- ✅ Migration files included in Docker image
- ✅ Migration script works without `dotenv` in production
- ✅ `.env` file creation matches example repo pattern

---

## Quick Reference

### Check if tables exist:

```bash
sudo docker exec -i pi-site-db-1 psql -U myuser -d mydatabase -c '\dt'
```

### Run migrations manually:

```bash
sudo docker exec pi-site-web-1 bun run db:migrate
```

### Create table manually (if migrations fail):

```bash
sudo docker exec -i pi-site-db-1 psql -U myuser -d mydatabase -c 'CREATE TABLE IF NOT EXISTS "todos" ("id" serial PRIMARY KEY NOT NULL, "content" varchar(255) NOT NULL, "completed" boolean DEFAULT false, "created_at" timestamp DEFAULT now());'
```

### Check migration files in container:

```bash
sudo docker exec pi-site-web-1 ls -la app/db/migrations/
```

### Verify DATABASE_URL is set:

```bash
sudo docker exec pi-site-web-1 env | grep DATABASE_URL
```

---

**Note:** These fixes are now in the codebase, so future deployments should automatically run migrations. The `update.sh` script will:

1. Create/update `.env` file with `DATABASE_URL`
2. Start containers
3. Wait for database to be ready
4. Run migrations automatically
5. Application starts with schema already in place
