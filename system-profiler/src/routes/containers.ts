import { Hono } from "hono";
import { config } from "../config.js";
import { collectContainerStats } from "../collectors/containers.js";

const containers = new Hono();

containers.get("/", async (c) => {
  const stats = await collectContainerStats();

  return c.json({
    data: stats,
    mockMode: config.mockHostStats,
  });
});

export { containers };
