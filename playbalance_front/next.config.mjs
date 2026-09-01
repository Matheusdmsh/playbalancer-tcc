/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: false,
  skipTrailingSlashRedirect: true,
  allowedDevOrigins: ['host.docker.internal'],
  async rewrites() {
    if (process.env.NODE_ENV !== 'development') return []

    return [
      {
        source: '/api-proxy/api_playbalance/:path*',
        destination: 'http://localhost:8001/api_playbalance/:path*',
      },
    ]
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
