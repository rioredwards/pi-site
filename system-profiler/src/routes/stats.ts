import { Hono } from "hono";
import { config } from "../config.js";
import { collectHostStats } from "../collectors/host.js";
import { collectContainerStats } from "../collectors/containers.js";
import { collectServiceHealth } from "../collectors/services.js";
import type { CombinedStats } from "../types.js";

const stats = new Hono();

stats.get("/", async (c) => {
  const [hostStats, containerStats, serviceHealth] = await Promise.all([
    collectHostStats(),
    collectContainerStats(),
    collectServiceHealth(),
  ]);

  const combined: CombinedStats = {
    timestamp: new Date().toISOString(),
    host: hostStats,
    containers: containerStats,
    services: serviceHealth,
  };

  return c.json({
    data: combined,
    mockMode: config.mockHostStats,
  });
});

export { stats };
