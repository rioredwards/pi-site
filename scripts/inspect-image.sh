#!/bin/bash
# Inspect the Docker image contents on the Pi
# Run this on the Pi: ssh raspberrypi 'cd ~/pi-site && bash scripts/inspect-image.sh'

set -e

IMAGE_NAME="pi-site:latest"
LOG_ENDPOINT="http://127.0.0.1:7247/ingest/ffff6e97-d96b-473d-a296-a90866dca292"

echo "🔍 Inspecting Docker image: ${IMAGE_NAME}"
echo ""

# #region agent log
curl -s -X POST -H "Content-Type: application/json" -d "{\"location\":\"inspect-image.sh:10\",\"message\":\"Starting image inspection\",\"data\":{\"imageName\":\"${IMAGE_NAME}\"},\"timestamp\":$(date +%s000),\"sessionId\":\"debug-session\",\"runId\":\"inspect-image\",\"hypothesisId\":\"B\"}" "${LOG_ENDPOINT}" >/dev/null 2>&1 || true
# #endregion

# Check if image exists
if ! docker image inspect "${IMAGE_NAME}" >/dev/null 2>&1; then
    echo "❌ Image ${IMAGE_NAME} not found"
    exit 1
fi

echo "✅ Image exists"
echo ""

# Use docker run directly instead of docker exec (works on stopped/created containers)
echo "📋 Checking /app directory structure..."
echo ""

# List /app contents
echo "Files in /app:"
docker run --rm --entrypoint sh "${IMAGE_NAME}" -c "ls -la /app" 2>&1 | head -30 || echo "Could not list /app"

echo ""
echo "Checking for server.js..."
if docker run --rm --entrypoint sh "${IMAGE_NAME}" -c "test -f /app/server.js && echo 'EXISTS'" 2>/dev/null | grep -q "EXISTS"; then
    SERVER_JS_SIZE=$(docker run --rm --entrypoint sh "${IMAGE_NAME}" -c "stat -c%s /app/server.js" 2>/dev/null || echo "0")
    echo "✅ server.js exists at /app/server.js (${SERVER_JS_SIZE} bytes)"
    # #region agent log
    curl -s -X POST -H "Content-Type: application/json" -d "{\"location\":\"inspect-image.sh:45\",\"message\":\"server.js found at /app/server.js\",\"data\":{\"exists\":true,\"path\":\"/app/server.js\",\"size\":${SERVER_JS_SIZE}},\"timestamp\":$(date +%s000),\"sessionId\":\"debug-session\",\"runId\":\"inspect-image\",\"hypothesisId\":\"B\"}" "${LOG_ENDPOINT}" >/dev/null 2>&1 || true
    # #endregion
    
    # Check permissions
    PERMS=$(docker run --rm --entrypoint sh "${IMAGE_NAME}" -c "stat -c '%a %U:%G' /app/server.js" 2>/dev/null || echo "unknown")
    echo "   Permissions: $PERMS"
else
    echo "❌ server.js does NOT exist at /app/server.js"
    # #region agent log
    curl -s -X POST -H "Content-Type: application/json" -d "{\"location\":\"inspect-image.sh:54\",\"message\":\"server.js missing from /app/server.js\",\"data\":{\"exists\":false,\"path\":\"/app/server.js\"},\"timestamp\":$(date +%s000),\"sessionId\":\"debug-session\",\"runId\":\"inspect-image\",\"hypothesisId\":\"B\"}" "${LOG_ENDPOINT}" >/dev/null 2>&1 || true
    # #endregion
    
    # Search for server.js anywhere
    echo "   Searching for server.js in /app..."
    docker run --rm --entrypoint sh "${IMAGE_NAME}" -c "find /app -name 'server.js' -type f 2>/dev/null" 2>/dev/null | head -10 || echo "   No server.js found anywhere"
fi

echo ""
echo "Checking .next directory structure..."
if docker run --rm --entrypoint sh "${IMAGE_NAME}" -c "test -d /app/.next && echo 'EXISTS'" 2>/dev/null | grep -q "EXISTS"; then
    echo "✅ .next directory exists"
    echo "   Contents:"
    docker run --rm --entrypoint sh "${IMAGE_NAME}" -c "ls -la /app/.next" 2>&1 | head -20 || echo "   Could not list .next"
    
    if docker run --rm --entrypoint sh "${IMAGE_NAME}" -c "test -d /app/.next/standalone && echo 'EXISTS'" 2>/dev/null | grep -q "EXISTS"; then
        echo "   ✅ .next/standalone exists"
        echo "   Contents of .next/standalone:"
        docker run --rm --entrypoint sh "${IMAGE_NAME}" -c "ls -la /app/.next/standalone" 2>&1 | head -20 || echo "   Could not list standalone"
        
        # Check if server.js is in standalone
        if docker run --rm --entrypoint sh "${IMAGE_NAME}" -c "test -f /app/.next/standalone/server.js && echo 'EXISTS'" 2>/dev/null | grep -q "EXISTS"; then
            echo "   ✅ server.js found in .next/standalone/server.js"
            # #region agent log
            curl -s -X POST -H "Content-Type: application/json" -d "{\"location\":\"inspect-image.sh:72\",\"message\":\"server.js found in standalone subdirectory\",\"data\":{\"exists\":true,\"path\":\"/app/.next/standalone/server.js\"},\"timestamp\":$(date +%s000),\"sessionId\":\"debug-session\",\"runId\":\"inspect-image\",\"hypothesisId\":\"B\"}" "${LOG_ENDPOINT}" >/dev/null 2>&1 || true
            # #endregion
        fi
    else
        echo "   ❌ .next/standalone does NOT exist"
    fi
else
    echo "❌ .next directory does NOT exist"
fi

echo ""
echo "Checking what user the container runs as..."
docker inspect "${IMAGE_NAME}" --format '{{.Config.User}}' 2>/dev/null || echo "Could not determine user"

echo ""
echo "Testing if server.js can be executed (as nextjs user)..."
# Try to run as nextjs user
if docker run --rm --user nextjs --entrypoint sh "${IMAGE_NAME}" -c "test -f /app/server.js && echo 'EXISTS'" 2>/dev/null | grep -q "EXISTS"; then
    echo "✅ nextjs user can see server.js"
    # Try to execute it
    if docker run --rm --user nextjs --entrypoint sh "${IMAGE_NAME}" -c "node --version" >/dev/null 2>&1; then
        echo "✅ Node.js is available"
        # Try to check if server.js is valid
        docker run --rm --user nextjs --entrypoint sh "${IMAGE_NAME}" -c "node -e 'console.log(\"Node works\")'" 2>&1 || echo "   Node execution test failed"
    fi
else
    echo "❌ nextjs user cannot see server.js"
fi

echo ""
echo "=== Inspection Complete ==="

