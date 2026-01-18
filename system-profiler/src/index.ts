import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import os from "os";

const app = new Hono();
app.use(logger());

type SystemStats = {
  platform: string;
  arch: string;
  hostname: string;
  cpuCount: number;
  uptimeSeconds: number;
  loadavg: [number, number, number];
  totalMemBytes: number;
  freeMemBytes: number;
};

function getSystemStats(): SystemStats {
  return {
    platform: os.platform(),
    arch: os.arch(),
    hostname: os.hostname(),
    cpuCount: os.cpus().length,
    uptimeSeconds: os.uptime(),
    loadavg: os.loadavg() as [number, number, number],
    totalMemBytes: os.totalmem(),
    freeMemBytes: os.freemem(),
  };
}

app.get("/", (c) => c.text("system-profiler"));

app.get("/health", (c) => c.json({ ok: true }));

app.get("/stats", (c) => {
  return c.json({
    timestamp: new Date().toISOString(),
    stats: getSystemStats(),
  });
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 8787;

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`system-profiler listening on :${info.port}`);
  }
);
