import os from "os";

const authToken = process.env.SYSTEM_PROFILER_AUTH_TOKEN;
if (!authToken?.trim()) throw new Error("SYSTEM_PROFILER_AUTH_TOKEN is required");

export const config = {
  // Server
  port: process.env.PORT ? parseInt(process.env.PORT) : 8787,

  // Auth
  authToken: authToken,

  // Mock mode - use mock data when not on Linux (e.g., macOS dev)
  mockHostStats:
    process.env.MOCK_HOST_STATS === "true" || os.platform() !== "linux",

  // Host filesystem paths (mounted from host in prod)
  paths: {
    proc: "/host/proc",
    sys: "/host/sys",
    rootFs: "/host/disk",
  },

  // Docker socket
  dockerUrl: process.env.DOCKER_HOST || "http://docker-proxy:2375",

  // Stack label for filtering containers
  stackLabel: "com.rioredwards.stack",
  stackName: "pi-site",

  // Service health check targets
  services: [
    { name: "web", url: "http://web:3000/" },
    { name: "ai-img-validator", url: "http://ai-img-validator:8000/" },
    { name: "db", host: "db", port: 5432 },
  ],
} as const;

export type Config = typeof config;
