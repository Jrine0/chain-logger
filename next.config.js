const path = require("path");

const nextConfig = {
  reactStrictMode: true,
  compress: true,

  // Production optimizations
  productionBrowserSourceMaps: false,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "gateway.pinata.cloud" },
      { protocol: "https", hostname: "arweave.net" },
      { protocol: "https", hostname: "ipfs.io" },
    ],
    formats: ["image/avif", "image/webp"],
  },

  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "@tanstack/react-query"],
  },

  turbopack: {
    resolveAlias: {
      "@x402/evm/upto/client": "./src/lib/empty-module.js",
      "@x402/evm/exact/client": "./src/lib/empty-module.js",
      "@x402/core/client": "./src/lib/empty-module.js",
      "@x402/svm/exact/client": "./src/lib/empty-module.js",
      "@x402/evm": "./src/lib/empty-module.js",
      "@react-native-async-storage/async-storage": "./src/lib/empty-module.js",
      "pino-pretty": "./src/lib/empty-module.js",
    },
  },

  webpack: (config) => {
    const stub = path.resolve("./src/lib/empty-module.js");
    config.resolve.alias["@x402/evm/upto/client"] = stub;
    config.resolve.alias["@x402/evm/exact/client"] = stub;
    config.resolve.alias["@x402/core/client"] = stub;
    config.resolve.alias["@x402/svm/exact/client"] = stub;
    config.resolve.alias["@x402/evm"] = stub;
    config.resolve.alias["@react-native-async-storage/async-storage"] = stub;
    config.resolve.alias["pino-pretty"] = stub;
    config.resolve.fallback = { ...config.resolve.fallback, fs: false, net: false, tls: false };
    return config;
  },
};

module.exports = nextConfig;
