#!/bin/bash
# One-command deployment: Build, transfer, and restart on Raspberry Pi
# Usage: ./scripts/deploy.sh [OPTIONS]
#
# This script:
# 1. Builds the Docker image on your dev machine (unless --skip-build)
# 2. Transfers it to your Raspberry Pi (via SSH or thumbdrive)
# 3. Restarts the container on the Pi (SSH only)
# 4. Optionally runs database migrations if needed (SSH only)
# 5. Cleans up old images automatically
#
# Options:
#   --skip-build           Skip build/transfer, only run deployment steps (migrations, etc.)
#   --use-cache            Use Docker build cache (faster for iterative changes)
#   --test-local           Test migrations locally before deploying (requires SSH if deploying)
#   --thumbdrive [PATH]    Use thumbdrive for transfer instead of SSH
#
# Examples:
#   ./scripts/deploy.sh                    # Full deployment (no cache)
#   ./scripts/deploy.sh --use-cache         # Faster build using cache
#   ./scripts/deploy.sh --skip-build        # Skip build, just deploy (if build already done)
#   ./scripts/deploy.sh --test-local        # Test locally, then deploy (requires SSH)
#   ./scripts/deploy.sh --test-local --skip-build  # Test locally only (no SSH needed)
#
# Prerequisites:
# - Docker buildx enabled
# - For SSH: SSH access to Raspberry Pi configured
# - For thumbdrive: Thumbdrive mounted and accessible

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_SCRIPT="${SCRIPT_DIR}/build-and-transfer.sh"
PI_HOST="raspberrypi"  # Update this if your Pi hostname is different
PI_PATH="\$HOME/pi-site"  # Path on Pi (using $HOME to expand correctly in SSH)
IMAGE_NAME="pi-site"    # Docker image name

USE_THUMBDRIVE=false
THUMBDRIVE_PATH=""
SKIP_BUILD=false
USE_CACHE=false
TEST_LOCAL=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --use-cache)
            USE_CACHE=true
            shift
            ;;
        --test-local)
            TEST_LOCAL=true
            shift
            ;;
        --thumbdrive)
            USE_THUMBDRIVE=true
            if [ -n "$2" ] && [[ ! "$2" =~ ^-- ]]; then
                THUMBDRIVE_PATH="$2"
                shift 2
            else
                shift
            fi
            ;;
        *)
            echo "❌ Unknown option: $1"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --skip-build           Skip build/transfer, only run deployment steps"
            echo "  --use-cache            Use Docker build cache (faster for iterative changes)"
            echo "  --test-local           Test migrations locally before deploying"
            echo "  --thumbdrive [PATH]    Use thumbdrive for transfer instead of SSH"
            echo ""
            echo "Examples:"
            echo "  $0                      # Full deployment"
            echo "  $0 --use-cache          # Faster build using cache"
            echo "  $0 --skip-build         # Skip build, just deploy"
            exit 1
            ;;
    esac
done

echo "🚀 Starting deployment..."
if [ "$SKIP_BUILD" = true ]; then
    echo "⏭️  Build/transfer skipped (using existing image on Pi)"
fi
if [ "$USE_CACHE" = true ]; then
    echo "⚡ Using Docker build cache (faster builds)"
fi
if [ "$TEST_LOCAL" = true ]; then
    echo "🧪 Local testing enabled"
fi
echo ""

# Pre-flight checks
echo "🔍 Pre-flight checks..."
if [ "$SKIP_BUILD" = false ]; then
    if ! docker buildx version &> /dev/null; then
        echo "❌ Error: docker buildx is not available."
        echo "   On Docker Desktop, buildx should be available by default."
        exit 1
    fi
fi

# Only check SSH if we actually need it (not just testing locally, and not using thumbdrive)
if [ "$TEST_LOCAL" = false ] && [ "$USE_THUMBDRIVE" != true ]; then
    if ! ssh -o ConnectTimeout=5 ${PI_HOST} "echo 'SSH connection test'" &>/dev/null; then
        echo "❌ Error: Cannot connect to ${PI_HOST} via SSH"
        echo "   Please verify SSH access: ssh ${PI_HOST}"
        exit 1
    fi
fi
echo "✅ Pre-flight checks passed"
echo ""

# Test migrations locally if requested
if [ "$TEST_LOCAL" = true ] && [ "$SKIP_BUILD" = false ]; then
    echo "🧪 Step 0: Validating migration setup locally..."
    SCRIPT_DIR_ABS="$(cd "${SCRIPT_DIR}/.." && pwd)"
    
    # Check if required files exist
    echo "   Checking required files..."
    VALID=true
    if [ ! -f "${SCRIPT_DIR_ABS}/prisma.config.ts" ]; then
        echo "   ❌ prisma.config.ts not found"
        VALID=false
    else
        echo "   ✅ prisma.config.ts exists"
    fi
    
    if [ ! -d "${SCRIPT_DIR_ABS}/prisma/migrations" ]; then
        echo "   ⚠️  No migrations directory found (migrations may not exist yet)"
    else
        MIGRATION_COUNT=$(find "${SCRIPT_DIR_ABS}/prisma/migrations" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l | tr -d ' ')
        if [ "$MIGRATION_COUNT" -gt 0 ]; then
            echo "   ✅ Found ${MIGRATION_COUNT} migration(s)"
        else
            echo "   ⚠️  Migrations directory is empty"
        fi
    fi
    
    if [ "$VALID" = false ]; then
        echo "   ❌ Validation failed - fix issues before deploying"
        exit 1
    fi
    echo ""
fi

# If only testing locally (no actual deployment), exit after test
# Exit if: test-local is true AND no deployment flags are set (no use-cache, no skip-build means build, etc.)
if [ "$TEST_LOCAL" = true ]; then
    # If skip-build is set, we're just testing (no deployment)
    if [ "$SKIP_BUILD" = true ]; then
        echo "✅ Local validation complete!"
        echo "   Run without --skip-build to deploy after validation"
        exit 0
    fi
    # If test-local is the ONLY flag (no use-cache, no other deployment intent), just test and exit
    if [ "$USE_CACHE" = false ] && [ "$USE_THUMBDRIVE" = false ]; then
        echo "✅ Local validation complete!"
        echo ""
        echo "💡 To deploy after validation, add deployment flags:"
        echo "   ./scripts/deploy.sh --test-local --use-cache    # Test, then deploy with cache"
        echo "   ./scripts/deploy.sh --test-local --skip-build   # Test, then deploy (skip build)"
        exit 0
    fi
    # If test-local is combined with deployment flags, validate then proceed
    echo "✅ Local validation passed! Proceeding with deployment..."
    echo ""
fi

# Step 1: Build and transfer (skip if flag set)
if [ "$SKIP_BUILD" = false ]; then
    # Check SSH now if we need it for deployment (we skipped it earlier for test-local)
    if [ "$TEST_LOCAL" = true ] && [ "$USE_THUMBDRIVE" != true ]; then
        echo "🔍 Checking SSH connection (required for deployment)..."
        if ! ssh -o ConnectTimeout=5 ${PI_HOST} "echo 'SSH connection test'" &>/dev/null; then
            echo "❌ Error: Cannot connect to ${PI_HOST} via SSH"
            echo "   Please verify SSH access: ssh ${PI_HOST}"
            echo "   (Local validation passed, but deployment requires SSH)"
            exit 1
        fi
        echo "✅ SSH connection verified"
    fi
    
    echo "📦 Step 1: Building and transferring image..."
    BUILD_ARGS="--restart"
    if [ "$USE_CACHE" = true ]; then
        BUILD_ARGS="$BUILD_ARGS --use-cache"
    fi
    
    if [ "$USE_THUMBDRIVE" = true ]; then
        if [ -n "$THUMBDRIVE_PATH" ]; then
            if ! bash "${BUILD_SCRIPT}" --thumbdrive "${THUMBDRIVE_PATH}" ${BUILD_ARGS}; then
                echo ""
                echo "❌ Deployment failed during build/transfer phase"
                exit 1
            fi
        else
            if ! bash "${BUILD_SCRIPT}" --thumbdrive ${BUILD_ARGS}; then
                echo ""
                echo "❌ Deployment failed during build/transfer phase"
                exit 1
            fi
        fi
        echo ""
        echo "⚠️  Thumbdrive mode: Manual steps required on Pi"
        echo "   Follow the instructions above to load the image on your Raspberry Pi"
        echo "   Or use: ssh ${PI_HOST} 'cd ${PI_PATH} && bash scripts/load-from-thumbdrive.sh'"
        exit 0
    else
        if ! bash "${BUILD_SCRIPT}" ${BUILD_ARGS}; then
            echo ""
            echo "❌ Deployment failed during build/transfer phase"
            exit 1
        fi
    fi
else
    echo "⏭️  Step 1: Skipping build/transfer (using existing image on Pi)..."
    # Check SSH if we need it (we might have skipped it earlier)
    if [ "$TEST_LOCAL" = true ] && [ "$USE_THUMBDRIVE" != true ]; then
        echo "🔍 Checking SSH connection (required for deployment)..."
        if ! ssh -o ConnectTimeout=5 ${PI_HOST} "echo 'SSH connection test'" &>/dev/null; then
            echo "❌ Error: Cannot connect to ${PI_HOST} via SSH"
            echo "   Please verify SSH access: ssh ${PI_HOST}"
            exit 1
        fi
        echo "✅ SSH connection verified"
    fi
    # Don't start container here - let the normal flow handle it after syncing files
fi

# Step 1.5: Stop old container before syncing/restarting (prevents port conflicts)
# Do this BEFORE syncing files so we can restart cleanly
echo ""
echo "🛑 Stopping old container (if running)..."
ssh ${PI_HOST} "cd ${PI_PATH} && docker compose down 2>/dev/null || true" || true

# Step 1.6: Sync docker-compose.yml and scripts to ensure they match
echo ""
echo "📋 Syncing docker-compose.yml and scripts..."
SCRIPT_DIR_ABS="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Get the actual expanded path from Pi (handles $HOME expansion properly)
PI_PATH_EXPANDED=$(ssh ${PI_HOST} "echo ${PI_PATH}" 2>/dev/null)
if [ -z "$PI_PATH_EXPANDED" ]; then
    # Fallback if SSH expansion fails
    PI_PATH_EXPANDED="~/pi-site"
fi

# Ensure directory and subdirectories exist on Pi
ssh ${PI_HOST} "mkdir -p ${PI_PATH_EXPANDED}/scripts" || true

# Sync docker-compose.yml using SSH pipe (more reliable than scp with $HOME)
if cat "${SCRIPT_DIR_ABS}/docker-compose.yml" | ssh ${PI_HOST} "cat > ${PI_PATH_EXPANDED}/docker-compose.yml" 2>/dev/null; then
    echo "✅ docker-compose.yml synced"
else
    echo "⚠️  Failed to sync docker-compose.yml - you may need to update it manually"
    echo "   Manual command: scp docker-compose.yml ${PI_HOST}:${PI_PATH_EXPANDED}/"
fi

# Sync scripts directory using tar over SSH (more reliable than rsync with $HOME)
if (cd "${SCRIPT_DIR_ABS}" && tar czf - scripts/ 2>/dev/null) | ssh ${PI_HOST} "cd ${PI_PATH_EXPANDED} && tar xzf - 2>/dev/null && chmod +x scripts/*.sh 2>/dev/null || true" 2>/dev/null; then
    echo "✅ Scripts synced"
else
    echo "⚠️  Failed to sync scripts - trying rsync fallback..."
    # Fallback to rsync
    if rsync -av --delete "${SCRIPT_DIR_ABS}/scripts/" ${PI_HOST}:${PI_PATH_EXPANDED}/scripts/ 2>/dev/null; then
        echo "✅ Scripts synced (via rsync)"
        ssh ${PI_HOST} "cd ${PI_PATH_EXPANDED} && chmod +x scripts/*.sh 2>/dev/null || true" || true
    else
        echo "⚠️  Failed to sync scripts - you may need to update them manually"
        echo "   Manual command: rsync -av scripts/ ${PI_HOST}:${PI_PATH_EXPANDED}/scripts/"
    fi
fi

# Step 1.7: Start/restart container after syncing files
# This applies to both normal builds (container already started by build script) 
# and skip-build (need to start it now)
echo ""
echo "🔄 Starting/restarting container with synced configuration..."
ssh ${PI_HOST} "cd ${PI_PATH} && docker compose up -d" || true

echo ""
echo "⏳ Waiting for container to be ready..."
# Wait for container to start and be healthy
for i in {1..10}; do
    if ssh ${PI_HOST} "cd ${PI_PATH} && docker compose ps | grep -q 'Up'"; then
        echo "✅ Container is running"
        sleep 2  # Give it a moment to fully initialize
        break
    fi
    if [ $i -eq 10 ]; then
        echo "⚠️  Container did not start within expected time"
    else
        sleep 1
    fi
done

# Step 2: Check if migrations are needed
echo ""
echo "🔍 Step 2: Checking database status..."
# Use HOME=/app to fix npm permission issues
# Check if container is actually running before trying to exec
if ssh ${PI_HOST} "cd ${PI_PATH} && docker compose ps | grep -q 'Up'"; then
    if ssh ${PI_HOST} "cd ${PI_PATH} && docker compose exec -T -e HOME=/app app npx prisma migrate status 2>/dev/null | grep -q 'Database schema is up to date'"; then
        echo "✅ Database is up to date"
    else
        echo "📊 Database migrations needed - running migrations..."
        if ssh ${PI_HOST} "cd ${PI_PATH} && docker compose exec -T -e HOME=/app app npx prisma migrate deploy"; then
            echo "✅ Migrations completed"
        else
            echo "⚠️  Migration failed - you may need to run manually:"
            echo "   ssh ${PI_HOST} 'cd ${PI_PATH} && docker compose exec -e HOME=/app app npx prisma migrate deploy'"
        fi
    fi
else
    echo "⚠️  Container is not running - skipping migration check"
    echo "   Start the container first: ssh ${PI_HOST} 'cd ${PI_PATH} && docker compose up -d'"
fi

# Step 3: Verify deployment
echo ""
echo "🔍 Step 3: Verifying deployment..."
if ssh ${PI_HOST} "cd ${PI_PATH} && docker compose ps | grep -q 'Up'"; then
    echo "✅ Container is running"
    
    # Check health (if healthcheck is configured)
    sleep 2
    if ssh ${PI_HOST} "cd ${PI_PATH} && docker compose ps | grep -q 'healthy'"; then
        echo "✅ Container is healthy"
    else
        echo "⚠️  Container is running but not yet healthy (this is normal during startup)"
    fi
else
    echo "⚠️  Container status unclear - check logs:"
    echo "   ssh ${PI_HOST} 'cd ${PI_PATH} && docker compose logs'"
fi

# Step 4: Cleanup old images on Pi (robust cleanup that works on all systems)
echo ""
echo "🧹 Step 4: Cleaning up old images on Pi..."
echo "   Removing dangling images and old tagged images (keeping current and one backup)..."
ssh ${PI_HOST} "cd ${PI_PATH} && \
    docker image prune -f --filter 'dangling=true' 2>/dev/null || true && \
    (docker images ${IMAGE_NAME} --format '{{.Tag}}' 2>/dev/null | grep -v 'latest' | tail -n +3 | while read tag; do \
        docker rmi ${IMAGE_NAME}:\${tag} 2>/dev/null || true; \
    done || true)" || echo "⚠️  Image cleanup on Pi had some issues (this is usually okay)"

# Cleanup old networks and volumes (prevent accumulation)
echo "   Cleaning up unused networks and volumes..."
ssh ${PI_HOST} "docker network prune -f 2>/dev/null || true; docker volume prune -f 2>/dev/null || true" || true

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "View logs: ssh ${PI_HOST} 'cd ${PI_PATH} && docker compose logs -f'"
echo "Stop:     ssh ${PI_HOST} 'cd ${PI_PATH} && docker compose down'"
