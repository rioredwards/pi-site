import * as tf from "@tensorflow/tfjs-node";
import * as nsfwjs from "nsfwjs";
import { join } from "path";
import { ModerationOptions, ModerationResult } from "./types";

let model: Awaited<ReturnType<typeof nsfwjs.load>> | null = null;

/**
 * Initialize the NSFWJS model (lazy loading)
 * The model is loaded on first use and cached for subsequent calls
 * Uses local model files to avoid CDN dependency and simplify build
 */
async function getModel() {
  if (!model) {
    // Use local model files (hosted in public/models/nsfwjs)
    // Falls back to CDN if local model doesn't exist
    // In standalone mode, process.cwd() is .next/standalone, so public/ is available
    // In dev mode, process.cwd() is project root, so public/ is also available
    const modelPath = join(process.cwd(), "public", "models", "nsfwjs");
    const localModelUrl = `http://localhost:3000/models/mobilenet_v2_mid/model.json`;

    try {
      // Try to load local model first
      model = await nsfwjs.load(localModelUrl);
      console.log(`✅ Loaded local NSFWJS model from: ${modelPath}`);
    } catch (error) {
      console.error("Error loading local NSFWJS model:", error);
      // Fallback to CDN if local model not found
      console.warn(
        `Local model not found at ${modelPath}, using CDN. Run 'zsh scripts/download-model.sh' to download model files.`,
      );
      model = await nsfwjs.load();
    }
  }
  return model;
}

/**
 * Moderate an image using NSFWJS
 * @param imageBuffer - The image file as a Buffer
 * @param options - Moderation options (threshold, failClosed)
 * @returns ModerationResult with approval status and confidence scores
 */
export async function moderateImage(
  imageBuffer: Buffer,
  options: ModerationOptions = {},
): Promise<ModerationResult> {
  const threshold = options.threshold ?? 0.5;
  const failClosed = options.failClosed ?? true;

  try {
    const model = await getModel();

    // Image must be in tf.tensor3d format
    // Convert image buffer to tf.tensor3d with tf.node.decodeImage
    const imageTensor = await tf.node.decodeImage(imageBuffer, 3);

    // Ensure Tensor3D (decodeImage with channels=3 should return Tensor3D, but TypeScript sees Tensor3D | Tensor4D)
    const image =
      imageTensor.rank === 4 ? imageTensor.squeeze([0]) : imageTensor;

    // Classify the image
    const predictions = await model.classify(image as any);

    // Tensor memory must be managed explicitly
    image.dispose();
    if (imageTensor !== image) {
      imageTensor.dispose();
    }

    // Extract category scores
    const categories = {
      porn: 0,
      hentai: 0,
      sexy: 0,
      neutral: 0,
      drawing: 0,
    };

    predictions.forEach((pred) => {
      const className = pred.className.toLowerCase();
      if (className in categories) {
        categories[className as keyof typeof categories] = pred.probability;
      }
    });

    // Calculate overall inappropriate content confidence
    const inappropriateConfidence = categories.porn + categories.hentai;

    // Determine if image should be approved
    const approved = inappropriateConfidence < threshold;

    return {
      approved,
      confidence: inappropriateConfidence,
      categories,
      reason: approved
        ? undefined
        : `Image contains inappropriate content (confidence: ${(inappropriateConfidence * 100).toFixed(1)}%)`,
    };
  } catch (error) {
    console.error("Content moderation error:", error);
    // If moderation fails, fail closed (block upload) by default
    if (failClosed) {
      return {
        approved: false,
        confidence: 1.0,
        categories: {
          porn: 0,
          hentai: 0,
          sexy: 0,
          neutral: 0,
          drawing: 0,
        },
        reason:
          "Content moderation check failed. Please try again or contact support.",
      };
    }

    // Fail open - allow upload but log the error
    return {
      approved: true,
      confidence: 0,
      categories: {
        porn: 0,
        hentai: 0,
        sexy: 0,
        neutral: 0,
        drawing: 0,
      },
      reason: "Moderation check unavailable",
    };
  }
}
