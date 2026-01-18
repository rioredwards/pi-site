import { Hono } from "hono";
import { config } from "../config.js";
import { collectHostStats } from "../collectors/host.js";
import { collectContainerStats } from "../collectors/containers.js";
import type { CombinedStats, ServiceHealthStats } from "../types.js";

const stats = new Hono();

/**
 * Get mock service health stats for development.
 * TODO: Phase 4 - replace with real HTTP/TCP probes
 */
function getMockServiceHealth(): ServiceHealthStats {
  return {
    services: [
      {
        name: "web",
        url: "http://web:3000/",
        healthy: true,
        responseTimeMs: 45,
        error: null,
      },
      {
        name: "ai-img-validator",
        url: "http://ai-img-validator:8000/",
        healthy: true,
        responseTimeMs: 120,
        error: null,
      },
      {
        name: "db",
        url: "tcp://db:5432",
        healthy: true,
        responseTimeMs: 5,
        error: null,
      },
    ],
    allHealthy: true,
  };
}

stats.get("/", async (c) => {
  const [hostStats, containerStats] = await Promise.all([
    collectHostStats(),
    collectContainerStats(),
    // TODO: Phase 4 - collectServiceHealth(),
  ]);

  const combined: CombinedStats = {
    timestamp: new Date().toISOString(),
    host: hostStats,
    containers: containerStats,
    services: getMockServiceHealth(),
  };

  return c.json({
    data: combined,
    mockMode: config.mockHostStats,
  });
});

export { stats };
