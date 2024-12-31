import fs from 'fs';
import { NextResponse } from 'next/server';

// This route enables serving files from the public directory without restarting the server.
// See: https://github.com/vercel/next.js/discussions/16417#discussioncomment-11647448

export async function GET(_, { params }) {
  const dir = (await params).dir.join("/");
  if (!dir) {
    return new NextResponse(null, { status: 500 });
  }

  // Prevent path traversal attacks
  if (dir.indexOf('..') >= 0) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    // Read and serve the file
    const data = fs.readFileSync('public/' + dir,
      { flag: 'r' }
    );

    return new NextResponse(data, { status: 200 });

  } catch (error) {
    return new NextResponse(null, { status: 500 });
  }
}
