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

  # Use version-controlled config from repo
  local nginx_conf="${APP_DIR}/nginx/pi-site.conf"
  [[ -f "$nginx_conf" ]] || die "Missing nginx config: $nginx_conf"

  sudo cp "$nginx_conf" "/etc/nginx/sites-available/${SITE_NAME}"

  sudo ln -sf \
    "/etc/nginx/sites-available/${SITE_NAME}" \
    "/etc/nginx/sites-enabled/${SITE_NAME}"

  sudo nginx -t || die "Nginx config test failed"
  sudo systemctl reload nginx || sudo systemctl start nginx
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

log "Running deployment..."
# Delegate to the Compose-focused deployment script
"${APP_DIR}/scripts/deploy-prod.sh" || {
  # If deploy-prod.sh doesn't exist yet (first clone), run it from repo root
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  "${SCRIPT_DIR}/scripts/deploy-prod.sh"
}

log "Full deployment complete!"
