#!/bin/bash
# Check if next.config.ts has standalone output configured
# This is required for Docker builds

CONFIG_FILE="next.config.ts"
LOG_ENDPOINT="http://127.0.0.1:7247/ingest/ffff6e97-d96b-473d-a296-a90866dca292"

# #region agent log
curl -s -X POST -H "Content-Type: application/json" -d "{\"location\":\"check-config.sh:8\",\"message\":\"Checking next.config.ts for standalone output\",\"data\":{\"configFile\":\"${CONFIG_FILE}\"},\"timestamp\":$(date +%s000),\"sessionId\":\"debug-session\",\"runId\":\"config-check\",\"hypothesisId\":\"A\"}" "${LOG_ENDPOINT}" >/dev/null 2>&1 || true
# #endregion

if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ $CONFIG_FILE not found!"
    exit 1
fi

# #region agent log
curl -s -X POST -H "Content-Type: application/json" -d "{\"location\":\"check-config.sh:15\",\"message\":\"Config file exists, checking for standalone output\",\"data\":{\"hasStandalone\":false},\"timestamp\":$(date +%s000),\"sessionId\":\"debug-session\",\"runId\":\"config-check\",\"hypothesisId\":\"A\"}" "${LOG_ENDPOINT}" >/dev/null 2>&1 || true
# #endregion

# Check if standalone is configured
if grep -q "output.*standalone" "$CONFIG_FILE" || grep -q "output:.*'standalone'" "$CONFIG_FILE" || grep -q 'output:.*"standalone"' "$CONFIG_FILE"; then
    echo "✅ Standalone output is configured in $CONFIG_FILE"
    # #region agent log
    curl -s -X POST -H "Content-Type: application/json" -d "{\"location\":\"check-config.sh:22\",\"message\":\"Standalone output found in config\",\"data\":{\"hasStandalone\":true},\"timestamp\":$(date +%s000),\"sessionId\":\"debug-session\",\"runId\":\"config-check\",\"hypothesisId\":\"A\"}" "${LOG_ENDPOINT}" >/dev/null 2>&1 || true
    # #endregion
    exit 0
else
    echo "❌ Standalone output is NOT configured in $CONFIG_FILE"
    echo "   The Dockerfile expects standalone output, but next.config.ts doesn't enable it."
    echo "   This will cause the Docker build to fail when trying to copy .next/standalone"
    # #region agent log
    curl -s -X POST -H "Content-Type: application/json" -d "{\"location\":\"check-config.sh:29\",\"message\":\"Standalone output missing from config\",\"data\":{\"hasStandalone\":false},\"timestamp\":$(date +%s000),\"sessionId\":\"debug-session\",\"runId\":\"config-check\",\"hypothesisId\":\"A\"}" "${LOG_ENDPOINT}" >/dev/null 2>&1 || true
    # #endregion
    exit 1
fi

