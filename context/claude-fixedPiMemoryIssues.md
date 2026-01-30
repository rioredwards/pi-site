Jan 20, 2026

Deployed Fixes
┌──────────────────┬──────────────┬───────────────┬─────────┐
│ Container │ Memory Limit │ Current Usage │ Health │
├──────────────────┼──────────────┼───────────────┼─────────┤
│ web │ 512MB │ 46MB (9%) │ healthy │
├──────────────────┼──────────────┼───────────────┼─────────┤
│ ai-img-validator │ 768MB │ 284MB (37%) │ healthy │
├──────────────────┼──────────────┼───────────────┼─────────┤
│ db │ 256MB │ 22MB (8%) │ healthy │
├──────────────────┼──────────────┼───────────────┼─────────┤
│ system-profiler │ 128MB │ 12MB (9%) │ healthy │
└──────────────────┴──────────────┴───────────────┴─────────┘
What's now protected:

- If any container tries to exceed its memory limit, Docker will kill and restart it (thanks to restart: unless-stopped) instead of letting it consume
  all RAM and crash the whole Pi
- The healthcheck is now passing because Next.js binds to 0.0.0.0
- Journal logs are persistent, so if crashes do happen, you'll have logs to review

Note: The cgroup v2 memory controller worked even though v1 was disabled by the Pi firmware. The kernel parameter changes we made weren't necessary in
the end, but they don't hurt.

Your site should be stable now. If it does crash again, run journalctl -b -1 to see logs from the previous boot.

Jan 21, 2026

Both monitoring systems are now properly set up. Here's what's working now:

What's Fixed
┌─────────────────────┬───────────────────────┬─────────────────────────────────────────────┐
│ System │ Status │ Location │
├─────────────────────┼───────────────────────┼─────────────────────────────────────────────┤
│ Journal persistence │ Active │ journalctl -b -1 will work after next crash │
├─────────────────────┼───────────────────────┼─────────────────────────────────────────────┤
│ Memory monitor │ Running (every 5 min) │ /var/log/container-memory.log │
├─────────────────────┼───────────────────────┼─────────────────────────────────────────────┤
│ Auto-start on boot │ Enabled │ mem-monitor.service │
└─────────────────────┴───────────────────────┴─────────────────────────────────────────────┘
Hardware Check Results

- Temperature: 38°C (normal)
- Power/throttling: None detected
- No obvious hardware issues

Current Memory Usage

Your containers are using the updated limits (I see you adjusted them):

- web: 71MB / 768MB
- ai-img-validator: 430MB / 1.5GB
- db: 53MB / 512MB
- system-profiler: 42MB / 256MB

If It Crashes Again

Run these after reboot:

# Check previous boot logs

journalctl -b -1 | tail -100

# Check memory trend before crash

cat /var/log/container-memory.log | tail -50

# Check for OOM events

journalctl -b -1 | grep -i "oom\|killed\|out of memory"

Since containers show 0 restarts and hardware looks fine, the crash might be something outside Docker entirely. The logs from the next crash should tell us more.
