/** @type {import('next').NextConfig} */
import FaviconsWebpackPlugin from 'favicons-webpack-plugin';

const nextConfig = {
  webpack: (config, { isServer }) => {
    // Add favicons-webpack-plugin to generate favicons
    if (!isServer) {
      config.plugins.push(
        new FaviconsWebpackPlugin({
          logo: './src/app/favicon.svg',
          outputPath: 'public/favicons/',
        })
      );
    }

    return config;
  },

};

export default nextConfig;
