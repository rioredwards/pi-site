#!/bin/bash
# Check Docker container status on Raspberry Pi
# Usage: ./scripts/check-server.sh
#
# This script shows the status of the Docker container.
# It can be run from any directory and will navigate to the project directory.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${PROJECT_DIR}"

echo "📊 Container Status:"
echo ""
docker compose ps

echo ""
echo "📋 Container Details:"
if docker compose ps | grep -q "Up"; then
    echo "✅ Container is running"
    
    # Check health status if available
    HEALTH=$(docker compose ps --format json 2>/dev/null | grep -o '"Health":"[^"]*"' | cut -d'"' -f4 || echo "")
    if [ -n "$HEALTH" ]; then
        echo "   Health: ${HEALTH}"
    fi
    
    # Show port mapping
    echo ""
    echo "🌐 Ports:"
    docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || docker compose ps
else
    echo "❌ Container is not running"
    echo ""
    echo "To start: ./scripts/start-server.sh"
    echo "Or: docker compose up -d"
fi
