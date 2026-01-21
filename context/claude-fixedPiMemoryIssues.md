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
