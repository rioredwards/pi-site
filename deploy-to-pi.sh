#!/bin/bash

# Deployment script to commit, push, and deploy to Raspberry Pi
# Usage: ./deploy-to-pi.sh [commit-message]
#
# Set these environment variables or create a .env.deploy file:
#   PI_HOST=pi@your-pi-ip-or-hostname
#   PI_SSH_KEY=~/.ssh/id_rsa  (optional, if using key-based auth)

set -e # Exit on error

# Load environment variables from .env.deploy if it exists
if [ -f .env.deploy ]; then
	export $(cat .env.deploy | grep -v '^#' | xargs)
fi

# Configuration
PI_HOST=${PI_HOST:-"pi@raspberrypi.local"}
COMMIT_MSG=${1:-"Deploy: $(date +'%Y-%m-%d %H:%M:%S')"}
UPDATE_SCRIPT_URL="https://raw.githubusercontent.com/rioredwards/pi-site/main/update.sh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting deployment to Raspberry Pi...${NC}\n"

# Step 1: Check git status
echo -e "${YELLOW}📋 Checking git status...${NC}"
if [ -z "$(git status --porcelain)" ]; then
	echo -e "${YELLOW}⚠️  No changes to commit.${NC}"
	read -p "Continue with push and deploy anyway? (y/n) " -n 1 -r
	echo
	if [[ ! $REPLY =~ ^[Yy]$ ]]; then
		echo -e "${RED}❌ Deployment cancelled.${NC}"
		exit 1
	fi
else
	echo -e "${GREEN}✓ Found uncommitted changes${NC}"
fi

# Step 2: Add all changes
echo -e "\n${YELLOW}📦 Staging all changes...${NC}"
git add -A

# Step 3: Commit
echo -e "\n${YELLOW}💾 Committing changes...${NC}"
echo -e "Commit message: ${GREEN}$COMMIT_MSG${NC}"
if ! git commit -m "$COMMIT_MSG"; then
	echo -e "${RED}❌ Commit failed. Deployment cancelled.${NC}"
	exit 1
fi
echo -e "${GREEN}✓ Changes committed${NC}"

# Step 4: Push to GitHub
echo -e "\n${YELLOW}📤 Pushing to GitHub...${NC}"
if ! git push origin main; then
	echo -e "${RED}❌ Push failed. Deployment cancelled.${NC}"
	exit 1
fi
echo -e "${GREEN}✓ Pushed to GitHub${NC}"

# Step 5: SSH into Pi and run update script
echo -e "\n${YELLOW}🔌 Connecting to Raspberry Pi...${NC}"
echo -e "Host: ${GREEN}$PI_HOST${NC}"

# Download and execute the update script on the Pi
ssh -o StrictHostKeyChecking=no "$PI_HOST" <<EOF
    set -e
    echo "📥 Downloading update script..."
    curl -o /tmp/update.sh $UPDATE_SCRIPT_URL
    chmod +x /tmp/update.sh
    echo "🚀 Running update script..."
    /tmp/update.sh
    echo "🧹 Cleaning up..."
    rm -f /tmp/update.sh
EOF

if [ $? -eq 0 ]; then
	echo -e "\n${GREEN}✅ Deployment complete!${NC}"
	echo -e "Your changes have been deployed to: ${GREEN}$PI_HOST${NC}"
else
	echo -e "\n${RED}❌ Deployment failed on Raspberry Pi.${NC}"
	exit 1
fi
