#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

# -------------------------
# Production Cleanup Script
#
# Uses Docker Compose commands for safer, project-scoped cleanup.
# Won't accidentally affect other Docker projects on the system.
# -------------------------

log()  { printf "\n▶ %s\n" "$*"; }
warn() { printf "\n⚠ %s\n" "$*" >&2; }

APP_DIR="${APP_DIR:-${HOME}/pi-site}"

confirm() {
  local prompt="$1"
  read -p "$prompt (yes/no): " answer
  [[ "$answer" == "yes" ]]
}

# -------------------------
# Main
# -------------------------
cd "$APP_DIR"

cat <<'EOM'
=========================================
Production Cleanup Script
=========================================

This will remove pi-site Docker resources:
  - Stop and remove containers
  - Remove project images
  - Optionally remove volumes (DATABASE DATA!)

Other Docker projects on this system will NOT be affected.

EOM

if ! confirm "Continue with cleanup?"; then
  echo "Cancelled."
  exit 0
fi

log "Stopping and removing containers..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml down --remove-orphans

if confirm "Remove project images? (will need to rebuild on next deploy)"; then
  log "Removing images..."
  docker compose -f docker-compose.yml -f docker-compose.prod.yml down --rmi local
fi

if confirm "Remove volumes? WARNING: This DELETES DATABASE DATA!"; then
  log "Removing volumes..."
  docker compose -f docker-compose.yml -f docker-compose.prod.yml down -v
fi

log "Pruning unused Docker resources..."
docker image prune -f
docker network prune -f

log "Cleanup complete!"

cat <<'EOM'

To redeploy:
  ./scripts/deploy-prod.sh

Or for a quick rebuild:
  ./scripts/update-prod.sh

EOM
