import { authOptions } from "@/app/auth";
import { uploadPhotoForUser } from "@/app/db/photo-upload";
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

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { data: undefined, error: "No file uploaded" },
      { status: 400 },
    );
  }

  const result = await uploadPhotoForUser(file, session.user.id);
  return NextResponse.json(result, { status: result.error ? 400 : 200 });
}
