"use server";

import { authOptions } from "@/app/auth";
import { desc, eq, sql } from "drizzle-orm";
import { unlink } from "node:fs/promises";
import {
  MAX_PROFILE_BYTES,
  removeStoredImage,
  saveImageUpload,
} from "../lib/image-security";
import { getServerSession } from "next-auth";
import { Photo, User } from "../lib/types";
import { getDb } from "./drizzle";
import { uploadPhotoForUser, type APIResponse } from "./photo-upload";
import { photos, users } from "./schema";

const IMG_UPLOAD_DIR = process.env.IMG_UPLOAD_DIR!;

export async function uploadPhoto(
  formData: FormData,
): Promise<APIResponse<Photo>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return {
      data: undefined,
      error: "You must be signed in to upload photos.",
    };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { data: undefined, error: "No file uploaded" };
  }

  return uploadPhotoForUser(file, session.user.id);
}

export type PaginatedPhotosResponse = {
  photos: Photo[];
  hasMore: boolean;
};

export async function getPhotos(
  limit: number = 12,
  offset: number = 0,
  seed?: string,
): Promise<APIResponse<PaginatedPhotosResponse>> {
  try {
    const db = getDb();

    // If seed provided, use seeded random order
    // Otherwise fall back to order column
    if (seed) {
      const dbPhotos = await db
        .select({
          id: photos.id,
          imgFilename: photos.imgFilename,
          userId: photos.userId,
          order: photos.order,
          src: photos.src,
          alt: photos.alt,
          ownerDisplayName: users.displayName,
          ownerProfilePicture: users.profilePicture,
        })
        .from(photos)
        .leftJoin(users, eq(photos.userId, users.id))
        .orderBy(sql`md5(${photos.id}::text || ${seed})`)
        .limit(limit + 1)
        .offset(offset);

      const hasMore = dbPhotos.length > limit;
      const photosToReturn = hasMore ? dbPhotos.slice(0, limit) : dbPhotos;

      const photoData: Photo[] = photosToReturn.map((photo) => ({
        id: photo.id,
        imgFilename: photo.imgFilename,
        userId: photo.userId,
        order: photo.order,
        src: photo.src,
        alt: photo.alt,
        ownerDisplayName: photo.ownerDisplayName,
        ownerProfilePicture: photo.ownerProfilePicture,
      }));

      return {
        error: undefined,
        data: { photos: photoData, hasMore },
      };
    }

    const dbPhotos = await db
      .select({
        id: photos.id,
        imgFilename: photos.imgFilename,
        userId: photos.userId,
        order: photos.order,
        src: photos.src,
        alt: photos.alt,
        ownerDisplayName: users.displayName,
        ownerProfilePicture: users.profilePicture,
      })
      .from(photos)
      .leftJoin(users, eq(photos.userId, users.id))
      .orderBy(desc(photos.order))
      .limit(limit + 1)
      .offset(offset);

    const hasMore = dbPhotos.length > limit;
    const photosToReturn = hasMore ? dbPhotos.slice(0, limit) : dbPhotos;

    const photoData: Photo[] = photosToReturn.map((photo) => ({
      id: photo.id,
      imgFilename: photo.imgFilename,
      userId: photo.userId,
      order: photo.order,
      src: photo.src,
      alt: photo.alt,
      ownerDisplayName: photo.ownerDisplayName,
      ownerProfilePicture: photo.ownerProfilePicture,
    }));

    return {
      error: undefined,
      data: { photos: photoData, hasMore },
    };
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Request failed...";
    return { data: undefined, error: errorMsg };
  }
}

export async function getPhotosByUserId(
  userId: string,
): Promise<APIResponse<Photo[]>> {
  try {
    const dbPhotos = await getDb()
      .select({
        id: photos.id,
        imgFilename: photos.imgFilename,
        userId: photos.userId,
        order: photos.order,
        src: photos.src,
        alt: photos.alt,
        ownerDisplayName: users.displayName,
        ownerProfilePicture: users.profilePicture,
      })
      .from(photos)
      .leftJoin(users, eq(photos.userId, users.id))
      .where(eq(photos.userId, userId))
      .orderBy(desc(photos.order));

    const photoData: Photo[] = dbPhotos.map((photo) => ({
      id: photo.id,
      imgFilename: photo.imgFilename,
      userId: photo.userId,
      order: photo.order,
      src: photo.src,
      alt: photo.alt,
      ownerDisplayName: photo.ownerDisplayName,
      ownerProfilePicture: photo.ownerProfilePicture,
    }));

    return {
      error: undefined,
      data: photoData,
    };
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Request failed...";
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
    const [photo] = await getDb()
      .select()
      .from(photos)
      .where(eq(photos.id, id))
      .limit(1);

    if (!photo) {
      return { data: undefined, error: "Photo not found" };
    }

    // Check if user owns the photo or is admin
    if (photo.userId !== session.user.id && session.user.id !== "admin") {
      return { data: undefined, error: "You can only delete your own photos." };
    }

    // Delete from database
    await getDb().delete(photos).where(eq(photos.id, id));

    // Delete the image file from filesystem
    await removeStoredImage(IMG_UPLOAD_DIR, photo.imgFilename);

    return { data: undefined, error: undefined };
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Request failed...";
    return { data: undefined, error: errorMsg };
  }
}

// Get user profile by ID (creates a new profile if it doesn't exist for the current user)
export async function getUserProfile(
  userId: string,
): Promise<APIResponse<User>> {
  try {
    const [existingUser] = await getDb()
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser) {
      return {
        data: {
          id: existingUser.id,
          displayName: existingUser.displayName,
          profilePicture: existingUser.profilePicture,
          createdAt: existingUser.createdAt,
          updatedAt: existingUser.updatedAt,
        },
        error: undefined,
      };
    }

    // Only create a new profile if the requesting user is the same as the userId
    const session = await getServerSession(authOptions);
    if (session?.user?.id === userId) {
      const [newUser] = await getDb()
        .insert(users)
        .values({ id: userId })
        .returning();

      if (!newUser) {
        return { data: undefined, error: "Failed to create user profile." };
      }

      return {
        data: {
          id: newUser.id,
          displayName: newUser.displayName,
          profilePicture: newUser.profilePicture,
          createdAt: newUser.createdAt,
          updatedAt: newUser.updatedAt,
        },
        error: undefined,
      };
    }

    // User not found and requester is not the owner
    return { data: undefined, error: "User not found." };
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Request failed...";
    return { data: undefined, error: errorMsg };
  }
}

// Update user profile (display name)
export async function updateUserProfile(data: {
  displayName?: string;
}): Promise<APIResponse<User>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return {
      data: undefined,
      error: "You must be signed in to update your profile.",
    };
  }

  // Validate display name
  if (data.displayName !== undefined) {
    if (data.displayName.length > 50) {
      return {
        data: undefined,
        error: "Display name must be 50 characters or less.",
      };
    }
  }

  try {
    // Ensure user exists
    const [existingUser] = await getDb()
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!existingUser) {
      // Create user if doesn't exist
      const [newUser] = await getDb()
        .insert(users)
        .values({
          id: session.user.id,
          displayName: data.displayName || null,
        })
        .returning();

      if (!newUser) {
        return { data: undefined, error: "Failed to create user profile." };
      }

      return {
        data: {
          id: newUser.id,
          displayName: newUser.displayName,
          profilePicture: newUser.profilePicture,
          createdAt: newUser.createdAt,
          updatedAt: newUser.updatedAt,
        },
        error: undefined,
      };
    }

    // Update existing user
    const [updatedUser] = await getDb()
      .update(users)
      .set({
        displayName:
          data.displayName !== undefined
            ? data.displayName || null
            : existingUser.displayName,
      })
      .where(eq(users.id, session.user.id))
      .returning();

    if (!updatedUser) {
      return { data: undefined, error: "Failed to update profile." };
    }

    return {
      data: {
        id: updatedUser.id,
        displayName: updatedUser.displayName,
        profilePicture: updatedUser.profilePicture,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
      error: undefined,
    };
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Request failed...";
    return { data: undefined, error: errorMsg };
  }
}

// Upload profile picture
export async function uploadProfilePicture(
  formData: FormData,
): Promise<APIResponse<{ filename: string }>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return {
      data: undefined,
      error: "You must be signed in to upload a profile picture.",
    };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { data: undefined, error: "No file uploaded" };
  }

  let stored: Awaited<ReturnType<typeof saveImageUpload>> | undefined;
  let persisted = false;
  try {
    stored = await saveImageUpload(file, IMG_UPLOAD_DIR, {
      maxBytes: MAX_PROFILE_BYTES,
      requireDog: false,
      profile: true,
    });
    const uniqueImgFilename = stored.filename;
    const [existingUser] = await getDb()
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    // Update or create user record
    if (existingUser) {
      await getDb()
        .update(users)
        .set({ profilePicture: uniqueImgFilename })
        .where(eq(users.id, session.user.id));
    } else {
      await getDb().insert(users).values({
        id: session.user.id,
        profilePicture: uniqueImgFilename,
      });
    }

    persisted = true;
    // OAuth URLs are not local files. Remove old uploads only after the replacement is saved.
    if (
      existingUser?.profilePicture &&
      !/^https?:\/\//.test(existingUser.profilePicture)
    ) {
      await removeStoredImage(
        IMG_UPLOAD_DIR,
        existingUser.profilePicture,
        true,
      );
    }
    return {
      data: { filename: uniqueImgFilename },
      error: undefined,
    };
  } catch (error) {
    if (stored && !persisted) await unlink(stored.path);
    const errorMsg =
      error instanceof Error ? error.message : "Request failed...";
    return { data: undefined, error: errorMsg };
  }
}
