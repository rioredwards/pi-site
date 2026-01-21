Jan 20, 2026

# Run in background (logs every 10 min by default)

nohup ~/pi-site/scripts/mem-monitor.sh &

# Check the log after a day or so

cat /tmp/container-memory.log

What Leak Patterns Look Like

Normal (no leak):
=== 2026-01-20T10:00:00 ===
pi-site-web-1 45MiB / 512MiB 8.79%

=== 2026-01-20T12:00:00 ===
pi-site-web-1 52MiB / 512MiB 10.16%

=== 2026-01-20T14:00:00 ===
pi-site-web-1 48MiB / 512MiB 9.38% ← fluctuates, returns to
baseline

Memory leak:
=== 2026-01-20T10:00:00 ===
pi-site-web-1 45MiB / 512MiB 8.79%

=== 2026-01-20T12:00:00 ===
pi-site-web-1 89MiB / 512MiB 17.38%

=== 2026-01-20T14:00:00 ===
pi-site-web-1 156MiB / 512MiB 30.47% ← steadily climbing, never
drops

If you see the leak pattern and the container keeps restarting (check
docker inspect for restart count), you've confirmed a leak and can dig
into which service (Node.js vs Python vs Postgres) is the culprit.
