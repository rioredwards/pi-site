import { constants } from "node:fs";
import { open } from "node:fs/promises";
import { extname } from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { imageDirectory, storedImagePath } from "../../../lib/image-security";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif", // Existing gallery images remain readable.
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ dir: string[] }> },
) {
  const parts = (await params).dir;
  const profile =
    parts[0] === "profiles" ||
    (parts[0] === "images" && parts[1] === "profiles");
  const expectedLength = profile && parts[0] === "images" ? 3 : 2;
  const filename = parts.at(-1) ?? "";
  const contentType = MIME_TYPES[extname(filename).toLowerCase()];
  if (
    !["images", "profiles"].includes(parts[0]) ||
    parts.length !== expectedLength ||
    !contentType
  ) {
    return new NextResponse(null, { status: 404 });
  }
  try {
    const root = process.env.IMG_UPLOAD_DIR;
    if (!root) throw new Error("Image storage is not configured");
    const directory = await imageDirectory(root, profile);
    const file = await open(
      storedImagePath(directory, filename),
      constants.O_RDONLY | constants.O_NOFOLLOW,
    );
    const stats = await file.stat();
    if (!stats.isFile()) {
      await file.close();
      return new NextResponse(null, { status: 404 });
    }
    return new NextResponse(
      Readable.toWeb(file.createReadStream()) as ReadableStream,
      {
        headers: {
          "Content-Type": contentType,
          "Content-Length": stats.size.toString(),
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff",
          "Content-Security-Policy": "default-src 'none'; sandbox",
          "Cross-Origin-Resource-Policy": "same-origin",
        },
      },
    );
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
