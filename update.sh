#!/usr/bin/env bash
set -euo pipefail

# -------------------------
# Quick Update Wrapper
#
# Delegates to scripts/update-prod.sh
# For full deployment (with system setup), use: ./deploy.sh
# -------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "${SCRIPT_DIR}/scripts/update-prod.sh" "$@"
