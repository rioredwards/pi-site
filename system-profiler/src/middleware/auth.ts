import type { Context, Next } from "hono";
import { config } from "../config.js";

const AUTH_HEADER = "X-Profiler-Token";

// Configuration rejects missing tokens before the server can start.
export async function authMiddleware(c: Context, next: Next) {
  const token = c.req.header(AUTH_HEADER);

  if (!token) {
    return c.json({ error: "Missing authentication token" }, 401);
  }

  if (token !== config.authToken) {
    return c.json({ error: "Invalid authentication token" }, 401);
  }

  return next();
}
