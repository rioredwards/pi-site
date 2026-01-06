# scripts/build-prod.sh
#!/usr/bin/env zsh
set -e

echo "🔨 Building for production..."

# Clean previous build
rm -rf .next

# Build
npm run build

# Ensure static files are in standalone directory (Next.js should do this, but verify)
if [ ! -d ".next/standalone/.next/static" ]; then
    echo "📦 Copying static files to standalone directory..."
    mkdir -p .next/standalone/.next
    cp -r .next/static .next/standalone/.next/static
fi

# Copy public folder to standalone (needed for public assets)
if [ ! -d ".next/standalone/public" ]; then
    echo "📦 Copying public folder to standalone directory..."
    cp -r public .next/standalone/public
fi

echo "✅ Build complete!"
