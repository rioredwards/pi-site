import { createReadStream, existsSync, statSync } from "fs";
import { NextResponse } from "next/server";
import { join } from "path";
import { devLog } from "../../../../lib/utils";

// This route serves as a fallback for development when Nginx isn't handling static files
// In production, Nginx should serve images directly from /images/ for better performance
// See: https://github.com/vercel/next.js/discussions/16417#discussioncomment-11647448

// Map file extensions to MIME types
const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

export async function GET(_req: Request, { params }: { params: Promise<{ dir: string[] }> }) {
  const dir = (await params).dir.join("/");
  if (!dir) {
    return new NextResponse(null, { status: 500 });
  }

  // Prevent path traversal attacks
  if (dir.indexOf("..") >= 0) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    // Use absolute path to ensure it works with standalone mode and Docker
    const filePath = join(process.cwd(), "public", dir);

    // Check if file exists
    if (!existsSync(filePath)) {
      return new NextResponse(null, { status: 404 });
    }

    // Get file stats for Content-Length and caching
    const stats = statSync(filePath);

    // Determine MIME type from file extension
    const ext = filePath.substring(filePath.lastIndexOf(".")).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    // Create read stream for efficient file serving
    const stream = createReadStream(filePath);

    // Convert Node.js stream to Web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        stream.on("data", (chunk) => {
          // `createReadStream` can emit either Buffer or string depending on encoding;
          // normalize to Uint8Array for the Web ReadableStream.
          if (typeof chunk === "string") {
            controller.enqueue(new TextEncoder().encode(chunk));
          } else {
            // Node Buffers are Uint8Array subclasses, so this is a zero-copy view.
            controller.enqueue(new Uint8Array(chunk));
          }
        });
        stream.on("end", () => controller.close());
        stream.on("error", (error) => controller.error(error));
      },
      cancel() {
        stream.destroy();
      },
    });

    // Return response with proper headers for caching
    return new NextResponse(webStream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": stats.size.toString(),
        // Cache for 1 year (images have UUID filenames, so they're immutable)
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    devLog("Error serving file:", error);
    return new NextResponse(null, { status: 500 });
  }
}
