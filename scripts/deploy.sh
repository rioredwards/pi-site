#!/bin/bash
# Simple deployment script for Raspberry Pi using PM2
# Usage: ./scripts/deploy.sh

set -e

PI_HOST="raspberrypi"
PI_PATH="~/pi-site"

echo "🚀 Starting deployment..."
echo ""

# Pre-flight checks
echo "🔍 Pre-flight checks..."
if ! ssh -o ConnectTimeout=5 ${PI_HOST} "echo 'SSH connection test'" &>/dev/null; then
    echo "❌ Error: Cannot connect to ${PI_HOST} via SSH"
    echo "   Please verify SSH access: ssh ${PI_HOST}"
    exit 1
fi
echo "✅ SSH connection verified"
echo ""

# Get expanded path
PI_PATH_EXPANDED=$(ssh ${PI_HOST} "echo ${PI_PATH}")

# Step 1: Build locally
echo "📦 Step 1: Building application..."
if ! npm run build; then
    echo "❌ Build failed!"
    exit 1
fi
echo "✅ Build complete"
echo ""

# Step 2: Sync files to Pi
echo "📤 Step 2: Syncing files to Pi..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Ensure directory exists
ssh ${PI_HOST} "mkdir -p ${PI_PATH_EXPANDED}/logs" || true

# Sync built files
echo "   Syncing .next directory..."
rsync -av --delete \
    --exclude '.next/cache' \
    "${PROJECT_ROOT}/.next/" ${PI_HOST}:${PI_PATH_EXPANDED}/.next/ || {
    echo "⚠️  rsync failed, trying alternative method..."
    tar czf - -C "${PROJECT_ROOT}" .next | ssh ${PI_HOST} "cd ${PI_PATH_EXPANDED} && tar xzf -"
}

# Sync other necessary files
echo "   Syncing package files..."
scp "${PROJECT_ROOT}/package.json" "${PROJECT_ROOT}/package-lock.json" ${PI_HOST}:${PI_PATH_EXPANDED}/ || true

# Sync prisma files
echo "   Syncing Prisma files..."
rsync -av "${PROJECT_ROOT}/prisma/" ${PI_HOST}:${PI_PATH_EXPANDED}/prisma/ || true

# Sync public files (excluding images which should already be on Pi)
echo "   Syncing public files..."
rsync -av --exclude 'images' "${PROJECT_ROOT}/public/" ${PI_HOST}:${PI_PATH_EXPANDED}/public/ || true

# Sync ecosystem config
echo "   Syncing PM2 config..."
scp "${PROJECT_ROOT}/ecosystem.config.js" ${PI_HOST}:${PI_PATH_EXPANDED}/ || true

echo "✅ Files synced"
echo ""

# Step 3: Install dependencies and restart on Pi
echo "🔄 Step 3: Installing dependencies and restarting on Pi..."
ssh ${PI_HOST} "cd ${PI_PATH_EXPANDED} && \
    npm ci --production && \
    npx prisma generate && \
    (pm2 restart pi-site || pm2 start ecosystem.config.js)"

echo "✅ Application restarted"
echo ""

# Step 4: Run migrations
echo "📊 Step 4: Running database migrations..."
if ssh ${PI_HOST} "cd ${PI_PATH_EXPANDED} && npx prisma migrate deploy"; then
    echo "✅ Migrations complete"
else
    echo "⚠️  Migration failed - you may need to run manually:"
    echo "   ssh ${PI_HOST} 'cd ${PI_PATH_EXPANDED} && npx prisma migrate deploy'"
fi
echo ""

# Step 5: Check status
echo "🔍 Step 5: Checking application status..."
ssh ${PI_HOST} "pm2 status"
echo ""

echo "🎉 Deployment complete!"
echo ""
echo "View logs: ssh ${PI_HOST} 'pm2 logs pi-site'"
echo "Restart:  ssh ${PI_HOST} 'pm2 restart pi-site'"
echo "Stop:     ssh ${PI_HOST} 'pm2 stop pi-site'"
echo "Status:   ssh ${PI_HOST} 'pm2 status'"
