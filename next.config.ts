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

  webpack(config, { isServer, webpack }) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    // Ignore @resvg native modules during build - this prevents webpack from processing .node files
    config.plugins.push(
      new webpack.IgnorePlugin({
        checkResource(resource: string) {
          // Ignore .node files from @resvg packages
          if (
            resource.includes("@resvg") &&
            (resource.endsWith(".node") || resource.includes(".node"))
          ) {
            return true;
          }
          // Also ignore the specific native module file
          if (resource.includes("resvgjs.win32-x64-msvc.node")) {
            return true;
          }
          return false;
        },
      })
    );

    // Exclude @resvg from server-side bundle
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        "@resvg/resvg-js": "commonjs @resvg/resvg-js",
      });
    }

    // Prevent webpack from trying to process native modules
    config.resolve.alias = {
      ...config.resolve.alias,
      "@resvg/resvg-js-win32-x64-msvc": false,
    };

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
