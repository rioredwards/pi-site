#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

# -------------------------
# Quick Production Update Script
#
# Usage:
#   ./scripts/update-prod.sh                    # Build web + system-profiler (default)
#   ./scripts/update-prod.sh web                # Build only web
#   ./scripts/update-prod.sh web system-profiler # Build specific services
#   ./scripts/update-prod.sh --all              # Build all services (including ai-img-validator)
#
# Note: ai-img-validator uses a cached :stable image by default.
# Run ./scripts/build-stable-services.sh to rebuild it when needed.
# -------------------------

trap 'echo "ERROR: update failed on line $LINENO" >&2' ERR

log() { printf "\n▶ %s\n" "$*"; }
die() { printf "\nERROR: %s\n" "$*" >&2; exit 1; }

# -------------------------
# Config
# -------------------------
APP_DIR="${APP_DIR:-${HOME}/pi-site}"
BRANCH="${BRANCH:-main}"
COMPOSE_FILES="-f docker-compose.yml -f docker-compose.prod.yml"

# Default services to build (excludes ai-img-validator which uses cached image)
DEFAULT_BUILD_SERVICES="web system-profiler"

# -------------------------
# Main
# -------------------------
command -v git >/dev/null 2>&1 || die "Missing required command: git"
command -v docker >/dev/null 2>&1 || die "Missing required command: docker"

[[ -d "$APP_DIR/.git" ]] || die "Not a git repo: $APP_DIR"
[[ -f "$APP_DIR/.env.prod" ]] || die "Missing env file: $APP_DIR/.env.prod"

log "Pulling latest changes..."
git -C "$APP_DIR" fetch origin "$BRANCH"
git -C "$APP_DIR" merge --ff-only "origin/$BRANCH"

cd "$APP_DIR"

# Determine which services to build
if [[ $# -eq 0 ]]; then
  BUILD_SERVICES="$DEFAULT_BUILD_SERVICES"
  log "Building default services: $BUILD_SERVICES"
elif [[ "$1" == "--all" ]]; then
  BUILD_SERVICES=""  # Empty means build all
  log "Building ALL services (including ai-img-validator)"
else
  BUILD_SERVICES="$*"
  log "Building specified services: $BUILD_SERVICES"
fi

# Build services
if [[ -n "$BUILD_SERVICES" ]]; then
  log "Building: $BUILD_SERVICES"
  docker compose $COMPOSE_FILES build $BUILD_SERVICES
else
  log "Building all services..."
  docker compose $COMPOSE_FILES build
fi

# Bring up all services
log "Starting services..."
docker compose $COMPOSE_FILES up -d

log "Waiting for services..."
sleep 5

# Quick health check
if ! docker compose $COMPOSE_FILES ps | grep -q "Up"; then
  die "Containers may not have started correctly. Check: docker compose $COMPOSE_FILES logs"
fi

log "Cleaning up dangling images only..."
docker image prune -f --filter "dangling=true"

log "Update complete!"
docker compose $COMPOSE_FILES ps
