import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pin the tracing root to this app so nested/parent lockfiles don't confuse the
  // Vercel build (the case-study repo has docs + design-system siblings).
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
