import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.OUTPUT_STANDALONE && { output: "standalone" }),
  /* config options here */
  serverExternalPackages: ["yjs"], //https://github.com/yjs/yjs/issues/438#issuecomment-2239984668
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
