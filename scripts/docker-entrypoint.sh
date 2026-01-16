#!/bin/sh
set -e

echo "🚀 Starting application..."

# Run database migrations
node scripts/run-migrations.js

# Start the Next.js server
exec node server.js
