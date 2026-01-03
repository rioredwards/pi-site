#!/bin/bash
# One-command deployment: Build, transfer, and restart on Raspberry Pi
# Usage: ./scripts/deploy.sh [--thumbdrive [PATH]]
#
# This script:
# 1. Builds the Docker image on your dev machine
# 2. Transfers it to your Raspberry Pi (via SSH or thumbdrive)
# 3. Restarts the container on the Pi (SSH only)
# 4. Optionally runs database migrations if needed (SSH only)
#
# Options:
#   --thumbdrive [PATH]    Use thumbdrive for transfer instead of SSH
#
# Prerequisites:
# - Docker buildx enabled
# - For SSH: SSH access to Raspberry Pi configured
# - For thumbdrive: Thumbdrive mounted and accessible

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_SCRIPT="${SCRIPT_DIR}/build-and-transfer.sh"
PI_HOST="raspberrypi"  # Update this if your Pi hostname is different
PI_PATH="~/pi-site"    # Path on Pi where the project lives

USE_THUMBDRIVE=false
THUMBDRIVE_PATH=""

# Parse arguments
if [[ "$1" == "--thumbdrive" ]]; then
    USE_THUMBDRIVE=true
    if [ -n "$2" ]; then
        THUMBDRIVE_PATH="$2"
    fi
fi

echo "🚀 Starting deployment..."
echo ""

# Step 1: Build and transfer
echo "📦 Step 1: Building and transferring image..."
if [ "$USE_THUMBDRIVE" = true ]; then
    if [ -n "$THUMBDRIVE_PATH" ]; then
        if ! bash "${BUILD_SCRIPT}" --thumbdrive "${THUMBDRIVE_PATH}"; then
            echo ""
            echo "❌ Deployment failed during build/transfer phase"
            exit 1
        fi
    else
        if ! bash "${BUILD_SCRIPT}" --thumbdrive; then
            echo ""
            echo "❌ Deployment failed during build/transfer phase"
            exit 1
        fi
    fi
    echo ""
    echo "⚠️  Thumbdrive mode: Manual steps required on Pi"
    echo "   Follow the instructions above to load the image on your Raspberry Pi"
    echo "   Or use: ssh ${PI_HOST} 'cd ${PI_PATH} && bash scripts/load-from-thumbdrive.sh'"
    exit 0
else
    if ! bash "${BUILD_SCRIPT}" --restart; then
        echo ""
        echo "❌ Deployment failed during build/transfer phase"
        exit 1
    fi
fi

# Step 1.5: Sync docker-compose.yml to ensure it matches (important for using pre-built image)
echo ""
echo "📋 Syncing docker-compose.yml..."
SCRIPT_DIR_ABS="$(cd "${SCRIPT_DIR}/.." && pwd)"
if scp "${SCRIPT_DIR_ABS}/docker-compose.yml" ${PI_HOST}:${PI_PATH}/docker-compose.yml; then
    echo "✅ docker-compose.yml synced"
else
    echo "⚠️  Failed to sync docker-compose.yml - you may need to update it manually"
fi

echo ""
echo "⏳ Waiting for container to be ready..."
sleep 3

# Step 2: Check if migrations are needed
echo ""
echo "🔍 Step 2: Checking database status..."
if ssh ${PI_HOST} "cd ${PI_PATH} && docker compose exec -T app npx prisma migrate status 2>/dev/null | grep -q 'Database schema is up to date'"; then
    echo "✅ Database is up to date"
else
    echo "📊 Database migrations needed - running migrations..."
    if ssh ${PI_HOST} "cd ${PI_PATH} && docker compose exec -T app npx prisma migrate deploy"; then
        echo "✅ Migrations completed"
    else
        echo "⚠️  Migration failed - you may need to run manually:"
        echo "   ssh ${PI_HOST} 'cd ${PI_PATH} && docker compose exec app npx prisma migrate deploy'"
    fi
fi

# Step 3: Verify deployment
echo ""
echo "🔍 Step 3: Verifying deployment..."
if ssh ${PI_HOST} "cd ${PI_PATH} && docker compose ps | grep -q 'Up'"; then
    echo "✅ Container is running"
    
    # Check health (if healthcheck is configured)
    sleep 2
    if ssh ${PI_HOST} "cd ${PI_PATH} && docker compose ps | grep -q 'healthy'"; then
        echo "✅ Container is healthy"
    fi
else
    echo "⚠️  Container status unclear - check logs:"
    echo "   ssh ${PI_HOST} 'cd ${PI_PATH} && docker compose logs'"
fi

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "View logs: ssh ${PI_HOST} 'cd ${PI_PATH} && docker compose logs -f'"
echo "Stop:     ssh ${PI_HOST} 'cd ${PI_PATH} && docker compose down'"

