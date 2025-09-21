import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async redirects() {
    return [
      {
        source: "/pools/savers",
        destination: "/thorfi/savers",
        permanent: true,
      },
      {
        source: "/assets",
        destination: "/thorfi/synths",
        permanent: true,
      },
    ];
  },

  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },

  env: {
    NETWORK: process.env.NETWORK || "mainnet",
  },

  sassOptions: {
    includePaths: [path.join(__dirname, "src/styles")],
  },
};

export default nextConfig;
