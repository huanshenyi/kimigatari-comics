import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@kimigatari/types"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
