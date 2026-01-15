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

RUN npm run build

# Stage 3: Production server
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8787

# Copy bundled application (no dependencies needed - everything is bundled)
COPY --from=builder /app/dist ./dist

EXPOSE 8787
ENTRYPOINT ["node", "dist/index.js"]
