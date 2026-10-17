import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { Hono } from "hono";

process.env.SYSTEM_PROFILER_AUTH_TOKEN = "test-only-token";
const { authMiddleware } = await import("./middleware/auth.js");
const { routes } = await import("./routes/index.js");

test("profiler refuses startup without a token", () => {
  const result = spawnSync(process.execPath, ["--import", "tsx", "src/config.ts"], {
    cwd: new URL("../", import.meta.url),
    env: { ...process.env, SYSTEM_PROFILER_AUTH_TOKEN: "" }, encoding: "utf8",
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /SYSTEM_PROFILER_AUTH_TOKEN is required/);
});

test("every metrics route rejects missing or incorrect credentials", async () => {
  const app = new Hono();
  for (const name of ["stats", "host", "containers", "services"]) app.use(`/${name}/*`, authMiddleware);
  app.route("/", routes);
  for (const path of ["/stats", "/stats/", "/host", "/containers", "/services"]) {
    assert.equal((await app.request(path)).status, 401);
    assert.equal((await app.request(path, { headers: { "X-Profiler-Token": "wrong" } })).status, 401);
  }
  assert.equal((await app.request("/stats", { headers: { "X-Profiler-Token": "test-only-token" } })).status, 200);
});
