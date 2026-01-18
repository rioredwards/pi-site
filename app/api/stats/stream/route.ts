import { CombinedStats, SystemProfilerResponse } from "@/shared/types";
import { devLog } from "../../../lib/utils";

export const runtime = "nodejs";
// Force dynamic - this should never be cached
export const dynamic = "force-dynamic";

const POLL_INTERVAL_MS = 2000;

// --- Env helpers ---
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is not set`);
  return value;
}

function getSystemProfilerBaseUrl(): string {
  return requireEnv("SYSTEM_PROFILER_BASE_URL");
}

function getSystemProfilerAuthToken(): string {
  return requireEnv("SYSTEM_PROFILER_AUTH_TOKEN");
}

// --- Shared poller state ---
let latestStats: CombinedStats | null = null;
let pollerStarted = false;
let pollTimer: ReturnType<typeof setInterval> | null = null;

const clients = new Set<ReadableStreamDefaultController<string>>();

function toSseData(payload: unknown): string {
  // SSE format: "data: <json>\n\n"
  return `data: ${JSON.stringify(payload)}\n\n`;
}

function broadcast(data: CombinedStats | null) {
  const payload = toSseData(data);

  for (const controller of clients) {
    try {
      controller.enqueue(payload);
    } catch (err) {
      // If a controller is closed/errored, remove it
      clients.delete(controller);
      devLog("🔴 [stream/server] Removed closed controller from clients:", err);
    }
  }
}

async function fetchStats(): Promise<CombinedStats | null> {
  const url = `${getSystemProfilerBaseUrl()}/stats`;
  const authToken = getSystemProfilerAuthToken();

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

  devLog("🔵 [stream/server] Starting system-stats poller");

  // initial + interval
  void pollOnce();
  pollTimer = setInterval(() => void pollOnce(), POLL_INTERVAL_MS);
}

export async function GET() {
  startPoller();

  const stream = new ReadableStream<string>({
    start(controller) {
      clients.add(controller);
      devLog("🔵 [stream/server] clients after add:", Array.from(clients).length);

      // Send immediately if we already have data (or even if it's null—your call).
      if (latestStats !== null) {
        const payload = toSseData(latestStats);
        devLog("🔵 [stream/server] enqueuing initial payload:", payload);
        controller.enqueue(payload);
      }
    },
    cancel() {
      // NOTE: cancel doesn't provide the same controller instance here reliably to delete,
      // so cleanup is primarily handled by enqueue try/catch.
      // Still, we can’t identify which controller canceled from here.
      devLog("🔵 [stream/server] stream canceled by client");
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
