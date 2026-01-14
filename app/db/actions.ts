"use server";

import { authOptions } from "@/app/auth";
import { count, eq } from "drizzle-orm";
import { existsSync, mkdirSync, unlinkSync } from "fs";
import { writeFile } from "fs/promises";
import { getServerSession } from "next-auth";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { devLog } from "@/app/lib/utils";
import { Photo } from "../lib/types";
import { db } from "./drizzle";
import { photos } from "./schema";

export type APIResponse<T> = { data: T; error: undefined } | { data: undefined; error: string };

const IMG_UPLOAD_DIR = process.env.IMG_UPLOAD_DIR!;

// Debug logging to understand what's happening
devLog("IMG_UPLOAD_DIR:", IMG_UPLOAD_DIR);
devLog("NODE_ENV:", process.env.NODE_ENV);
devLog("cwd:", process.cwd());

const IMAGE_READ_BASE_URL = "/api/assets/images/";

export async function uploadPhoto(formData: FormData): Promise<APIResponse<Photo>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return {
      data: undefined,
      error: "You must be signed in to upload photos.",
    };
  }

  const file = formData.get("file") as File;
  if (!file) {
    return { data: undefined, error: "No file uploaded" };
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return {
      data: undefined,
      error: "Invalid file type. Only JPEG, PNG, and WebP images are allowed.",
    };
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return { data: undefined, error: "File size exceeds 5MB limit." };
  }

  try {
    // AI image validator check (before processing the file)
    try {
      const validatorBaseUrl = process.env.PUBLIC_IMG_VALIDATOR_BASE_URL!;

      const validatorUrl = `${validatorBaseUrl.replace(/\/+$/, "")}/analyze`;

      devLog("validatorUrl: ", validatorUrl);

      const validatorFormData = new FormData();
      validatorFormData.append("file", file);

      const response = await fetch(validatorUrl, {
        method: "POST",
        body: validatorFormData,
      });

      if (!response.ok) {
        // If validator service is unavailable, log but don't block upload
        devLog("AI validator service unavailable, proceeding without validation");
      } else {
        const analysisResult = await response.json();

        devLog("analysisResult", analysisResult);

        // Validate: must be SFW and must be a dog
        if (analysisResult.is_nsfw) {
          return {
            data: undefined,
            error: "This image cannot be uploaded as it may contain inappropriate content.",
          };
        }

        if (!analysisResult.is_dog) {
          return {
            data: undefined,
            error: "This image does not appear to contain a dog. Please upload dog photos only.",
          };
        }
      }
    } catch (validatorError) {
      // If validator fails, log but don't block upload (fail open for now)
      // In production, you might want to fail closed
      devLog("AI validator check failed:", validatorError);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const imgFilename = file.name.replaceAll(" ", "_");
    const imgId = uuidv4();
    const uniqueImgFilename = `${imgId}-${imgFilename}`;

    // Create the upload directory if it doesn't exist
    createDirIfNotExists(IMG_UPLOAD_DIR);
    const imgFilePath = join(IMG_UPLOAD_DIR, uniqueImgFilename);

    // Write the image file to the images directory
    await writeFile(imgFilePath, buffer);

    // Get current photo count to determine order
    const photoCountResult = await db.select({ count: count() }).from(photos);
    const photoCount = photoCountResult[0]?.count || 0;

    // Save metadata to database
    const [photo] = await db
      .insert(photos)
      .values({
        id: imgId,
        imgFilename: uniqueImgFilename,
        userId: session.user.id,
        order: photoCount + 1,
        src: IMAGE_READ_BASE_URL + uniqueImgFilename,
        alt: `Dog photo ${photoCount + 1}`,
      })
      .returning();

    if (!photo) {
      return { data: undefined, error: "Failed to save photo to database." };
    }

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
    return response;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Request failed...";
    return { data: undefined, error: errorMsg };
  }
}

export async function getPhotos(): Promise<APIResponse<Photo[]>> {
  try {
    const dbPhotos = await db.select().from(photos).orderBy(photos.order);

    const photoData: Photo[] = dbPhotos.map((photo) => ({
      id: photo.id,
      imgFilename: photo.imgFilename,
      userId: photo.userId,
      order: photo.order,
      src: photo.src,
      alt: photo.alt,
    }));

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
    return {
      data: undefined,
      error: "You must be signed in to delete photos.",
    };
  }

  try {
    // Fetch photo from database to verify ownership and get filename
    const [photo] = await db.select().from(photos).where(eq(photos.id, id)).limit(1);

    if (!photo) {
      return { data: undefined, error: "Photo not found" };
    }

    // Check if user owns the photo or is admin
    if (photo.userId !== session.user.id && session.user.id !== "admin") {
      return { data: undefined, error: "You can only delete your own photos." };
    }

    // Delete from database
    await db.delete(photos).where(eq(photos.id, id));

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
  try {
    devLog(`Checking if directory exists: ${dir}`);
    if (!existsSync(dir)) {
      devLog(`Directory doesn't exist, creating: ${dir}`);
      mkdirSync(dir, { recursive: true });
      devLog(`Successfully created upload directory: ${dir}`);
    } else {
      devLog(`Directory already exists: ${dir}`);
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    devLog(`Failed to create directory "${dir}". Error:`, error);
    throw new Error(`Failed to create upload directory "${dir}": ${errorMsg}`);
  }
}
