#!/usr/bin/env zsh
# Rebuild native Node.js modules for the current architecture
# Run this on the Pi if native modules (better-sqlite3, canvas, etc.) aren't working
# Usage: zsh scripts/rebuild-native-modules.sh

set -e

echo "🔧 Rebuilding native Node.js modules..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Run this script from the project root."
  exit 1
fi

# Rebuild all native modules
echo "📦 Rebuilding all native modules..."
npm rebuild

# Specifically rebuild critical modules
echo ""
echo "📦 Rebuilding better-sqlite3 (required for Prisma)..."
npm rebuild better-sqlite3

echo ""
echo "📦 Rebuilding canvas (required for content moderation)..."
npm rebuild canvas || echo "⚠️  Canvas rebuild failed (may need system dependencies)"

echo ""
echo "✅ Native modules rebuilt!"
echo ""
echo "Next steps:"
echo "1. Restart the app: pm2 restart pi-site"
echo "2. Check logs: pm2 logs pi-site"

