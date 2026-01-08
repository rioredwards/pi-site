FROM oven/bun:alpine AS base

# Stage 1: Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Stage 2: Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# Stage 3: Production server
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/app/db/migrations ./app/db/migrations
COPY --from=builder /app/app/db/migrate.ts ./app/db/migrate.ts
COPY --from=builder /app/app/db/drizzle.ts ./app/db/drizzle.ts
COPY --from=builder /app/app/db/schema.ts ./app/db/schema.ts

# Install required packages for migration script
# Next.js standalone build doesn't include drizzle-orm and postgres
# because they're only used in the migration script, not the app runtime
# We install them directly in the runner stage so all dependencies are included
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/bun.lockb ./bun.lockb
RUN bun install --production --frozen-lockfile drizzle-orm postgres

EXPOSE 3000
CMD ["bun", "run", "server.js"]
