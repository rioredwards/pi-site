#!/usr/bin/env bash
set -euo pipefail

# Add common Docker domains
for domain in auth.docker.io production.cloudflare.docker.com index.docker.io; do
  echo "$(getent ahosts $domain | grep STREAM | head -1 | awk '{print $1}') $domain" | sudo tee -a /etc/hosts
done
