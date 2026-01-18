import { Hono } from "hono";
import { config } from "../config.js";
import type { ServiceHealthStats } from "../types.js";

const services = new Hono();

/**
 * Get mock service health stats for development.
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

/**
 * Get real service health via HTTP/TCP probes.
 * Phase 4 will implement actual health checks.
 */
async function getRealServiceHealth(): Promise<ServiceHealthStats> {
  // TODO: Phase 4 - implement HTTP/TCP health probes
  // For now, return mock data
  return getMockServiceHealth();
}

services.get("/", async (c) => {
  const stats = config.mockHostStats
    ? getMockServiceHealth()
    : await getRealServiceHealth();

  return c.json({
    data: stats,
    mockMode: config.mockHostStats,
  });
});

export { services };
