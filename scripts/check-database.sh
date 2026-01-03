#!/bin/bash
# Check database status in Docker container
# Run on Pi: bash scripts/check-database.sh

echo "🔍 Checking database status..."
echo ""

echo "1. Checking if database file exists on host:"
ls -lh ~/pi-site/prisma/dev.db 2>/dev/null && echo "✅ Database file exists" || echo "❌ Database file does NOT exist"

echo ""
echo "2. Checking database file in container:"
docker compose exec -T app ls -lh /app/prisma/dev.db 2>/dev/null && echo "✅ Database file exists in container" || echo "❌ Database file does NOT exist in container"

echo ""
echo "3. Checking database connection and photo count:"
docker compose exec -T app node -e "
const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const adapter = new PrismaBetterSqlite3({ url: 'file:./prisma/dev.db' });
const prisma = new PrismaClient({ adapter });
prisma.photo.count()
  .then(count => {
    console.log('✅ Database connected! Photo count:', count);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Database error:', err.message);
    process.exit(1);
  });
" 2>&1

echo ""
echo "4. Checking if migrations have been run:"
docker compose exec -T app npx prisma migrate status 2>&1 | head -10

echo ""
echo "=== Done ==="

