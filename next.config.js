/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize Hedera SDK to avoid webpack bundling issues
      config.externals.push('@hashgraph/sdk');
    }

    if (!isServer) {
      // Add fallbacks for Node.js modules on the client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Suppress specific warnings for HashConnect and Hedera Wallet Connect
    config.ignoreWarnings = [
      { module: /node_modules\/@hashgraph\/hedera-wallet-connect/ },
      { module: /node_modules\/hashconnect/ },
    ];

    return config;
  },
}

module.exports = nextConfig
