#!/bin/bash
# Simple deployment: Push to GitHub, then pull and restart on Pi
# Usage: ./scripts/deploy.sh

set -e

PI_HOST="raspberrypi"
PI_PATH="~/pi-site"

echo "🚀 Deploying to Raspberry Pi..."
echo ""

# Step 0: Test build locally first (fail fast)
echo "🧪 Step 0: Testing build locally..."
if ! npm run build; then
    echo "❌ Build failed locally! Fix errors before deploying."
    exit 1
fi
echo "✅ Local build successful"
echo ""

# Step 1: Commit and push to GitHub
echo "📤 Step 1: Committing and pushing to GitHub..."
CURRENT_BRANCH=$(git branch --show-current)
if [ -n "$CURRENT_BRANCH" ]; then
    # Check if there are changes to commit
    if ! git diff --quiet || ! git diff --cached --quiet; then
        echo "   Committing changes..."
        git add -A
        git commit -m "Deploy: $(date +%Y-%m-%d\ %H:%M:%S)" || echo "   No changes to commit"
    fi
    echo "   Pushing to GitHub..."
    git push origin ${CURRENT_BRANCH} || {
        echo "❌ Failed to push to GitHub"
        exit 1
    }
else
    echo "   Not on a branch, skipping push"
fi
echo ""

# Step 2: Pull and restart on Pi
echo "🔄 Step 2: Pulling and restarting on Pi..."
if ! ssh ${PI_HOST} "cd ${PI_PATH} && \
    git pull && \
    npm install --ignore-scripts && \
    mkdir -p public/images && chmod 755 public/images && chown -R \$(whoami):\$(whoami) public/images && \
    (PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate 2>&1 | grep -v '404 Not Found' || echo 'Prisma generate completed with warnings') && \
    (PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma migrate deploy 2>&1 | grep -v '404 Not Found' || echo 'Migrations skipped') && \
    npm run build && \
    pm2 delete pi-site 2>/dev/null || true && \
    pm2 start ecosystem.config.js"; then
    echo ""
    echo "❌ Deployment failed on Pi!"
    exit 1
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "The app should be running on http://localhost:3000"
echo "Check logs: ssh ${PI_HOST} 'cd ${PI_PATH} && tail -f .next/trace'"
