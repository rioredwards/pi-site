#!/bin/bash
# Transfer and run setup script on Raspberry Pi
# Usage: ./scripts/setup-pi-remote.sh [PI_HOSTNAME]

set -e

PI_HOST="${1:-raspberrypi}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "🔧 Setting up Raspberry Pi remotely..."
echo "   Target: ${PI_HOST}"
echo ""

# Test SSH connection
if ! ssh -o ConnectTimeout=5 ${PI_HOST} "echo 'SSH connection test'" &>/dev/null; then
    echo "❌ Error: Cannot connect to ${PI_HOST} via SSH"
    echo ""
    echo "Please check:"
    echo "1. Is your Pi online?"
    echo "2. Is SSH enabled on the Pi?"
    echo "3. Is the hostname correct? (try: ssh pi@raspberrypi.local or ssh pi@192.168.x.x)"
    echo ""
    echo "You can specify a different hostname:"
    echo "  ./scripts/setup-pi-remote.sh pi@192.168.1.100"
    exit 1
fi

echo "✅ SSH connection verified"
echo ""

# Get expanded path
PI_PATH=$(ssh ${PI_HOST} "echo ~/pi-site")
echo "📁 Pi project path: ${PI_PATH}"
echo ""

# Ensure directory exists
echo "📦 Creating project directory..."
ssh ${PI_HOST} "mkdir -p ${PI_PATH}/scripts" || true

# Transfer setup script
echo "📤 Transferring setup script..."
scp "${SCRIPT_DIR}/setup-pi.sh" ${PI_HOST}:${PI_PATH}/scripts/ || {
    echo "❌ Failed to transfer setup script"
    exit 1
}

# Make it executable
ssh ${PI_HOST} "chmod +x ${PI_PATH}/scripts/setup-pi.sh"

# Run the setup script
echo "🚀 Running setup script on Pi..."
echo ""
ssh -t ${PI_HOST} "cd ${PI_PATH} && bash scripts/setup-pi.sh"

echo ""
echo "✅ Setup complete!"
echo ""
echo "⚠️  If PM2 startup showed a command, run it on the Pi:"
echo "   ssh ${PI_HOST}"
echo "   # Then run the sudo command that was shown"
echo ""
echo "Next: Run 'npm run deploy' from your desktop to deploy the app"

