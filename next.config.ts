import createMDX from "@next/mdx";
import type { NextConfig } from "next";
import remarkGfm from "remark-gfm";
// import path from 'path';

const isDev = process.env.NODE_ENV !== "production";
const umamiUrl = process.env.NEXT_PUBLIC_UMAMI_URL;
const getOrigin = (url?: string) => {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
};

const umamiScriptOrigin = getOrigin(umamiUrl);

const scriptSrcParts = [
  "'self'",
  "'unsafe-inline'",
  "'unsafe-eval'",
  "https:",
  ...(isDev ? ["http:"] : []),
  ...(umamiScriptOrigin ? [umamiScriptOrigin] : []),
];

const connectSrcParts = [
  "'self'",
  "https:",
  "wss:",
  ...(isDev ? ["http:", "ws:"] : []),
];

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  `script-src ${scriptSrcParts.join(" ")}`,
  "style-src 'self' 'unsafe-inline' https:",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  `connect-src ${connectSrcParts.join(" ")}`,
  "media-src 'self' data: blob:",
  "worker-src 'self' blob:",
  "trusted-types default nextjs nextjs#bundler",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          ...(!isDev
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
              ]
            : []),
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
        ],
      },
    ];
  },
  // Recommended: this will reduce output
  // Docker image size by 80%+
  output: "standalone",
  serverExternalPackages: ["postgres"],
  // Optional: bring your own cache handler
  // cacheHandler: path.resolve('./cache-handler.mjs'),
  // cacheMaxMemorySize: 0, // Disable default in-memory caching
  images: {
    // Optional: use a different optimization service
    // loader: 'custom',
    // loaderFile: './image-loader.ts',
    //
    // We're defaulting to optimizing images with
    // Sharp, which is built-into `next start`
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
        search: "",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: "",
        pathname: "/**",
        search: "",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
        search: "",
      },
    ],
  },
  // Nginx will do gzip compression. We disable
  // compression here so we can prevent buffering
  // streaming responses
  compress: false,
  // Optional: override the default (1 year) `stale-while-revalidate`
  // header time for static pages
  // swrDelta: 3600 // seconds
  // Enable detailed logging for fetch requests in development
  logging: {
    fetches: {
      fullUrl: true, // Log full URLs for fetch requests
    },
  },
  // Configure `pageExtensions` to include MDX files
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
};

// Add markdown plugins here, as desired
const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
  },
});

// Optionally wrap with bundle analyzer (only when ANALYZE=true)
const config =
  process.env.ANALYZE === "true"
    ? import("@next/bundle-analyzer").then(({ default: withBundleAnalyzer }) =>
        withBundleAnalyzer({ enabled: true })(withMDX(nextConfig)),
      )
    : withMDX(nextConfig);

export default config;
