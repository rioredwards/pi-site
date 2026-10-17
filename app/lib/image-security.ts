import { randomUUID } from "node:crypto";
import { mkdir, realpath, statfs, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import sharp from "sharp";
import type { AnalysisResult } from "./imgValidatorTypes";

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const MAX_PROFILE_BYTES = 2 * 1024 * 1024;
export const MAX_MULTIPART_BYTES = MAX_PHOTO_BYTES + 64 * 1024;
const INVALID_IMAGE =
  "Upload a valid JPEG, PNG, or WebP image within the size limit.";

export function rasterContentType(
  bytes: Buffer,
  allowGif = false,
): string | null {
  // Reject other decoders, including SVG, before invoking a native image parser.
  if (bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])))
    return "image/jpeg";
  if (
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return "image/png";
  if (
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  )
    return "image/webp";
  if (allowGif && ["GIF87a", "GIF89a"].includes(bytes.toString("ascii", 0, 6)))
    return "image/gif";
  return null;
}

export async function normalizeImage(
  file: File,
  maxBytes: number,
): Promise<Buffer> {
  if (!(file instanceof File) || file.size === 0 || file.size > maxBytes) {
    throw new Error(INVALID_IMAGE);
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const mime = rasterContentType(bytes);
  if (!mime || file.type !== mime || bytes.length > maxBytes)
    throw new Error(INVALID_IMAGE);
  try {
    const image = sharp(bytes, {
      limitInputPixels: 25_000_000,
      failOn: "warning",
    });
    const metadata = await image.metadata();
    if (
      !metadata.width ||
      !metadata.height ||
      metadata.width > 8192 ||
      metadata.height > 8192 ||
      (metadata.pages ?? 1) !== 1
    ) {
      throw new Error(INVALID_IMAGE);
    }
    // Decode every pixel, orient it, strip metadata and discard all source container bytes.
    const normalized = await image
      .rotate()
      .webp({ quality: 85 })
      .timeout({ seconds: 10 })
      .toBuffer();
    if (normalized.length > MAX_PHOTO_BYTES) throw new Error(INVALID_IMAGE);
    return normalized;
  } catch {
    throw new Error(INVALID_IMAGE);
  }
}

export async function analyzeRaster(
  bytes: Buffer,
  validatorUrl = process.env.PUBLIC_IMG_VALIDATOR_BASE_URL,
  timeoutMs = 15_000,
): Promise<AnalysisResult> {
  try {
    if (!validatorUrl) throw new Error("Validator URL missing");
    const form = new FormData();
    form.append(
      "file",
      new File([Uint8Array.from(bytes)], "image.webp", { type: "image/webp" }),
    );
    const response = await fetch(
      `${validatorUrl.replace(/\/+$/, "")}/analyze`,
      {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(timeoutMs),
        redirect: "error",
      },
    );
    if (!response.ok) throw new Error("Validator unavailable");
    const result = await response.json();
    const probability = (value: unknown) =>
      typeof value === "number" &&
      Number.isFinite(value) &&
      value >= 0 &&
      value <= 1;
    if (
      !result ||
      typeof result.is_nsfw !== "boolean" ||
      typeof result.is_dog !== "boolean" ||
      !probability(result.nsfw_score) ||
      !probability(result.dog_probability) ||
      "error" in result
    ) {
      throw new Error("Invalid validator response");
    }
    return result;
  } catch {
    throw new Error("Image validation failed. Please try again.");
  }
}

// Legacy raster filenames remain readable; separators and parent paths never do.
export function storedImagePath(directory: string, filename: string): string {
  const root = resolve(directory);
  const target = resolve(root, filename);
  if (
    !filename ||
    filename === "." ||
    filename === ".." ||
    /[\\/\0]/.test(filename) ||
    basename(filename) !== filename ||
    dirname(target) !== root
  ) {
    throw new Error("Invalid image filename");
  }
  return target;
}

export async function imageDirectory(
  root: string,
  profile = false,
): Promise<string> {
  const base = await realpath(root);
  if (!profile) return base;
  const directory = await realpath(resolve(base, "profiles"));
  if (dirname(directory) !== base) throw new Error("Invalid image directory");
  return directory;
}

export async function saveImageUpload(
  file: File,
  root: string,
  options: {
    maxBytes: number;
    requireDog: boolean;
    profile?: boolean;
    validatorUrl?: string;
    timeoutMs?: number;
  },
): Promise<{ id: string; filename: string; path: string }> {
  const bytes = await normalizeImage(file, options.maxBytes);
  const analysis = await analyzeRaster(
    bytes,
    options.validatorUrl,
    options.timeoutMs,
  );
  if (analysis.is_nsfw)
    throw new Error("This image may contain inappropriate content.");
  if (options.requireDog && !analysis.is_dog)
    throw new Error("Please upload a photo containing a dog.");
  // No filesystem or database writes occur until decoding and validation both pass.
  let storageRoot: string;
  try {
    storageRoot = await realpath(root);
    const filesystem = await statfs(storageRoot, { bigint: true });
    if (
      filesystem.bavail * filesystem.bsize <
      BigInt(512 * 1024 * 1024 + bytes.length)
    ) {
      throw new Error("Insufficient storage reserve");
    }
  } catch {
    throw new Error(
      "Image uploads are temporarily unavailable. Please try again later.",
    );
  }
  if (options.profile)
    await mkdir(resolve(storageRoot, "profiles"), { recursive: true });
  const directory = await imageDirectory(storageRoot, options.profile);
  const id = randomUUID();
  const filename = `${id}.webp`;
  const path = storedImagePath(directory, filename);
  await writeFile(path, bytes, { flag: "wx", mode: 0o644 });
  return { id, filename, path };
}

export async function removeStoredImage(
  root: string,
  filename: string,
  profile = false,
): Promise<void> {
  const directory = await imageDirectory(root, profile);
  await unlink(storedImagePath(directory, filename)).catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    },
  );
}

// Cleanup cannot change whether the upload was persisted.
export async function cleanupUploadFile(
  remove: () => Promise<void>,
): Promise<void> {
  try {
    await remove();
  } catch {
    // eslint-disable-next-line no-console -- Cleanup failures need a production signal without private paths.
    console.error("Image cleanup failed; a stored file may need removal.");
  }
}
