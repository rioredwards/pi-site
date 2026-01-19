#!/usr/bin/env node

/**
 * Watch script for depth map generation
 * Monitors midas_depth.py and input.png for changes,
 * regenerates depth maps, and copies them to public/pi/
 */

const { watch } = require("fs");
const { exec } = require("child_process");
const { promisify } = require("util");
const { copyFile, mkdir } = require("fs/promises");
const { join, dirname } = require("path");

const execAsync = promisify(exec);

const DEPTH_MAKER_DIR = join(__dirname, "..", "temp-pi-depth-map-maker");
const PYTHON_SCRIPT = join(DEPTH_MAKER_DIR, "midas_depth.py");
const INPUT_IMAGE = join(DEPTH_MAKER_DIR, "input.png");
const OUTPUT_8 = join(DEPTH_MAKER_DIR, "depth_8.png");
const OUTPUT_16 = join(DEPTH_MAKER_DIR, "depth_16.png");

const PUBLIC_DIR = join(__dirname, "..", "public", "pi");
const PUBLIC_DEPTH_8 = join(PUBLIC_DIR, "pi_depth.png");
const PUBLIC_DEPTH_16 = join(PUBLIC_DIR, "pi_depth_16.png");

let isProcessing = false;
let debounceTimer = null;
const DEBOUNCE_MS = 500; // Wait 500ms after last change before processing

async function ensurePublicDir() {
  try {
    await mkdir(PUBLIC_DIR, { recursive: true });
  } catch (error) {
    if (error.code !== "EEXIST") {
      throw error;
    }
  }
}

async function generateDepthMap() {
  if (isProcessing) {
    console.log("⏳ Already processing, skipping...");
    return;
  }

  isProcessing = true;
  console.log("\n🔄 Generating depth map...");

  try {
    // Run the Python script
    const { stdout, stderr } = await execAsync(
      `python3 "${PYTHON_SCRIPT}"`,
      { cwd: DEPTH_MAKER_DIR }
    );

    if (stderr && !stderr.includes("Wrote:")) {
      console.warn("⚠️  Python warnings:", stderr);
    }

    if (stdout) {
      console.log(stdout.trim());
    }

    // Copy generated files to public directory
    await ensurePublicDir();
    await copyFile(OUTPUT_8, PUBLIC_DEPTH_8);
    await copyFile(OUTPUT_16, PUBLIC_DEPTH_16);

    console.log("✅ Depth map generated and copied to public/pi/");
    console.log(`   → ${PUBLIC_DEPTH_8}`);
    console.log(`   → ${PUBLIC_DEPTH_16}`);
  } catch (error) {
    console.error("❌ Error generating depth map:", error.message);
    if (error.stderr) {
      console.error(error.stderr);
    }
  } finally {
    isProcessing = false;
  }
}

function debouncedGenerate() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(generateDepthMap, DEBOUNCE_MS);
}

// Watch for changes
console.log("👀 Watching for changes...");
console.log(`   📝 ${PYTHON_SCRIPT}`);
console.log(`   🖼️  ${INPUT_IMAGE}`);
console.log("\n💡 Make changes to the Python script or input image to regenerate depth maps");
console.log("   Press Ctrl+C to stop\n");

// Watch Python script
watch(PYTHON_SCRIPT, { persistent: true }, (eventType) => {
  if (eventType === "change") {
    console.log("📝 Python script changed");
    debouncedGenerate();
  }
});

// Watch input image
watch(INPUT_IMAGE, { persistent: true }, (eventType) => {
  if (eventType === "change") {
    console.log("🖼️  Input image changed");
    debouncedGenerate();
  }
});

// Generate once on startup
generateDepthMap();

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\n👋 Stopping watch...");
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  process.exit(0);
});
