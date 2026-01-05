#!/bin/bash
# Verify the upload fix is working
# Run this on the Pi: ssh raspberrypi 'cd ~/pi-site && bash scripts/verify-upload-fix.sh'

set -e

echo "🔍 Verifying upload fix..."
echo ""

# Check if UPLOAD_DIR is set in PM2
echo "1️⃣ Checking PM2 environment..."
UPLOAD_DIR=$(pm2 env 0 | grep UPLOAD_DIR | cut -d'=' -f2 | tr -d "'" || echo "")
if [ -z "$UPLOAD_DIR" ]; then
  echo "❌ UPLOAD_DIR not set in PM2 environment"
  echo "   Check ecosystem.config.js"
  exit 1
else
  echo "✅ UPLOAD_DIR is set: $UPLOAD_DIR"
fi

# Check if directory exists
echo ""
echo "2️⃣ Checking upload directory..."
if [ -d "$UPLOAD_DIR" ]; then
  echo "✅ Directory exists: $UPLOAD_DIR"
  ls -ld "$UPLOAD_DIR"
else
  echo "❌ Directory does NOT exist: $UPLOAD_DIR"
  echo "   Creating it..."
  mkdir -p "$UPLOAD_DIR"
  chmod 755 "$UPLOAD_DIR"
  echo "✅ Directory created"
fi

# Check write permissions
echo ""
echo "3️⃣ Checking write permissions..."
if touch "$UPLOAD_DIR/.test-write" 2>/dev/null; then
  rm "$UPLOAD_DIR/.test-write"
  echo "✅ Directory is writable"
else
  echo "❌ Directory is NOT writable"
  echo "   Fixing permissions..."
  chmod 755 "$UPLOAD_DIR"
  chown -R $(whoami):$(whoami) "$UPLOAD_DIR" 2>/dev/null || echo "   (Could not change owner - may need sudo)"
  echo "✅ Permissions updated"
fi

# Check if code uses environment variable
echo ""
echo "4️⃣ Checking code fix..."
if grep -q "process.env.UPLOAD_DIR" app/actions.ts; then
  echo "✅ Code uses UPLOAD_DIR environment variable"
else
  echo "❌ Code still uses hardcoded path"
  echo "   The fix may not be deployed"
fi

# Check PM2 is running
echo ""
echo "5️⃣ Checking PM2 status..."
if pm2 list | grep -q "pi-site.*online"; then
  echo "✅ PM2 process is running"
else
  echo "⚠️  PM2 process may not be running"
  pm2 list
fi

echo ""
echo "✅ Verification complete!"
echo ""
echo "Next steps:"
echo "1. Try uploading an image through the web interface"
echo "2. Check logs: pm2 logs pi-site --lines 50"
echo "3. Check debug logs: cat .cursor/debug.log 2>/dev/null || echo 'No debug logs yet'"

