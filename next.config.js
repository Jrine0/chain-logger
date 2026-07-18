const path = require("path");

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  outputFileTracingRoot: path.resolve(__dirname),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "gateway.pinata.cloud" },
      { protocol: "https", hostname: "arweave.net" },
      { protocol: "https", hostname: "ipfs.io" },
    ],
  },
  webpack: (config) => {
    // Stub out broken browser-only transitive deps that aren't used by this app.
    // Applies to both server and client bundles.
    const stub = path.resolve("./src/lib/empty-module.js");
    config.resolve.alias["@x402/evm/upto/client"] = stub;
    config.resolve.alias["@x402/evm/exact/client"] = stub;
    config.resolve.alias["@x402/core/client"] = stub;
    config.resolve.alias["@x402/svm/exact/client"] = stub;
    config.resolve.alias["@x402/evm"] = stub;
    config.resolve.alias["@react-native-async-storage/async-storage"] = stub;
    config.resolve.alias["pino-pretty"] = stub;
    return config;
  },
};

module.exports = nextConfig;
