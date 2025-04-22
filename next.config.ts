import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["yjs"], //https://github.com/yjs/yjs/issues/438#issuecomment-2239984668
};

export default nextConfig;
