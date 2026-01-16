import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { stream, streamText } from "hono/streaming";
import os from "os";

const app = new Hono();
app.use(logger());

// TODO: share this in a lib or common file
type SystemInfoResponse = {
  message: string;
  stats: {
    platform: string;
    architecture: string;
  };
};

function getSystemInfo(): SystemInfoResponse {
  return {
    message: "System stats",
    stats: {
      platform: os.platform(),
      architecture: os.arch(),
    },
  };
}

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/debug/stats", (c) => {
  return c.json(getSystemInfo());
});

app.get("/stream", (c) => {
  return stream(c, async (stream) => {
    // Write a process to be executed when aborted.
    stream.onAbort(() => {
      console.log("Aborted!");
    });
    // Write a Uint8Array.
    await stream.write(new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]));
    // Pipe a readable stream.
    // await stream.pipe(anotherReadableStream);
  });
});

const sentence = "This is some text that will be streamed to the client. Hello dogtownusa.com! 👋";

app.get("/streamText", (c) => {
  return streamText(c, async (stream) => {
    for (const word of sentence.split(" ")) {
      await stream.write(word);
      await stream.sleep(1000);
    }
  });
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 8787;

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
