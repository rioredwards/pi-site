#!/bin/bash
# Fix database issues in Docker container
# Run on Pi: bash scripts/fix-database.sh

set -e

echo "🔧 Fixing database issues..."
echo ""

echo "1. Checking if database file exists:"
if [ -f ~/pi-site/prisma/dev.db ]; then
    echo "   ✅ Database file exists on host"
    ls -lh ~/pi-site/prisma/dev.db
else
    echo "   ⚠️  Database file does NOT exist - will be created by migrations"
fi

echo ""
echo "2. Running database migrations..."
if docker compose exec -T app npx prisma migrate deploy; then
    echo "   ✅ Migrations completed"
else
    echo "   ❌ Migration failed - trying to create database..."
    docker compose exec -T app npx prisma db push || echo "   Failed to create database"
fi

echo ""
echo "3. Checking database status:"
docker compose exec -T app npx prisma migrate status

echo ""
echo "4. Testing database connection:"
docker compose exec -T app node -e "
const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const adapter = new PrismaBetterSqlite3({ url: 'file:./prisma/dev.db' });
const prisma = new PrismaClient({ adapter });
prisma.photo.count()
  .then(count => {
    console.log('   ✅ Database connected! Photo count:', count);
    process.exit(0);
  })
  .catch(err => {
    console.error('   ❌ Database error:', err.message);
    process.exit(1);
  });
" 2>&1

echo ""
echo "=== Done ==="
echo ""
echo "If database is empty, you can upload photos through the web interface."
echo "If you have existing photos in public/images, run:"
echo "  docker compose exec app npx tsx scripts/migrate-to-db.ts"

