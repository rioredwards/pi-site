import { Hono } from "hono";
import os from "os";
import { config } from "../config.js";
import type { CombinedStats, HostStats, ContainerStats, ServiceHealthStats } from "../types.js";

const stats = new Hono();

/**
 * Get mock host stats for development on non-Linux systems.
 */
function getMockHostStats(): HostStats {
  return {
    cpu: {
      usagePercent: 25.5,
      loadAverage: os.loadavg() as [number, number, number],
      cores: os.cpus().length,
    },
    memory: {
      totalBytes: os.totalmem(),
      usedBytes: os.totalmem() - os.freemem(),
      freeBytes: os.freemem(),
      availableBytes: os.freemem(),
      usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
    },
    disks: [
      {
        mountPoint: "/",
        totalBytes: 100 * 1024 * 1024 * 1024,
        usedBytes: 50 * 1024 * 1024 * 1024,
        freeBytes: 50 * 1024 * 1024 * 1024,
        usagePercent: 50,
      },
    ],
    temperature: {
      cpuCelsius: null,
      available: false,
    },
    network: {
      interfaces: [
        { name: "eth0", rxBytes: 1024 * 1024 * 100, txBytes: 1024 * 1024 * 50 },
      ],
    },
    system: {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      uptimeSeconds: os.uptime(),
      kernelVersion: null,
    },
  };
}

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

stats.get("/", async (c) => {
  const combined: CombinedStats = {
    timestamp: new Date().toISOString(),
    host: getMockHostStats(),
    containers: getMockContainerStats(),
    services: getMockServiceHealth(),
  };

  return c.json({
    data: combined,
    mockMode: config.mockHostStats,
  });
});

export { stats };
