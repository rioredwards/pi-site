import { MAX_MULTIPART_BYTES } from "./image-security";

export async function readUploadForm(request: Request): Promise<FormData> {
  const length = request.headers.get("content-length");
  if (
    (length &&
      (!/^\d+$/.test(length) || Number(length) > MAX_MULTIPART_BYTES)) ||
    !request.headers.get("content-type")?.startsWith("multipart/form-data;") ||
    !request.body
  ) {
    throw new Error("Invalid or oversized upload request.");
  }
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_MULTIPART_BYTES)
        throw new Error("Upload exceeds the size limit.");
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }
  return new Response(Buffer.concat(chunks), {
    headers: { "content-type": request.headers.get("content-type")! },
  }).formData();
}
