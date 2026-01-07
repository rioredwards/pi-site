#!/bin/bash

# Health check script for pi-site services
# Checks all Docker containers and service endpoints

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track overall health
HEALTHY=true

# Determine which docker-compose command to use
if docker compose version &>/dev/null 2>&1; then
	DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &>/dev/null; then
	DOCKER_COMPOSE_CMD="docker-compose"
else
	echo -e "${RED}❌ Docker Compose not found${NC}"
	exit 1
fi

# Check if we need sudo
if [ "$EUID" -eq 0 ] || sudo -n true 2>/dev/null; then
	SUDO_CMD="sudo"
else
	SUDO_CMD=""
fi

echo -e "${BLUE}🏥 Running health check for pi-site services...${NC}\n"

# Function to check service
check_service() {
	local name=$1
	local status=$2

	if [ "$status" = "healthy" ] || [ "$status" = "running" ] || [ "$status" = "Up" ]; then
		echo -e "${GREEN}✓${NC} $name: ${GREEN}OK${NC}"
		return 0
	else
		echo -e "${RED}✗${NC} $name: ${RED}FAILED${NC} (Status: $status)"
		HEALTHY=false
		return 1
	fi
}

# Function to check HTTP endpoint
check_http() {
	local name=$1
	local url=$2
	local expected_code=${3:-200}

	if response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>/dev/null); then
		if [ "$response" = "$expected_code" ]; then
			echo -e "${GREEN}✓${NC} $name: ${GREEN}OK${NC} (HTTP $response)"
			return 0
		else
			echo -e "${RED}✗${NC} $name: ${RED}FAILED${NC} (HTTP $response, expected $expected_code)"
			HEALTHY=false
			return 1
		fi
	else
		echo -e "${RED}✗${NC} $name: ${RED}FAILED${NC} (Connection error)"
		HEALTHY=false
		return 1
	fi
}

# Function to check TCP port
check_tcp() {
	local name=$1
	local host=$2
	local port=$3

	if timeout 2 bash -c "echo >/dev/tcp/$host/$port" 2>/dev/null; then
		echo -e "${GREEN}✓${NC} $name: ${GREEN}OK${NC} (Port $port open)"
		return 0
	else
		echo -e "${RED}✗${NC} $name: ${RED}FAILED${NC} (Port $port not accessible)"
		HEALTHY=false
		return 1
	fi
}

# Function to check database connection
check_database() {
	local name=$1

	# Find the database container name
	DB_CONTAINER=$($SUDO_CMD docker ps --format '{{.Names}}' | grep -E "pi-site.*db|db.*pi-site" | head -1)

	if [ -z "$DB_CONTAINER" ]; then
		echo -e "${RED}✗${NC} $name: ${RED}FAILED${NC} (Database container not found)"
		HEALTHY=false
		return 1
	fi

	# Try to get DB credentials from .env file
	if [ -f .env ]; then
		# Source .env safely (handle errors)
		set +e
		source .env 2>/dev/null
		set -e
	fi

	# Use defaults if not set
	POSTGRES_USER=${POSTGRES_USER:-myuser}

	# Check if we can connect via docker exec
	if $SUDO_CMD docker exec "$DB_CONTAINER" pg_isready -U "$POSTGRES_USER" >/dev/null 2>&1; then
		echo -e "${GREEN}✓${NC} $name: ${GREEN}OK${NC} (Database ready)"
		return 0
	else
		echo -e "${RED}✗${NC} $name: ${RED}FAILED${NC} (Database not ready)"
		HEALTHY=false
		return 1
	fi
}

# 1. Check Docker Compose services status
echo -e "${YELLOW}📦 Checking Docker containers...${NC}"

# Get container status - try JSON format first, fallback to table format
if command -v jq &>/dev/null && $SUDO_CMD $DOCKER_COMPOSE_CMD ps --format json 2>/dev/null | jq -r '.Name + "|" + .State' 2>/dev/null | head -1 | grep -q "|"; then
	CONTAINERS=$($SUDO_CMD $DOCKER_COMPOSE_CMD ps --format json 2>/dev/null | jq -r '.Name + "|" + .State' 2>/dev/null)
else
	# Fallback: parse table format (skip header, get name and status)
	CONTAINERS=$($SUDO_CMD $DOCKER_COMPOSE_CMD ps 2>/dev/null | tail -n +2 | awk '{if (NF >= 2) print $1 "|" $NF}')
fi

if [ -z "$CONTAINERS" ]; then
	echo -e "${RED}✗${NC} No containers found. Are services running?"
	echo "  Run: $SUDO_CMD $DOCKER_COMPOSE_CMD up -d"
	HEALTHY=false
else
	while IFS='|' read -r name status; do
		# Skip header lines and empty lines
		[[ "$name" =~ ^NAME ]] && continue
		[ -z "$name" ] && continue

		check_service "Container: $name" "$status"
	done <<<"$CONTAINERS"
fi

echo ""

# 2. Check web service (Next.js)
echo -e "${YELLOW}🌐 Checking web service...${NC}"
if check_http "Web Service" "http://localhost:3000" "200"; then
	# Also check a specific endpoint if available
	check_http "Web Service (API)" "http://localhost:3000/api" "404" || true
	# 404 is OK for /api if it doesn't exist, we just want to verify it's responding
fi
echo ""

# 3. Check database service
echo -e "${YELLOW}🗄️  Checking database service...${NC}"
check_tcp "Database Port" "localhost" "5432"
check_database "Database Connection"
echo ""

# 4. Check AI Image Validator service (internal network)
echo -e "${YELLOW}🤖 Checking AI Image Validator service...${NC}"
# Find the validator and web container names
VALIDATOR_CONTAINER=$($SUDO_CMD docker ps --format '{{.Names}}' | grep -E "pi-site.*ai-img-validator|ai-img-validator.*pi-site" | head -1)
WEB_CONTAINER=$($SUDO_CMD docker ps --format '{{.Names}}' | grep -E "pi-site.*web|web.*pi-site" | head -1)

if [ -z "$VALIDATOR_CONTAINER" ]; then
	echo -e "${RED}✗${NC} AI Image Validator: ${RED}FAILED${NC} (Container not running)"
	HEALTHY=false
elif [ -z "$WEB_CONTAINER" ]; then
	# Can't check from web container, but validator is running
	echo -e "${YELLOW}⚠${NC}  AI Image Validator: ${YELLOW}WARNING${NC} (Container running, but can't verify endpoint - web container not available)"
else
	# Try to check from within the network
	if $SUDO_CMD docker exec "$WEB_CONTAINER" curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://ai-img-validator:8000/health 2>/dev/null | grep -q "200\|404"; then
		echo -e "${GREEN}✓${NC} AI Image Validator: ${GREEN}OK${NC} (Responding on internal network)"
	elif $SUDO_CMD docker exec "$WEB_CONTAINER" curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://ai-img-validator:8000/docs 2>/dev/null | grep -q "200"; then
		echo -e "${GREEN}✓${NC} AI Image Validator: ${GREEN}OK${NC} (Responding on internal network)"
	else
		echo -e "${YELLOW}⚠${NC}  AI Image Validator: ${YELLOW}WARNING${NC} (Container running but endpoint check failed)"
	fi
fi
echo ""

# 5. Check cron service
echo -e "${YELLOW}⏰ Checking cron service...${NC}"
CRON_CONTAINER=$($SUDO_CMD docker ps --format '{{.Names}}' | grep -E "pi-site.*cron|cron.*pi-site" | head -1)
if [ -n "$CRON_CONTAINER" ]; then
	check_service "Cron Container" "running"
else
	echo -e "${RED}✗${NC} Cron: ${RED}FAILED${NC} (Container not running)"
	HEALTHY=false
fi
echo ""

# 6. Check Docker network
echo -e "${YELLOW}🔗 Checking Docker network...${NC}"
if $SUDO_CMD docker network ls | grep -q "my_network"; then
	echo -e "${GREEN}✓${NC} Network 'my_network': ${GREEN}OK${NC}"
else
	echo -e "${RED}✗${NC} Network 'my_network': ${RED}FAILED${NC} (Not found)"
	HEALTHY=false
fi
echo ""

# 7. Check Docker volumes
echo -e "${YELLOW}💾 Checking Docker volumes...${NC}"
if $SUDO_CMD docker volume ls | grep -q "pi-site_postgres_data"; then
	echo -e "${GREEN}✓${NC} Volume 'postgres_data': ${GREEN}OK${NC}"
else
	echo -e "${YELLOW}⚠${NC}  Volume 'postgres_data': ${YELLOW}WARNING${NC} (Not found, may be normal if not initialized)"
fi
echo ""

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [ "$HEALTHY" = true ]; then
	echo -e "${GREEN}✅ All services are healthy!${NC}"
	exit 0
else
	echo -e "${RED}❌ Some services are not healthy. Check the details above.${NC}"
	echo ""
	echo -e "${YELLOW}💡 Troubleshooting tips:${NC}"
	echo "  - Check logs: $SUDO_CMD $DOCKER_COMPOSE_CMD logs [service-name]"
	echo "  - Restart services: $SUDO_CMD $DOCKER_COMPOSE_CMD restart"
	echo "  - View all containers: $SUDO_CMD $DOCKER_COMPOSE_CMD ps"
	exit 1
fi
