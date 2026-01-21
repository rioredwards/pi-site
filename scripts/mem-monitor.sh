#!/bin/bash
# Simple memory monitor - logs container memory usage over time
# Usage: ./mem-monitor.sh [interval_seconds] [log_file]
# Default: 600 seconds (10 min), logs to /tmp/container-memory.log

INTERVAL=${1:-600}
LOGFILE=${2:-/tmp/container-memory.log}

echo "Logging container memory to $LOGFILE every $INTERVAL seconds"
echo "Press Ctrl+C to stop"

while true; do
  {
    echo "=== $(date -Iseconds) ==="
    docker stats --no-stream --format "{{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}"
    echo ""
  } >> "$LOGFILE"
  sleep "$INTERVAL"
done
