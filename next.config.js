/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost', 'your-domain.com'],
  },
  env: {
    PAYLOAD_SECRET: process.env.PAYLOAD_SECRET,
    MONGODB_URI: process.env.MONGODB_URI,
  },
}

module.exports = nextConfig