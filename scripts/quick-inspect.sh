#!/bin/bash
# Quick inspection of Docker image - simple version that definitely works
# Run on Pi: bash scripts/quick-inspect.sh

IMAGE_NAME="pi-site:latest"

echo "🔍 Quick inspection of ${IMAGE_NAME}"
echo ""

echo "1. Listing /app directory:"
docker run --rm --entrypoint ls "${IMAGE_NAME}" -la /app 2>&1

echo ""
echo "2. Checking for server.js:"
docker run --rm --entrypoint test "${IMAGE_NAME}" -f /app/server.js && echo "✅ server.js EXISTS" || echo "❌ server.js MISSING"

echo ""
echo "3. Searching for server.js anywhere:"
docker run --rm --entrypoint find "${IMAGE_NAME}" /app -name "server.js" -type f 2>&1

echo ""
echo "4. Listing .next directory (if exists):"
docker run --rm --entrypoint sh "${IMAGE_NAME}" -c "ls -la /app/.next 2>/dev/null || echo '.next does not exist'" 2>&1

echo ""
echo "5. Full directory tree of /app:"
docker run --rm --entrypoint sh "${IMAGE_NAME}" -c "find /app -maxdepth 3 -type f -o -type d | head -30" 2>&1

echo ""
echo "=== Done ==="

