FROM node:20-alpine AS base

# Stage 1: Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_SAFE_KEY
ENV NEXT_PUBLIC_SAFE_KEY=$NEXT_PUBLIC_SAFE_KEY

RUN npm run build

# Stage 3: Production server
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy Next.js standalone build
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy migrations and migration script
COPY --from=builder /app/app/db/migrations ./app/db/migrations
COPY --from=builder /app/scripts/run-migrations.js ./scripts/run-migrations.js
COPY --from=builder /app/scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh
RUN chmod +x ./scripts/docker-entrypoint.sh

# Install minimal deps for migration script (not included in standalone build)
# Copy directly from deps stage - they're already installed there!
COPY --from=deps /app/node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --from=deps /app/node_modules/postgres ./node_modules/postgres
# postgres depends on pg (native module)
# COPY --from=deps /app/node_modules/pg ./node_modules/pg

EXPOSE 3000
ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
