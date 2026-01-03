#!/bin/bash
# Copy Prisma client from local machine to Pi
# Usage: ./scripts/copy-prisma-client.sh

PI_HOST="raspberrypi"
PI_PATH="~/pi-site"

echo "📦 Copying Prisma client to Pi..."

if [ ! -f "prisma-client.tar.gz" ]; then
    echo "❌ prisma-client.tar.gz not found. Generating Prisma client locally first..."
    npx prisma generate
    tar -czf prisma-client.tar.gz node_modules/@prisma/client node_modules/.prisma
fi

scp prisma-client.tar.gz ${PI_HOST}:${PI_PATH}/
ssh ${PI_HOST} "cd ${PI_PATH} && tar -xzf prisma-client.tar.gz && rm prisma-client.tar.gz && echo '✅ Prisma client copied successfully'"

echo "✅ Done!"

