import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@kimigatari/types"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
      },
    ],
  },
};

export default nextConfig;
