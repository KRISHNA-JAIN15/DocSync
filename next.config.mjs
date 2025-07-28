/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Ensure Pages API works with App Router
    appDir: true,
  },
  // Enable both App Router and Pages API
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
