#!/usr/bin/env zsh
# Initial setup script for macOS (Mac Mini)
# Run this ONCE: zsh scripts/setup-mac.sh

set -e

echo "🔧 Setting up Mac Mini for pi-site (production-like environment)..."
echo ""

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew is not installed"
    echo "   Install Homebrew first:"
    echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    exit 1
fi
echo "✅ Homebrew found"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "   Installing Node.js via Homebrew..."
    brew install node@20
    echo "✅ Node.js installed"
else
    NODE_VERSION=$(node -v)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 20 ]; then
        echo "⚠️  Node.js version is $NODE_VERSION, but 20+ is required"
        echo "   Please upgrade Node.js: brew upgrade node@20"
        exit 1
    fi
    echo "✅ Node.js found: ${NODE_VERSION}"
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
    echo "✅ PM2 installed"
else
    echo "✅ PM2 already installed"
fi

# Check and install system dependencies for canvas
echo "📦 Checking system dependencies for canvas..."
MISSING_DEPS=()

# Check for required packages
for dep in pkg-config cairo pango libpng jpeg giflib librsvg pixman; do
    if ! brew list "$dep" &> /dev/null; then
        MISSING_DEPS+=("$dep")
    fi
done

if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
    echo "   Installing missing dependencies: ${MISSING_DEPS[*]}"
    brew install "${MISSING_DEPS[@]}"
    echo "✅ System dependencies installed"
else
    echo "✅ All system dependencies already installed"
fi

# Check for Xcode Command Line Tools
if ! xcode-select -p &> /dev/null; then
    echo "⚠️  Xcode Command Line Tools not found"
    echo "   Installing Xcode Command Line Tools..."
    xcode-select --install
    echo "⚠️  Please complete the Xcode Command Line Tools installation, then run this script again"
    exit 1
else
    echo "✅ Xcode Command Line Tools found"
fi

# Create logs directory
mkdir -p logs
echo "✅ Logs directory created"

# Create public/images directory if it doesn't exist
mkdir -p public/images
chmod 755 public/images
echo "✅ Public images directory created"

# Check for .env file
if [ ! -f .env ]; then
    if [ -f .env.local ]; then
        echo "📋 Copying .env.local to .env..."
        cp .env.local .env
        echo "✅ Created .env from .env.local"
        echo "⚠️  Please review .env and update NODE_ENV=production if needed"
    else
        echo "⚠️  No .env file found"
        echo "   Creating .env template..."
        cat > .env << 'EOF'
NODE_ENV=production
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=your-secret-here
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
ADMIN_USER_IDS=github-your_github_id
DATABASE_URL=file:./prisma/dev.db
EOF
        echo "✅ Created .env template"
        echo "⚠️  IMPORTANT: Edit .env and add your actual credentials"
    fi
else
    echo "✅ .env file found"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Review and update your .env file with correct values"
echo "2. Install npm dependencies: npm install"
echo "3. Set up database: npx prisma generate && npx prisma migrate deploy"
echo "4. Build the app: npm run build"
echo "5. Start with PM2: pm2 start ecosystem.config.js && pm2 save"
echo ""
echo "Or run these commands now:"
echo "  npm install && npx prisma generate && npx prisma migrate deploy && npm run build && pm2 start ecosystem.config.js && pm2 save"

