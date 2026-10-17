import { authOptions } from "@/app/auth";
import { uploadPhotoForUser } from "@/app/db/photo-upload";
import { readUploadForm } from "@/app/lib/upload-request";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { data: undefined, error: "You must be signed in to upload photos." },
      { status: 401 },
    );
  }

  let formData: FormData;
  try {
    formData = await readUploadForm(request);
  } catch {
    return NextResponse.json(
      { error: "Invalid or oversized upload request." },
      { status: 413 },
    );
  }
  const file = formData.get("file");

  if (!(file instanceof File) || formData.getAll("file").length !== 1) {
    return NextResponse.json(
      { data: undefined, error: "No file uploaded" },
      { status: 400 },
    );
  }

  const result = await uploadPhotoForUser(file, session.user.id);
  return NextResponse.json(result, { status: result.error ? 400 : 200 });
}
