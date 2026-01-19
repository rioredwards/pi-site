import { createReadStream, existsSync, statSync } from "fs";
import { NextResponse } from "next/server";
import { join } from "path";
import { devLog } from "@/app/lib/utils";

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

// Upload directory from environment (matches where actions.ts uploads files)
const IMG_UPLOAD_DIR = process.env.IMG_UPLOAD_DIR! || join(process.cwd(), "public", "images");

export async function GET(_req: Request, { params }: { params: Promise<{ dir: string[] }> }) {
  const dirParts = (await params).dir;
  const dir = dirParts.join("/");
  if (!dir) {
    return new NextResponse(null, { status: 500 });
  }

  // Prevent path traversal attacks
  if (dir.indexOf("..") >= 0) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    let filePath: string;

    // If path starts with "images/", serve from the upload directory
    if (dirParts[0] === "images" && dirParts.length > 1) {
      const filename = dirParts.slice(1).join("/");
      filePath = join(IMG_UPLOAD_DIR, filename);
    } else if (dirParts[0] === "profiles" && dirParts.length > 1) {
      // Profile pictures are stored in IMG_UPLOAD_DIR/profiles/
      const filename = dirParts.slice(1).join("/");
      filePath = join(IMG_UPLOAD_DIR, "profiles", filename);
    } else {
      // Fallback to public directory for other assets
      filePath = join(process.cwd(), "public", dir);
    }

    devLog("Serving file from:", filePath);

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
