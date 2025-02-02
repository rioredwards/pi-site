"use server";
import { existsSync, mkdirSync, readFileSync, unlinkSync } from "fs";
import { readdir, writeFile } from "fs/promises";
import { cookies } from "next/headers";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { APIResponse, IMG_READ_DIR, IMG_UPLOAD_DIR, META_UPLOAD_DIR } from "../lib/constants";
import { Photo } from "../lib/types";

export async function uploadPhoto(formData: FormData): Promise<APIResponse<Photo>> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("sessionId");
  if (!sessionId) {
    throw new Error("No session ID found");
  }

  const file = formData.get("file") as File;
  if (!file) {
    throw new Error("No file uploaded");
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Invalid file type. Only JPEG, PNG, and WebP images are allowed.");
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error("File size exceeds 5MB limit.");
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
      sessionId: sessionId.value,
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

export async function getPhoto(): Promise<APIResponse<Photo>> {
  try {
    createDirIfNotExists(META_UPLOAD_DIR);
    const files = await readdir(META_UPLOAD_DIR);
    if (files.length === 0) {
      return { data: undefined, error: "No Photos Found" };
    }

    // Get metadata for all photos
    const photos = await Promise.all(
      files.map((file) => {
        const metadataFilePath = join(META_UPLOAD_DIR, file);
        return JSON.parse(readFileSync(metadataFilePath, "utf-8"));
      })
    );

    // Sort by order (oldest first)
    photos.sort((a, b) => a.order - b.order);

    return { data: photos[0], error: undefined };
  } catch (error) {
    return { data: undefined, error: error instanceof Error ? error.message : "Request failed..." };
  }
}

// export async function deleteOldestPhoto() {
//   try {
//     const files = await readdir(META_UPLOAD_DIR);
//     if (files.length <= 1) {
//       return;
//     }

//     const photos = await Promise.all(
//       files.map((file) => {
//         const metadataFilePath = join(META_UPLOAD_DIR, file);
//         return JSON.parse(readFileSync(metadataFilePath, "utf-8"));
//       })
//     );

//     // Sort by order (oldest first)
//     photos.sort((a, b) => a.order - b.order);
//     const oldestPhoto = photos[0];

//     if (oldestPhoto) {
//       await deletePhoto(oldestPhoto.id, oldestPhoto.imgFilename);
//     }
//   } catch (error) {
//     console.error("Error deleting the oldest photo:", error);
//   }
// }

export async function deletePhoto(
  id: string,
  imgFilename: string
): Promise<APIResponse<undefined>> {
  const metadataFilePath = join(META_UPLOAD_DIR, `${id}.json`);
  const imgFilePath = join(IMG_UPLOAD_DIR, imgFilename);

  if (!existsSync(metadataFilePath) || !existsSync(imgFilePath)) {
    return { data: undefined, error: "Photo not found" };
  } else {
    try {
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

export async function createCookie(): Promise<APIResponse<string>> {
  const cookieStore = await cookies();
  const newSessionId = uuidv4();
  cookieStore.set("sessionId", newSessionId);
  return { data: newSessionId, error: undefined };
}

export async function getCookie(): Promise<APIResponse<string>> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("sessionId");
  if (!sessionId) {
    return { data: undefined, error: "No session ID found" };
  }
  return { data: sessionId.value, error: undefined };
}
