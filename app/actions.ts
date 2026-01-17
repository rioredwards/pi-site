"use server";

import { devLog } from "@/app/lib/utils";
import { deletePhoto, getPhotos, uploadPhoto } from "./db/actions";
import { AnalysisResult } from "./lib/imgValidatorTypes";

// Re-export database actions
export { deletePhoto, getPhotos, uploadPhoto };

/**
 * Server action to proxy image analysis requests to the ai-img-validator service.
 * Expects a FormData with a `file` entry containing the image.
 */
export async function analyzeImageAction(formData: FormData): Promise<AnalysisResult> {
  // eslint-disable-next-line no-console
  console.log("[server] [analyzeImageAction.15] formData: ", formData); // TODO: remove this
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    throw new Error("No image file provided");
  }

  // Prefer explicit env override; otherwise pick a sensible default.
  const validatorBaseUrl = process.env.PUBLIC_IMG_VALIDATOR_BASE_URL!;
  
  const validatorUrl = `${validatorBaseUrl.replace(/\/+$/, "")}/analyze`;
  // eslint-disable-next-line no-console
  console.log("[server] [analyzeImageAction.25] validatorUrl: ", validatorUrl); // TODO: remove this

  devLog("validatorUrl: ", validatorUrl);

  const outbound = new FormData();
  outbound.append("file", file);

  const response = await fetch(validatorUrl, {
    method: "POST",
    body: outbound,
  });
  // eslint-disable-next-line no-console
  console.log("[server] [analyzeImageAction.39] response: ", response); // TODO: remove this

  if (!response.ok) {
    let detail = response.statusText || "Analysis failed";
    try {
      const errorData = await response.json();
      // eslint-disable-next-line no-console
      console.log("[server] [analyzeImageAction.47] errorData: ", errorData); // TODO: remove this
      if (typeof errorData?.detail === "string") {
        detail = errorData.detail;
      }
    } catch {
      // ignore JSON parse errors, fall back to status text
    }
    throw new Error(detail);
  }

  const data = (await response.json()) as AnalysisResult;

  // eslint-disable-next-line no-console
  console.log("[server] [analyzeImageAction.60] data: ", data); // TODO: remove this

  return {
    filename: data.filename,
    nsfw_score: data.nsfw_score,
    is_nsfw: data.is_nsfw,
    dog_probability: data.dog_probability,
    is_dog: data.is_dog,
  };
}
