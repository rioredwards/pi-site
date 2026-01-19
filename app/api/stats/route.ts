import { CombinedStats, SystemProfilerResponse } from "@/shared/types";
import { devLog } from "../../lib/utils";

export const runtime = "nodejs";
// Force dynamic - this should never be cached
export const dynamic = "force-dynamic";

const POLL_INTERVAL_MS = 2000;

// --- Env helpers (don't throw - return null for graceful handling) ---
function getSystemProfilerBaseUrl(): string | null {
  return process.env.SYSTEM_PROFILER_BASE_URL ?? null;
}

function getSystemProfilerAuthToken(): string | null {
  return process.env.SYSTEM_PROFILER_AUTH_TOKEN ?? null;
}

function getConfigError(): string | null {
  if (!getSystemProfilerBaseUrl()) return "SYSTEM_PROFILER_BASE_URL is not configured";
  if (!getSystemProfilerAuthToken()) return "SYSTEM_PROFILER_AUTH_TOKEN is not configured";
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
      client.controller.enqueue(payload);
    } catch {
      // Controller closed unexpectedly, mark and remove
      client.closed = true;
      clients.delete(id);
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
  devLog("🔵 [stream/server] polling url:", url);

  const res = await fetch(url, {
    headers: { "X-Profiler-Token": authToken },
  });

  if (!res.ok) {
    devLog("🔴 [stream/server] polling error:", res.status, res.statusText);
    return null;
  }

  const body = (await res.json()) as SystemProfilerResponse<CombinedStats>;

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

  return body.data;
}

async function pollOnce() {
  try {
    const next = await fetchStats();
    latestStats = next;
    // devLog("🔵 [stream/server] polling latestStats:", latestStats);
  } catch (err) {
    devLog("🔴 [stream/server] polling exception:", err);
    latestStats = null;
  }

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

export async function GET() {
  startPoller();

  // Unique ID for this client connection
  const clientId = Symbol("sse-client");

  const stream = new ReadableStream<string>({
    start(controller) {
      clients.set(clientId, { controller, closed: false });
      devLog("🔵 [stream/server] clients after add:", clients.size);

      // Send immediately if we already have data
      if (latestStats !== null) {
        const payload = toSseData(latestStats);
        devLog("🔵 [stream/server] enqueuing initial payload");
        controller.enqueue(payload);
      }
    },
    cancel() {
      // Mark as closed and remove
      const client = clients.get(clientId);
      if (client) {
        client.closed = true;
        clients.delete(clientId);
      }
      devLog("🔵 [stream/server] stream canceled, clients remaining:", clients.size);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
