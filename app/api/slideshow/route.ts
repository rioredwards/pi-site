import { deletePhoto, getPhoto } from "../../actions";

export async function GET() {
  const encoder = new TextEncoder();

  const abortController = new AbortController();
  const signal = abortController.signal;

  const stream = new ReadableStream({
    async start(controller) {
      let isConnected = true;

      signal.addEventListener("abort", () => {
        isConnected = false;
      });

      while (isConnected) {
        console.log("Fetching photo...");
        let photo: any;
        try {
          photo = await getPhoto();
        } catch (error) {
          console.error("Error fetching photo:", error);
        }
        const data = encoder.encode(
          `data: ${JSON.stringify({ photo: photo.data, error: photo.error })}\n\n`
        );
        controller.enqueue(data);
        // Delete the photo
        await new Promise<void>((resolve) =>
          setTimeout(async () => {
            if (photo.data) {
              try {
                await deletePhoto(photo.data.id, photo.data.imgFilename);
              } catch (error) {
                console.log("Error deleting the oldest photo:", error);
              }
            }
            resolve();
          }, 10000)
        ); // Change slide every 10 seconds
      }
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
