#!/bin/bash
# Deploy sandbox-bpp to UAT

set -e

echo "Building locally..."
npm run build

echo "Committing and pushing..."
git add -A
git commit -m "${1:-Update sandbox-bpp}" || echo "Nothing to commit"
git push origin main

echo "Deploying to UAT..."
ssh ubuntu@13.203.73.248 "cd ~/DEG/testnet/p2p-trading-interdiscom-devkit/install/sandbox && git pull origin main && cd .. && docker compose -f docker-compose-adapter-p2p.yml up -d --build sandbox-bpp"

echo "Done! Test at: https://p2p.terrarexenergy.com/api/bid/preview"
