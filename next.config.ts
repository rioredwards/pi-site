import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  // Mark Node.js-only packages as external (not bundled)
  // This is the modern Next.js way to handle server-only dependencies
  serverExternalPackages: [
    "@tensorflow/tfjs-node",
    "canvas",
    "@mapbox/node-pre-gyp",
    "nsfwjs",
  ],
};

export default nextConfig;
