#!/usr/bin/env bash
set -euo pipefail
repo=$(cd "$(dirname "$0")/.." && pwd)
fixture=$(mktemp -d)
trap 'rm -rf "$fixture"' EXIT
mkdir -p "$fixture/bin" "$fixture/etc/sites-available" "$fixture/etc/sites-enabled"
export NGINX_CONFIG_DIR="$fixture/etc" TEST_STATE="$fixture" TMPDIR="$fixture"
export PATH="$fixture/bin:$PATH"
cat > "$fixture/bin/sudo" <<'SH'
#!/usr/bin/env bash
exec "$@"
SH
cat > "$fixture/bin/nginx" <<'SH'
#!/usr/bin/env bash
if [[ -e "$TEST_STATE/invalid" ]]; then exit 1; fi
SH
cat > "$fixture/bin/systemctl" <<'SH'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$TEST_STATE/actions"
[[ ! -e "$TEST_STATE/activation-fails" ]] || exit 1
if [[ -e "$TEST_STATE/transition" ]]; then
  printf 'LISTEN 0 511 127.0.0.1:80 0.0.0.0:*\n' > "$TEST_STATE/listeners"
fi
SH
cat > "$fixture/bin/ss" <<'SH'
#!/usr/bin/env bash
cat "$TEST_STATE/listeners"
SH
cat > "$fixture/bin/chown" <<'SH'
#!/usr/bin/env bash
exit 0
SH
cat > "$fixture/bin/mkdir" <<'SH'
#!/usr/bin/env bash
for arg in "$@"; do [[ "$arg" != /var/cache/nginx/nextjs_images ]] || exit 0; done
exec /bin/mkdir "$@"
SH
cat > "$fixture/bin/cp" <<'SH'
#!/usr/bin/env bash
if [[ -e "$TEST_STATE/restore-fails" && "$1" == -a && "${!#}" == "$NGINX_CONFIG_DIR/nginx.conf" ]]; then exit 1; fi
exec /bin/cp "$@"
SH
chmod +x "$fixture/bin/"*
printf 'LISTEN 0 511 127.0.0.1:80 0.0.0.0:*\n' > "$fixture/listeners"
installer="$repo/scripts/install-nginx.sh"
[[ -x "$installer" ]] || { echo 'FAIL: shared paired installer missing'; exit 1; }
"$installer"
cmp "$repo/nginx/nginx.conf" "$NGINX_CONFIG_DIR/nginx.conf"
cmp "$repo/nginx/pi-site.conf" "$NGINX_CONFIG_DIR/sites-available/pi-site"
[[ $(cat "$fixture/actions") == 'reload nginx' ]]
: > "$fixture/actions"
"$installer"
[[ ! -s "$fixture/actions" ]]
printf old > "$NGINX_CONFIG_DIR/nginx.conf"
touch "$fixture/invalid"
if "$installer"; then echo 'FAIL: invalid config accepted'; exit 1; fi
[[ $(cat "$NGINX_CONFIG_DIR/nginx.conf") == old ]]
rm "$fixture/invalid"
printf 'LISTEN 0 511 0.0.0.0:80 0.0.0.0:*\n' > "$fixture/listeners"
if NGINX_VERIFY_ATTEMPTS=1 "$installer"; then echo 'FAIL: wildcard listener accepted'; exit 1; fi
[[ $(cat "$NGINX_CONFIG_DIR/nginx.conf") == old ]]
grep -q '^restart nginx$' "$fixture/actions"
# A successful migration uses restart and verifies the replacement listener.
touch "$fixture/transition"
"$installer"
rm "$fixture/transition"
# Restore enabled-site state and paired files when activation fails.
printf old > "$NGINX_CONFIG_DIR/nginx.conf"
printf oldsite > "$NGINX_CONFIG_DIR/sites-available/pi-site"
ln -s /legacy/site "$NGINX_CONFIG_DIR/sites-enabled/default"
touch "$fixture/activation-fails"
if "$installer"; then echo 'FAIL: activation failure accepted'; exit 1; fi
[[ $(cat "$NGINX_CONFIG_DIR/nginx.conf") == old ]]
[[ $(cat "$NGINX_CONFIG_DIR/sites-available/pi-site") == oldsite ]]
[[ $(readlink "$NGINX_CONFIG_DIR/sites-enabled/default") == /legacy/site ]]
rm "$fixture/activation-fails"
# IPv6 and extra non-loopback listeners are rejected too.
for address in '[::]:80' '192.0.2.1:80'; do
  printf 'LISTEN 0 511 127.0.0.1:80 0.0.0.0:*\nLISTEN 0 511 %s *:*\n' "$address" > "$fixture/listeners"
  if NGINX_VERIFY_ATTEMPTS=1 "$installer"; then echo "FAIL: accepted $address"; exit 1; fi
done
# A failed restore must retain the only remaining copy of the original bytes.
printf original-recovery-bytes > "$NGINX_CONFIG_DIR/nginx.conf"
touch "$fixture/invalid" "$fixture/restore-fails"
if "$installer" 2> "$fixture/recovery-error"; then echo 'FAIL: restore failure accepted'; exit 1; fi
recovery=$(sed -n 's/^Recovery backup retained at: //p' "$fixture/recovery-error")
[[ -n "$recovery" && -f "$recovery/0" ]] || { echo 'FAIL: recovery backup discarded'; exit 1; }
[[ $(cat "$recovery/0") == original-recovery-bytes ]]
# Every mutating entry point delegates to the paired installer.
for caller in deploy.sh scripts/update-prod.sh .github/workflows/deploy.yml; do
  grep -q 'scripts/install-nginx.sh' "$repo/$caller"
done
echo 'PASS: paired installation, activation, migration, no-op, rollback, strict listeners, callers'
