"use server";

import { authOptions } from "@/app/auth";
import { accessSync, constants, existsSync, mkdirSync, statSync, unlinkSync } from "fs";
import { writeFile } from "fs/promises";
import { getServerSession } from "next-auth";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../lib/prisma";
import { Photo } from "../lib/types";

export type APIResponse<T> = { data: T; error: undefined } | { data: undefined; error: string };

// Always use absolute path - process.cwd() is unreliable in production
// Use environment variable if set (from PM2/Docker), otherwise fall back to hardcoded path
const IMG_UPLOAD_DIR = process.env.UPLOAD_DIR || "/home/rioredwards/pi-site/public/images";
const IMG_READ_DIR = "/api/assets/images/";

export async function uploadPhoto(formData: FormData): Promise<APIResponse<Photo>> {
  // #region agent log
  fetch("http://127.0.0.1:7247/ingest/ffff6e97-d96b-473d-a296-a90866dca292", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "actions.ts:18",
      message: "uploadPhoto entry",
      data: { hasFormData: !!formData },
      timestamp: Date.now(),
      sessionId: "debug-session",
      runId: "run1",
      hypothesisId: "A",
    }),
  }).catch(() => {});
  // #endregion
  const session = await getServerSession(authOptions);
  // #region agent log
  fetch("http://127.0.0.1:7247/ingest/ffff6e97-d96b-473d-a296-a90866dca292", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "actions.ts:21",
      message: "session check",
      data: { hasSession: !!session, hasUserId: !!session?.user?.id, userId: session?.user?.id },
      timestamp: Date.now(),
      sessionId: "debug-session",
      runId: "run1",
      hypothesisId: "F",
    }),
  }).catch(() => {});
  // #endregion
  if (!session?.user?.id) {
    return { data: undefined, error: "You must be signed in to upload photos." };
  }

  const file = formData.get("file") as File;
  // #region agent log
  fetch("http://127.0.0.1:7247/ingest/ffff6e97-d96b-473d-a296-a90866dca292", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "actions.ts:27",
      message: "file extraction",
      data: { hasFile: !!file, fileName: file?.name, fileSize: file?.size, fileType: file?.type },
      timestamp: Date.now(),
      sessionId: "debug-session",
      runId: "run1",
      hypothesisId: "E",
    }),
  }).catch(() => {});
  // #endregion
  if (!file) {
    return { data: undefined, error: "No file uploaded" };
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  // #region agent log
  fetch("http://127.0.0.1:7247/ingest/ffff6e97-d96b-473d-a296-a90866dca292", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "actions.ts:32",
      message: "file type validation",
      data: { fileType: file.type, isAllowed: allowedTypes.includes(file.type) },
      timestamp: Date.now(),
      sessionId: "debug-session",
      runId: "run1",
      hypothesisId: "G",
    }),
  }).catch(() => {});
  // #endregion
  if (!allowedTypes.includes(file.type)) {
    return {
      data: undefined,
      error: "Invalid file type. Only JPEG, PNG, and WebP images are allowed.",
    };
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  // #region agent log
  fetch("http://127.0.0.1:7247/ingest/ffff6e97-d96b-473d-a296-a90866dca292", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "actions.ts:40",
      message: "file size validation",
      data: { fileSize: file.size, maxSize, isValid: file.size <= maxSize },
      timestamp: Date.now(),
      sessionId: "debug-session",
      runId: "run1",
      hypothesisId: "G",
    }),
  }).catch(() => {});
  // #endregion
  if (file.size > maxSize) {
    return { data: undefined, error: "File size exceeds 5MB limit." };
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    // #region agent log
    fetch("http://127.0.0.1:7247/ingest/ffff6e97-d96b-473d-a296-a90866dca292", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "actions.ts:47",
        message: "buffer created",
        data: { bufferSize: buffer.length },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "A",
      }),
    }).catch(() => {});
    // #endregion

    const imgFilename = file.name.replaceAll(" ", "_");
    const imgId = uuidv4();
    const uniqueImgFilename = `${imgId}-${imgFilename}`;

    // Create the upload directory if it doesn't exist
    // #region agent log
    fetch("http://127.0.0.1:7247/ingest/ffff6e97-d96b-473d-a296-a90866dca292", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "actions.ts:54",
        message: "before directory check",
        data: {
          uploadDir: IMG_UPLOAD_DIR,
          envUploadDir: process.env.UPLOAD_DIR,
          dirExists: existsSync(IMG_UPLOAD_DIR),
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "A",
      }),
    }).catch(() => {});
    // #endregion
    createDirIfNotExists(IMG_UPLOAD_DIR);
    // #region agent log
    let canWrite = false;
    try {
      accessSync(IMG_UPLOAD_DIR, constants.W_OK);
      canWrite = true;
    } catch {}
    fetch("http://127.0.0.1:7247/ingest/ffff6e97-d96b-473d-a296-a90866dca292", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "actions.ts:56",
        message: "after directory creation",
        data: { dirExists: existsSync(IMG_UPLOAD_DIR), canWrite },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "B",
      }),
    }).catch(() => {});
    // #endregion
    const imgFilePath = join(IMG_UPLOAD_DIR, uniqueImgFilename);
    // #region agent log
    fetch("http://127.0.0.1:7247/ingest/ffff6e97-d96b-473d-a296-a90866dca292", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "actions.ts:58",
        message: "before file write",
        data: { filePath: imgFilePath },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "D",
      }),
    }).catch(() => {});
    // #endregion

    // Write the image file to the images directory
    await writeFile(imgFilePath, buffer);
    // #region agent log
    const fileWritten = existsSync(imgFilePath);
    let fileSize = 0;
    try {
      if (fileWritten) fileSize = statSync(imgFilePath).size;
    } catch {}
    fetch("http://127.0.0.1:7247/ingest/ffff6e97-d96b-473d-a296-a90866dca292", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "actions.ts:61",
        message: "after file write",
        data: { fileWritten, fileSize },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "D",
      }),
    }).catch(() => {});
    // #endregion

    // Get current photo count to determine order
    // #region agent log
    fetch("http://127.0.0.1:7247/ingest/ffff6e97-d96b-473d-a296-a90866dca292", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "actions.ts:64",
        message: "before db count",
        data: {},
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "C",
      }),
    }).catch(() => {});
    // #endregion
    const photoCount = await prisma.photo.count();
    // #region agent log
    fetch("http://127.0.0.1:7247/ingest/ffff6e97-d96b-473d-a296-a90866dca292", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "actions.ts:65",
        message: "after db count",
        data: { photoCount },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "C",
      }),
    }).catch(() => {});
    // #endregion

    // Save metadata to database
    // #region agent log
    fetch("http://127.0.0.1:7247/ingest/ffff6e97-d96b-473d-a296-a90866dca292", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "actions.ts:68",
        message: "before db create",
        data: { imgId, uniqueImgFilename, userId: session.user.id },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "C",
      }),
    }).catch(() => {});
    // #endregion
    const photo = await prisma.photo.create({
      data: {
        id: imgId,
        imgFilename: uniqueImgFilename,
        userId: session.user.id,
        order: photoCount + 1,
        src: IMG_READ_DIR + uniqueImgFilename,
        alt: `Dog photo ${photoCount + 1}`,
      },
    });
    // #region agent log
    fetch("http://127.0.0.1:7247/ingest/ffff6e97-d96b-473d-a296-a90866dca292", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "actions.ts:79",
        message: "after db create",
        data: { photoId: photo.id },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "C",
      }),
    }).catch(() => {});
    // #endregion

    const metadata: Photo = {
      id: photo.id,
      imgFilename: photo.imgFilename,
      userId: photo.userId,
      order: photo.order,
      src: photo.src,
      alt: photo.alt,
    };

    const response: APIResponse<Photo> = {
      error: undefined,
      data: metadata,
    };
    // #region agent log
    fetch("http://127.0.0.1:7247/ingest/ffff6e97-d96b-473d-a296-a90866dca292", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "actions.ts:95",
        message: "uploadPhoto success",
        data: { photoId: metadata.id },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "A",
      }),
    }).catch(() => {});
    // #endregion
    return response;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Request failed...";
    // #region agent log
    fetch("http://127.0.0.1:7247/ingest/ffff6e97-d96b-473d-a296-a90866dca292", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "actions.ts:98",
        message: "uploadPhoto error",
        data: {
          errorMsg,
          errorName: error instanceof Error ? error.name : "unknown",
          errorStack: error instanceof Error ? error.stack?.substring(0, 500) : "no stack",
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "A",
      }),
    }).catch(() => {});
    // #endregion
    return { data: undefined, error: errorMsg };
  }
}

export async function getPhotos(): Promise<APIResponse<Photo[]>> {
  try {
    const photos = await prisma.photo.findMany({
      orderBy: { order: "asc" },
    });

    const photoData: Photo[] = photos.map(
      (photo: {
        id: string;
        imgFilename: string;
        userId: string;
        order: number;
        src: string;
        alt: string;
      }) => ({
        id: photo.id,
        imgFilename: photo.imgFilename,
        userId: photo.userId,
        order: photo.order,
        src: photo.src,
        alt: photo.alt,
      })
    );

    const response: APIResponse<Photo[]> = {
      error: undefined,
      data: photoData,
    };
    return response;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Request failed...";
    return { data: undefined, error: errorMsg };
  }
}

export async function deletePhoto(id: string): Promise<APIResponse<undefined>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { data: undefined, error: "You must be signed in to delete photos." };
  }

  try {
    // Fetch photo from database to verify ownership and get filename
    const photo = await prisma.photo.findUnique({
      where: { id },
    });

    if (!photo) {
      return { data: undefined, error: "Photo not found" };
    }

    // Check if user owns the photo or is admin
    // Note: Old photos migrated from sessionId-based auth have userIds that won't match
    // new OAuth userIds (format: provider-accountId), so they're effectively protected
    // from deletion by regular users. Only admin can delete them.
    if (photo.userId !== session.user.id && session.user.id !== "admin") {
      return { data: undefined, error: "You can only delete your own photos." };
    }

    // Delete from database
    await prisma.photo.delete({
      where: { id },
    });

    // Delete the image file from filesystem
    const imgFilePath = join(IMG_UPLOAD_DIR, photo.imgFilename);
    if (existsSync(imgFilePath)) {
      unlinkSync(imgFilePath);
    }

    return { data: undefined, error: undefined };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Request failed...";
    return { data: undefined, error: errorMsg };
  }
}

// Helper function to create a directory if it doesn't exist
function createDirIfNotExists(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}
