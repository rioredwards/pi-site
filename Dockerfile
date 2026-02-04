FROM node:20-alpine AS base

# Stage 1: Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# Cache mount persists npm cache across builds, even when package.json changes
RUN --mount=type=cache,target=/root/.npm npm ci

# Stage 2: Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_SAFE_KEY
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_UMAMI_URL
ARG NEXT_PUBLIC_UMAMI_WEBSITE_ID
ENV NEXT_PUBLIC_SAFE_KEY=$NEXT_PUBLIC_SAFE_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_UMAMI_URL=$NEXT_PUBLIC_UMAMI_URL
ENV NEXT_PUBLIC_UMAMI_WEBSITE_ID=$NEXT_PUBLIC_UMAMI_WEBSITE_ID

# Cache mount persists Next.js build cache for faster incremental builds
RUN --mount=type=cache,target=/app/.next/cache npm run build

# Stage 3: Production server
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install su-exec for dropping privileges in entrypoint
RUN apk add --no-cache su-exec

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Create upload directory with correct ownership
# (volume will be mounted here, but this ensures the path exists)
RUN mkdir -p /data/uploads/images && chown -R nextjs:nodejs /data

# Copy Next.js standalone build with proper ownership
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy migrations and migration script with proper ownership
COPY --from=builder --chown=nextjs:nodejs /app/app/db/migrations ./app/db/migrations
COPY --from=builder --chown=nextjs:nodejs /app/scripts/run-migrations.js ./scripts/run-migrations.js
COPY --from=builder --chown=nextjs:nodejs /app/scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh
RUN chmod +x ./scripts/docker-entrypoint.sh

# Copy minimal runtime dependencies for migration script
# NOTE: We must selectively copy (not npm install) to preserve the node_modules
# that came from .next/standalone, which includes the 'next' module
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/postgres ./node_modules/postgres

# NOTE: We don't use USER here because the entrypoint needs to run as root
# initially to fix volume permissions, then drops to nextjs via su-exec

EXPOSE 3000
ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
