import { count, eq } from "drizzle-orm";
import { unlink } from "node:fs/promises";
import {
  cleanupUploadFile,
  MAX_PHOTO_BYTES,
  saveImageUpload,
} from "../lib/image-security";
import { Photo } from "../lib/types";
import { getDb } from "./drizzle";
import { photos, users } from "./schema";

export type APIResponse<T> =
  | { data: T; error: undefined }
  | { data: undefined; error: string };

const IMG_UPLOAD_DIR = process.env.IMG_UPLOAD_DIR!;
const IMAGE_READ_BASE_URL = "/api/assets/images/";

export async function uploadPhotoForUser(
  file: File,
  userId: string,
): Promise<APIResponse<Photo>> {
  let stored: Awaited<ReturnType<typeof saveImageUpload>> | undefined;
  let persisted = false;
  try {
    stored = await saveImageUpload(file, IMG_UPLOAD_DIR, {
      maxBytes: MAX_PHOTO_BYTES,
      requireDog: true,
    });
    const { id: imgId, filename: uniqueImgFilename } = stored;

    const photoCountResult = await getDb()
      .select({ count: count() })
      .from(photos);
    const photoCount = photoCountResult[0]?.count || 0;
    const [user] = await getDb()
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

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
      throw new Error("Failed to save photo to database.");
    }

    persisted = true;

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
    if (stored && !persisted) {
      const storedPath = stored.path;
      await cleanupUploadFile(() => unlink(storedPath));
    }
    const errorMsg =
      error instanceof Error ? error.message : "Request failed...";
    return { data: undefined, error: errorMsg };
  }
}
