#!/bin/bash
# Update the server with latest code (PM2 workflow)
# Usage: ./scripts/update-server.sh [--local]
#
# This script pulls the latest code from git.
# By default, it assumes you'll deploy from your desktop using ./scripts/deploy.sh
# Use --local to rebuild and restart locally on the Pi (not recommended for regular use)
#
# Recommended workflow:
#   1. On desktop: git pull && ./scripts/deploy.sh
#   2. This script is mainly for pulling code when you're already on the Pi

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

REBUILD_LOCAL=false

# Parse arguments
if [[ "$1" == "--local" ]]; then
    REBUILD_LOCAL=true
fi

cd "${PROJECT_DIR}"

echo "📥 Pulling latest changes from git..."
echo ""

# Determine current branch
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "main")
echo "Current branch: ${CURRENT_BRANCH}"

if git pull origin "${CURRENT_BRANCH}"; then
    echo "✅ Code updated successfully!"
else
    echo "❌ Failed to pull code"
    exit 1
fi

echo ""
if [ "$REBUILD_LOCAL" = true ]; then
    echo "🔨 Rebuilding and restarting locally (this may take a while)..."
    echo "   Note: Building on Pi is slow. Consider using ./scripts/deploy.sh from your desktop instead."
    echo ""
    
    # Install dependencies
    echo "📦 Installing dependencies..."
    npm install --ignore-scripts
    
    # Generate Prisma client
    echo "🔧 Generating Prisma client..."
    PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate 2>&1 | (grep -v '404 Not Found' || true) || echo 'Prisma generate failed, using existing client'
    
    # Build the app
    echo "🏗️  Building application..."
    npm run build
    
    # Restart PM2
    echo "🔄 Restarting PM2..."
    pm2 restart pi-site || pm2 start ecosystem.config.js
    
    echo "✅ App rebuilt and restarted!"
else
    echo "ℹ️  Code pulled. To deploy:"
    echo ""
    echo "   From your desktop (recommended):"
    echo "     ./scripts/deploy.sh"
    echo ""
    echo "   Or rebuild locally on Pi:"
    echo "     ./scripts/update-server.sh --local"
    echo ""
    echo "   Or just restart PM2 if code is already built:"
    echo "     pm2 restart pi-site"
fi
