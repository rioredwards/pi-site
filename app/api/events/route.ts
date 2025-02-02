export async function GET() {
  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Function to send events
      const sendEvent = (data: string) => {
        const formattedEvent = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(formattedEvent);
      };

      // Send initial connection message
      sendEvent("Connected to server-sent events");

      // Simulate periodic updates
      const intervalId = setInterval(() => {
        const timestamp = new Date().toISOString();
        sendEvent(`Server time: ${timestamp}`);
      }, 2000);

      // Optional: Handle stream cancellation
      return () => {
        clearInterval(intervalId);
        controller.close();
      };
    },
  });

  // Return the stream with appropriate headers for SSE
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-open",
    },
  });
}
