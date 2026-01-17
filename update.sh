#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

# Helpful error if anything fails
trap 'echo "ERROR: failed on line $LINENO" >&2' ERR

# -------------------------
# Config
# -------------------------
REPO_URL="git@github.com:rioredwards/pi-site.git"
APP_DIR="${HOME}/pi-site"
ENV_FILE="$APP_DIR/.env.prod"
BRANCH="main"

log() { printf "\n▶ %s\n" "$*"; }

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "ERROR: missing required command: $1" >&2
    exit 1
  }
}

need_cmd git

# -------------------------
# Repo setup / update
# -------------------------
if [[ -d "$APP_DIR/.git" ]]; then
  log "Pulling latest changes from the repository..."
  git -C "$APP_DIR" fetch origin "$BRANCH"
  # safer than a normal pull: won't create merge commits unexpectedly
  git -C "$APP_DIR" merge --ff-only "origin/$BRANCH"
elif [[ -e "$APP_DIR" ]]; then
  echo "ERROR: $APP_DIR exists but is not a git repo (missing .git). Refusing to continue." >&2
  exit 1
else
  log "Cloning repository from $REPO_URL..."
  git clone --branch "$BRANCH" --single-branch "$REPO_URL" "$APP_DIR"
fi

# -------------------------
# Docker / Compose selection
# -------------------------
need_cmd docker

# If docker requires sudo on this machine, use it (and preserve PATH).
SUDO_ENV=()
if ! docker info >/dev/null 2>&1; then
  SUDO_ENV=(sudo env "PATH=$PATH")
fi

# Pick compose command (plugin v2: `docker compose`, standalone v1: `docker-compose`)
COMPOSE_CMD=()
if "${SUDO_ENV[@]}" docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD=("${SUDO_ENV[@]}" docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD=("${SUDO_ENV[@]}" docker-compose)
else
  echo "ERROR: Docker Compose not found (tried 'docker compose' and 'docker-compose')." >&2
  exit 1
fi

# -------------------------
# Deploy
# -------------------------
log "Rebuilding and restarting Docker containers..."
cd "$APP_DIR"

"${COMPOSE_CMD[@]}" down
"${COMPOSE_CMD[@]}" \
    --project-directory "$APP_DIR" \
    -f docker-compose.yml \
    -f docker-compose.prod.yml \
    up -d --build

# Basic health check (works for both v1 and v2)
if ! "${COMPOSE_CMD[@]}" ps | grep -q "Up"; then
  echo "ERROR: Docker containers may not have started correctly." >&2
  echo "Try: ${COMPOSE_CMD[*]} logs" >&2
  exit 1
fi

log "Update complete. Your Next.js app has been deployed with the latest changes."
