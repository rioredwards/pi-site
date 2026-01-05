#!/bin/bash
# Check PM2 process status on Raspberry Pi
# Usage: ./scripts/check-server.sh [remote]
#
# If "remote" is provided, checks status on Raspberry Pi via SSH
# Otherwise, checks locally
#
# This script shows the status of the PM2 process.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [ "$1" = "remote" ]; then
    # Check on Raspberry Pi
    PI_HOST="raspberrypi"
    PI_PATH="~/pi-site"
    
    echo "📊 Checking PM2 status on Raspberry Pi..."
    echo ""
    
    ssh ${PI_HOST} "cd ${PI_PATH} && pm2 status" || {
        echo "❌ Failed to check PM2 status on Pi"
        echo "   Make sure PM2 is installed and the app is set up"
        exit 1
    }
    
    echo ""
    echo "View logs: ssh ${PI_HOST} 'pm2 logs pi-site'"
    echo "Restart: ssh ${PI_HOST} 'pm2 restart pi-site'"
else
    # Check locally
    echo "📊 PM2 Status:"
    echo ""
    
    cd "${PROJECT_DIR}"
    
    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        echo "❌ PM2 is not installed. Install it with: npm install -g pm2"
        exit 1
    fi
    
    # Show PM2 status
    pm2 status
    
    echo ""
    echo "📋 Process Details:"
    if pm2 list | grep -q "pi-site.*online"; then
        echo "✅ App is running"
        
        # Show more details
        echo ""
        echo "Process info:"
        pm2 describe pi-site 2>/dev/null | head -20 || pm2 list
        
        echo ""
        echo "View logs: pm2 logs pi-site"
        echo "Restart: pm2 restart pi-site"
        echo "Stop: pm2 stop pi-site"
    else
        echo "❌ App is not running"
        echo ""
        echo "To start: ./scripts/start-server.sh"
        echo "Or: pm2 start ecosystem.config.js"
    fi
fi
