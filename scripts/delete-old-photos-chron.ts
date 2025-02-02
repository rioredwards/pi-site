import { CronJob } from "cron";
import { existsSync, readFileSync, unlinkSync } from "fs";
import { readdir } from "fs/promises";
import { join } from "path/posix";
import { APIResponse, IMG_UPLOAD_DIR, META_UPLOAD_DIR } from "../lib/constants";

async function deleteOldestPhoto() {
  try {
    const files = await readdir(META_UPLOAD_DIR);
    if (files.length <= 1) {
      return;
    }

    const photos = await Promise.all(
      files.map((file) => {
        const metadataFilePath = join(META_UPLOAD_DIR, file);
        return JSON.parse(readFileSync(metadataFilePath, "utf-8"));
      })
    );

    // Sort by order (oldest first)
    photos.sort((a, b) => a.order - b.order);
    const oldestPhoto = photos[0];

    if (oldestPhoto) {
      await deletePhoto(oldestPhoto.id, oldestPhoto.imgFilename);
    }
  } catch (error) {
    console.error("Error deleting the oldest photo:", error);
  }
}

new CronJob(
  "*/10 * * * * *", // cronTime
  function () {
    console.log("Deleting oldest photo...");
    deleteOldestPhoto();
  }, // onTick
  null, // onComplete
  true, // start
  "America/Los_Angeles" // timeZone
);

export async function deletePhoto(
  id: string,
  imgFilename: string
): Promise<APIResponse<undefined>> {
  const metadataFilePath = join(META_UPLOAD_DIR, `${id}.json`);
  const imgFilePath = join(IMG_UPLOAD_DIR, imgFilename);

  if (!existsSync(metadataFilePath) || !existsSync(imgFilePath)) {
    return { data: undefined, error: "Photo not found" };
  } else {
    try {
      // Delete the metadata file
      unlinkSync(metadataFilePath);
      // Delete the image file
      unlinkSync(imgFilePath);
      return { data: undefined, error: undefined };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Request failed...";
      return { data: undefined, error: errorMsg };
    }
  }
}
