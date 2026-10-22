#!/usr/bin/env bash
# Install the global and site configuration as one recoverable unit.
set -euo pipefail
repo=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
config_dir=${NGINX_CONFIG_DIR:-/etc/nginx}
attempts=${NGINX_VERIFY_ATTEMPTS:-10}
[[ "$attempts" =~ ^[1-9][0-9]*$ && "$attempts" -le 30 ]] || { echo 'Invalid verification attempt limit' >&2; exit 1; }
for command in sudo nginx systemctl ss; do
  command -v "$command" >/dev/null || { echo "Missing command: $command" >&2; exit 1; }
done
[[ -f "$repo/nginx/nginx.conf" && -f "$repo/nginx/pi-site.conf" ]]

loopback_only() {
  local listeners
  listeners=$(sudo ss -H -ltn 'sport = :80') || return 2
  printf '%s\n' "$listeners" | awk '
    NF { seen=1; if ($4 != "127.0.0.1:80") bad=1 }
    END { exit (!seen || bad) }'
}

paths=("$config_dir/nginx.conf" "$config_dir/sites-available/pi-site"
  "$config_dir/sites-enabled/pi-site" "$config_dir/sites-enabled/myapp"
  "$config_dir/sites-enabled/dogtownUSA" "$config_dir/sites-enabled/default")
backup=$(mktemp -d)
changed=0
activated=0
committed=0
# Called indirectly by the EXIT trap.
# shellcheck disable=SC2329
rollback() {
  local status=$? index
  trap - EXIT
  if [[ "$committed" -eq 0 && "$changed" -eq 1 ]]; then
    echo 'Nginx installation failed; restoring previous configuration' >&2
    for index in "${!paths[@]}"; do
      sudo rm -f -- "${paths[$index]}" || status=1
      if [[ -e "$backup/$index" || -L "$backup/$index" ]]; then
        sudo cp -a -- "$backup/$index" "${paths[$index]}" || status=1
      fi
    done
    if [[ "$activated" -eq 1 ]]; then
      if ! sudo nginx -t || ! sudo systemctl restart nginx; then
        echo 'Nginx rollback activation failed' >&2
        status=1
      fi
    fi
  fi
  sudo rm -rf -- "$backup"
  exit "$status"
}
trap rollback EXIT
for index in "${!paths[@]}"; do
  if [[ -e "${paths[$index]}" || -L "${paths[$index]}" ]]; then
    sudo cp -a -- "${paths[$index]}" "$backup/$index"
  fi
done

if ! sudo cmp -s "$repo/nginx/nginx.conf" "${paths[0]}" ||
   ! sudo cmp -s "$repo/nginx/pi-site.conf" "${paths[1]}" ||
   [[ ! -L "${paths[2]}" || $(readlink "${paths[2]}") != "${paths[1]}" ]]; then
  changed=1
fi
for index in 3 4 5; do
  [[ ! -L "${paths[$index]}" ]] || changed=1
done
sudo mkdir -p "$config_dir/sites-available" "$config_dir/sites-enabled" /var/cache/nginx/nextjs_images
sudo chown www-data:www-data /var/cache/nginx/nextjs_images
if [[ "$changed" -eq 1 ]]; then
  sudo rm -f -- "${paths[0]}" "${paths[1]}"
  sudo cp "$repo/nginx/nginx.conf" "${paths[0]}"
  sudo cp "$repo/nginx/pi-site.conf" "${paths[1]}"
  sudo ln -sfn "${paths[1]}" "${paths[2]}"
  for index in 3 4 5; do
    if [[ -L "${paths[$index]}" ]]; then sudo rm -f -- "${paths[$index]}"; fi
  done
fi
sudo nginx -t
if loopback_only; then
  if [[ "$changed" -eq 1 ]]; then
    activated=1
    sudo systemctl reload nginx
  fi
else
  [[ $? -ne 2 ]] || { echo 'Cannot inspect Nginx listeners' >&2; exit 1; }
  activated=1
  sudo systemctl restart nginx
fi
for ((attempt=1; attempt<=attempts; attempt++)); do
  if loopback_only; then
    committed=1
    echo 'Nginx configuration installed; port 80 is loopback only'
    exit 0
  else
    [[ $? -ne 2 ]] || { echo 'Cannot inspect Nginx listeners' >&2; exit 1; }
  fi
  if [[ "$attempt" -lt "$attempts" ]]; then sleep 1; fi
done
echo 'Nginx port 80 listener verification failed' >&2
exit 1
