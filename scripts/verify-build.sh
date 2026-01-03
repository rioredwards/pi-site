#!/bin/bash
# Verify that a Docker image has standalone output
# Usage: ./scripts/verify-build.sh [image-name:tag]

IMAGE_NAME="${1:-pi-site:latest}"
LOG_ENDPOINT="http://127.0.0.1:7247/ingest/ffff6e97-d96b-473d-a296-a90866dca292"

echo "🔍 Verifying Docker image: ${IMAGE_NAME}"
echo ""

# #region agent log
curl -s -X POST -H "Content-Type: application/json" -d "{\"location\":\"verify-build.sh:8\",\"message\":\"Starting image verification\",\"data\":{\"imageName\":\"${IMAGE_NAME}\"},\"timestamp\":$(date +%s000),\"sessionId\":\"debug-session\",\"runId\":\"verify-build\",\"hypothesisId\":\"A\"}" "${LOG_ENDPOINT}" >/dev/null 2>&1 || true
# #endregion

# Check if image exists
if ! docker image inspect "${IMAGE_NAME}" >/dev/null 2>&1; then
    echo "❌ Image ${IMAGE_NAME} not found locally"
    echo "   You may need to build it first or load it from a tar file"
    # #region agent log
    curl -s -X POST -H "Content-Type: application/json" -d "{\"location\":\"verify-build.sh:16\",\"message\":\"Image not found\",\"data\":{\"imageName\":\"${IMAGE_NAME}\",\"exists\":false},\"timestamp\":$(date +%s000),\"sessionId\":\"debug-session\",\"runId\":\"verify-build\",\"hypothesisId\":\"A\"}" "${LOG_ENDPOINT}" >/dev/null 2>&1 || true
    # #endregion
    exit 1
fi

echo "✅ Image exists"
echo ""

# Create a temporary container to inspect
CONTAINER_ID=$(docker create "${IMAGE_NAME}" 2>/dev/null)
if [ -z "$CONTAINER_ID" ]; then
    echo "❌ Failed to create temporary container"
    exit 1
fi

# #region agent log
curl -s -X POST -H "Content-Type: application/json" -d "{\"location\":\"verify-build.sh:28\",\"message\":\"Created temp container for inspection\",\"data\":{\"containerId\":\"${CONTAINER_ID}\"},\"timestamp\":$(date +%s000),\"sessionId\":\"debug-session\",\"runId\":\"verify-build\",\"hypothesisId\":\"A\"}" "${LOG_ENDPOINT}" >/dev/null 2>&1 || true
# #endregion

echo "📋 Checking image contents..."
echo ""

# Check for server.js
if docker cp "${CONTAINER_ID}:/app/server.js" /dev/null 2>/dev/null; then
    SERVER_JS_SIZE=$(docker exec "${CONTAINER_ID}" stat -c%s /app/server.js 2>/dev/null || echo "0")
    echo "✅ server.js exists (${SERVER_JS_SIZE} bytes)"
    # #region agent log
    curl -s -X POST -H "Content-Type: application/json" -d "{\"location\":\"verify-build.sh:38\",\"message\":\"server.js exists in image\",\"data\":{\"exists\":true,\"size\":${SERVER_JS_SIZE}},\"timestamp\":$(date +%s000),\"sessionId\":\"debug-session\",\"runId\":\"verify-build\",\"hypothesisId\":\"A\"}" "${LOG_ENDPOINT}" >/dev/null 2>&1 || true
    # #endregion
else
    echo "❌ server.js does NOT exist in image"
    # #region agent log
    curl -s -X POST -H "Content-Type: application/json" -d "{\"location\":\"verify-build.sh:43\",\"message\":\"server.js missing from image\",\"data\":{\"exists\":false},\"timestamp\":$(date +%s000),\"sessionId\":\"debug-session\",\"runId\":\"verify-build\",\"hypothesisId\":\"A\"}" "${LOG_ENDPOINT}" >/dev/null 2>&1 || true
    # #endregion
fi

# Check for .next/standalone directory
if docker exec "${CONTAINER_ID}" test -d /app/.next/standalone 2>/dev/null; then
    echo "✅ .next/standalone directory exists"
    # #region agent log
    curl -s -X POST -H "Content-Type: application/json" -d "{\"location\":\"verify-build.sh:51\",\"message\":\"Standalone directory exists in image\",\"data\":{\"exists\":true},\"timestamp\":$(date +%s000),\"sessionId\":\"debug-session\",\"runId\":\"verify-build\",\"hypothesisId\":\"A\"}" "${LOG_ENDPOINT}" >/dev/null 2>&1 || true
    # #endregion
else
    echo "❌ .next/standalone directory does NOT exist in image"
    # #region agent log
    curl -s -X POST -H "Content-Type: application/json" -d "{\"location\":\"verify-build.sh:56\",\"message\":\"Standalone directory missing from image\",\"data\":{\"exists\":false},\"timestamp\":$(date +%s000),\"sessionId\":\"debug-session\",\"runId\":\"verify-build\",\"hypothesisId\":\"A\"}" "${LOG_ENDPOINT}" >/dev/null 2>&1 || true
    # #endregion
fi

# Check for .next/static directory
if docker exec "${CONTAINER_ID}" test -d /app/.next/static 2>/dev/null; then
    echo "✅ .next/static directory exists"
else
    echo "❌ .next/static directory does NOT exist in image"
fi

# List top-level files
echo ""
echo "📁 Top-level files in /app:"
docker exec "${CONTAINER_ID}" ls -la /app 2>/dev/null | head -20 || echo "Could not list files"

# Cleanup
docker rm "${CONTAINER_ID}" >/dev/null 2>&1

echo ""
echo "=== Verification Complete ==="

