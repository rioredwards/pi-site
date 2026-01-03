#!/bin/bash
# Stop the Docker container on Raspberry Pi
# Usage: ./scripts/stop-server.sh
#
# This script stops the Docker container using docker compose.
# It can be run from any directory and will navigate to the project directory.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "🛑 Stopping Docker container..."
echo ""

cd "${PROJECT_DIR}"

if docker compose ps | grep -q "Up"; then
    if docker compose down; then
        echo "✅ Container stopped successfully!"
    else
        echo "❌ Failed to stop container"
        exit 1
    fi
else
    echo "ℹ️  Container is not running"
    docker compose ps
fi
