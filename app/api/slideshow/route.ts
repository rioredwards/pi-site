// import { getNextPhoto } from "@/app/actions/photoActions"

import { deletePhoto, getPhoto } from "../../actions";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      while (true) {
        const photo = await getPhoto();
        if (!photo.data) {
          controller.error("No photos found");
          controller.close();
          return;
        }
        const data = encoder.encode(`data: ${JSON.stringify(photo.data)}\n\n`);
        controller.enqueue(data);
        // Delete the photo
        // await deletePhoto(photo.data.id, photo.data.imgFilename);
        await new Promise<void>((resolve) =>
          setTimeout(async () => {
            await deletePhoto(photo.data.id, photo.data.imgFilename);
            resolve();
          }, 5000)
        ); // Change slide every 5 seconds
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
