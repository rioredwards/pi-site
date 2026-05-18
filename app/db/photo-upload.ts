import { devLog } from "@/lib/utils";
import { count, eq } from "drizzle-orm";
import { existsSync, mkdirSync } from "fs";
import { writeFile } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { Photo } from "../lib/types";
import { getDb } from "./drizzle";
import { photos, users } from "./schema";

export type APIResponse<T> =
  | { data: T; error: undefined }
  | { data: undefined; error: string };

const IMG_UPLOAD_DIR = process.env.IMG_UPLOAD_DIR!;
const IMAGE_READ_BASE_URL = "/api/assets/images/";

function createDirIfNotExists(path: string) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

export async function uploadPhotoForUser(
  file: File,
  userId: string,
): Promise<APIResponse<Photo>> {
  if (!file) {
    return { data: undefined, error: "No file uploaded" };
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return {
      data: undefined,
      error: "Invalid file type. Only JPEG, PNG, and WebP images are allowed.",
    };
  }

  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { data: undefined, error: "File size exceeds 5MB limit." };
  }

  try {
    try {
      const validatorBaseUrl = process.env.PUBLIC_IMG_VALIDATOR_BASE_URL!;
      const validatorUrl = `${validatorBaseUrl.replace(/\/+$/, "")}/analyze`;

      const validatorFormData = new FormData();
      validatorFormData.append("file", file);

      const response = await fetch(validatorUrl, {
        method: "POST",
        body: validatorFormData,
      });

      if (!response.ok) {
        devLog("AI validator service unavailable, proceeding without validation");
      } else {
        const analysisResult = await response.json();

        if (analysisResult.is_nsfw) {
          return {
            data: undefined,
            error:
              "This image cannot be uploaded as it may contain inappropriate content.",
          };
        }

        if (!analysisResult.is_dog) {
          return {
            data: undefined,
            error:
              "This image does not appear to contain a dog. Please upload dog photos only.",
          };
        }
      }
    } catch {
      return {
        data: undefined,
        error: "AI validator check failed. Please try again.",
      };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const imgFilename = file.name.replaceAll(" ", "_");
    const imgId = uuidv4();
    const uniqueImgFilename = `${imgId}-${imgFilename}`;

    createDirIfNotExists(IMG_UPLOAD_DIR);
    const imgFilePath = join(IMG_UPLOAD_DIR, uniqueImgFilename);

    await writeFile(imgFilePath, buffer);

    const photoCountResult = await getDb()
      .select({ count: count() })
      .from(photos);
    const photoCount = photoCountResult[0]?.count || 0;

    const [photo] = await getDb()
      .insert(photos)
      .values({
        id: imgId,
        imgFilename: uniqueImgFilename,
        userId,
        order: photoCount + 1,
        src: IMAGE_READ_BASE_URL + uniqueImgFilename,
        alt: `Dog photo ${photoCount + 1}`,
      })
      .returning();

    if (!photo) {
      return { data: undefined, error: "Failed to save photo to database." };
    }

    const [user] = await getDb()
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return {
      error: undefined,
      data: {
        id: photo.id,
        imgFilename: photo.imgFilename,
        userId: photo.userId,
        order: photo.order,
        src: photo.src,
        alt: photo.alt,
        ownerDisplayName: user?.displayName ?? null,
        ownerProfilePicture: user?.profilePicture ?? null,
      },
    };
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Request failed...";
    return { data: undefined, error: errorMsg };
  }
}
