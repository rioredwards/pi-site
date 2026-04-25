#!/usr/bin/env bash
set -euo pipefail

# Pin Docker Hub hostnames to IPv4 in /etc/hosts so pulls don't use AAAA when IPv6
# doesn't work. Layer fetches go to registry-1.docker.io — include it or pulls fail
# with "address family not supported by protocol" on some ARM/self-hosted runners.
for domain in \
  registry-1.docker.io \
  auth.docker.io \
  production.cloudflare.docker.com \
  index.docker.io; do
  escaped=${domain//./\\.}
  if grep -qE "^[0-9.]+[[:space:]]+${escaped}([[:space:]]|$)" /etc/hosts 2>/dev/null; then
    echo "Already pinned: $domain"
    continue
  fi
  ipv4=$(getent ahosts "$domain" | awk '$1 ~ /^[0-9]+\./ {print $1; exit}')
  if [[ -z "$ipv4" ]]; then
    echo "fix-docker-ipv6-auto: no IPv4 for $domain" >&2
    exit 1
  fi
  echo "$ipv4 $domain" | sudo tee -a /etc/hosts
  echo "Added: $ipv4 $domain"
done
