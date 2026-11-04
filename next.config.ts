import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Arena and Vercel preview hosts proxy the dev server from a different origin.
  allowedDevOrigins: ["*.e2b.app", "*.vercel.app"],
};

export default nextConfig;
