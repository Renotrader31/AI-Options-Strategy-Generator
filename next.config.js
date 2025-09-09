/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
  env: {
    CUSTOM_KEY: 'placeholder',
  },
}

module.exports = nextConfig