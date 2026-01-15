import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

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
      platform: "(demo-data)",
      architecture: "(demo-data)",
    },
  };
}

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/debug/stats", (c) => {
  return c.json(getSystemInfo());
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
