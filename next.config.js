/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize Hedera SDK to avoid webpack bundling issues
      config.externals.push('@hashgraph/sdk');
    }
    return config;
  },
}

module.exports = nextConfig
