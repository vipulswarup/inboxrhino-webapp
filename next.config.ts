import type { NextConfig } from 'next';

const STORK_WIRE = 'https://www.stork.ai/wire/w1yiv89paodcwwi5u';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: '/news', destination: STORK_WIRE },
      { source: '/news/:path*', destination: `${STORK_WIRE}/:path*` },
    ];
  },
};

export default nextConfig;
