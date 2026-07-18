#!/usr/bin/env bash
set -e

echo "Building contracts..."
forge build

echo ""
echo "Deploying ChainLogger to Polygon Amoy..."
forge script script/Deploy.s.sol:Deploy \
    --rpc-url "$POLYGON_AMOY_RPC_URL" \
    --private-key "$PRIVATE_KEY" \
    --broadcast \
    --verify \
    --etherscan-api-key "$POLYGONSCAN_API_KEY" \
    -vvvv

echo ""
echo "Deployment complete!"
