#!/bin/bash
# Load Docker image from thumbdrive on Raspberry Pi
# Usage: ./scripts/load-from-thumbdrive.sh [THUMBDRIVE_PATH]
#
# If THUMBDRIVE_PATH is not provided, will try to auto-detect

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Find the image file
if [ -n "$1" ]; then
    THUMBDRIVE_PATH="$1"
else
    # Try to auto-detect thumbdrive
    THUMBDRIVE_PATH=$(mount | grep -i "usb\|sd[a-z]1" | awk '{print $3}' | head -1)
    if [ -z "$THUMBDRIVE_PATH" ]; then
        # Try common mount points
        for path in /media/*/ /mnt/*/ /media/pi/*/; do
            if [ -d "$path" ] && [ "$(ls -A "$path" 2>/dev/null)" ]; then
                THUMBDRIVE_PATH="$path"
                break
            fi
        done
    fi
fi

if [ -z "$THUMBDRIVE_PATH" ]; then
    echo "❌ Could not find thumbdrive. Please specify the path:"
    echo "   ./scripts/load-from-thumbdrive.sh /path/to/thumbdrive"
    echo ""
    echo "Available mount points:"
    mount | grep -E "usb|sd[a-z]" || echo "   (none found)"
    exit 1
fi

echo "🔍 Looking for image files in: ${THUMBDRIVE_PATH}"

# Find the image file (look for pi-site-*.tar files)
IMAGE_FILE=$(find "${THUMBDRIVE_PATH}" -name "pi-site-*.tar" -type f 2>/dev/null | head -1)

if [ -z "$IMAGE_FILE" ]; then
    echo "❌ No pi-site image file found on thumbdrive"
    echo "   Searched in: ${THUMBDRIVE_PATH}"
    echo ""
    echo "Available files:"
    ls -lh "${THUMBDRIVE_PATH}" | head -10
    exit 1
fi

echo "✅ Found image: $(basename "${IMAGE_FILE}")"
FILE_SIZE=$(du -h "${IMAGE_FILE}" | cut -f1)
echo "   Size: ${FILE_SIZE}"

echo ""
echo "📥 Loading Docker image..."
if ! docker load -i "${IMAGE_FILE}"; then
    echo "❌ Failed to load image!"
    exit 1
fi

echo ""
echo "✅ Image loaded successfully!"
echo ""
echo "🔄 Restarting container..."
cd "${PROJECT_DIR}"
if docker compose up -d; then
    echo "✅ Container restarted!"
    echo ""
    echo "Check status: docker compose ps"
    echo "View logs: docker compose logs -f"
else
    echo "⚠️  Image loaded but container restart failed"
    echo "   Try manually: cd ~/pi-site && docker compose up -d"
fi

