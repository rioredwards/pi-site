import { Hono } from "hono";
import { config } from "../config.js";
import type { ContainerStats } from "../types.js";

const containers = new Hono();

/**
 * Get mock container stats for development.
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
 * Get real container stats from Docker socket.
 * Phase 3 will implement actual Docker API calls.
 */
async function getRealContainerStats(): Promise<ContainerStats> {
  // TODO: Phase 3 - implement Docker socket calls
  // For now, return mock data
  return getMockContainerStats();
}

containers.get("/", async (c) => {
  const stats = config.mockHostStats
    ? getMockContainerStats()
    : await getRealContainerStats();

  return c.json({
    data: stats,
    mockMode: config.mockHostStats,
  });
});

export { containers };
