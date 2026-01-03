#!/bin/bash
# Start the Docker container on Raspberry Pi
# Usage: ./scripts/start-server.sh
#
# This script starts the Docker container using docker compose.
# It can be run from any directory and will navigate to the project directory.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "🚀 Starting Docker container..."
echo ""

cd "${PROJECT_DIR}"

if ! docker compose ps | grep -q "Up"; then
    if docker compose up -d; then
        echo "✅ Container started successfully!"
        echo ""
        echo "View logs: docker compose logs -f"
        echo "Check status: docker compose ps"
        echo "Stop: docker compose down"
    else
        echo "❌ Failed to start container"
        echo "Check logs: docker compose logs"
        exit 1
    fi
else
    echo "✅ Container is already running"
    docker compose ps
fi
