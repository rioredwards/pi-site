#!/usr/bin/env zsh
# Check and optionally install system dependencies required for npm packages
# Usage: ./scripts/check-system-deps.sh [--install]
#   --install: Automatically install missing dependencies (requires sudo)

set -e

REQUIRED_DEPS=(
    "libcairo2-dev"
    "libpango1.0-dev"
    "libjpeg-dev"
    "libgif-dev"
    "librsvg2-dev"
    "build-essential"
)

MISSING_DEPS=()

# Check which dependencies are missing
for dep in "${REQUIRED_DEPS[@]}"; do
    if ! dpkg -l | grep -q "^ii.*${dep}"; then
        MISSING_DEPS+=("${dep}")
    fi
done

if [ ${#MISSING_DEPS[@]} -eq 0 ]; then
    echo "✅ All system dependencies are installed"
    exit 0
fi

echo "⚠️  Missing system dependencies: ${MISSING_DEPS[*]}"
echo "   These are required for the 'canvas' package (used by content moderation)"

if [ "$1" = "--install" ]; then
    echo "📦 Installing missing dependencies..."
    sudo apt-get update
    sudo apt-get install -y "${MISSING_DEPS[@]}"
    echo "✅ System dependencies installed"
    exit 0
else
    echo ""
    echo "To install automatically, run:"
    echo "  zsh scripts/check-system-deps.sh --install"
    echo ""
    echo "Or run the full setup script:"
    echo "  zsh scripts/setup-pi.sh"
    exit 1
fi

