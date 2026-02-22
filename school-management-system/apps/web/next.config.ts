import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@sms/types", "@sms/database"],
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "**.amazonaws.com" },
    ],
  },
};

export default nextConfig;
