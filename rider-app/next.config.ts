import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  async headers() {
    return [
      {
        source: "/inicio",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache",
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
