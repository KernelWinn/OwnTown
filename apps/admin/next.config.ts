import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@owntown/types', '@owntown/utils'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.amazonaws.com' },
      { protocol: 'https', hostname: '*.cloudfront.net' },
    ],
  },
}

export default nextConfig
