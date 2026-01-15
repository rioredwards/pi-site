import { getStaticSystemInfo } from "@/app/lib/system-stats";
import { NextResponse } from "next/server";

// Cache for 60 seconds - static info doesn't change often
export const revalidate = 60;

export async function GET() {
  try {
    const staticInfo = getStaticSystemInfo();

    return NextResponse.json(staticInfo, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("Error fetching system stats:", error);
    return NextResponse.json({ error: "Failed to fetch system stats" }, { status: 500 });
  }
}
