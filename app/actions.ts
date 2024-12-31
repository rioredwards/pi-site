"use server";

import { readdir, writeFile } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { Photo } from "../lib/types";

export type APIResponse<T> = { data: T; error: undefined } | { data: undefined; error: string };

export async function uploadPhoto(formData: FormData): Promise<APIResponse<Photo>> {
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

    // Generate a unique filename
    const filename = file.name.replaceAll(" ", "_");
    const uniqueFilename = `${uuidv4()}-${filename}`;
    const uploadDir = join(process.cwd(), "public/images");
    const filesLength = (await readdir(uploadDir)).filter(
      (file) => !(file === ".gitignore")
    ).length;
    const filePath = join(uploadDir, uniqueFilename);

    // Ensure the upload directory exists
    await writeFile(filePath, buffer);

    const response: APIResponse<Photo> = {
      error: undefined,
      data: {
        id: filesLength + 1,
        src: "/api/assets/images/" + uniqueFilename,
        alt: `Dog photo ${filesLength + 1}`,
      },
    };
    return response;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Request failed...";
    return { data: undefined, error: errorMsg };
  }
}

export async function getPhotos() {
  const uploadDir = join(process.cwd(), "public/images");
  const files = (await readdir(uploadDir)).filter((file) => !(file === ".gitignore"));
  const photos = files.map((file, index) => ({
    id: index + 1,
    src: "/api/assets/images/" + file,
    alt: `Dog photo ${index + 1}`,
  }));
  return photos.sort((a, b) => a.id - b.id);
}
