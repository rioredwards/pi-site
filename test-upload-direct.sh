#!/bin/bash
# Test upload directly on the Pi

PI_HOST="raspberrypi"
PI_PATH="~/pi-site"

echo "🧪 Testing upload on Pi..."
echo ""

# Create a test image file on the Pi
ssh ${PI_HOST} "cd ${PI_PATH} && \
  echo -e '\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xFF\xD9' > /tmp/test-image.jpg && \
  echo 'Test image created'"

# Check if the upload directory exists and is writable
echo "📁 Checking upload directory..."
ssh ${PI_HOST} "cd ${PI_PATH} && \
  UPLOAD_DIR=\$(pm2 env 0 | grep UPLOAD_DIR | cut -d'=' -f2) && \
  echo 'UPLOAD_DIR from PM2: '\$UPLOAD_DIR && \
  if [ -d \"\$UPLOAD_DIR\" ]; then \
    echo 'Directory exists: '\$UPLOAD_DIR && \
    ls -ld \"\$UPLOAD_DIR\" && \
    touch \"\$UPLOAD_DIR/.test-write\" 2>&1 && \
    if [ -f \"\$UPLOAD_DIR/.test-write\" ]; then \
      rm \"\$UPLOAD_DIR/.test-write\" && \
      echo '✅ Directory is writable'; \
    else \
      echo '❌ Directory is NOT writable'; \
    fi; \
  else \
    echo '❌ Directory does NOT exist: '\$UPLOAD_DIR; \
  fi"

echo ""
echo "📋 Checking PM2 process environment..."
ssh ${PI_HOST} "cd ${PI_PATH} && pm2 env 0 | grep -E 'UPLOAD_DIR|NODE_ENV|PORT'"

echo ""
echo "✅ Test complete"

