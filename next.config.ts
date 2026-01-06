import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  productionBrowserSourceMaps: true,
  // Enable server-side source maps for debugging
  webpack: (config, { dev, isServer }) => {
    if (!dev && isServer) {
      config.devtool = "source-map";
    }
    return config;
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  // Mark Node.js-only packages as external (not bundled)
  serverExternalPackages: [
    "@tensorflow/tfjs-node",
    "canvas",
    "@mapbox/node-pre-gyp",
    "nsfwjs",
  ],
};

export default nextConfig;
