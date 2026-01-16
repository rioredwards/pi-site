import { getSystemStats } from "@/app/lib/system-stats";
import { NextResponse } from "next/server";

// Force dynamic rendering - ensures fresh data on each request
export const dynamic = "force-dynamic";

// This API route uses server-side environment variables
// It's safe to call getSystemStats here since this runs on the server
export async function GET() {
  try {
    const stats = await getSystemStats();
    return NextResponse.json(stats);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to fetch system stats:", error);
    return NextResponse.json({ error: "Failed to fetch system stats" }, { status: 500 });
  }
}
