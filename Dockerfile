# Builder stage - installs dependencies and builds the application
# Using Debian-based image for better compatibility with Raspbian
FROM node:22-slim AS builder

# Install build dependencies for native modules and Prisma
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        python3 \
        make \
        g++ \
        openssl \
        libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Set environment variables for Prisma
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
ENV NEXT_TELEMETRY_DISABLED=1
# Note: Don't set NODE_ENV=production here - we need devDependencies for the build

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy Prisma schema and generate client
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Verify standalone output was created (required for Docker deployment)
RUN if [ ! -d ".next/standalone" ] || [ ! -f ".next/standalone/server.js" ]; then \
        echo "ERROR: Standalone output not found! Check next.config.ts has output: 'standalone'" && \
        ls -la .next/ || echo ".next directory does not exist" && \
        exit 1; \
    fi && \
    echo "✅ Standalone output verified: server.js exists"

# Prune dev dependencies to create production-only node_modules
RUN npm prune --production

# Runner stage - minimal runtime image
FROM node:22-slim AS runner

WORKDIR /app

# Install only runtime dependencies (better-sqlite3 needs sqlite)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        openssl \
        libsqlite3-0 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV HOME=/app

# Copy built application from builder (standalone output includes only needed dependencies)
# Next.js standalone puts everything in .next/standalone, including server.js at the root
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Copy public files but exclude images (mounted as volume)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
RUN rm -rf /app/public/images

# Copy Prisma files and generated client from builder
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
# Try to copy @prisma/config from builder if it exists (needed for prisma.config.ts)
# Note: prisma.config.ts has a fallback if this module isn't available, so this is optional
RUN mkdir -p ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/config* ./node_modules/@prisma/ || true

# Verify that server.js was copied correctly (critical for container startup)
RUN ls -la /app/ && \
    if [ ! -f "/app/server.js" ]; then \
        echo "ERROR: server.js not found after COPY!" && \
        echo "Contents of /app:" && \
        ls -la /app/ && \
        echo "Searching for server.js:" && \
        find /app -name "server.js" -type f 2>/dev/null || echo "server.js not found anywhere" && \
        exit 1; \
    fi && \
    echo "✅ Verified: server.js exists at /app/server.js" && \
    ls -lh /app/server.js

# Create directories for volumes and set permissions
RUN mkdir -p /app/public/images /app/prisma && \
    chown -R nextjs:nodejs /app && \
    chmod +x /app/server.js 2>/dev/null || true

USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application (standalone mode uses server.js directly)
CMD ["node", "server.js"]
