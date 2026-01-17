#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

# -------------------------
# Production Deployment Script
#
# Philosophy:
# - Use Docker Compose for all orchestration
# - Never generate or store secrets (sync .env.prod manually)
# - Validate environment before deploying
# -------------------------

trap 'echo "ERROR: deploy failed on line $LINENO" >&2' ERR

log()  { printf "\n▶ %s\n" "$*"; }
warn() { printf "\n⚠ %s\n" "$*" >&2; }
die()  { printf "\nERROR: %s\n" "$*" >&2; exit 1; }

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

# -------------------------
# Config
# -------------------------
REPO_URL="git@github.com:rioredwards/pi-site.git"
APP_DIR="${APP_DIR:-${HOME}/pi-site}"
BRANCH="${BRANCH:-main}"
ENV_FILE="$APP_DIR/.env.prod"

# -------------------------
# Repo
# -------------------------
clone_or_update_repo() {
  if [[ -d "$APP_DIR/.git" ]]; then
    log "Updating repo..."
    git -C "$APP_DIR" fetch origin "$BRANCH"
    git -C "$APP_DIR" merge --ff-only "origin/$BRANCH"
  else
    log "Cloning repo..."
    git clone --branch "$BRANCH" --single-branch "$REPO_URL" "$APP_DIR"
  fi
}

# -------------------------
# Env validation
# -------------------------
ensure_env_file_present() {
  [[ -f "$ENV_FILE" ]] && return

  warn "Missing env file: $ENV_FILE"
  cat <<'EOM' >&2

Sync your production env file from your dev-machine before deploying:

  rsync -avz .env.prod pi:~/pi-site/.env.prod

Then re-run:

  ./deploy.sh
EOM
  exit 1
}

get_env_value() {
  grep -E "^${1}=" "$ENV_FILE" | tail -n 1 | cut -d= -f2- || true
}

require_env_key() {
  [[ -n "$(get_env_value "$1")" ]] || die "Missing required env var '$1'"
}

validate_env() {
  log "Validating environment..."

  # Database
  require_env_key POSTGRES_USER
  require_env_key POSTGRES_PASSWORD
  require_env_key POSTGRES_DB
  require_env_key DATABASE_URL

  # Auth
  require_env_key NEXTAUTH_URL
  require_env_key AUTH_SECRET

  # OAuth
  require_env_key GITHUB_CLIENT_ID
  require_env_key GITHUB_CLIENT_SECRET
  require_env_key GOOGLE_CLIENT_ID
  require_env_key GOOGLE_CLIENT_SECRET

  # Image handling
  require_env_key PUBLIC_IMG_VALIDATOR_BASE_URL
  require_env_key IMG_UPLOAD_DIR

  # App keys
  require_env_key SECRET_KEY
  require_env_key NEXT_PUBLIC_SAFE_KEY

  log "Environment validated."
}

# -------------------------
# Docker Compose
# -------------------------
COMPOSE_FILES="-f docker-compose.yml -f docker-compose.prod.yml"
DEFAULT_BUILD_SERVICES="web system-profiler"

ensure_stable_images() {
  # ai-img-validator uses a cached :stable image to avoid slow rebuilds
  if ! docker image inspect pi-site/ai-img-validator:stable >/dev/null 2>&1; then
    log "Building ai-img-validator:stable (first time only)..."
    docker build -t pi-site/ai-img-validator:stable ./ai-img-validator
  else
    log "Using cached ai-img-validator:stable image"
  fi
}

compose_up() {
  log "Building and starting containers..."
  cd "$APP_DIR"

  ensure_stable_images

  # Only build web and system-profiler (ai-img-validator uses cached image)
  log "Building: $DEFAULT_BUILD_SERVICES"
  docker compose $COMPOSE_FILES build $DEFAULT_BUILD_SERVICES

  log "Starting all services..."
  docker compose $COMPOSE_FILES up -d

  log "Waiting for services to be healthy..."
  sleep 5

  # Check if containers are running
  if ! docker compose $COMPOSE_FILES ps | grep -q "Up"; then
    warn "Some containers may not have started correctly"
    docker compose $COMPOSE_FILES ps
    exit 1
  fi

  docker compose $COMPOSE_FILES ps
}

cleanup_images() {
  log "Cleaning up dangling images only..."
  docker image prune -f --filter "dangling=true"
}

# -------------------------
# Main
# -------------------------
main() {
  need_cmd git
  need_cmd docker

  clone_or_update_repo
  ensure_env_file_present
  validate_env
  compose_up
  cleanup_images

  log "Deployment complete!"
  cat <<'EOM'

Services running. Check status with:
  docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

View logs with:
  docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

EOM
}

main "$@"
