import { prisma } from "../lib/prisma";

async function testDatabase() {
  try {
    console.log("Testing database connection...\n");

    // Test 1: Count photos
    const count = await prisma.photo.count();
    console.log(`✓ Found ${count} photos in database`);

    // Test 2: Fetch a few photos
    const photos = await prisma.photo.findMany({
      take: 3,
      orderBy: { order: "asc" },
    });
    console.log(`✓ Successfully fetched ${photos.length} photos`);
    photos.forEach((photo) => {
      console.log(`  - ${photo.id}: ${photo.imgFilename} (user: ${photo.userId})`);
    });

    // Test 3: Test findUnique
    if (photos.length > 0) {
      const firstPhoto = await prisma.photo.findUnique({
        where: { id: photos[0].id },
      });
      console.log(`✓ Successfully found photo by ID: ${firstPhoto?.imgFilename}`);
    }

    console.log("\n✅ All database tests passed!");
  } catch (error) {
    console.error("❌ Database test failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();

