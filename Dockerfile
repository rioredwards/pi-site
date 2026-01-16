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

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy Next.js standalone build with proper ownership
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy migrations and migration script with proper ownership
COPY --from=builder --chown=nextjs:nodejs /app/app/db/migrations ./app/db/migrations
COPY --from=builder --chown=nextjs:nodejs /app/scripts/run-migrations.js ./scripts/run-migrations.js
COPY --from=builder --chown=nextjs:nodejs /app/scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh
RUN chmod +x ./scripts/docker-entrypoint.sh

# Install minimal runtime dependencies for migration script
# Using a minimal package.json approach instead of copying from deps stage
RUN echo '{"dependencies":{"drizzle-orm":"^0.45.1","postgres":"^3.4.5"}}' > package.json && \
    npm install --omit=dev --ignore-scripts && \
    rm package.json

# Switch to non-root user
USER nextjs

EXPOSE 3000
ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
