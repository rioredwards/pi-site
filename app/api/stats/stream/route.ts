import { devLog } from "../../../lib/utils";

export const runtime = "nodejs";
// Force dynamic - this should never be cached
export const dynamic = "force-dynamic";

const POLL_INTERVAL = 2000;

function getSystemProfilerBaseUrl(): string {
  if (!process.env.SYSTEM_PROFILER_BASE_URL) {
    throw new Error("SYSTEM_PROFILER_BASE_URL is not set");
  }
  return process.env.SYSTEM_PROFILER_BASE_URL!;
}

function getSystemProfilerAuthToken(): string {
  if (!process.env.SYSTEM_PROFILER_AUTH_TOKEN) {
    throw new Error("SYSTEM_PROFILER_AUTH_TOKEN is not set");
  }
  return process.env.SYSTEM_PROFILER_AUTH_TOKEN!;
}

let latestStats: any = null;
let pollerStarted = false;
const clients = new Set<ReadableStreamDefaultController>();

async function startPoller() {
  if (pollerStarted) return;
  pollerStarted = true;
  devLog("🔵 [stream/server] Starting system-stats poller");

  async function poll() {
    try {
      const url = `${getSystemProfilerBaseUrl()}/stats`;
      devLog("🔵 [stream/server] polling url: ", url);
      const authToken = getSystemProfilerAuthToken(); 
      devLog("🔵 [stream/server] polling authToken: ", authToken);
      const res = await fetch(url, { headers: { "X-Profiler-Token": authToken } });
      devLog("🔵 [stream/server] polling res: ", res);
      if (res.ok) {
        latestStats = await res.json();
        devLog("🔵 [stream/server] polling latestStats: ", latestStats);
        broadcast(latestStats);
      }
    } catch (err) {
      devLog("🔴 [stream/server] polling error: ", err);
    }
  }

  // initial + interval
  poll();
  setInterval(poll, POLL_INTERVAL);
}

function broadcast(data: any) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const controller of clients) {
    try {
      controller.enqueue(payload);
    } catch (err) {
      // Controller is already closed, remove it from clients
      clients.delete(controller);
      devLog("🔴 [stream/server] Removed closed controller from clients:", err);
    }
  }
}

export async function GET() {
  await startPoller();

  const stream = new ReadableStream({
    start(controller) {
      clients.add(controller);
      devLog("🔵 [stream/server] clients after add: ", Array.from(clients));
      // send immediately if we already have data
      if (latestStats) {
        const payload = `data: ${JSON.stringify(latestStats)}\n\n`;
        devLog("🔵 [stream/server] enqueuing payload: ", payload);
        controller.enqueue(payload);
      }
    },
    cancel(controller) {
      clients.delete(controller);
      devLog("🔵 [stream/server] clients after delete: ", Array.from(clients));
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
