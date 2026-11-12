import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server for the Docker image used on the VPS
  // (NEXT_OUTPUT=standalone). Traced from the repository root so the
  // workspace packages are included. No effect on Vercel.
  ...(process.env.NEXT_OUTPUT === "standalone"
    ? { output: "standalone" as const, outputFileTracingRoot: path.resolve(process.cwd(), "../..") }
    : {}),
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  experimental: {
    // Turbopack's on-disk cache kept serving an old compile of globals.css
    // (through the Tailwind loader below) after it changed: new markup with
    // stale styles, in `next dev` and on Vercel, which restores .next/cache.
    turbopackFileSystemCacheForDev: false,
    turbopackFileSystemCacheForBuild: false,
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
