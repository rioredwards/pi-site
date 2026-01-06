#!/usr/bin/env zsh
# Stop the app using PM2
# Usage: ./scripts/stop-server.sh [remote]
#
# If "remote" is provided, stops on Raspberry Pi via SSH
# Otherwise, stops locally
#
# This script stops the app using PM2

set -e

SCRIPT_DIR="$(cd "$(dirname "${(%):-%x}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [ "$1" = "remote" ]; then
    # Stop on Raspberry Pi
    PI_HOST="pi"
    
    echo "🛑 Stopping app on Raspberry Pi..."
    echo ""
    
    ssh ${PI_HOST} "pm2 stop pi-site || echo 'App is not running'"
    
    echo "✅ App stopped on Raspberry Pi!"
else
    # Stop locally
    echo "🛑 Stopping app locally..."
    echo ""
    
    cd "${PROJECT_DIR}"
    
    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        echo "❌ PM2 is not installed."
        exit 1
    fi
    
    if pm2 list | grep -q "pi-site"; then
        pm2 stop pi-site
        echo "✅ App stopped!"
    else
        echo "ℹ️  App is not running"
    fi
fi
