#!/bin/bash
# Build Docker image for ARM64 on your dev machine and transfer to Raspberry Pi
# Usage: ./scripts/build-and-transfer.sh [OPTIONS]
#
# Options:
#   --restart              Automatically restart the container on Pi after transfer
#   --use-cache            Use Docker build cache (faster for iterative changes)
#   --thumbdrive [PATH]    Use thumbdrive for transfer instead of SSH
#                          If PATH is not provided, will try to detect or use /Volumes/pi-site
#
# Prerequisites:
# - Docker buildx enabled (usually comes with Docker Desktop)
# - For SSH: SSH access to your Raspberry Pi configured
# - For thumbdrive: Thumbdrive mounted and accessible

set -e

IMAGE_NAME="pi-site"
PI_HOST="raspberrypi"  # Update this if your Pi hostname is different
PI_PATH="~/pi-site"    # Path on Pi where the project lives

# Determine image tag (use git commit hash if available, otherwise timestamp)
if git rev-parse --git-dir > /dev/null 2>&1; then
    IMAGE_TAG=$(git rev-parse --short HEAD)
    echo "📝 Using git commit hash as image tag: ${IMAGE_TAG}"
else
    IMAGE_TAG=$(date +%Y%m%d-%H%M%S)
    echo "📝 Using timestamp as image tag: ${IMAGE_TAG}"
fi

TAR_FILE="${IMAGE_NAME}-${IMAGE_TAG}.tar"
TAR_GZ="${TAR_FILE}.gz"
RESTART_CONTAINER=false
USE_THUMBDRIVE=false
THUMBDRIVE_PATH=""
USE_CACHE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --restart)
            RESTART_CONTAINER=true
            shift
            ;;
        --use-cache)
            USE_CACHE=true
            shift
            ;;
        --thumbdrive)
            USE_THUMBDRIVE=true
            if [ -n "$2" ] && [[ ! "$2" =~ ^-- ]]; then
                THUMBDRIVE_PATH="$2"
                shift 2
            else
                # Try to detect thumbdrive - check common names
                # Note: Your thumbdrive can have ANY name - "pi-site" is just one option
                if [ -d "/Volumes/pi-site" ]; then
                    THUMBDRIVE_PATH="/Volumes/pi-site"
                elif [ -d "/Volumes/NO NAME" ]; then
                    THUMBDRIVE_PATH="/Volumes/NO NAME"
                else
                    # List available volumes and let user choose
                    echo "📁 Available volumes (your thumbdrive can have any name):"
                    ls -1 /Volumes/ 2>/dev/null | grep -v "^\.$" | grep -v "^\.\.$" || echo "   (none found)"
                    echo ""
                    echo "Please specify your thumbdrive path:"
                    echo "  ./scripts/build-and-transfer.sh --thumbdrive /Volumes/YOUR_DRIVE_NAME"
                    echo ""
                    echo "💡 Tip: Your thumbdrive name doesn't matter - just use the path shown above"
                    exit 1
                fi
                shift
            fi
            # Check if thumbdrive path exists
            if [ ! -d "$THUMBDRIVE_PATH" ]; then
                echo "❌ Thumbdrive not found at: ${THUMBDRIVE_PATH}"
                echo "   Please mount the thumbdrive and try again"
                exit 1
            fi
            echo "💾 Using thumbdrive: ${THUMBDRIVE_PATH}"
            ;;
        *)
            echo "❌ Unknown option: $1"
            echo "Usage: $0 [--restart] [--use-cache] [--thumbdrive [PATH]]"
            exit 1
            ;;
    esac
done

# Error handling function
cleanup_on_error() {
    echo ""
    echo "❌ Error occurred! Cleaning up..."
    if [ -f "${TAR_FILE}" ]; then
        rm -f "${TAR_FILE}"
    fi
    if [ -f "${TAR_GZ}" ]; then
        rm -f "${TAR_GZ}"
    fi
    exit 1
}

trap cleanup_on_error ERR

# Check if buildx is available
if ! docker buildx version &> /dev/null; then
    echo "❌ Error: docker buildx is not available."
    echo "   On Docker Desktop, buildx should be available by default."
    echo "   On Linux, you may need to install it separately."
    exit 1
fi

# Create buildx builder if it doesn't exist (one-time setup)
if ! docker buildx ls | grep -q "pi-site-builder"; then
    echo "🔧 Setting up buildx builder (one-time setup)..."
    docker buildx create --name pi-site-builder --use || true
fi

# Use the builder
docker buildx use pi-site-builder 2>/dev/null || docker buildx create --name pi-site-builder --use

echo "🐳 Building Docker image for Raspberry Pi (tag: ${IMAGE_TAG})..."
if [ "$USE_CACHE" = true ]; then
    echo "   ⚡ Using Docker build cache (faster for iterative changes)"
    echo "   Building for linux/arm64 (aarch64 - required for Prisma support)..."
    BUILD_ARGS="--platform linux/arm64"
else
    echo "   (This may take a few minutes - building from scratch to ensure standalone output is correct)"
    echo "   Building for linux/arm64 (aarch64 - required for Prisma support)..."
    BUILD_ARGS="--platform linux/arm64 --no-cache"
fi

if ! docker buildx build ${BUILD_ARGS} -t ${IMAGE_NAME}:${IMAGE_TAG} -t ${IMAGE_NAME}:latest --output type=docker,dest=${TAR_FILE} .; then
    echo "❌ Build failed!"
    exit 1
fi

TAR_SIZE=$(du -h ${TAR_FILE} | cut -f1)
echo "✅ Image built successfully! Size: ${TAR_SIZE}"

if [ "$USE_THUMBDRIVE" = true ]; then
    # For thumbdrive, we can skip compression for faster transfer
    echo "💾 Copying image to thumbdrive..."
    if ! cp ${TAR_FILE} "${THUMBDRIVE_PATH}/"; then
        echo "❌ Failed to copy to thumbdrive!"
        exit 1
    fi
    
    echo "✅ Image copied to thumbdrive!"
    echo ""
    echo "📋 Next steps on your Raspberry Pi:"
    echo "   1. Safely eject the thumbdrive from your Mac"
    echo "   2. Insert the thumbdrive into your Raspberry Pi"
    echo "   3. The Pi will usually auto-mount it (check with: lsblk)"
    echo "   4. Load the image using the helper script:"
    echo "      cd ~/pi-site && bash scripts/load-from-thumbdrive.sh"
    echo ""
    echo "   Or manually:"
    echo "      docker load -i /media/pi/USB_DRIVE/${TAR_FILE}"
    echo "      cd ~/pi-site && docker compose up -d"
    echo ""
    echo "📁 Image file location: ${THUMBDRIVE_PATH}/${TAR_FILE}"
    echo "   (Just this ONE file needs to be on the thumbdrive)"
else
    # Original SSH transfer method
    echo "🗜️  Compressing image..."
    if ! gzip -c ${TAR_FILE} > ${TAR_GZ}; then
        echo "❌ Compression failed!"
        exit 1
    fi

    GZ_SIZE=$(du -h ${TAR_GZ} | cut -f1)
    echo "✅ Compressed! Size: ${GZ_SIZE}"

    echo "📤 Transferring compressed image to Raspberry Pi..."
    if ! scp ${TAR_GZ} ${PI_HOST}:${PI_PATH}/; then
        echo "❌ Transfer failed! Check SSH connection to ${PI_HOST}"
        exit 1
    fi

    echo "📥 Decompressing and loading image on Raspberry Pi..."
    if ! ssh ${PI_HOST} "cd ${PI_PATH} && gunzip -c ${TAR_GZ} | docker load && rm ${TAR_GZ}"; then
        echo "❌ Failed to load image on Pi!"
        exit 1
    fi

    echo "🧹 Cleaning up local files..."
    rm -f ${TAR_FILE} ${TAR_GZ}
    
    # Clean up old local images (keep current and one backup)
    echo "🧹 Cleaning up old local images..."
    docker image prune -f --filter "dangling=true" 2>/dev/null || true
    # Remove old tagged images (keep latest and one backup)
    OLD_IMAGES=$(docker images ${IMAGE_NAME} --format "{{.Tag}}" | grep -v "latest" | tail -n +3)
    if [ -n "$OLD_IMAGES" ]; then
        echo "$OLD_IMAGES" | xargs -r -I {} docker rmi ${IMAGE_NAME}:{} 2>/dev/null || true
    fi
fi

echo "✅ Image transferred successfully!"
echo ""
echo "   Image: ${IMAGE_NAME}:${IMAGE_TAG}"
echo "   Also tagged as: ${IMAGE_NAME}:latest"
echo ""

if [ "$RESTART_CONTAINER" = true ]; then
    echo "🔄 Restarting container on Pi..."
    if ssh ${PI_HOST} "cd ${PI_PATH} && docker compose up -d"; then
        echo "✅ Container restarted!"
    else
        echo "⚠️  Image loaded but container restart failed. Run manually:"
        echo "   ssh ${PI_HOST} 'cd ${PI_PATH} && docker compose up -d'"
    fi
else
    echo "On your Pi, you can now run:"
    echo "  docker compose up -d"
fi
