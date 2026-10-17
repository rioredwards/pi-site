import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createServer } from "node:http";
import { mkdtemp, readdir, readFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import sharp from "sharp";
import {
  cleanupUploadFile,
  normalizeImage,
  saveImageUpload,
} from "../image-security";

const clean = {
  nsfw_score: 0,
  is_nsfw: false,
  dog_probability: 1,
  is_dog: true,
};
const png = () =>
  sharp({ create: { width: 8, height: 6, channels: 3, background: "red" } })
    .png()
    .toBuffer();
const file = (bytes: Uint8Array, name = "photo.png", type = "image/png") =>
  new File([Uint8Array.from(bytes)], name, { type });

async function withValidator(
  run: (url: string) => Promise<void>,
  respond: (res: import("node:http").ServerResponse) => void,
) {
  const server = createServer((req, res) => {
    req.resume();
    respond(res);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as import("node:net").AddressInfo;
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

test("normalization rejects invalid bytes and active content despite an image MIME", async () => {
  for (const bytes of [
    Buffer.from("not an image"),
    Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    ),
    Buffer.from("<!doctype html><script>alert(1)</script>"),
  ]) {
    await assert.rejects(normalizeImage(file(bytes), 1024));
  }
  const bytes = await png();
  await assert.rejects(
    normalizeImage(file(bytes, "photo.png", "image/jpeg"), 1024),
  );
  await assert.rejects(normalizeImage(file(bytes), 1));
  await assert.rejects(normalizeImage(file(bytes.subarray(0, 30)), 1024));
});

test("normalization decodes supported rasters and discards names, trailing payloads and metadata", async () => {
  for (const format of ["jpeg", "png", "webp"] as const) {
    const bytes = await sharp(await png())
      .withMetadata({ exif: { IFD0: { Artist: "private metadata" } } })
      .toFormat(format)
      .toBuffer();
    const normalized = await normalizeImage(
      file(
        Buffer.concat([bytes, Buffer.from("<script>active payload</script>")]),
        "../../startup.js",
        `image/${format}`,
      ),
      10000,
    );
    const metadata = await sharp(normalized).metadata();
    assert.equal(metadata.format, "webp");
    assert.equal(metadata.width, 8);
    assert.equal(metadata.height, 6);
    assert.equal(metadata.exif, undefined);
    assert.equal(normalized.includes(Buffer.from("<script>")), false);
  }
});

test("oversized dimensions are rejected before storage", async () => {
  const bytes = await sharp({
    create: { width: 8193, height: 1, channels: 3, background: "red" },
  })
    .png()
    .toBuffer();
  await assert.rejects(normalizeImage(file(bytes), 10000));
});

test("validator failures leave no stored file, including an actual timeout", async () => {
  const root = await mkdtemp(join(tmpdir(), "image-security-"));
  try {
    for (const result of [
      { status: 400, body: clean },
      { status: 500, body: clean },
      { status: 200, body: "invalid json" },
      { status: 200, body: {} },
      { status: 200, body: { ...clean, error: "model failed" } },
      { status: 200, body: { ...clean, is_nsfw: true } },
      { status: 200, body: { ...clean, is_dog: false } },
      { status: 200, body: { ...clean, nsfw_score: "0" } },
      { status: 200, body: { ...clean, dog_probability: 2 } },
    ]) {
      await withValidator(
        async (validatorUrl) => {
          await assert.rejects(
            saveImageUpload(file(await png()), root, {
              validatorUrl,
              requireDog: true,
              maxBytes: 1024,
              timeoutMs: 500,
            }),
          );
        },
        (res) => {
          res.writeHead(result.status);
          res.end(
            typeof result.body === "string"
              ? result.body
              : JSON.stringify(result.body),
          );
        },
      );
      assert.deepEqual(await readdir(root), []);
    }
    await withValidator(
      async (validatorUrl) => {
        await assert.rejects(
          saveImageUpload(file(await png()), root, {
            validatorUrl,
            requireDog: true,
            maxBytes: 1024,
            timeoutMs: 25,
          }),
        );
      },
      () => {},
    );
    assert.deepEqual(await readdir(root), []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("validator scores without a filename permit safe storage and receive the stored raster", async () => {
  const root = await mkdtemp(join(tmpdir(), "image-security-"));
  let analyzed: Buffer | undefined;
  const server = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const request = new Request("http://validator/analyze", {
      method: "POST",
      headers: { "Content-Type": req.headers["content-type"]! },
      body: Buffer.concat(chunks),
    });
    analyzed = Buffer.from(
      await ((await request.formData()).get("file") as File).arrayBuffer(),
    );
    res.end(JSON.stringify(clean));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as import("node:net").AddressInfo;
  try {
    const saved = await saveImageUpload(
      file(await png(), "../../startup.js"),
      root,
      {
        validatorUrl: `http://127.0.0.1:${address.port}`,
        requireDog: true,
        maxBytes: 1024,
      },
    );
    assert.match(saved.filename, /^[a-f0-9-]{36}\.webp$/);
    assert.deepEqual(await readdir(root), [saved.filename]);
    assert.deepEqual(await readFile(join(root, saved.filename)), analyzed);
  } finally {
    server.closeAllConnections();
    server.close();
    await rm(root, { recursive: true, force: true });
  }
});

test("profiles allow a safe non-dog portrait and reject a directory symlink escape", async () => {
  const root = await mkdtemp(join(tmpdir(), "image-security-"));
  const outside = await mkdtemp(join(tmpdir(), "image-outside-"));
  try {
    await withValidator(
      async (validatorUrl) => {
        const options = {
          validatorUrl,
          requireDog: false,
          profile: true,
          maxBytes: 1024,
        };
        const saved = await saveImageUpload(file(await png()), root, options);
        assert.match(saved.filename, /\.webp$/);
        await rm(join(root, "profiles"), { recursive: true });
        await symlink(outside, join(root, "profiles"));
        await assert.rejects(saveImageUpload(file(await png()), root, options));
        assert.deepEqual(await readdir(outside), []);
      },
      (res) =>
        res.end(
          JSON.stringify({ ...clean, is_dog: false, dog_probability: 0 }),
        ),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});

test("storage exhaustion or an unavailable disk measurement rejects before any file write", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "image-storage-"));
  try {
    await withValidator(
      async (validatorUrl) => {
        for (const unavailable of [false, true]) {
          const measurement = context.mock.method(fs, "statfs", async () => {
            if (unavailable)
              throw new Error("private storage measurement failure");
            return {
              bavail: BigInt(0),
              bsize: BigInt(4096),
            } as import("node:fs").BigIntStatsFs;
          });
          try {
            await assert.rejects(
              saveImageUpload(file(await png()), root, {
                validatorUrl,
                requireDog: true,
                maxBytes: 1024,
              }),
              {
                message:
                  "Image uploads are temporarily unavailable. Please try again later.",
              },
            );
            assert.deepEqual(await readdir(root), []);
          } finally {
            measurement.mock.restore();
          }
        }
      },
      (res) => res.end(JSON.stringify(clean)),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("upload cleanup removes obsolete files", async () => {
  const root = await mkdtemp(join(tmpdir(), "image-cleanup-"));
  const old = join(root, "old.webp");
  try {
    await fs.writeFile(old, "old raster");
    await cleanupUploadFile(() => fs.unlink(old));
    assert.deepEqual(await readdir(root), []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("upload cleanup failure resolves and logs no private filesystem details", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "image-private-cleanup-"));
  const messages: unknown[][] = [];
  context.mock.method(console, "error", (...args: unknown[]) =>
    messages.push(args),
  );
  try {
    // Unlinking a directory fails on both Linux and macOS.
    await cleanupUploadFile(() => fs.unlink(root));
    assert.deepEqual(messages, [
      ["Image cleanup failed; a stored file may need removal."],
    ]);
    assert.equal(JSON.stringify(messages).includes(root), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
