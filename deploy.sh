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
#     rsync -avz .env.prod pi:~/pi-site/.env.prod
#
# What this script does:
# - Installs/updates system deps (docker, nginx, cloudflared)
# - Pulls latest repo changes
# - Validates required env keys exist in ~/pi-site/.env.prod
# - Starts services via docker compose using --env-file
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
APP_DIR="${HOME}/pi-site"
BRANCH="main"

SITE_NAME="pi-site"
ENV_FILE="$APP_DIR/.env.prod"
ENV_EXAMPLE_FILE="$APP_DIR/.env.example"

PI_ARCH="arm64"
DOCKER_ARCH="$PI_ARCH"
CLOUDFLARED_ARCH="$PI_ARCH"

# -------------------------
# Repo
# -------------------------
clone_or_update_repo() {
  if [[ -d "$APP_DIR/.git" ]]; then
    log "Updating repo..."
    git -C "$APP_DIR" fetch origin "$BRANCH"
    git -C "$APP_DIR" merge --ff-only "origin/$BRANCH"
    return
  fi

  log "Cloning repo..."
  git clone --branch "$BRANCH" --single-branch "$REPO_URL" "$APP_DIR"
}

# -------------------------
# Env validation
# -------------------------
ensure_env_file_present() {
  [[ -f "$ENV_FILE" ]] && return

  warn "Missing env file: $ENV_FILE"
  if [[ -f "$ENV_EXAMPLE_FILE" ]]; then
    warn "Template exists at $ENV_EXAMPLE_FILE"
  fi

  cat <<'EOM' >&2

Sync your production env file from your dev-machine before deploying:

  rsync -avz .env.prod pi:~/pi-site/.env.prod

Then re-run:

  ./deploy.sh
EOM
  exit 1
}

get_env_value() {
  local key="$1"
  grep -E "^${key}=" "$ENV_FILE" | tail -n 1 | cut -d= -f2- || true
}

require_env_key() {
  local key="$1"
  [[ -n "$(get_env_value "$key")" ]] || die "Missing required env var '$key'"
}

validate_env() {
  # Core runtime
	# --- Database ---
	require_env_key POSTGRES_USER
	require_env_key POSTGRES_PASSWORD
	require_env_key POSTGRES_DB

	# Next.js runtime DB
	require_env_key DATABASE_URL

	# Drizzle CLI / Studio
	# require_env_key DATABASE_URL_EXTERNAL


	# --- Auth ---
	require_env_key NEXTAUTH_URL
	require_env_key AUTH_SECRET


	# --- OAuth ---
	require_env_key GITHUB_CLIENT_ID
	require_env_key GITHUB_CLIENT_SECRET

	require_env_key GOOGLE_CLIENT_ID
	require_env_key GOOGLE_CLIENT_SECRET


	# --- Image handling ---
	# server-to-server (Next -> validator)
	require_env_key PUBLIC_IMG_VALIDATOR_BASE_URL

	# server-only filesystem path
	require_env_key IMG_UPLOAD_DIR


	# --- Demo ---
	require_env_key SECRET_KEY
	require_env_key NEXT_PUBLIC_SAFE_KEY
}

# -------------------------
# Docker
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

setup_compose_cmd() {
  if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD=(docker compose)
  else
    die "docker compose not available"
  fi
}

compose_up() {
  log "Building and starting containers..."
  "${COMPOSE_CMD[@]}" \
    --project-directory "$APP_DIR" \
    --env-file "$ENV_FILE" \
    up -d --build
}

# -------------------------
# Nginx
# -------------------------
install_nginx_if_needed() {
  command -v nginx >/dev/null 2>&1 && return
  sudo apt-get install -y nginx
}

configure_nginx() {
  log "Configuring Nginx..."
  sudo systemctl stop nginx || true

  sudo tee "/etc/nginx/sites-available/${SITE_NAME}" >/dev/null <<'EOF'
server {
    listen 80;
    server_name _;

    # Serve user-uploaded images
    # DB src: /api/assets/images/{filename}
    location /api/assets/images/ {
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
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
EOF

  sudo ln -sf \
    "/etc/nginx/sites-available/${SITE_NAME}" \
    "/etc/nginx/sites-enabled/${SITE_NAME}"

  sudo nginx -t
  sudo systemctl start nginx
}

# -------------------------
# Main
# -------------------------
need_cmd git
need_cmd sudo

clone_or_update_repo
ensure_env_file_present
validate_env

install_docker_if_needed
ensure_docker_running
setup_compose_cmd

install_nginx_if_needed
configure_nginx

compose_up

log "Deployment complete."

cat <<'EOM'

Notes:
- Env file: ~/pi-site/.env.prod
- Image URLs: /api/assets/images/{filename}
- Filesystem storage: $IMG_UPLOAD_DIR (inside containers)
- Nginx serves images directly from the Docker volume

EOM
