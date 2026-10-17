"use server";

import {
  analyzeRaster,
  MAX_PHOTO_BYTES,
  normalizeImage,
} from "./lib/image-security";
import {
  deletePhoto,
  getPhotos,
  getPhotosByUserId,
  uploadPhoto,
  PaginatedPhotosResponse,
} from "./db/actions";
import { AnalysisResult } from "./lib/imgValidatorTypes";

// Re-export database actions
export { deletePhoto, getPhotos, getPhotosByUserId, uploadPhoto };
export type { PaginatedPhotosResponse };

/**
 * Server action to proxy image analysis requests to the ai-img-validator service.
 * Expects a FormData with a `file` entry containing the image.
 */
export async function analyzeImageAction(
  formData: FormData,
): Promise<AnalysisResult> {
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    throw new Error("No image file provided");
  }

  const bytes = await normalizeImage(file, MAX_PHOTO_BYTES);
  return analyzeRaster(bytes);
}
