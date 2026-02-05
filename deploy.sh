#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

# -------------------------
# pi-site Full Deployment Script (Raspberry Pi)
#
# This script handles:
# - System dependencies (Docker, Nginx)
# - Nginx configuration
# - Then delegates to scripts/deploy-prod.sh for Compose orchestration
#
# For routine updates (when system is already set up), use:
#   ./scripts/update-prod.sh
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
export APP_DIR="${HOME}/pi-site"
export BRANCH="main"
SITE_NAME="pi-site"
DOCKER_ARCH="arm64"

# -------------------------
# Docker Installation
# -------------------------
install_docker_if_needed() {
  command -v docker >/dev/null 2>&1 && return

  log "Installing Docker..."
  sudo apt-get update -y
  sudo apt-get install -y ca-certificates curl gnupg lsb-release

  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/debian/gpg \
    | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

  echo "deb [arch=${DOCKER_ARCH} signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/debian $(lsb_release -cs) stable" \
    | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null

  sudo apt-get update -y
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
}

ensure_docker_running() {
  sudo systemctl enable docker
  sudo systemctl start docker
}

# -------------------------
# Nginx Installation & Configuration
# -------------------------
install_nginx_if_needed() {
  command -v nginx >/dev/null 2>&1 && return
  log "Installing Nginx..."
  sudo apt-get install -y nginx
}

configure_nginx() {
  log "Configuring Nginx..."

  # Use version-controlled configs from repo
  local main_conf="${APP_DIR}/nginx/nginx.conf"
  local site_conf="${APP_DIR}/nginx/pi-site.conf"

  [[ -f "$main_conf" ]] || die "Missing nginx config: $main_conf"
  [[ -f "$site_conf" ]] || die "Missing nginx config: $site_conf"

  # Backup existing nginx.conf if it differs
  if [[ -f /etc/nginx/nginx.conf ]] && ! diff -q "$main_conf" /etc/nginx/nginx.conf >/dev/null 2>&1; then
    log "Backing up existing nginx.conf..."
    sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
  fi

  # Copy main nginx.conf
  sudo cp "$main_conf" /etc/nginx/nginx.conf

  # Copy site config
  sudo cp "$site_conf" "/etc/nginx/sites-available/${SITE_NAME}"

  # Enable our site config
  sudo ln -sf \
    "/etc/nginx/sites-available/${SITE_NAME}" \
    "/etc/nginx/sites-enabled/${SITE_NAME}"

  # Remove old/stale site configs that aren't managed by this repo
  log "Cleaning up old nginx site configs..."
  for old_config in myapp dogtownUSA default; do
    if [[ -L "/etc/nginx/sites-enabled/${old_config}" ]]; then
      log "  Removing sites-enabled/${old_config}"
      sudo rm -f "/etc/nginx/sites-enabled/${old_config}"
    fi
  done

  # Create cache directory for Next.js optimized images
  if [[ ! -d /var/cache/nginx/nextjs_images ]]; then
    log "Creating nginx cache directory..."
    sudo mkdir -p /var/cache/nginx/nextjs_images
    sudo chown www-data:www-data /var/cache/nginx/nextjs_images
  fi

  sudo nginx -t || die "Nginx config test failed"
  sudo systemctl reload nginx || sudo systemctl start nginx
}

configure_cron() {
  log "Configuring cron jobs..."

  local cron_file="${APP_DIR}/cron/pi-site"
  [[ -f "$cron_file" ]] || { warn "No cron config found, skipping"; return; }

  sudo cp "$cron_file" /etc/cron.d/pi-site
  sudo chmod 644 /etc/cron.d/pi-site
}

# -------------------------
# Main
# -------------------------
need_cmd git
need_cmd sudo

log "Setting up system dependencies..."
install_docker_if_needed
ensure_docker_running
install_nginx_if_needed
configure_nginx
configure_cron

log "Running deployment..."
# Delegate to the Compose-focused deployment script
"${APP_DIR}/scripts/deploy-prod.sh" || {
  # If deploy-prod.sh doesn't exist yet (first clone), run it from repo root
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  "${SCRIPT_DIR}/scripts/deploy-prod.sh"
}

log "Full deployment complete!"
