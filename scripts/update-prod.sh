#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

# -------------------------
# Quick Production Update Script
#
# Use this for routine updates when:
# - Docker/Nginx are already installed
# - .env.prod already exists
# - You just need to pull code and rebuild
#
# For full deployment (first-time or after env changes), use deploy-prod.sh
# -------------------------

trap 'echo "ERROR: update failed on line $LINENO" >&2' ERR

log() { printf "\n▶ %s\n" "$*"; }
die() { printf "\nERROR: %s\n" "$*" >&2; exit 1; }

# -------------------------
# Config
# -------------------------
APP_DIR="${APP_DIR:-${HOME}/pi-site}"
BRANCH="${BRANCH:-main}"

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

log "Rebuilding and restarting containers..."
cd "$APP_DIR"

docker compose -f docker-compose.yml -f docker-compose.prod.yml down
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

log "Waiting for services..."
sleep 5

# Quick health check
if ! docker compose -f docker-compose.yml -f docker-compose.prod.yml ps | grep -q "Up"; then
  die "Containers may not have started correctly. Check: docker compose -f docker-compose.yml -f docker-compose.prod.yml logs"
fi

log "Cleaning up old images..."
docker image prune -f

log "Update complete!"
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
