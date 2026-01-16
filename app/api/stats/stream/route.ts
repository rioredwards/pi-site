import { devLog } from "../../../lib/utils";

// Force dynamic - this should never be cached
export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Fetch from the Hono streamText endpoint
        const response = await fetch("http://localhost:8787/streamText");

        devLog("🔵 response:", response);

        if (!response.body) {
          devLog("🔴 response.body is null");
          controller.close();
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            devLog("💚 done");
            controller.close();
            break;
          }

          devLog("🔵 value:", value);

          // Decode the chunk and wrap it in SSE format
          const text = decoder.decode(value, { stream: true });
          // Split by newlines to handle multiple messages
          const lines = text.split("\n").filter((line) => line.trim());

          for (const line of lines) {
            // Format as SSE: data: <content>\n\n
            devLog("🔵 line:", line);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(line)}\n\n`));
          }
        }
      } catch (error) {
        devLog("🔴 Stream error:", error);
        controller.error(error);
      }
    },

    cancel() {
      // Cleanup handled by the fetch stream
      devLog("🔴 cancel");
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
