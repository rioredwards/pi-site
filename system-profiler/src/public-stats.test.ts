import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { test } from "node:test";
import { build } from "esbuild";

process.env.SYSTEM_PROFILER_AUTH_TOKEN = "test-only-token";
process.env.SYSTEM_PROFILER_BASE_URL = "http://test-profiler";
const { getMockHostStats } = await import("./collectors/host.js");
const { getMockContainerStats } = await import("./collectors/containers.js");
const { getMockServiceHealth } = await import("./collectors/services.js");

test("public stream hides infrastructure data, caps clients and cleans up aborts", async () => {
  const directory = await mkdtemp(join(tmpdir(), "dogtown-stats-test-"));
  const originalFetch = globalThis.fetch;
  const controllers: AbortController[] = [];
  try {
    const outfile = join(directory, "route.mjs");
    await build({
      entryPoints: [new URL("../../app/api/stats/route.ts", import.meta.url).pathname],
      bundle: true, platform: "node", format: "esm", outfile,
      plugins: [{ name: "quiet-logging", setup(builder) {
        builder.onResolve({ filter: /lib\/utils$/ }, () => ({ path: "logging", namespace: "test" }));
        builder.onLoad({ filter: /.*/, namespace: "test" }, () => ({ contents: "export const devLog = () => {};" }));
      } }],
    });
    const data = { timestamp: new Date().toISOString(), host: getMockHostStats(),
      containers: getMockContainerStats(), services: getMockServiceHealth(), secret: "sensitive-marker" };
    data.host.system.hostname = "private-host-marker";
    data.host.system.kernelVersion = "private-kernel-marker";
    data.containers.containers[0].image = "private-image-marker";
    data.services.services[0].url = "http://private-service-marker";
    data.services.services[0].error = "private-error-marker";
    globalThis.fetch = async () => Response.json({ data });
    const { GET } = await import(pathToFileURL(outfile).href);
    const first = new AbortController();
    controllers.push(first);
    const response = await GET(new Request("http://test/api/stats", { signal: first.signal }));
    assert.equal(response.status, 200);
    const reader = response.body.getReader();
    const { value } = await reader.read();
    const payload = typeof value === "string" ? value : new TextDecoder().decode(value);
    assert.doesNotMatch(payload, /private-|sensitive-marker|tcp:\/\/|http:\/\/web/);
    const stats = JSON.parse(payload.slice(6).trim());
    assert.equal(stats.host.system.hostname, "DogTown");
    assert.equal(stats.containers.containers[0].name, "web");
    assert.equal(stats.containers.containers[0].restartCount, null);
    assert.equal(stats.host.cpu.cores, data.host.cpu.cores);
    for (let i = 1; i < 32; i++) {
      const abort = new AbortController();
      controllers.push(abort);
      assert.equal((await GET(new Request("http://test/api/stats", { signal: abort.signal }))).status, 200);
    }
    assert.equal((await GET(new Request("http://test/api/stats"))).status, 503);
    controllers.forEach((abort) => abort.abort());
    assert.equal((await reader.read()).done, true);
  } finally {
    controllers.forEach((abort) => abort.abort());
    globalThis.fetch = originalFetch;
    await rm(directory, { recursive: true, force: true });
  }
});
