import { Hono } from "hono";
import os from "os";
import { config } from "../config.js";
import type { HostStats } from "../types.js";

const host = new Hono();

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
 * Get real host stats from /proc and /sys.
 * Phase 2 will implement actual parsing.
 */
async function getRealHostStats(): Promise<HostStats> {
  // TODO: Phase 2 - implement real /proc parsing
  // For now, return mock data with a note
  return getMockHostStats();
}

host.get("/", async (c) => {
  const stats = config.mockHostStats
    ? getMockHostStats()
    : await getRealHostStats();

  return c.json({
    data: stats,
    mockMode: config.mockHostStats,
  });
});

export { host };
