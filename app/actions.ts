"use server";

import { devLog } from "@/lib/utils";
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

  // Prefer explicit env override; otherwise pick a sensible default.
  const validatorBaseUrl = process.env.PUBLIC_IMG_VALIDATOR_BASE_URL!;

  const validatorUrl = `${validatorBaseUrl.replace(/\/+$/, "")}/analyze`;
  devLog("[analyzeImageAction] validatorUrl:", validatorUrl);

  const outbound = new FormData();
  outbound.append("file", file);

  const response = await fetch(validatorUrl, {
    method: "POST",
    body: outbound,
  });

  if (!response.ok) {
    let detail = response.statusText || "Analysis failed";
    try {
      const errorData = await response.json();
      if (typeof errorData?.detail === "string") {
        detail = errorData.detail;
      }
    } catch {
      // ignore JSON parse errors, fall back to status text
    }
    throw new Error(detail);
  }

  const data = (await response.json()) as AnalysisResult;

  return {
    filename: data.filename,
    nsfw_score: data.nsfw_score,
    is_nsfw: data.is_nsfw,
    dog_probability: data.dog_probability,
    is_dog: data.is_dog,
  };
}
