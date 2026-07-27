import type { NextConfig } from "next";

let nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ["@el-bannawy/shared", "@el-bannawy/lib"],
  experimental: {
    optimizePackageImports: ["lucide-react", "firebase/auth", "firebase/firestore"],
  },
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
};

const ANALYZE = process.env.ANALYZE === "true";
if (ANALYZE) {
  const withBundleAnalyzer = require("@next/bundle-analyzer")({
    enabled: true,
  });
  nextConfig = withBundleAnalyzer(nextConfig);
}

export default nextConfig;
