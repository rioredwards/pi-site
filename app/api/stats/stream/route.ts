import { getLiveSystemStats } from "@/app/lib/system-stats";
import { devLog } from "../../../lib/utils";

// Force dynamic - this should never be cached
export const dynamic = "force-dynamic";

const INTERVAL_MS = 5000;

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial data immediately
      const initialData = getLiveSystemStats();
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialData)}\n\n`));

      // Set up interval to send updates every 5 seconds
      const intervalId = setInterval(() => {
        try {
          const stats = getLiveSystemStats();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(stats)}\n\n`));
        } catch (error) {
          devLog("Error getting live stats:", error);
          // Send error event but don't close the stream
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({ error: "Failed to get stats" })}\n\n`
            )
          );
        }
      }, INTERVAL_MS);

      // Clean up when the connection is closed
      // Note: This is handled by the cancel callback below
      // Store the interval ID for cleanup
      (controller as any)._intervalId = intervalId;
    },

    cancel(controller) {
      // Clean up the interval when client disconnects
      const intervalId = (controller as any)._intervalId;
      if (intervalId) {
        clearInterval(intervalId);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable Nginx buffering for SSE
    },
  });
}
