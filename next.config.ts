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
  // nsfwjs and buffer are bundled by webpack to avoid ESM import issues
  serverExternalPackages: ["@tensorflow/tfjs-node", "@mapbox/node-pre-gyp"],
};

export default nextConfig;
