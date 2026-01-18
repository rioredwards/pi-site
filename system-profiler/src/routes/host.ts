import { Hono } from "hono";
import { config } from "../config.js";
import { collectHostStats } from "../collectors/host.js";

const host = new Hono();

host.get("/", async (c) => {
  const stats = await collectHostStats();

  return c.json({
    data: stats,
    mockMode: config.mockHostStats,
  });
});

export { host };
