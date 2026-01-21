#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
IMAGE_NAME="${1:-myapp}"
VERSION="${2:-latest}"
API_URL="${3:-https://api.example.com}"
REGISTRY="${4:-}"

# Build tag
if [ -z "$REGISTRY" ]; then
    BUILD_TAG="$IMAGE_NAME:$VERSION"
else
    BUILD_TAG="$REGISTRY/$IMAGE_NAME:$VERSION"
fi

echo -e "${YELLOW}Building Docker image...${NC}"
echo "Image Name: $BUILD_TAG"
echo "API URL: $API_URL"
echo "Version: $VERSION"
echo ""

# Enable BuildKit for better caching
DOCKER_BUILDKIT=1 docker build \
  --build-arg NEXT_PUBLIC_API_URL="$API_URL" \
  --build-arg NEXT_PUBLIC_VERSION="$VERSION" \
  -t "$BUILD_TAG" \
  -t "$IMAGE_NAME:latest" \
  . || exit 1

echo ""
echo -e "${GREEN}✓ Build complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "Run locally: ${GREEN}docker run -p 3000:3000 $BUILD_TAG${NC}"
echo "Push to registry: ${GREEN}docker push $BUILD_TAG${NC}"
echo "View image size: ${GREEN}docker images | grep $IMAGE_NAME${NC}"
