#!/usr/bin/env bash
set -euo pipefail


if [ $# -eq 0 ]; then
    echo "Usage: $0 <domain>"
    echo "Example: $0 auth.docker.io"
    exit 1
fi

DOMAIN=$1
# Prefer a dotted-decimal address; getent ahosts can list IPv6 first
IPV4=$(getent ahosts "$DOMAIN" | awk '$1 ~ /^[0-9]+\./ {print $1; exit}')

if [ -z "$IPV4" ]; then
    echo "Could not resolve $DOMAIN to IPv4"
    exit 1
fi

echo "$IPV4 $DOMAIN" | sudo tee -a /etc/hosts
echo "Added: $IPV4 $DOMAIN"
