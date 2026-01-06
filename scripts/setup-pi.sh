#!/usr/bin/env zsh
# Initial setup script for Raspberry Pi
# Run this ONCE on your Pi: zsh scripts/setup-pi.sh

set -e

echo "🔧 Setting up Raspberry Pi for pi-site..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "   Install Node.js 18+ first:"
    echo "   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
    echo "   sudo apt-get install -y nodejs"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js found: ${NODE_VERSION}"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    # Preserve PATH when using sudo so npm/nvm is accessible
    sudo env PATH="$PATH" npm install -g pm2
    echo "✅ PM2 installed"
else
    echo "✅ PM2 already installed"
fi

# Check and install system dependencies for canvas (required for content moderation)
echo "📦 Checking system dependencies for canvas..."
MISSING_DEPS=()
for dep in libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev build-essential; do
    if ! dpkg -l | grep -q "^ii.*${dep}"; then
        MISSING_DEPS+=("${dep}")
    fi
done

if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
    echo "   Installing missing dependencies: ${MISSING_DEPS[*]}"
    sudo apt-get update
    sudo apt-get install -y "${MISSING_DEPS[@]}"
    echo "✅ System dependencies installed"
else
    echo "✅ All system dependencies already installed"
fi

# Create logs directory
mkdir -p ~/pi-site/logs
echo "✅ Logs directory created"

# Install PM2 startup script
echo "📦 Setting up PM2 startup script..."
pm2 startup systemd -u $USER --hp $HOME
echo "✅ PM2 startup configured"
echo ""
echo "⚠️  IMPORTANT: Run the command shown above (it starts with 'sudo env PATH=...')"
echo ""

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Make sure your .env file is in ~/pi-site/"
echo "2. Run the deploy script from your desktop: npm run deploy"

