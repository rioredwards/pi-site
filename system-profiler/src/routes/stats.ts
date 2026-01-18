import { Hono } from "hono";
import { config } from "../config.js";
import { collectHostStats } from "../collectors/host.js";
import type { CombinedStats, ContainerStats, ServiceHealthStats } from "../types.js";

const stats = new Hono();

/**
 * Get mock container stats for development.
 * TODO: Phase 3 - replace with real Docker API calls
 */
function getMockContainerStats(): ContainerStats {
  return {
    containers: [
      {
        id: "abc123",
        name: "pi-site-web-1",
        image: "pi-site-web:latest",
        status: "Up 2 hours",
        state: "running",
        health: "healthy",
        restartCount: 0,
        cpuPercent: 5.2,
        memoryUsageBytes: 256 * 1024 * 1024,
        memoryLimitBytes: 1024 * 1024 * 1024,
        memoryPercent: 25,
      },
      {
        id: "def456",
        name: "pi-site-system-profiler-1",
        image: "pi-site-system-profiler:latest",
        status: "Up 2 hours",
        state: "running",
        health: "healthy",
        restartCount: 0,
        cpuPercent: 1.5,
        memoryUsageBytes: 64 * 1024 * 1024,
        memoryLimitBytes: 512 * 1024 * 1024,
        memoryPercent: 12.5,
      },
      {
        id: "ghi789",
        name: "pi-site-ai-img-validator-1",
        image: "pi-site/ai-img-validator:stable",
        status: "Up 2 hours",
        state: "running",
        health: "healthy",
        restartCount: 0,
        cpuPercent: 0.5,
        memoryUsageBytes: 512 * 1024 * 1024,
        memoryLimitBytes: 2 * 1024 * 1024 * 1024,
        memoryPercent: 25,
      },
      {
        id: "jkl012",
        name: "pi-site-db-1",
        image: "postgres:17",
        status: "Up 2 hours",
        state: "running",
        health: "healthy",
        restartCount: 0,
        cpuPercent: 2.1,
        memoryUsageBytes: 128 * 1024 * 1024,
        memoryLimitBytes: 512 * 1024 * 1024,
        memoryPercent: 25,
      },
    ],
    summary: {
      total: 4,
      running: 4,
      stopped: 0,
      unhealthy: 0,
    },
  };
}

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
  const [hostStats] = await Promise.all([
    collectHostStats(),
    // TODO: Phase 3 - collectContainerStats(),
    // TODO: Phase 4 - collectServiceHealth(),
  ]);

  const combined: CombinedStats = {
    timestamp: new Date().toISOString(),
    host: hostStats,
    containers: getMockContainerStats(),
    services: getMockServiceHealth(),
  };

  return c.json({
    data: combined,
    mockMode: config.mockHostStats,
  });
});

export { stats };
