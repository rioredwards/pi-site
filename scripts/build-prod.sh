# scripts/build-prod.sh
#!/usr/bin/env zsh
set -e

echo "🔨 Building for production..."

# Clean previous build
rm -rf .next

# Build directly (don't use npm run build to avoid circular dependency)
npx next build

# Always copy static files to standalone directory (Next.js doesn't do this automatically)
echo "📦 Copying static files to standalone directory..."
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/static

# Always copy public folder to standalone (needed for public assets)
echo "📦 Copying public folder to standalone directory..."
cp -r public .next/standalone/public

echo "✅ Build complete!"
