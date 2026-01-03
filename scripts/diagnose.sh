#!/bin/bash
# Diagnostic script to check why the app isn't online
# Run this on the Raspberry Pi: ssh raspberrypi 'cd ~/pi-site && bash scripts/diagnose.sh'

set -e

LOG_FILE="/tmp/pi-site-diagnosis.log"
LOG_ENDPOINT="http://127.0.0.1:7247/ingest/ffff6e97-d96b-473d-a296-a90866dca292"

# Log function for debug mode
debug_log() {
    local location="$1"
    local message="$2"
    local data="$3"
    local hypothesis="$4"
    # #region agent log
    curl -s -X POST -H "Content-Type: application/json" -d "{\"location\":\"${location}\",\"message\":\"${message}\",\"data\":${data},\"timestamp\":$(date +%s000),\"sessionId\":\"debug-session\",\"runId\":\"diagnosis\",\"hypothesisId\":\"${hypothesis}\"}" "${LOG_ENDPOINT}" >/dev/null 2>&1 || true
    # #endregion
}
echo "=== Pi-Site Diagnostic Report ===" > "$LOG_FILE"
echo "Timestamp: $(date)" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Function to log and echo
log_check() {
    echo "$1" | tee -a "$LOG_FILE"
}

log_check "1. Checking Docker service status..."
if systemctl is-active --quiet docker; then
    log_check "   ✅ Docker service is running"
else
    log_check "   ❌ Docker service is NOT running"
fi

log_check ""
log_check "2. Checking container status..."
CONTAINER_STATUS=$(docker compose ps --format json 2>/dev/null | jq -r '.[0].State' 2>/dev/null || echo "not_running")
log_check "   Container state: $CONTAINER_STATUS"

if [ "$CONTAINER_STATUS" = "running" ]; then
    log_check "   ✅ Container is running"
else
    log_check "   ❌ Container is NOT running"
fi

log_check ""
log_check "3. Checking container health..."
HEALTH_STATUS=$(docker compose ps --format json 2>/dev/null | jq -r '.[0].Health' 2>/dev/null || echo "unknown")
log_check "   Health status: $HEALTH_STATUS"
debug_log "diagnose.sh:health" "Container health check" "{\"healthStatus\":\"${HEALTH_STATUS}\"}" "B"

log_check ""
log_check "4. Checking if server.js exists in container..."
if docker compose exec -T app test -f /app/server.js 2>/dev/null; then
    log_check "   ✅ server.js exists"
    SERVER_JS_SIZE=$(docker compose exec -T app stat -c%s /app/server.js 2>/dev/null || echo "0")
    log_check "   server.js size: $SERVER_JS_SIZE bytes"
    debug_log "diagnose.sh:serverjs" "server.js exists" "{\"exists\":true,\"size\":${SERVER_JS_SIZE}}" "A"
else
    log_check "   ❌ server.js does NOT exist"
    debug_log "diagnose.sh:serverjs" "server.js missing" "{\"exists\":false}" "A"
fi

log_check ""
log_check "5. Checking if standalone directory exists..."
if docker compose exec -T app test -d /app/.next/standalone 2>/dev/null; then
    log_check "   ✅ .next/standalone directory exists"
    debug_log "diagnose.sh:standalone" "Standalone directory exists" "{\"exists\":true}" "A"
else
    log_check "   ❌ .next/standalone directory does NOT exist"
    debug_log "diagnose.sh:standalone" "Standalone directory missing" "{\"exists\":false}" "A"
fi

log_check ""
log_check "6. Checking port 3000 binding..."
PORT_CHECK=$(netstat -tlnp 2>/dev/null | grep ':3000' || ss -tlnp 2>/dev/null | grep ':3000' || echo "not_found")
if echo "$PORT_CHECK" | grep -q "3000"; then
    log_check "   ✅ Port 3000 is bound"
    log_check "   Details: $PORT_CHECK"
    debug_log "diagnose.sh:port" "Port 3000 is bound" "{\"bound\":true}" "C"
else
    log_check "   ❌ Port 3000 is NOT bound"
    debug_log "diagnose.sh:port" "Port 3000 not bound" "{\"bound\":false}" "C"
fi

log_check ""
log_check "7. Checking container logs (last 50 lines, including previous runs)..."
log_check "   --- Container Logs ---"
# Get logs from all containers (including stopped ones)
CONTAINER_ID=$(docker compose ps -a -q app 2>/dev/null | head -1)
if [ -n "$CONTAINER_ID" ]; then
    CONTAINER_LOGS=$(docker logs --tail=50 "$CONTAINER_ID" 2>&1 || docker compose logs --tail=50 app 2>&1 || echo "Could not retrieve logs")
else
    CONTAINER_LOGS=$(docker compose logs --tail=50 app 2>&1 || echo "Could not retrieve logs")
fi
echo "$CONTAINER_LOGS" | tee -a "$LOG_FILE"
log_check "   --- End Logs ---"

# Also check docker inspect for exit code and error
if [ -n "$CONTAINER_ID" ]; then
    EXIT_CODE=$(docker inspect "$CONTAINER_ID" --format '{{.State.ExitCode}}' 2>/dev/null || echo "unknown")
    STATUS=$(docker inspect "$CONTAINER_ID" --format '{{.State.Status}}' 2>/dev/null || echo "unknown")
    ERROR=$(docker inspect "$CONTAINER_ID" --format '{{.State.Error}}' 2>/dev/null || echo "")
    log_check "   Container status: $STATUS, Exit code: $EXIT_CODE"
    if [ -n "$ERROR" ] && [ "$ERROR" != "<no value>" ]; then
        log_check "   Container error: $ERROR"
        debug_log "diagnose.sh:container-error" "Container has error" "{\"error\":\"${ERROR}\",\"exitCode\":\"${EXIT_CODE}\",\"status\":\"${STATUS}\"}" "B"
    fi
fi
# Extract key error patterns
if echo "$CONTAINER_LOGS" | grep -qi "server.js"; then
    debug_log "diagnose.sh:logs" "Found server.js reference in logs" "{\"hasServerJsError\":true}" "A"
fi
if echo "$CONTAINER_LOGS" | grep -qi "standalone"; then
    debug_log "diagnose.sh:logs" "Found standalone reference in logs" "{\"hasStandaloneError\":true}" "A"
fi
if echo "$CONTAINER_LOGS" | grep -qi "error\|failed\|cannot\|ENOENT\|not found"; then
    debug_log "diagnose.sh:logs" "Found errors in container logs" "{\"hasErrors\":true}" "D"
    # Extract specific error messages
    ERROR_LINES=$(echo "$CONTAINER_LOGS" | grep -i "error\|failed\|cannot\|ENOENT\|not found" | head -5)
    if [ -n "$ERROR_LINES" ]; then
        log_check "   Key error lines:"
        echo "$ERROR_LINES" | while read line; do
            log_check "     $line"
        done
    fi
fi

log_check ""
log_check "8. Testing health endpoint from inside container..."
HEALTH_RESPONSE=$(docker compose exec -T app node -e "require('http').get('http://localhost:3000/api/health', (r) => {let d='';r.on('data',c=>d+=c);r.on('end',()=>{console.log('Status:',r.statusCode);console.log('Body:',d);process.exit(r.statusCode===200?0:1)})}).on('error',(e)=>{console.error('Error:',e.message);process.exit(1)})" 2>&1 || echo "FAILED")
log_check "   Health check result: $HEALTH_RESPONSE"

log_check ""
log_check "9. Checking environment variables..."
ENV_CHECK=$(docker compose exec -T app env 2>/dev/null | grep -E "(NODE_ENV|PORT|HOSTNAME|DATABASE_URL|NEXTAUTH)" || echo "Could not check env vars")
log_check "   Environment variables:"
echo "$ENV_CHECK" | while read line; do
    log_check "     $line"
done

log_check ""
log_check "10. Checking database file..."
if docker compose exec -T app test -f /app/prisma/dev.db 2>/dev/null; then
    log_check "   ✅ Database file exists"
    DB_SIZE=$(docker compose exec -T app stat -c%s /app/prisma/dev.db 2>/dev/null || echo "0")
    log_check "   Database size: $DB_SIZE bytes"
    debug_log "diagnose.sh:database" "Database file exists" "{\"exists\":true,\"size\":${DB_SIZE}}" "D"
else
    log_check "   ⚠️  Database file does NOT exist (may need migrations)"
    debug_log "diagnose.sh:database" "Database file missing" "{\"exists\":false}" "D"
fi

log_check ""
log_check "11. Checking image contents (if image exists locally)..."
if docker image inspect pi-site:latest >/dev/null 2>&1; then
    log_check "   Image exists locally, checking contents..."
    TEMP_CONTAINER=$(docker create pi-site:latest 2>/dev/null)
    if [ -n "$TEMP_CONTAINER" ]; then
        if docker exec "$TEMP_CONTAINER" test -f /app/server.js 2>/dev/null; then
            log_check "   ✅ Image contains server.js"
            debug_log "diagnose.sh:image" "Image has server.js" "{\"hasServerJs\":true}" "A"
        else
            log_check "   ❌ Image does NOT contain server.js"
            debug_log "diagnose.sh:image" "Image missing server.js" "{\"hasServerJs\":false}" "A"
        fi
        docker rm "$TEMP_CONTAINER" >/dev/null 2>&1
    fi
else
    log_check "   Image not found locally (may be on Pi only)"
fi

log_check ""
log_check "=== Diagnostic Complete ==="
log_check "Full log saved to: $LOG_FILE"
cat "$LOG_FILE"

