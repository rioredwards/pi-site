#!/bin/bash
# Quick fix script to generate Prisma client and rebuild on Pi
# Run this on the Pi: ssh raspberrypi 'cd ~/pi-site && bash scripts/fix-prisma-on-pi.sh'

set -e

echo "🔧 Fixing Prisma client generation on Pi..."
echo ""

cd ~/pi-site || exit 1

echo "📦 Step 1: Generating Prisma client..."
npx prisma generate || {
    echo "❌ Failed to generate Prisma client"
    exit 1
}

echo "✅ Prisma client generated"
echo ""

echo "🔨 Step 2: Building application..."
npm run build || {
    echo "❌ Build failed"
    exit 1
}

echo "✅ Build successful"
echo ""

echo "🔄 Step 3: Restarting PM2..."
pm2 restart pi-site || pm2 start npm --name pi-site -- start

echo ""
echo "✅ All done! The app should be running now."

