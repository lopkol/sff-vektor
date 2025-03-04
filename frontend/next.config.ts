import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Needed for biome to work: this allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
