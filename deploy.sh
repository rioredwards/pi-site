#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

# -------------------------
# pi-site deploy script (Raspberry Pi) — rsync-first mode
#
# Philosophy:
# - This script NEVER generates or stores secrets.
# - You must sync an env file to the Pi BEFORE running it.
#   e.g. from your dev-machine:
#     rsync -avz --chmod=600 ./secrets/pi-site.env.prod pi@raspberrypi:~/pi-site/.env
#
# What this script does:
# - Installs/updates system deps (docker, nginx, cloudflared)
# - Pulls latest repo changes
# - Validates required env keys exist in ~/pi-site/.env
# - Starts services via docker compose using --env-file
# -------------------------

trap 'echo "ERROR: deploy failed on line $LINENO" >&2' ERR

log() { printf "\n▶ %s\n" "$*"; }
warn() { printf "\n⚠ %s\n" "$*" >&2; }
die() { printf "\nERROR: %s\n" "$*" >&2; exit 1; }

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1";
}

# -------------------------
# Config (edit if needed)
# -------------------------
REPO_URL="git@github.com:rioredwards/pi-site.git"
APP_DIR="${HOME}/pi-site"
BRANCH="main"

SWAP_SIZE="1G"   # only created if /swapfile missing
PI_ARCH="arm64"
DOCKER_ARCH="$PI_ARCH"
CLOUDFLARED_ARCH="$PI_ARCH"

SITE_NAME="pi-site"
ENV_FILE="$APP_DIR/.env.prod"           # synced from your dev-machine
ENV_EXAMPLE_FILE="$APP_DIR/.env.example" # optional: you can keep in repo

# -------------------------
# Helpers
# -------------------------
apt_update_upgrade() {
  log "Updating packages (apt update/upgrade)..."
  sudo apt-get update -y
  sudo apt-get upgrade -y
}

ensure_swap() {
  if [[ -f /swapfile ]]; then
    log "Swap file already exists, skipping..."
    return
  fi

  log "Adding swap space (${SWAP_SIZE})..."
  sudo fallocate -l "$SWAP_SIZE" /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile

  if ! grep -qE '^/swapfile\s+' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
  fi
}

install_docker_if_needed() {
  if command -v docker >/dev/null 2>&1; then
    log "Docker already installed."
    return
  fi

  log "Installing Docker..."
  sudo apt-get install -y ca-certificates curl gnupg lsb-release

  local os_id os_codename
  if [[ -f /etc/debian_version ]]; then
    os_id="debian"
  else
    os_id="ubuntu"
  fi
  os_codename="$(lsb_release -cs)"

  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL "https://download.docker.com/linux/${os_id}/gpg" | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg

  echo "deb [arch=${DOCKER_ARCH} signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/${os_id} ${os_codename} stable" \
    | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null

  sudo apt-get update -y
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
}

configure_docker_daemon_ipv4() {
  # Optional: your original script forced IPv4 DNS. Keep if you truly need it.
  log "Configuring Docker daemon (IPv6 off, DNS set)..."
  sudo mkdir -p /etc/docker
  echo '{"ipv6": false, "fixed-cidr-v6": "", "dns": ["8.8.8.8", "8.8.4.4"]}' \
    | sudo tee /etc/docker/daemon.json >/dev/null

  if ! grep -q "precedence ::ffff:0:0/96" /etc/gai.conf 2>/dev/null; then
    echo "precedence ::ffff:0:0/96  100" | sudo tee -a /etc/gai.conf >/dev/null
  fi
}

ensure_docker_running() {
  log "Ensuring Docker is enabled and running..."
  sudo systemctl enable docker
  sudo systemctl start docker
}

# Decide once whether docker needs sudo on this machine.
setup_docker_prefix() {
  DOCKER_PREFIX=(docker)
  if ! docker info >/dev/null 2>&1; then
    DOCKER_PREFIX=(sudo env "PATH=$PATH" docker)
  fi
}

setup_compose_cmd() {
  COMPOSE_CMD=()

  if "${DOCKER_PREFIX[@]}" compose version >/dev/null 2>&1; then
    COMPOSE_CMD=("${DOCKER_PREFIX[@]}" compose)
    return
  fi

  if command -v docker-compose >/dev/null 2>&1; then
    if [[ "${DOCKER_PREFIX[*]}" == docker ]]; then
      COMPOSE_CMD=(docker-compose)
    else
      COMPOSE_CMD=(sudo env "PATH=$PATH" docker-compose)
    fi
    return
  fi

  die "Docker Compose not found (tried 'docker compose' and 'docker-compose')."
}

clone_or_update_repo() {
  if [[ -d "$APP_DIR/.git" ]]; then
    log "Updating repo in $APP_DIR..."
    git -C "$APP_DIR" fetch origin "$BRANCH"
    git -C "$APP_DIR" merge --ff-only "origin/$BRANCH"
    return
  fi

  if [[ -e "$APP_DIR" ]]; then
    die "$APP_DIR exists but is not a git repo (missing .git). Refusing to continue."
  fi

  log "Cloning repository from $REPO_URL..."
  git clone --branch "$BRANCH" --single-branch "$REPO_URL" "$APP_DIR"
}

ensure_env_file_present() {
  if [[ -f "$ENV_FILE" ]]; then
    # minimal permission sanity check
    local perms
    perms="$(stat -c "%a" "$ENV_FILE" 2>/dev/null || true)"
    if [[ -n "$perms" && "$perms" != "600" ]]; then
      warn "$ENV_FILE permissions are $perms (recommended: 600)."
    fi
    return
  fi

  warn "Missing env file: $ENV_FILE"
  if [[ -f "$ENV_EXAMPLE_FILE" ]]; then
    warn "A template exists at $ENV_EXAMPLE_FILE. Copy it on your dev-machine, fill it, and rsync it to the Pi."
  fi

  cat <<'EOM' >&2

Sync your production env file from your dev-machine before deploying, e.g.:

  rsync -avz --chmod=600 ./secrets/pi-site.env.prod pi@raspberrypi:~/pi-site/.env

Then re-run:

  ./deploy.sh
EOM

  exit 1
}

get_env_value() {
  # Reads KEY=value lines (no eval). Returns empty string if missing.
  local key="$1"
  local file="$2"
  local line

  line="$(grep -E "^${key}=" "$file" 2>/dev/null | tail -n 1 || true)"
  printf "%s" "${line#${key}=}"
}

require_env_key() {
  local key="$1"
  local v
  v="$(get_env_value "$key" "$ENV_FILE")"
  [[ -n "$v" ]] || die "Missing required env var '${key}' in $ENV_FILE"
}

validate_env() {
  # Required for Compose/db/app correctness
  require_env_key POSTGRES_USER
  require_env_key POSTGRES_PASSWORD
  require_env_key POSTGRES_DB
  require_env_key DATABASE_URL
	require_env_key AUTH_SECRET
	require_env_key NEXTAUTH_URL

  # Required because you're baking NEXT_PUBLIC_* during docker build
  require_env_key NEXT_PUBLIC_SAFE_KEY
}

install_nginx_if_needed() {
  if command -v nginx >/dev/null 2>&1; then
    log "Nginx already installed."
    return
  fi
  log "Installing Nginx..."
  sudo apt-get install -y nginx
}

configure_nginx() {
  log "Configuring Nginx..."
  sudo systemctl stop nginx || true

  # Rate limit zone in dedicated file (http context)
  sudo install -m 0644 /dev/null "/etc/nginx/conf.d/${SITE_NAME}-rate-limit.conf"
  echo 'limit_req_zone $binary_remote_addr zone=mylimit:10m rate=30r/s;' \
    | sudo tee "/etc/nginx/conf.d/${SITE_NAME}-rate-limit.conf" >/dev/null

  # Site config
  sudo tee "/etc/nginx/sites-available/${SITE_NAME}" >/dev/null <<'EOL'
server {
    listen 80;
    server_name localhost;

    location /images/ {
        alias /var/lib/docker/volumes/pi-site_uploads_data/_data/;

        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options "nosniff" always;
        add_header Access-Control-Allow-Origin "*";

        access_log off;

        sendfile on;
        tcp_nopush on;
        tcp_nodelay on;

        try_files $uri =404;
    }

    location / {
        limit_req zone=mylimit burst=50 nodelay;

        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        proxy_buffering off;
        proxy_set_header X-Accel-Buffering no;
    }
}
EOL

  sudo ln -sf "/etc/nginx/sites-available/${SITE_NAME}" "/etc/nginx/sites-enabled/${SITE_NAME}"

  sudo nginx -t
  sudo systemctl start nginx
}

install_cloudflared_if_needed() {
  if command -v cloudflared >/dev/null 2>&1; then
    log "Cloudflared already installed."
    return
  fi

  log "Installing Cloudflare Tunnel (cloudflared)..."
  need_cmd curl
  need_cmd wget

  local version
  version="$(curl -fsSL https://api.github.com/repos/cloudflare/cloudflared/releases/latest \
    | grep -m1 '"tag_name"' \
    | cut -d '"' -f 4 \
    | sed 's/^v//')"

  [[ -n "$version" ]] || die "Failed to resolve latest cloudflared version"

  sudo wget -q -O /usr/local/bin/cloudflared \
    "https://github.com/cloudflare/cloudflared/releases/download/v${version}/cloudflared-linux-${CLOUDFLARED_ARCH}"
  sudo chmod +x /usr/local/bin/cloudflared

  cloudflared --version >/dev/null
}

restart_docker() {
  log "Restarting Docker to apply configuration..."
  sudo systemctl daemon-reload || true
  sudo systemctl restart docker
  sleep 2
}

compose_up() {
  log "Building and starting Docker containers..."

  # Always run against the correct project dir and env file.
  "${COMPOSE_CMD[@]}" --project-directory "$APP_DIR" --env-file "$ENV_FILE" up -d --build

  if ! "${COMPOSE_CMD[@]}" --project-directory "$APP_DIR" ps | grep -q "Up"; then
    warn "Containers may not have started correctly. Showing last logs..."
    "${COMPOSE_CMD[@]}" --project-directory "$APP_DIR" logs --tail=200 || true
    die "Docker containers failed to start."
  fi
}

# -------------------------
# Main
# -------------------------
need_cmd git
need_cmd sudo

apt_update_upgrade
ensure_swap
install_docker_if_needed
configure_docker_daemon_ipv4
ensure_docker_running

setup_docker_prefix
setup_compose_cmd

clone_or_update_repo
ensure_env_file_present
validate_env

install_nginx_if_needed
configure_nginx

install_cloudflared_if_needed
restart_docker
compose_up

log "Deployment complete."
cat <<'EOM'

Next steps (Cloudflare Tunnel):
1) Authenticate:
   cloudflared tunnel login

2) Create a tunnel:
   cloudflared tunnel create pi-site

3) Route a hostname to localhost:80:
   cloudflared tunnel route dns pi-site your-domain.com

4) Run the tunnel:
   cloudflared tunnel run pi-site

Notes:
- Nginx is listening on port 80 internally.
- Cloudflare Tunnel should terminate TLS and route to http://localhost:80.
- Env file is required at: ~/pi-site/.env (sync it from your dev-machine).
EOM
