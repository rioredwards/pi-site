#!/usr/bin/env node

/**
 * Bulk import photos into the database.
 *
 * Usage:
 *   node scripts/bulk-import-photos.js <source-directory> <user-id>
 *
 * Example:
 *   node scripts/bulk-import-photos.js ./old-photos admin
 *
 * This script:
 * - Reads all image files from the source directory
 * - Copies them to the uploads directory with unique filenames
 * - Inserts records into the database
 * - Skips AI validation (assumes photos are already vetted)
 *
 * Environment:
 * - Loads .env.local for DATABASE_URL and IMG_UPLOAD_DIR
 */

const { drizzle } = require("drizzle-orm/postgres-js");
const { count } = require("drizzle-orm");
const postgres = require("postgres");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

// Load environment variables from .env.local
require("dotenv").config({ path: path.join(process.cwd(), ".env.local") });

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const IMAGE_READ_BASE_URL = "/api/assets/images/";

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error(
      "Usage: node scripts/bulk-import-photos.js <source-directory> <user-id>",
    );
    console.error(
      "Example: node scripts/bulk-import-photos.js ./old-photos admin",
    );
    process.exit(1);
  }

  const sourceDir = path.resolve(args[0]);
  const userId = args[1];

  // Validate source directory exists
  if (!fs.existsSync(sourceDir)) {
    console.error(`Source directory does not exist: ${sourceDir}`);
    process.exit(1);
  }

  // Validate environment
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL not set. Make sure .env.local exists.");
    process.exit(1);
  }

  const uploadDir = process.env.IMG_UPLOAD_DIR;
  if (!uploadDir) {
    console.error("IMG_UPLOAD_DIR not set. Make sure .env.local exists.");
    process.exit(1);
  }

  const resolvedUploadDir = path.resolve(uploadDir);

  // Create upload directory if it doesn't exist
  if (!fs.existsSync(resolvedUploadDir)) {
    fs.mkdirSync(resolvedUploadDir, { recursive: true });
    console.log(`Created upload directory: ${resolvedUploadDir}`);
  }

  // Get list of image files
  const files = fs.readdirSync(sourceDir).filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return ALLOWED_EXTENSIONS.includes(ext);
  });

  if (files.length === 0) {
    console.error(`No image files found in ${sourceDir}`);
    console.error(`Supported extensions: ${ALLOWED_EXTENSIONS.join(", ")}`);
    process.exit(1);
  }

  console.log(`Found ${files.length} image(s) to import`);
  console.log(`Source: ${sourceDir}`);
  console.log(`Destination: ${resolvedUploadDir}`);
  console.log(`Owner user ID: ${userId}`);
  console.log("");

  // Connect to database
  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client);

  // Import the schema (we need to use raw SQL since we can't import TypeScript)
  // Get current max order value
  const orderResult =
    await client`SELECT COALESCE(MAX("order"), 0) as max_order FROM photos`;
  let currentOrder = orderResult[0].max_order;

  console.log(`Current max order in database: ${currentOrder}`);
  console.log("");

  let successCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const sourcePath = path.join(sourceDir, file);
    const imgId = uuidv4();
    const sanitizedFilename = file.replaceAll(" ", "_");
    const uniqueFilename = `${imgId}-${sanitizedFilename}`;
    const destPath = path.join(resolvedUploadDir, uniqueFilename);

    try {
      // Copy file to upload directory
      fs.copyFileSync(sourcePath, destPath);

      // Increment order for this photo
      currentOrder++;

      // Insert into database
      await client`
        INSERT INTO photos (id, img_filename, user_id, "order", src, alt, created_at, updated_at)
        VALUES (
          ${imgId}::uuid,
          ${uniqueFilename},
          ${userId},
          ${currentOrder},
          ${IMAGE_READ_BASE_URL + uniqueFilename},
          ${"Dog photo " + currentOrder},
          NOW(),
          NOW()
        )
      `;

      console.log(`✓ Imported: ${file} -> ${uniqueFilename}`);
      successCount++;
    } catch (error) {
      console.error(`✗ Failed to import ${file}: ${error.message}`);
      // Clean up copied file if database insert failed
      if (fs.existsSync(destPath)) {
        fs.unlinkSync(destPath);
      }
      errorCount++;
    }
  }

  await client.end();

  console.log("");
  console.log("Import complete!");
  console.log(`  Successful: ${successCount}`);
  console.log(`  Failed: ${errorCount}`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
