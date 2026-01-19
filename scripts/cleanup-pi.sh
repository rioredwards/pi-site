#!/bin/bash

# Complete cleanup script for Docker, PostgreSQL, and Nginx on Raspberry Pi
# This will remove ALL traces of previous deployments

set -e # Exit on error

# Helper function to ask for confirmation
confirm_step() {
	local step_description=$1
	echo ""
	read -p "$step_description Continue? (yes/no): " confirm
	if [ "$confirm" != "yes" ]; then
		echo "Step cancelled. Exiting."
		exit 0
	fi
}

echo "========================================="
echo "Complete Cleanup Script for Pi"
echo "========================================="
echo ""
echo "WARNING: This will remove:"
echo "  - All Docker containers"
echo "  - All Docker images"
echo "  - All Docker volumes (including database data)"
echo "  - All Docker networks"
echo "  - Nginx configuration files"
echo ""
echo "You will be asked to confirm each step."

confirm_step "Step 1: Stop all running containers..."
sudo docker stop $(sudo docker ps -aq) 2>/dev/null || echo "No containers to stop"

confirm_step "Step 2: Remove all containers..."
sudo docker rm $(sudo docker ps -aq) 2>/dev/null || echo "No containers to remove"

confirm_step "Step 3: Remove all Docker images..."
sudo docker rmi $(sudo docker images -q) 2>/dev/null || echo "No images to remove"

confirm_step "Step 4: Remove all Docker volumes (including postgres_data - THIS DELETES DATABASE DATA)..."
sudo docker volume rm $(sudo docker volume ls -q) 2>/dev/null || echo "No volumes to remove"

confirm_step "Step 5: Remove all Docker networks..."
sudo docker network rm $(sudo docker network ls -q) 2>/dev/null || echo "No networks to remove"

confirm_step "Step 6: Prune Docker system (removes all unused data)..."
sudo docker system prune -a --volumes -f

confirm_step "Step 7: Stop Nginx..."
sudo systemctl stop nginx 2>/dev/null || echo "Nginx not running"

confirm_step "Step 8: Remove Nginx configuration files..."
sudo rm -f /etc/nginx/sites-available/pi-site
sudo rm -f /etc/nginx/sites-enabled/pi-site

# Remove rate limiting zone from nginx.conf if it exists
if grep -q "limit_req_zone.*zone=mylimit" /etc/nginx/nginx.conf 2>/dev/null; then
	echo "Removing rate limiting zone from nginx.conf..."
	sudo sed -i '/limit_req_zone.*zone=mylimit/d' /etc/nginx/nginx.conf
fi

echo ""
echo "Step 9: Verifying cleanup..."
echo "Containers: $(sudo docker ps -aq | wc -l)"
echo "Images: $(sudo docker images -q | wc -l)"
echo "Volumes: $(sudo docker volume ls -q | wc -l)"
echo "Networks: $(sudo docker network ls -q | wc -l)"

echo ""
echo "========================================="
echo "Cleanup complete!"
echo "========================================="
echo ""
echo "All Docker containers, images, volumes, and networks have been removed."
echo "Nginx configuration files have been removed."
echo ""
echo "You can now run deploy.sh for a fresh deployment."
