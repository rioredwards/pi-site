import { Hono } from "hono";
import { config } from "../config.js";
import type { HealthResponse } from "../types.js";

const health = new Hono();

health.get("/", (c) => {
  const response: HealthResponse = {
    ok: true,
    ...(config.mockHostStats && { mockMode: true }),
  };
  return c.json(response);
});

export { health };
