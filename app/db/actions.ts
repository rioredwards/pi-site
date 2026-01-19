"use server";

import { authOptions } from "@/app/auth";
import { devLog } from "@/app/lib/utils";
import { count, eq } from "drizzle-orm";
import { existsSync, mkdirSync, unlinkSync } from "fs";
import { writeFile } from "fs/promises";
import { getServerSession } from "next-auth";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { Photo, User } from "../lib/types";
import { db } from "./drizzle";
import { photos, users } from "./schema";

export type APIResponse<T> = { data: T; error: undefined } | { data: undefined; error: string };

const IMG_UPLOAD_DIR = process.env.IMG_UPLOAD_DIR!;

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      // If validator fails, block upload
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
    if (!existsSync(dir)) {
      devLog(`Directory doesn't exist, creating: ${dir}`);
      mkdirSync(dir, { recursive: true });
      devLog(`Successfully created upload directory: ${dir}`);
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    devLog(`Failed to create directory "${dir}". Error:`, error);
    throw new Error(`Failed to create upload directory "${dir}": ${errorMsg}`);
  }
}

// Get user profile by ID (creates a new profile if it doesn't exist for the current user)
export async function getUserProfile(userId: string): Promise<APIResponse<User>> {
  try {
    const [existingUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

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
      const [newUser] = await db
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
    const errorMsg = error instanceof Error ? error.message : "Request failed...";
    return { data: undefined, error: errorMsg };
  }
}

// Update user profile (display name)
export async function updateUserProfile(data: { displayName?: string }): Promise<APIResponse<User>> {
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
      return { data: undefined, error: "Display name must be 50 characters or less." };
    }
  }

  try {
    // Ensure user exists
    const [existingUser] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);

    if (!existingUser) {
      // Create user if doesn't exist
      const [newUser] = await db
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
    const [updatedUser] = await db
      .update(users)
      .set({
        displayName: data.displayName !== undefined ? (data.displayName || null) : existingUser.displayName,
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
    const errorMsg = error instanceof Error ? error.message : "Request failed...";
    return { data: undefined, error: errorMsg };
  }
}

// Upload profile picture
export async function uploadProfilePicture(formData: FormData): Promise<APIResponse<{ filename: string }>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return {
      data: undefined,
      error: "You must be signed in to upload a profile picture.",
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

  // Validate file size (max 2MB for profile pictures)
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) {
    return { data: undefined, error: "File size exceeds 2MB limit." };
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const imgFilename = file.name.replaceAll(" ", "_");
    const imgId = uuidv4();
    const uniqueImgFilename = `${imgId}-${imgFilename}`;

    // Store profile pictures in a separate directory
    const profilePictureDir = join(IMG_UPLOAD_DIR, "profiles");
    createDirIfNotExists(profilePictureDir);
    const imgFilePath = join(profilePictureDir, uniqueImgFilename);

    // Delete old profile picture if exists
    const [existingUser] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
    if (existingUser?.profilePicture) {
      const oldFilePath = join(profilePictureDir, existingUser.profilePicture);
      if (existsSync(oldFilePath)) {
        unlinkSync(oldFilePath);
      }
    }

    // Write the image file
    await writeFile(imgFilePath, buffer);

    // Update or create user record
    if (existingUser) {
      await db
        .update(users)
        .set({ profilePicture: uniqueImgFilename })
        .where(eq(users.id, session.user.id));
    } else {
      await db
        .insert(users)
        .values({
          id: session.user.id,
          profilePicture: uniqueImgFilename,
        });
    }

    return {
      data: { filename: uniqueImgFilename },
      error: undefined,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Request failed...";
    return { data: undefined, error: errorMsg };
  }
}
