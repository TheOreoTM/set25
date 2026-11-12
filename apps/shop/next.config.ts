import path from "node:path";

import type { NextConfig } from "next";

// Public product images are served from the deliberately public media bucket
// (PUBLIC_MEDIA_BASE_URL). Nothing else is allowed through the optimizer.
const mediaBase = (process.env.PUBLIC_MEDIA_BASE_URL ?? "").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  // Self-contained server for the Docker image used on the VPS
  // (NEXT_OUTPUT=standalone). Traced from the repository root so the
  // workspace packages are included. No effect on Vercel.
  ...(process.env.NEXT_OUTPUT === "standalone"
    ? { output: "standalone" as const, outputFileTracingRoot: path.resolve(process.cwd(), "../..") }
    : {}),
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
