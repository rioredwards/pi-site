import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import sharp from "sharp";
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
    const raster = sharp({
      create: { width: 8, height: 6, channels: 3, background: "red" },
    });
    const jpeg = await raster.clone().jpeg().toBuffer();
    const png = await raster.clone().png().toBuffer();
    await writeFile(join(root, "old-photo.jpg"), jpeg);
    await writeFile(join(root, "legacy-jpeg-blob"), jpeg);
    await writeFile(join(root, "legacy-png-blob"), png);
    await writeFile(
      join(root, "active-blob"),
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    );
    await writeFile(
      join(root, "fake.png"),
      "<!doctype html><script>alert(1)</script>",
    );
    await writeFile(join(root, "active.svg"), "<svg/>");
    await mkdir(join(root, "profiles"));
    await writeFile(
      join(root, "profiles", "portrait.webp"),
      await raster.clone().webp().toBuffer(),
    );
    await symlink(join(root, "old-photo.jpg"), join(root, "link.jpg"));
    for (const dir of [
      ["images", "active.svg"],
      ["images", "active-blob"],
      ["images", "fake.png"],
      ["images", "..", "old-photo.jpg"],
      ["images", "../old-photo.jpg"],
      ["images", "link.jpg"],
      ["anything", "old-photo.jpg"],
    ])
      assert.equal((await get(dir)).status, 404);
    const response = await get(["images", "old-photo.jpg"]);
    assert.equal(response.status, 200);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), jpeg);
    for (const [name, bytes, mime] of [
      ["legacy-jpeg-blob", jpeg, "image/jpeg"],
      ["legacy-png-blob", png, "image/png"],
    ] as const) {
      const legacy = await get(["images", name]);
      assert.equal(legacy.status, 200);
      assert.equal(legacy.headers.get("content-type"), mime);
      assert.equal(legacy.headers.get("x-content-type-options"), "nosniff");
      assert.equal(
        legacy.headers.get("content-security-policy"),
        "default-src 'none'; sandbox",
      );
      assert.deepEqual(Buffer.from(await legacy.arrayBuffer()), bytes);
    }
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
