import fs from "fs";
import { join } from "path";
import { NextResponse } from "next/server";

// This route enables serving files from the public directory without restarting the server.
// See: https://github.com/vercel/next.js/discussions/16417#discussioncomment-11647448

export async function GET(_req: Request, { params }: { params: Promise<{ dir: string[] }> }) {
  const dir = (await params).dir.join("/");
  if (!dir) {
    return new NextResponse(null, { status: 500 });
  }

  // Prevent path traversal attacks
  if (dir.indexOf("..") >= 0) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    // Use absolute path to ensure it works with standalone mode and Docker
    // process.cwd() returns the project root
    const filePath = join(process.cwd(), "public", dir);
    
    // Read and serve the file
    const data = fs.readFileSync(filePath, { flag: "r" });

    return new NextResponse(data, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 500 });
  }
}

