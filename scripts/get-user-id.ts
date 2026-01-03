/**
 * Helper script to find your user ID after signing in.
 *
 * After signing in with OAuth, your user ID will be in the format:
 * - GitHub: github-{your_github_account_id}
 * - Google: google-{your_google_sub}
 *
 * Usage:
 *
 * Local development:
 *   npm run get-user-id
 *   or: npx tsx scripts/get-user-id.ts
 *
 * Docker (on Raspberry Pi):
 *   docker compose exec app npm run get-user-id
 *   or: docker compose exec app npx tsx scripts/get-user-id.ts
 *
 * To use this:
 * 1. Sign in to your app
 * 2. Check the browser console or network tab for the session
 * 3. Or run this script after uploading a photo to see your userId
 */

import { prisma } from "../lib/prisma";

async function getRecentUserIds() {
  try {
    console.log("Recent user IDs from photos:\n");

    const photos = await prisma.photo.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userId: true,
        imgFilename: true,
        createdAt: true,
      },
    });

    if (photos.length === 0) {
      console.log("No photos found. Upload a photo first, then run this script.");
      return;
    }

    const uniqueUserIds = [...new Set(photos.map((p) => p.userId))];

    console.log("User IDs found:");
    uniqueUserIds.forEach((userId) => {
      console.log(`  - ${userId}`);
    });

    console.log("\nTo set yourself as admin, add this to your .env.local:");
    console.log(`ADMIN_USER_IDS=${uniqueUserIds[0]}`);
    console.log("\nOr for multiple admins:");
    console.log(`ADMIN_USER_IDS=${uniqueUserIds.join(",")}`);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

getRecentUserIds();
