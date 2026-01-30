# Docker Resource Limits Configuration

## Overview

Production containers use the modern `deploy.resources` syntax (Compose v3+) for CPU and memory limits. This prevents any single service from consuming all resources and crashing the Pi.

## Current Allocations (Pi 5: 4 cores, 8GB RAM)

| Service          | CPU Limit | CPU Reserved | Memory Limit | Memory Reserved |
| ---------------- | --------- | ------------ | ------------ | --------------- |
| web              | 2         | 0.5          | 768M         | 384M            |
| system-profiler  | 0.5       | 0.25         | 256M         | 128M            |
| ai-img-validator | 2         | 0.5          | 1536M        | 768M            |
| db               | 1         | 0.25         | 512M         | 256M            |

**Totals:**

- Limits: ~3GB RAM, 5.5 CPU cores (burst capacity)
- Reservations: ~1.5GB RAM, 1.5 CPU cores (guaranteed minimums)

## Design Decisions

1. **Syntax choice**: Using `deploy.resources.limits/reservations` instead of deprecated `mem_limit`. Works with Docker Compose v2+ in non-swarm mode.

2. **Reservations**: Guarantee minimum resources so services don't starve each other under load.

3. **Headroom**: ~5GB RAM left for OS, filesystem cache, and unexpected spikes.

4. **Staging**: No limits applied - allows catching memory leaks and resource issues before they hit production.

## Behavior When Limits Exceeded

If a container exceeds its memory limit, Docker kills and restarts it (via `restart: unless-stopped`) rather than letting it consume all RAM and crash the entire Pi.

## Related Files

- `docker-compose.prod.yml` - Production resource limits
- `docker-compose.staging.yml` - No limits (intentional)
- `context/claude-fixedPiMemoryIssues.md` - Historical context on enabling cgroup memory controller
