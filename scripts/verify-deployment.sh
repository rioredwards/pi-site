#!/bin/bash
# Verify deployment on Raspberry Pi
# Usage: ./scripts/verify-deployment.sh

PI_HOST="raspberrypi"
PI_PATH="~/pi-site"

echo "🔍 Verifying deployment on Raspberry Pi..."
echo ""

echo "1️⃣ Checking PM2 status..."
ssh ${PI_HOST} "cd ${PI_PATH} && pm2 status"
echo ""

echo "2️⃣ Checking if Prisma client was generated..."
ssh ${PI_HOST} "cd ${PI_PATH} && ls -la node_modules/@prisma/client 2>/dev/null && echo '✅ Prisma client exists' || echo '❌ Prisma client missing'"
echo ""

echo "3️⃣ Checking build output..."
ssh ${PI_HOST} "cd ${PI_PATH} && ls -la .next 2>/dev/null && echo '✅ Build output exists' || echo '❌ Build output missing'"
echo ""

echo "4️⃣ Checking recent PM2 logs..."
ssh ${PI_HOST} "cd ${PI_PATH} && pm2 logs pi-site --lines 30 --nostream | tail -20"
echo ""

echo "5️⃣ Testing health endpoint..."
HEALTH_RESPONSE=$(ssh ${PI_HOST} "curl -s http://localhost:3000/api/health 2>/dev/null || echo 'FAILED'")
if [ "$HEALTH_RESPONSE" != "FAILED" ] && [ -n "$HEALTH_RESPONSE" ]; then
    echo "✅ Health endpoint responded:"
    echo "$HEALTH_RESPONSE" | head -5
else
    echo "❌ Health endpoint not responding"
fi
echo ""

echo "✅ Verification complete!"

