import { CombinedStats, SystemProfilerResponse } from "@/shared/types";
import { devLog } from "../../lib/utils";

export const runtime = "nodejs";
// Force dynamic - this should never be cached
export const dynamic = "force-dynamic";

const POLL_INTERVAL_MS = 2000;
const MAX_CLIENTS = 32;
const MAX_RESPONSE_BYTES = 256 * 1024;
const MAX_CONNECTION_MS = 5 * 60 * 1000;
let polling = false;

// Rebuild the public contract from allowed fields. Never forward arbitrary profiler keys.
function publicStats(stats: CombinedStats): CombinedStats {
  const h = stats.host;
  const roles = ["ai-img-validator", "system-profiler", "web", "db", "umami"];
  const containers = stats.containers.containers.flatMap((c) => {
    const role = roles.find((name) => c.name === name || c.name.includes(`-${name}-`));
    if (!role) return [];
    return [{
      id: role, name: role, image: "", status: c.state, state: c.state,
      health: c.health, restartCount: 0, cpuPercent: c.cpuPercent,
      memoryUsageBytes: c.memoryUsageBytes, memoryLimitBytes: c.memoryLimitBytes,
      memoryPercent: c.memoryPercent,
    }];
  });
  return {
    timestamp: stats.timestamp,
    host: {
      cpu: { usagePercent: h.cpu.usagePercent, loadAverage: [...h.cpu.loadAverage], cores: h.cpu.cores },
      memory: { totalBytes: h.memory.totalBytes, usedBytes: h.memory.usedBytes,
        freeBytes: h.memory.freeBytes, availableBytes: h.memory.availableBytes, usagePercent: h.memory.usagePercent },
      disks: h.disks.map((d) => ({ mountPoint: "Storage", totalBytes: d.totalBytes,
        usedBytes: d.usedBytes, freeBytes: d.freeBytes, usagePercent: d.usagePercent })),
      temperature: { cpuCelsius: h.temperature.cpuCelsius, available: h.temperature.available },
      network: { interfaces: h.network.interfaces.map((n, i) => ({ name: `Network ${i + 1}`, rxBytes: n.rxBytes, txBytes: n.txBytes })) },
      system: { hostname: "DogTown", platform: h.system.platform, arch: h.system.arch,
        uptimeSeconds: h.system.uptimeSeconds, kernelVersion: null },
    },
    containers: { containers, summary: { total: containers.length,
      running: containers.filter((c) => c.state === "running").length,
      stopped: containers.filter((c) => c.state === "exited").length,
      unhealthy: containers.filter((c) => c.health === "unhealthy").length } },
    services: { allHealthy: stats.services.allHealthy,
      services: stats.services.services.filter((s) => roles.includes(s.name)).map((s) => ({
        name: s.name, url: "", healthy: s.healthy, responseTimeMs: s.responseTimeMs,
        error: s.healthy ? null : "Unavailable",
      })) },
  };
}

// --- Env helpers (don't throw - return null for graceful handling) ---
function getSystemProfilerBaseUrl(): string | null {
  return process.env.SYSTEM_PROFILER_BASE_URL ?? null;
}

function getSystemProfilerAuthToken(): string | null {
  return process.env.SYSTEM_PROFILER_AUTH_TOKEN ?? null;
}

function getConfigError(): string | null {
  if (!getSystemProfilerBaseUrl())
    return "SYSTEM_PROFILER_BASE_URL is not configured";
  if (!getSystemProfilerAuthToken())
    return "SYSTEM_PROFILER_AUTH_TOKEN is not configured";
  return null;
}

// --- Shared poller state ---
let latestStats: CombinedStats | null = null;
let pollerStarted = false;
let pollTimer: ReturnType<typeof setInterval> | null = null;

// Track clients with their closed state
interface ClientController {
  controller: ReadableStreamDefaultController<string>;
  closed: boolean;
  cleanup: () => void;
}

const clients = new Map<symbol, ClientController>();

function toSseData(payload: unknown): string {
  // SSE format: "data: <json>\n\n"
  return `data: ${JSON.stringify(payload)}\n\n`;
}

function broadcast(data: CombinedStats | null) {
  const payload = toSseData(data);

  for (const [id, client] of clients) {
    if (client.closed) {
      clients.delete(id);
      continue;
    }
    try {
      if ((client.controller.desiredSize ?? 0) <= 0) {
        client.controller.close();
        removeClient(id);
        continue;
      }
      client.controller.enqueue(payload);
    } catch {
      // Controller closed unexpectedly, mark and remove
      removeClient(id);
      devLog("🔵 [stream/server] Removed closed client");
    }
  }
}

async function fetchStats(): Promise<CombinedStats | null> {
  const baseUrl = getSystemProfilerBaseUrl();
  const authToken = getSystemProfilerAuthToken();

  // Config missing - handled gracefully
  if (!baseUrl || !authToken) {
    return null;
  }

  const url = `${baseUrl}/stats`;
  // devLog("🔵 [stream/server] polling url:", url);

  const res = await fetch(url, {
    headers: { "X-Profiler-Token": authToken },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });

  if (!res.ok) {
    devLog("🔴 [stream/server] polling error:", res.status, res.statusText);
    return null;
  }

  const reader = res.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const body = JSON.parse(Buffer.concat(chunks).toString()) as SystemProfilerResponse<CombinedStats>;

  if (body.error) {
    devLog("🔴 [stream/server] polling body.error:", body.error);
    return null;
  }

  // If your API contract says data always exists on success,
  // this guard makes the type safe in case of unexpected responses.
  if (!body.data) {
    devLog("🔴 [stream/server] polling error: missing body.data");
    return null;
  }

  return publicStats(body.data);
}

async function pollOnce() {
  if (polling || clients.size === 0) return;
  polling = true;
  try {
    const next = await fetchStats();
    latestStats = next;
    // devLog("🔵 [stream/server] polling latestStats:", latestStats);
  } catch (err) {
    devLog("🔴 [stream/server] polling exception:", err);
    latestStats = null;
  }

  polling = false;
  broadcast(latestStats);
}

function startPoller() {
  if (pollerStarted) return;
  pollerStarted = true;

  const configError = getConfigError();
  if (configError) {
    devLog("🔴 [stream/server] Cannot start poller:", configError);
    return;
  }

  devLog("🔵 [stream/server] Starting system-stats poller");

  // initial + interval
  void pollOnce();
  pollTimer = setInterval(() => void pollOnce(), POLL_INTERVAL_MS);
}

function stopPoller() {
  if (!pollerStarted) return;

  devLog("🔵 [stream/server] Stopping system-stats poller (no clients)");

  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  pollerStarted = false;
  latestStats = null;
}

function removeClient(clientId: symbol) {
  const client = clients.get(clientId);
  if (client) {
    client.closed = true;
    client.cleanup();
    try { client.controller.close(); } catch { /* Already closed. */ }
    clients.delete(clientId);
  }

  devLog("🔵 [stream/server] client removed, clients remaining:", clients.size);

  // Stop polling if no clients remain
  if (clients.size === 0) {
    stopPoller();
  }
}

export async function GET(request: Request) {
  if (clients.size >= MAX_CLIENTS) return new Response("Stats stream busy", { status: 503 });
  if (getConfigError()) return new Response("Stats unavailable", { status: 503 });

  // Unique ID for this client connection
  const clientId = Symbol("sse-client");

  let connectionTimer: ReturnType<typeof setTimeout>;
  const onAbort = () => removeClient(clientId);
  const stream = new ReadableStream<string>({
    start(controller) {
      clients.set(clientId, { controller, closed: false, cleanup: () => {
        clearTimeout(connectionTimer);
        request.signal.removeEventListener("abort", onAbort);
      } });
      startPoller();
      connectionTimer = setTimeout(() => {
        removeClient(clientId);
        try { controller.close(); } catch { /* Already closed. */ }
      }, MAX_CONNECTION_MS);
      devLog("🔵 [stream/server] clients after add:", clients.size);

      // Send immediately if we already have data
      if (latestStats !== null) {
        const payload = toSseData(latestStats);
        devLog("🔵 [stream/server] enqueuing initial payload");
        controller.enqueue(payload);
      }

      // Listen for client disconnect via abort signal - this is the reliable way
      // to detect when an SSE client disconnects (cancel() is not always triggered)
      request.signal.addEventListener("abort", onAbort, { once: true });
      if (request.signal.aborted) onAbort();
    },
    cancel() {
      clearTimeout(connectionTimer);
      request.signal.removeEventListener("abort", onAbort);
      removeClient(clientId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
  });
}
