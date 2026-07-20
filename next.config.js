const path = require("path");

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  outputFileTracingRoot: path.resolve(__dirname),
  compress: true,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "gateway.pinata.cloud" },
      { protocol: "https", hostname: "arweave.net" },
      { protocol: "https", hostname: "ipfs.io" },
    ],
  },

  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "@tanstack/react-query"],
  },

  // Turbopack resolve aliases (only active when --turbopack is used).
  // Use relative strings — Turbopack resolves them from the project root.
  // Absolute path.resolve() breaks on Windows ("windows imports are not implemented yet").
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
    // Stub out broken browser-only transitive deps that aren't used by this app.
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
