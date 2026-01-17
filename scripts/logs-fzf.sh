#!/usr/bin/env bash
set -euo pipefail

# Run from repo root regardless of where it's invoked from
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Map profile -> compose files (using layered compose structure)
pick_profile() {
  printf "dev\nstaging\nprod\n" | fzf --prompt="profile> "
}

# Returns the docker compose command with appropriate files
get_compose_cmd() {
  case "$1" in
    dev)
      # override.yml is auto-loaded
      echo "docker compose"
      ;;
    staging)
      echo "docker compose -f docker-compose.yml -f docker-compose.staging.yml"
      ;;
    prod)
      echo "docker compose -f docker-compose.yml -f docker-compose.prod.yml"
      ;;
    *)
      echo "Unknown profile: $1" >&2
      exit 1
      ;;
  esac
}

main() {
  command -v fzf >/dev/null 2>&1 || { echo "Missing dependency: fzf" >&2; exit 1; }
  command -v docker >/dev/null 2>&1 || { echo "Missing dependency: docker" >&2; exit 1; }

  profile="$(pick_profile)" || exit 0
  compose_cmd="$(get_compose_cmd "$profile")"

  # Get services for that compose context
  services="$(
    $compose_cmd config --services \
    | fzf -m --prompt="services ($profile)> "
  )" || exit 0

  # If none selected, tail all services
  if [ -z "${services}" ]; then
    exec $compose_cmd logs -f --tail=200 -t
  fi

  # Convert newline list -> args safely
  mapfile -t svc_array <<<"$services"
  $compose_cmd logs -f --tail=200 -t "${svc_array[@]}" \
| awk '
  {
    raw = $0

    # Split on pipe with flexible spacing (handles padded service names)
    n = split($0, parts, /[[:space:]]*\|[[:space:]]*/)

    service = parts[1]
    gsub(/^[[:space:]]+|[[:space:]]+$/, "", service)

    # Extract HH:MM:SS from ISO timestamp (macOS awk: no {2} regex)
    time = ""
    if (match(parts[2], /T[0-9][0-9]:[0-9][0-9]:[0-9][0-9]/)) {
      time = substr(parts[2], RSTART+1, 8)
    }

    # Try to drop everything up through the ISO timestamp Z (optional tidy)
    rest = parts[2]
    z = index(rest, "Z")
    if (z > 0) rest = substr(rest, z+2)

    # Output: pretty_display<TAB>raw_line
    printf "%-6s %s %s\t%s\n", service, time, rest, raw
  }
' \
| fzf --ansi --no-sort --track --tail=100000 \
      --tac \
      --header='Ctrl-l: clear query, Ctrl-w: toggle wrap, Ctrl-/: toggle preview' \
      --bind 'ctrl-l:clear-query' \
      --bind 'ctrl-w:toggle-wrap' \
      --bind 'ctrl-/:toggle-preview' \
      --bind 'ctrl-j:page-down' \
      --bind 'ctrl-k:page-up' \
      --delimiter=$'\t' --with-nth=1 \
      --preview 'printf "%s\n" {2}' \
      --preview-window="hidden,right,50%,wrap,border-rounded,<50(hidden,bottom,40%,wrap,border-rounded)" \
      --info=inline-right \
      --pointer="▸" \
      --prompt="❯ "
}

main "$@"


