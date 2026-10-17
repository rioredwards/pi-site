#!/bin/sh
set -eu

# Runtime code stays root-owned. Volume ownership is provisioned before startup.
if [ ! -w /data/uploads/images ]; then
  echo "Upload volume must be writable by UID 1001" >&2
  exit 1
fi
node scripts/run-migrations.js
exec node server.js
