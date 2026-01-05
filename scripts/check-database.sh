#!/bin/bash
# Check database status
# Run on Pi: bash scripts/check-database.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${PROJECT_DIR}"

echo "🔍 Checking database status..."
echo ""

echo "1. Checking if database file exists:"
ls -lh prisma/dev.db 2>/dev/null && echo "✅ Database file exists" || echo "❌ Database file does NOT exist"

echo ""
echo "2. Checking database connection and photo count:"
node -e "
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
echo "3. Checking if migrations have been run:"
npx prisma migrate status 2>&1 | head -10

echo ""
echo "=== Done ==="
