import { getLiveSystemStats } from "@/app/lib/system-stats";
import { devLog } from "../../../lib/utils";

// Force dynamic - this should never be cached
export const dynamic = "force-dynamic";

const INTERVAL_MS = 5000;

export async function GET() {
  const encoder = new TextEncoder();

  let intervalId: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial data immediately
      try {
        const initialData = getLiveSystemStats();
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialData)}\n\n`));
      } catch (error) {
        devLog("Error getting initial live stats:", error);
        controller.enqueue(
          encoder.encode(
            `event: error\ndata: ${JSON.stringify({ error: "Failed to get initial stats" })}\n\n`
          )
        );
      }

      // Function to send periodic updates
      const sendUpdate = () => {
        try {
          // Check if controller is still active before enqueuing
          if (controller.desiredSize !== null && controller.desiredSize >= 0) {
            const stats = getLiveSystemStats();
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(stats)}\n\n`));
          } else {
            // Controller is closed, stop the interval
            if (intervalId) {
              clearInterval(intervalId);
              intervalId = null;
            }
            return;
          }
        } catch (error) {
          devLog("Error getting live stats:", error);
          try {
            // Check if controller is still active before sending error
            if (controller.desiredSize !== null && controller.desiredSize >= 0) {
              controller.enqueue(
                encoder.encode(
                  `event: error\ndata: ${JSON.stringify({ error: "Failed to get stats" })}\n\n`
                )
              );
            }
          } catch (enqueueError) {
            // Controller is closed, stop trying to send data
            if (intervalId) {
              clearInterval(intervalId);
              intervalId = null;
            }
            return;
          }
        }
      };

      // Set up interval to send updates every 5 seconds
      intervalId = setInterval(sendUpdate, INTERVAL_MS);
    },

    cancel() {
      // Clean up the interval when client disconnects
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
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
