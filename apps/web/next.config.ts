import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ["@el-bannawy/shared", "@el-bannawy/lib"],
  async redirects() {
    return [
      {
        source: "/logo.png",
        destination: "/logo.svg",
        permanent: true,
      },
    ];
  },
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
};

export default nextConfig;
