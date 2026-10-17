import { constants } from "node:fs";
import { open } from "node:fs/promises";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import sharp from "sharp";
import {
  imageDirectory,
  MAX_PHOTO_BYTES,
  rasterContentType,
  storedImagePath,
} from "../../../lib/image-security";

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
  if (
    !["images", "profiles"].includes(parts[0]) ||
    parts.length !== expectedLength
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
    let bytes: Buffer;
    try {
      const stats = await file.stat();
      if (!stats.isFile() || stats.size > MAX_PHOTO_BYTES)
        throw new Error("Invalid asset");
      bytes = await file.readFile();
    } finally {
      await file.close();
    }
    // Older uploads may end in -blob. Trust raster contents, never the extension.
    const contentType = rasterContentType(bytes, true);
    if (!contentType) throw new Error("Invalid raster asset");
    const metadata = await sharp(bytes, {
      limitInputPixels: 25_000_000,
      failOn: "warning",
    }).metadata();
    if (`image/${metadata.format}` !== contentType)
      throw new Error("Invalid raster asset");
    return new NextResponse(
      Readable.toWeb(Readable.from([bytes])) as ReadableStream,
      {
        headers: {
          "Content-Type": contentType,
          "Content-Length": bytes.length.toString(),
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
