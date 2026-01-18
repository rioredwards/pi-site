import type { Context, Next } from "hono";
import { config } from "../config.js";

const AUTH_HEADER = "X-Profiler-Token";

/**
 * Token-based auth middleware.
 * If PROFILER_AUTH_TOKEN is set, requires matching X-Profiler-Token header.
 * If not set, auth is disabled (dev mode).
 */
export async function authMiddleware(c: Context, next: Next) {
  // If no token configured, auth is disabled
  if (!config.authToken) {
    return next();
  }

  const token = c.req.header(AUTH_HEADER);

  if (!token) {
    return c.json({ error: "Missing authentication token" }, 401);
  }

  if (token !== config.authToken) {
    return c.json({ error: "Invalid authentication token" }, 401);
  }

  return next();
}
