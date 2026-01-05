#!/bin/bash
# Deployment script for automatic GitHub Actions deployments
# This script is called by GitHub Actions when main branch is updated
# Usage: ./scripts/deploy-from-github.sh
#
# Note: This script is designed to be run on the Raspberry Pi via SSH from GitHub Actions.
# For manual deployments from feature branches, use ./scripts/deploy.sh from your desktop.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${PROJECT_DIR}"

echo "🚀 Starting deployment from GitHub Actions..."
echo ""

# Ensure we're on main branch
echo "📋 Checking out main branch..."
git fetch origin
git checkout main
git pull origin main

echo ""
echo "📦 Installing dependencies..."
npm install --ignore-scripts

echo ""
echo "📁 Setting up directories..."
mkdir -p public/images
chmod 755 public/images
chown -R $(whoami):$(whoami) public/images

echo ""
echo "🧹 Cleaning previous build..."
rm -rf .next

echo ""
echo "🔧 Generating Prisma client..."
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate 2>&1 | (grep -v '404 Not Found' || true) || echo 'Prisma generate failed, using existing client'

echo ""
echo "🏗️  Building application..."
if ! npm run build; then
    echo "⚠️  Build failed, checking Prisma client..."
    ls -la node_modules/@prisma/client
    npm run build
fi

echo ""
echo "🔄 Restarting PM2..."
pm2 delete pi-site 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

echo ""
echo "✅ Deployment complete!"
echo ""
echo "The app should be running on http://localhost:3000"
echo "Check status: pm2 status"
echo "View logs: pm2 logs pi-site"

