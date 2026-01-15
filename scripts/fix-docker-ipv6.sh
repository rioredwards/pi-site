#!/usr/bin/env bash
set -euo pipefail


if [ $# -eq 0 ]; then
    echo "Usage: $0 <domain>"
    echo "Example: $0 auth.docker.io"
    exit 1
fi

DOMAIN=$1
IPV4=$(getent ahosts $DOMAIN | grep STREAM | head -1 | awk '{print $1}')

if [ -z "$IPV4" ]; then
    echo "Could not resolve $DOMAIN to IPv4"
    exit 1
fi

echo "$IPV4 $DOMAIN" | sudo tee -a /etc/hosts
echo "Added: $IPV4 $DOMAIN"
