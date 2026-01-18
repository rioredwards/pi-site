import { Hono } from "hono";
import { config } from "../config.js";
import { collectServiceHealth } from "../collectors/services.js";

const services = new Hono();

services.get("/", async (c) => {
  const stats = await collectServiceHealth();

  return c.json({
    data: stats,
    mockMode: config.mockHostStats,
  });
});

export { services };
