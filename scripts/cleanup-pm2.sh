#!/bin/bash
# Clean up old errored PM2 processes
# Usage: ./scripts/cleanup-pm2.sh

PI_HOST="raspberrypi"
PI_PATH="~/pi-site"

echo "🧹 Cleaning up old PM2 processes..."
ssh ${PI_HOST} "cd ${PI_PATH} && pm2 delete all && pm2 start npm --name pi-site -- start"
echo "✅ Cleanup complete!"

