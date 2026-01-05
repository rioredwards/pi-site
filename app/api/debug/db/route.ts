import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Test database connection
    const photoCount = await prisma.photo.count();
    const photos = await prisma.photo.findMany({ take: 5 });

    return NextResponse.json({
      status: "ok",
      databaseConnected: true,
      photoCount,
      samplePhotos: photos.map((p: { id: string; imgFilename: string; src: string }) => ({
        id: p.id,
        filename: p.imgFilename,
        src: p.src,
      })),
      databasePath: process.env.DATABASE_URL || "file:./prisma/dev.db",
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        databaseConnected: false,
        error: error instanceof Error ? error.message : "Unknown error",
        databasePath: process.env.DATABASE_URL || "file:./prisma/dev.db",
      },
      { status: 500 }
    );
  }
}
