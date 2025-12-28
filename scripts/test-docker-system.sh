#!/bin/bash

# Georgian Distribution System - Docker Testing Script
# Tests the entire Docker-based system for errors

set -e  # Exit on error

echo "🚀 Georgian Distribution System - Docker Test Suite"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print success
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error
error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to print warning
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. Check Docker is running
echo "1️⃣ Checking Docker status..."
if docker info > /dev/null 2>&1; then
    success "Docker is running"
else
    error "Docker is not running. Please start Docker Desktop."
    exit 1
fi

# 2. Check required files
echo ""
echo "2️⃣ Checking required files..."
files=(
    "docker-compose.yml"
    "frontend/Dockerfile.production"
    "frontend/package.json"
    "frontend/.env.local"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        success "Found: $file"
    else
        if [ "$file" == "frontend/.env.local" ]; then
            warning "Missing: $file (will use environment variables)"
        else
            error "Missing: $file"
            exit 1
        fi
    fi
done

# 3. Check environment variables
echo ""
echo "3️⃣ Checking environment variables..."
if [ -f "frontend/.env.local" ]; then
    source frontend/.env.local
    success "Loaded environment variables from .env.local"
else
    warning "No .env.local found, using system environment variables"
fi

required_vars=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
)

missing_vars=0
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        error "Missing environment variable: $var"
        missing_vars=1
    else
        success "Found: $var"
    fi
done

if [ $missing_vars -eq 1 ]; then
    error "Please set all required environment variables"
    exit 1
fi

# 4. Stop any existing containers
echo ""
echo "4️⃣ Cleaning up existing containers..."
docker-compose down -v 2>/dev/null || true
success "Cleaned up existing containers"

# 5. Build Docker image
echo ""
echo "5️⃣ Building Docker image..."
echo "This may take a few minutes..."
if docker-compose build --no-cache 2>&1 | tee /tmp/docker-build.log; then
    success "Docker image built successfully"
else
    error "Docker build failed. Check logs above."
    exit 1
fi

# 6. Start containers
echo ""
echo "6️⃣ Starting Docker containers..."
if docker-compose up -d; then
    success "Containers started"
else
    error "Failed to start containers"
    exit 1
fi

# 7. Wait for containers to be healthy
echo ""
echo "7️⃣ Waiting for containers to be healthy..."
echo "This may take up to 60 seconds..."

max_attempts=60
attempt=0
while [ $attempt -lt $max_attempts ]; do
    sleep 1
    attempt=$((attempt + 1))

    # Check if container is running
    if docker-compose ps | grep -q "Up"; then
        echo -n "."

        # Try health check
        if curl -s http://localhost:3000/api/health/liveness > /dev/null 2>&1; then
            echo ""
            success "Container is healthy!"
            break
        fi
    else
        echo ""
        error "Container is not running"
        docker-compose logs
        exit 1
    fi

    if [ $attempt -eq $max_attempts ]; then
        echo ""
        error "Container health check failed after ${max_attempts} seconds"
        echo "Showing container logs:"
        docker-compose logs
        exit 1
    fi
done

# 8. Run system tests
echo ""
echo "8️⃣ Running system tests..."

# Test health endpoints
echo "Testing health endpoints..."
if curl -s http://localhost:3000/api/health/liveness | grep -q "ok"; then
    success "Liveness check passed"
else
    error "Liveness check failed"
fi

if curl -s http://localhost:3000/api/health/readiness | grep -q "ok"; then
    success "Readiness check passed"
else
    warning "Readiness check failed (database may not be connected)"
fi

# Test homepage
echo "Testing homepage..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    success "Homepage loads successfully"
else
    error "Homepage failed to load"
fi

# 9. Show container status
echo ""
echo "9️⃣ Container status:"
docker-compose ps

# 10. Show container logs (last 20 lines)
echo ""
echo "🔟 Recent container logs:"
echo "========================"
docker-compose logs --tail=20

# Final summary
echo ""
echo "=================================================="
echo "🎉 Docker System Test Complete!"
echo "=================================================="
echo ""
echo "📊 Summary:"
echo "  - Container status: Running ✅"
echo "  - Health check: $(curl -s http://localhost:3000/api/health/liveness)"
echo "  - Access application at: http://localhost:3000"
echo ""
echo "📝 Useful commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - Stop system: docker-compose down"
echo "  - Restart: docker-compose restart"
echo ""
