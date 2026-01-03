"use server";

import { existsSync, mkdirSync, unlinkSync } from "fs";
import { writeFile } from "fs/promises";
import { getServerSession } from "next-auth";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { authOptions } from "@/app/auth";
import { Photo } from "../lib/types";
import { prisma } from "../lib/prisma";

export type APIResponse<T> = { data: T; error: undefined } | { data: undefined; error: string };

const IMG_UPLOAD_DIR = join(process.cwd(), "public/images");
const IMG_READ_DIR = "/api/assets/images/";

export async function uploadPhoto(formData: FormData): Promise<APIResponse<Photo>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { data: undefined, error: "You must be signed in to upload photos." };
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
    const photoCount = await prisma.photo.count();
    
    // Save metadata to database
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
    const photos = await prisma.photo.findMany({
      orderBy: { order: "asc" },
    });

    const photoData: Photo[] = photos.map((photo) => ({
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
