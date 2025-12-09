import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "img.clerk.com" },
      { hostname: "wafxhogndldxzgzizbst.supabase.co" }, // Supabase Storage 도메인
    ],
  },
};

export default nextConfig;
