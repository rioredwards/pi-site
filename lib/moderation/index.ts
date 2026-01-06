import { moderateImage as moderateImageNSFWJS } from "./nsfwjs";
import { ModerationResult, ModerationOptions } from "./types";

/**
 * Main moderation function - currently uses NSFWJS
 * This abstraction allows switching to different moderation providers in the future
 *
 * @param imageBuffer - The image file as a Buffer
 * @param options - Moderation options (threshold, failClosed)
 * @returns ModerationResult with approval status and confidence scores
 */
export async function moderateImage(
  imageBuffer: Buffer,
  options: ModerationOptions = {},
): Promise<ModerationResult> {
  return moderateImageNSFWJS(imageBuffer, options);
}

export type { ModerationResult, ModerationOptions };
