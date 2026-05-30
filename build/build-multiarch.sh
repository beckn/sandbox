#!/bin/bash

# Multi-Architecture Docker Build Script for Sandbox
# ======================================================================
# Builds sandbox for linux/amd64 and linux/arm64
#
# Prerequisites:
#   - Docker Desktop or Docker Engine with buildx support
#   - QEMU user-static binaries (for cross-arch emulation)
#
# Usage:
#   ./build-multiarch.sh                    # Build only (cached)
#   ./build-multiarch.sh --push             # Build multi-arch and push to registry
#   ./build-multiarch.sh --load             # Build and load to local Docker (current arch only)
#   ./build-multiarch.sh --platform amd64   # Build specific platform only
#   ./build-multiarch.sh --push --tag v2.1  # Push with custom tag
#
# Environment Variables:
#   IMAGE_NAME      - Image name (default: fidedocker/sandbox-2.0)
#   IMAGE_TAG       - Image tag (default: latest)
#   PLATFORMS       - Platforms to build (default: linux/amd64,linux/arm64)
#   BUILDER_NAME    - Buildx builder name (default: sandbox-multiarch)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SANDBOX_ROOT="$(dirname "$SCRIPT_DIR")"

# Configuration with defaults
IMAGE_NAME="${IMAGE_NAME:-fidedocker/sandbox-2.0}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
PLATFORMS="${PLATFORMS:-linux/amd64,linux/arm64}"
BUILDER_NAME="${BUILDER_NAME:-sandbox-multiarch}"
DOCKERFILE="$SANDBOX_ROOT/Dockerfile"

# Parse arguments
PUSH_FLAG=""
LOAD_FLAG=""
while [[ $# -gt 0 ]]; do
    case $1 in
        --push)
            PUSH_FLAG="--push"
            shift
            ;;
        --load)
            LOAD_FLAG="--load"
            shift
            ;;
        --platform)
            PLATFORMS="linux/$2"
            shift 2
            ;;
        --tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --push              Push to registry after build"
            echo "  --load              Load into local Docker (single arch only)"
            echo "  --platform ARCH     Build for specific platform (amd64, arm64)"
            echo "  --tag TAG           Image tag (default: latest)"
            echo "  --help              Show this help message"
            echo ""
            echo "Environment Variables:"
            echo "  IMAGE_NAME          Image name (default: fidedocker/sandbox-2.0)"
            echo "  IMAGE_TAG           Image tag (default: latest)"
            echo "  PLATFORMS           Platforms (default: linux/amd64,linux/arm64)"
            echo "  BUILDER_NAME        Buildx builder name (default: sandbox-multiarch)"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

FULL_IMAGE="${IMAGE_NAME}:${IMAGE_TAG}"

echo "============================================"
echo "Multi-Arch Build: Sandbox"
echo "============================================"
echo "Sandbox Root:    $SANDBOX_ROOT"
echo "Dockerfile:      $DOCKERFILE"
echo "Image:           $FULL_IMAGE"
echo "Platforms:       $PLATFORMS"
echo "Builder:         $BUILDER_NAME"
echo "============================================"

if [ ! -f "$DOCKERFILE" ]; then
    echo "ERROR: Dockerfile not found at $DOCKERFILE"
    exit 1
fi

echo ""
echo ">>> Step 1: Setting up QEMU for cross-platform builds..."
docker run --privileged --rm tonistiigi/binfmt --install all 2>/dev/null || {
    echo "Note: QEMU setup may already be configured or not needed"
}

echo ""
echo ">>> Step 2: Setting up buildx builder..."
if ! docker buildx inspect "$BUILDER_NAME" >/dev/null 2>&1; then
    echo "Creating new buildx builder: $BUILDER_NAME"
    docker buildx create \
        --name "$BUILDER_NAME" \
        --driver docker-container \
        --driver-opt network=host \
        --bootstrap
else
    echo "Using existing builder: $BUILDER_NAME"
fi

docker buildx use "$BUILDER_NAME"

echo ""
echo ">>> Step 3: Verifying builder capabilities..."
docker buildx inspect --bootstrap

OUTPUT_FLAG=""
if [ -n "$PUSH_FLAG" ]; then
    OUTPUT_FLAG="$PUSH_FLAG"
    echo ""
    echo ">>> Mode: Build and push to registry"
elif [ -n "$LOAD_FLAG" ]; then
    OUTPUT_FLAG="$LOAD_FLAG"
    if [[ "$PLATFORMS" == *","* ]]; then
        echo "WARNING: --load only supports single platform. Using current platform."
        PLATFORMS="linux/$(uname -m | sed 's/x86_64/amd64/' | sed 's/aarch64/arm64/')"
    fi
    echo ""
    echo ">>> Mode: Build and load to local Docker (platform: $PLATFORMS)"
else
    echo ""
    echo ">>> Mode: Build only (use --push or --load to export)"
    echo "    Note: Images will be in build cache. Use --push to push to registry"
    echo "          or --load to load single-arch image to local Docker."
fi

echo ""
echo ">>> Step 4: Building multi-arch image..."
echo "Command:"
echo "  docker buildx build \\"
echo "    --platform $PLATFORMS \\"
echo "    --file $DOCKERFILE \\"
echo "    --tag $FULL_IMAGE \\"
echo "    $OUTPUT_FLAG \\"
echo "    $SANDBOX_ROOT"
echo ""

docker buildx build \
    --platform "$PLATFORMS" \
    --file "$DOCKERFILE" \
    --tag "$FULL_IMAGE" \
    $OUTPUT_FLAG \
    "$SANDBOX_ROOT"

echo ""
echo "============================================"
echo "Build Complete!"
echo "============================================"
echo "Image: $FULL_IMAGE"
echo "Platforms: $PLATFORMS"

if [ -n "$PUSH_FLAG" ]; then
    echo ""
    echo "Image pushed to registry. Verify with:"
    echo "  docker buildx imagetools inspect $FULL_IMAGE"
elif [ -n "$LOAD_FLAG" ]; then
    echo ""
    echo "Image loaded to local Docker. Verify with:"
    echo "  docker images $IMAGE_NAME"
    echo "  docker inspect $FULL_IMAGE | jq '.[0].Architecture'"
else
    echo ""
    echo "Image built in cache. To use:"
    echo "  - Push to registry:  $0 --push"
    echo "  - Load locally:      $0 --load"
fi

echo "============================================"
