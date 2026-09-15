import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'www.stork.ai', pathname: '/badge/**' }],
  },
};

export default nextConfig;
