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
      type: 'asset/resource'
    });

    config.module.rules.push({
      test: /\.tsx?$/,
      exclude: /node_modules/,
      use: {
        loader: 'ts-loader',
        options: {
          transpileOnly: true
        }
      }
    });

    config.resolve.alias = {
      ...config.resolve.alias,
      'phaser': require.resolve('phaser')
    };

    return config;
  },
  images: {
    unoptimized: true
  },
  transpilePackages: ['phaser']
};

export default nextConfig;
