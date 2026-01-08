"use server";

import { AnalysisResult } from "./lib/imgValidatorTypes";
import { getPhotos, uploadPhoto, deletePhoto } from "./db/actions";

// Re-export database actions
export { getPhotos, uploadPhoto, deletePhoto };

/**
 * Server action to proxy image analysis requests to the ai-img-validator service.
 * Expects a FormData with a `file` entry containing the image.
 */
export async function analyzeImageAction(formData: FormData): Promise<AnalysisResult> {
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    throw new Error("No image file provided");
  }

  // Prefer explicit env override; otherwise pick a sensible default.
  const baseUrl =
    process.env.NSFW_API_URL ??
    (process.env.NODE_ENV === "production"
      ? "http://ai-img-validator:8000"
      : "http://localhost:8000");

  const backendUrl = `${baseUrl.replace(/\/+$/, "")}/analyze`;

  const outbound = new FormData();
  outbound.append("file", file);

  const response = await fetch(backendUrl, {
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
