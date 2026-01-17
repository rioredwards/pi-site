#!/bin/sh
set -e

echo "🚀 Starting application..."

# Fix ownership of upload directory (volume is created as root)
# This runs as root before we drop privileges
if [ -d "/data/uploads/images" ]; then
  chown -R nextjs:nodejs /data/uploads/images
fi

# Drop privileges and run as nextjs user
exec su-exec nextjs:nodejs sh -c '
  # Run database migrations
  node scripts/run-migrations.js

  # Start the Next.js server
  exec node server.js
'
