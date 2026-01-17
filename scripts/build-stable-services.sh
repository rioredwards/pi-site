#!/usr/bin/env bash
set -euo pipefail

# -------------------------
# Build Stable Services (ai-img-validator)
#
# The ai-img-validator service rarely changes, so we build it once
# and tag it as :stable. This avoids slow rebuilds on every deploy.
#
# Run this script:
#   - On first deployment to create the image
#   - When ai-img-validator code actually changes
#
# Usage:
#   ./scripts/build-stable-services.sh
# -------------------------

log() { printf "\n▶ %s\n" "$*"; }

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$APP_DIR"

log "Building ai-img-validator:stable..."
docker build -t pi-site/ai-img-validator:stable ./ai-img-validator

log "Done!"
echo ""
echo "Image built: pi-site/ai-img-validator:stable"
echo ""
echo "This image will be used by production deploys."
echo "Regular ./update.sh runs will NOT rebuild it."
echo ""
echo "To verify:"
echo "  docker images | grep ai-img-validator"
