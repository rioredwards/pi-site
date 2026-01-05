#!/bin/bash
# Start the app using PM2
# Usage: ./scripts/start-server.sh [remote]
#
# If "remote" is provided, starts on Raspberry Pi via SSH
# Otherwise, starts locally
#
# This script starts the app using PM2 with ecosystem.config.js

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [ "$1" = "remote" ]; then
    # Start on Raspberry Pi
    PI_HOST="raspberrypi"
    PI_PATH="~/pi-site"
    
    echo "🚀 Starting app on Raspberry Pi with PM2..."
    echo ""
    
    ssh ${PI_HOST} "cd ${PI_PATH} && pm2 start ecosystem.config.js || pm2 restart pi-site"
    
    echo "✅ App started on Raspberry Pi!"
    echo ""
    echo "View logs: ssh ${PI_HOST} 'pm2 logs pi-site'"
    echo "Check status: ssh ${PI_HOST} 'pm2 status'"
    echo "Stop: ssh ${PI_HOST} 'pm2 stop pi-site'"
else
    # Start locally
    echo "🚀 Starting app locally with PM2..."
    echo ""
    
    cd "${PROJECT_DIR}"
    
    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        echo "❌ PM2 is not installed. Install it with: npm install -g pm2"
        exit 1
    fi
    
    # Check if app is already running
    if pm2 list | grep -q "pi-site.*online"; then
        echo "ℹ️  App is already running, restarting..."
        pm2 restart pi-site
    else
        pm2 start ecosystem.config.js
    fi
    
    echo "✅ App started!"
    echo ""
    echo "View logs: pm2 logs pi-site"
    echo "Check status: pm2 status"
    echo "Stop: pm2 stop pi-site"
fi
