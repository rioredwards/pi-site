import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { GET } from "../../api/assets/[...dir]/route";
import { safeAuthRedirect } from "../auth-redirect";
import { MAX_MULTIPART_BYTES } from "../image-security";
import { readUploadForm } from "../upload-request";

test("OAuth redirects remain within the exact application origin", () => {
  const base = "https://dogtown.dog";
  for (const url of [
    "https://example.com",
    "https://dogtown.dog.example.com",
    "//example.com",
    "/\\example.com",
    "javascript:alert(1)",
    "https://dogtown.dog:444/profile",
    "https://dogtown.dog@example.com",
  ]) {
    assert.equal(safeAuthRedirect(url, base), base);
  }
  assert.equal(
    safeAuthRedirect("/profile/edit?callbackUrl=external&x=1", base),
    `${base}/profile/edit?x=1`,
  );
});

test("multipart parser counts actual streamed bytes when length is absent or false", async () => {
  const form = new FormData();
  form.append("file", new File(["image"], "photo.png", { type: "image/png" }));
  assert.equal(
    (
      await readUploadForm(
        new Request("http://upload", { method: "POST", body: form }),
      )
    ).get("file") instanceof File,
    true,
  );
  for (const length of [undefined, "1", String(MAX_MULTIPART_BYTES + 1)]) {
    const headers = new Headers({
      "content-type": "multipart/form-data; boundary=x",
    });
    if (length) headers.set("content-length", length);
    const request = new Request("http://upload", {
      method: "POST",
      headers,
      body: new Uint8Array(MAX_MULTIPART_BYTES + 1),
    });
    await assert.rejects(readUploadForm(request));
  }
});

test("asset route serves legacy rasters with isolation headers and rejects active files or symlinks", async () => {
  const root = await mkdtemp(join(tmpdir(), "image-assets-"));
  const previousRoot = process.env.IMG_UPLOAD_DIR;
  process.env.IMG_UPLOAD_DIR = root;
  const get = (dir: string[]) =>
    GET(new Request("http://assets"), { params: Promise.resolve({ dir }) });
  try {
    await writeFile(join(root, "old-photo.jpg"), "legacy raster fixture");
    await writeFile(join(root, "active.svg"), "<svg/>");
    await mkdir(join(root, "profiles"));
    await writeFile(
      join(root, "profiles", "portrait.webp"),
      "portrait fixture",
    );
    await symlink(join(root, "old-photo.jpg"), join(root, "link.jpg"));
    for (const dir of [
      ["images", "active.svg"],
      ["images", "..", "old-photo.jpg"],
      ["images", "../old-photo.jpg"],
      ["images", "link.jpg"],
      ["anything", "old-photo.jpg"],
    ])
      assert.equal((await get(dir)).status, 404);
    const response = await get(["images", "old-photo.jpg"]);
    assert.equal(response.status, 200);
    assert.equal(await response.text(), "legacy raster fixture");
    assert.equal(response.headers.get("content-type"), "image/jpeg");
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(
      response.headers.get("content-security-policy"),
      "default-src 'none'; sandbox",
    );
    for (const dir of [
      ["profiles", "portrait.webp"],
      ["images", "profiles", "portrait.webp"],
    ]) {
      const portrait = await get(dir);
      assert.equal(portrait.status, 200);
      await portrait.text();
    }
  } finally {
    if (previousRoot === undefined) delete process.env.IMG_UPLOAD_DIR;
    else process.env.IMG_UPLOAD_DIR = previousRoot;
    await rm(root, { recursive: true, force: true });
  }
});
