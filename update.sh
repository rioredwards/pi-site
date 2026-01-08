#!/bin/bash

# Script Vars
REPO_URL="git@github.com:rioredwards/pi-site.git"
APP_DIR=~/pi-site

# Pull the latest changes from the Git repository
if [ -d "$APP_DIR" ]; then
	echo "Pulling latest changes from the repository..."
	cd $APP_DIR
	git pull origin main
else
	echo "Cloning repository from $REPO_URL..."
	git clone $REPO_URL $APP_DIR
	cd $APP_DIR
fi

# Ensure .env file exists with DATABASE_URL
# Load existing values if .env exists, otherwise use defaults from deploy.sh
if [ -f "$APP_DIR/.env" ]; then
	# Load existing values from .env (preserve existing password)
	source "$APP_DIR/.env"
	# Use existing values or defaults (don't overwrite password if it exists)
	POSTGRES_USER=${POSTGRES_USER:-"myuser"}
	POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-$(openssl rand -base64 12)}
	POSTGRES_DB=${POSTGRES_DB:-"mydatabase"}
else
	# Use defaults (matching deploy.sh) - only generate new password if .env doesn't exist
	POSTGRES_USER="myuser"
	POSTGRES_PASSWORD=$(openssl rand -base64 12)
	POSTGRES_DB="mydatabase"
fi

# Construct DATABASE_URL for Docker internal communication
DATABASE_URL="postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@db:5432/$POSTGRES_DB"
DATABASE_URL_EXTERNAL="postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:5432/$POSTGRES_DB"

# Create or update .env file
echo "POSTGRES_USER=$POSTGRES_USER" >"$APP_DIR/.env"
echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD" >>"$APP_DIR/.env"
echo "POSTGRES_DB=$POSTGRES_DB" >>"$APP_DIR/.env"
echo "DATABASE_URL=$DATABASE_URL" >>"$APP_DIR/.env"
echo "DATABASE_URL_EXTERNAL=$DATABASE_URL_EXTERNAL" >>"$APP_DIR/.env"

# Build and restart the Docker containers from the app directory (~/pi-site)
echo "Rebuilding and restarting Docker containers..."
# Determine which docker-compose command to use (plugin or standalone)
if docker compose version &>/dev/null; then
	DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &>/dev/null; then
	DOCKER_COMPOSE_CMD="docker-compose"
else
	echo "Docker Compose not found. Exiting."
	exit 1
fi

sudo $DOCKER_COMPOSE_CMD down
sudo $DOCKER_COMPOSE_CMD up --build -d

# Check if Docker Compose started correctly
if ! sudo $DOCKER_COMPOSE_CMD ps | grep "Up"; then
	echo "Docker containers failed to start. Check logs with '$DOCKER_COMPOSE_CMD logs'."
	exit 1
fi

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 5

# Run database migrations
echo "Running database migrations..."
if sudo docker exec pi-site-web-1 bun run db:migrate 2>/dev/null; then
	echo "✓ Migrations completed successfully"
else
	echo "⚠️  Migration failed or already up to date. This is normal if migrations were already applied."
fi

# Output final message
echo "Update complete. Your Next.js app has been deployed with the latest changes."
