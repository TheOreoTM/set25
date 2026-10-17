import type { NextConfig } from "next";

// Public product images are served from the deliberately public media bucket
// (PUBLIC_MEDIA_BASE_URL). Nothing else is allowed through the optimizer.
const mediaBase = (process.env.PUBLIC_MEDIA_BASE_URL ?? "").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  images: {
    qualities: [75],
    remotePatterns: mediaBase ? [new URL(`${mediaBase}/**`)] : [],
  },
  async headers() {
    return [
      {
        // The order page URL carries its access token; never leak it.
        source: "/order/:token*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.svg": {
        type: "asset",
      },
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
