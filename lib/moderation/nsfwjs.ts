import * as nsfwjs from "nsfwjs";
import * as tf from "@tensorflow/tfjs-node";
import { ModerationResult, ModerationOptions } from "./types";

let model: nsfwjs.NSFWJS | null = null;
let modelInitialized = false;

/**
 * Initialize TensorFlow.js backend for Node.js
 * This must be called before loading the NSFWJS model
 */
async function initializeTensorFlow(): Promise<void> {
  if (!modelInitialized) {
    // Initialize TensorFlow.js with Node.js backend
    await tf.ready();
    modelInitialized = true;
  }
}

/**
 * Initialize the NSFWJS model (lazy loading)
 * The model is loaded on first use and cached for subsequent calls
 */
async function getModel(): Promise<nsfwjs.NSFWJS> {
  if (!model) {
    await initializeTensorFlow();
    // Load the model from the CDN (quantized version for faster loading)
    model = await nsfwjs.load("https://nsfwjs.com/model/", { size: 299 });
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
  options: ModerationOptions = {}
): Promise<ModerationResult> {
  const threshold = options.threshold ?? 0.5;
  const failClosed = options.failClosed ?? true;

  try {
    const model = await getModel();

    // Convert buffer to ImageData or HTMLImageElement
    // NSFWJS expects an image element, so we'll use a workaround with canvas
    const { createCanvas, loadImage } = await import("canvas");
    
    // Load image from buffer
    const img = await loadImage(imageBuffer);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    // Classify the image
    const predictions = await model.classify(canvas as any);

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
        reason: "Content moderation check failed. Please try again or contact support.",
      };
    }

    // Fail open - allow upload but log the error
    console.error("Content moderation error:", error);
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

