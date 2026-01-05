#!/bin/bash
# Fix upload directory permissions on Pi
# Usage: ./scripts/fix-upload-permissions.sh

PI_HOST="raspberrypi"
PI_PATH="~/pi-site"

echo "🔧 Fixing upload directory permissions..."
ssh ${PI_HOST} "cd ${PI_PATH} && \
    mkdir -p public/images && \
    chmod 755 public/images && \
    chown -R \$(whoami):\$(whoami) public/images && \
    echo '✅ Upload directory permissions fixed'"

