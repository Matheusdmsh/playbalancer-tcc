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
        source: '/api-proxy/rachinha/:path*',
        destination: 'http://localhost:8001/rachinha/:path*',
      },
    ]
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
