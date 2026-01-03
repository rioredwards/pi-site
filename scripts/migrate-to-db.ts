import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { prisma } from "../lib/prisma";

const META_UPLOAD_DIR = join(process.cwd(), "public/meta");

interface OldPhotoMetadata {
  id: string;
  imgFilename: string;
  sessionId?: string;
  userId?: string;
  order: number;
  src: string;
  alt: string;
}

async function migrateMetadata() {
  try {
    console.log("Starting migration from JSON files to database...");

    // Check if meta directory exists
    let files: string[];
    try {
      files = await readdir(META_UPLOAD_DIR);
    } catch (error) {
      console.error(`Error reading meta directory: ${error}`);
      console.log("No meta directory found or it's empty. Nothing to migrate.");
      return;
    }

    // Filter to only JSON files
    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    if (jsonFiles.length === 0) {
      console.log("No JSON files found to migrate.");
      return;
    }

    console.log(`Found ${jsonFiles.length} JSON files to migrate.`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const file of jsonFiles) {
      try {
        const filePath = join(META_UPLOAD_DIR, file);
        const fileContent = await readFile(filePath, "utf-8");
        const metadata: OldPhotoMetadata = JSON.parse(fileContent);

        // Check if photo already exists in database (idempotent migration)
        const existing = await prisma.photo.findUnique({
          where: { id: metadata.id },
        });

        if (existing) {
          console.log(`  ✓ Skipping ${metadata.id} - already exists in database`);
          skipped++;
          continue;
        }

        // Map sessionId to userId if needed (for old data)
        const userId = metadata.userId || metadata.sessionId || "unknown";

        // Insert into database
        await prisma.photo.create({
          data: {
            id: metadata.id,
            imgFilename: metadata.imgFilename,
            userId: userId,
            order: metadata.order,
            src: metadata.src,
            alt: metadata.alt,
          },
        });

        console.log(`  ✓ Migrated ${metadata.id} (${metadata.imgFilename})`);
        migrated++;
      } catch (error) {
        console.error(`  ✗ Error migrating ${file}:`, error);
        errors++;
      }
    }

    console.log("\nMigration complete!");
    console.log(`  Migrated: ${migrated}`);
    console.log(`  Skipped (already exists): ${skipped}`);
    console.log(`  Errors: ${errors}`);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateMetadata();
