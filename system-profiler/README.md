Metrics service for DogTown. Set `SYSTEM_PROFILER_AUTH_TOKEN` before startup;
all metric routes require the matching `X-Profiler-Token` header.

```sh
npm ci
npm test
npm run build
npm start
```

Build the image from the repository root:

```sh
docker build -f system-profiler/Dockerfile -t pi-site-system-profiler:latest .
```

Production mounts only the metric files listed in Compose. Root disk capacity
comes from `statfs` on a harmless host file, without exposing host directories.
Missing required metrics fail the request instead of returning simulated values.

Docker metrics pass through HAProxy on an isolated internal network. Its method
and path allowlist follows [Tecnativa's socket proxy](https://github.com/Tecnativa/docker-socket-proxy),
narrowed to stack-filtered container listing and non-streaming container stats.
Inspect, filesystem access and write methods are denied. The profiler never mounts
the Docker socket. Public stats omit host IDs, image names and internal URLs.
