import type { NextConfig } from "next";
const { i18n } = require('./next-i18next.config');

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  i18n,
};

export default nextConfig;
