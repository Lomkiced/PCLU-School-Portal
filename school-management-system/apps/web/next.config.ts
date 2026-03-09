import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production", // Changed to !== "production"
});

const nextConfig: NextConfig = {
  turbopack: {}, // Empty turbopack config silences the Next 16 Turbopack/Webpack conflict error
  transpilePackages: ["@sms/types", "@sms/database"],
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "**.amazonaws.com" },
    ],
  },
};

export default withSerwist(nextConfig);
