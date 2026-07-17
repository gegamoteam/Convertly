import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@distube/ytdl-core", "yt-search"],
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
