"use server";

import { existsSync, mkdirSync, readFileSync, unlinkSync } from "fs";
import { readdir, writeFile } from "fs/promises";
import { getServerSession } from "next-auth";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { authOptions } from "@/app/auth";
import { Photo } from "../lib/types";

export type APIResponse<T> = { data: T; error: undefined } | { data: undefined; error: string };

const IMG_UPLOAD_DIR = join(process.cwd(), "public/images");
const META_UPLOAD_DIR = join(process.cwd(), "public/meta");
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
    const isNewDir = createDirIfNotExists(IMG_UPLOAD_DIR);
    const imgFilesLength = isNewDir ? 0 : (await readdir(IMG_UPLOAD_DIR)).length;
    const imgFilePath = join(IMG_UPLOAD_DIR, uniqueImgFilename);

    // Write the image file to the images directory
    await writeFile(imgFilePath, buffer);
    // Write metadata to an associated JSON file
    const metadata: Photo = {
      id: imgId,
      imgFilename: uniqueImgFilename,
      userId: session.user.id,
      order: imgFilesLength + 1,
      src: IMG_READ_DIR + uniqueImgFilename,
      alt: `Dog photo ${imgFilesLength + 1}`,
    };
    // Create the upload directory if it doesn't exist
    createDirIfNotExists(META_UPLOAD_DIR);
    const metadataFilePath = join(META_UPLOAD_DIR, `${imgId}.json`);
    await writeFile(metadataFilePath, JSON.stringify(metadata, null, 2));

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
    const isNewDir = createDirIfNotExists(META_UPLOAD_DIR);
    if (isNewDir) {
      return { data: [], error: undefined };
    }
    const files = await readdir(META_UPLOAD_DIR);
    const photos = await Promise.all(
      files.map((file) => {
        const metadataFilePath = join(META_UPLOAD_DIR, file);
        const metadata = JSON.parse(readFileSync(metadataFilePath, "utf-8"));
        return metadata;
      })
    );
    const response: APIResponse<Photo[]> = {
      error: undefined,
      data: photos,
    };
    return response;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Request failed...";
    return { data: undefined, error: errorMsg };
  }
}

export async function deletePhoto(
  id: string,
  imgFilename: string
): Promise<APIResponse<undefined>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { data: undefined, error: "You must be signed in to delete photos." };
  }

  const metadataFilePath = join(META_UPLOAD_DIR, `${id}.json`);
  const imgFilePath = join(IMG_UPLOAD_DIR, imgFilename);

  if (!existsSync(metadataFilePath) || !existsSync(imgFilePath)) {
    return { data: undefined, error: "Photo not found" };
  }

  try {
    // Read metadata to check ownership
    const metadata = JSON.parse(readFileSync(metadataFilePath, "utf-8")) as Photo;

    // Check if user owns the photo or is admin
    if (metadata.userId !== session.user.id && session.user.id !== "admin") {
      return { data: undefined, error: "You can only delete your own photos." };
    }

    // Delete the metadata file
    unlinkSync(metadataFilePath);
    // Delete the image file
    unlinkSync(imgFilePath);
    return { data: undefined, error: undefined };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Request failed...";
    return { data: undefined, error: errorMsg };
  }
}

// Helper function to create a directory if it doesn't exist
// Returns true if the directory was created, false if it already exists
function createDirIfNotExists(dir: string): boolean {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    return true;
  }
  return false;
}
