import type { CombinedStats } from "@pi-site/shared/types.js";
import { Hono } from "hono";
import { collectContainerStats } from "../collectors/containers.js";
import { collectHostStats } from "../collectors/host.js";
import { collectServiceHealth } from "../collectors/services.js";
import { config } from "../config.js";

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
