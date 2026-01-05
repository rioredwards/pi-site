#!/bin/bash
# Initial setup script for Raspberry Pi
# Run this ONCE on your Pi: bash scripts/setup-pi.sh

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

