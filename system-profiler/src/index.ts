import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { config } from "./config.js";
import { authMiddleware } from "./middleware/auth.js";
import { routes } from "./routes/index.js";

const app = new Hono();

// Logging
app.use(logger());

// Root endpoint (no auth required)
app.get("/", (c) => c.text("system-profiler"));

// Health endpoint (no auth required for load balancer probes)
app.get("/health", (c) => {
  return c.json({
    ok: true,
    ...(config.mockHostStats && { mockMode: true }),
  });
});

// Protected routes - apply auth middleware
app.use("/stats/*", authMiddleware);
app.use("/host/*", authMiddleware);
app.use("/containers/*", authMiddleware);
app.use("/services/*", authMiddleware);

// Mount routes
app.route("/", routes);

serve(
  {
    fetch: app.fetch,
    port: config.port,
  },
  (info) => {
    console.log(`system-profiler listening on :${info.port}`);
    if (config.mockHostStats) {
      console.log("Running in mock mode (non-Linux or MOCK_HOST_STATS=true)");
    }
    if (!config.authToken) {
      console.log("Warning: No PROFILER_AUTH_TOKEN set - auth disabled");
    }
  },
);
