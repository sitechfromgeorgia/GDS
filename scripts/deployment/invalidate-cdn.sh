#!/bin/bash

# CDN Cache Invalidation Script
# Invalidates CDN cache after deployment

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

CDN_PROVIDER=${CDN_PROVIDER:-cloudflare}

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  CDN Cache Invalidation${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

case $CDN_PROVIDER in
  cloudflare)
    echo -e "${YELLOW}Purging Cloudflare cache...${NC}"

    if [ -z "$CLOUDFLARE_ZONE_ID" ] || [ -z "$CLOUDFLARE_API_TOKEN" ]; then
      echo "Error: CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN must be set"
      exit 1
    fi

    curl -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
      -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
      -H "Content-Type: application/json" \
      --data '{"purge_everything":true}'

    echo -e "${GREEN}✓ Cloudflare cache purged${NC}"
    ;;

  cloudfront)
    echo -e "${YELLOW}Invalidating CloudFront distribution...${NC}"

    if [ -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
      echo "Error: CLOUDFRONT_DISTRIBUTION_ID must be set"
      exit 1
    fi

    aws cloudfront create-invalidation \
      --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
      --paths "/*" \
      --region "${AWS_REGION:-us-east-1}"

    echo -e "${GREEN}✓ CloudFront invalidation created${NC}"
    ;;

  *)
    echo "Unknown CDN provider: $CDN_PROVIDER"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}CDN cache invalidation complete!${NC}"
