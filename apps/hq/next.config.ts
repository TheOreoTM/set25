import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
