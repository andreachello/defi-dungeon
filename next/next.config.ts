import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };

    // Add support for static assets
    config.module.rules.push({
      test: /\.(png|jpg|gif|svg|mp3|wav)$/i,
      type: "asset/resource",
    });

    config.module.rules.push({
      test: /\.tsx?$/,
      exclude: /node_modules/,
      use: {
        loader: "ts-loader",
        options: {
          transpileOnly: true,
        },
      },
    });

    config.resolve.alias = {
      ...config.resolve.alias,
      phaser: require.resolve("phaser"),
    };

    return config;
  },
  images: {
    unoptimized: true,
  },
  transpilePackages: ["phaser"],
  env: {
    projectID: process.env.PROJECT_ID,
    apiKey: process.env.API_KEY,
    NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS,
    NEXT_PUBLIC_STAKING_TOKEN_ADDRESS: process.env.NEXT_PUBLIC_STAKING_TOKEN_ADDRESS,
  },
  compilerOptions: {
    baseUrl: "src/",
    paths: {
      "@/styles/*": ["styles/*"],
      "@/components/*": ["components/*"],
      "@/config/*": ["config/*"],
      "@/context/*": ["context/*"],
    },
  },
};

export default nextConfig;
