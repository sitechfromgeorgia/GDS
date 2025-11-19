#!/bin/bash
# Georgian Distribution Management - Docker Build Test Script
# This script tests the Docker build locally before deploying to Dockploy

set -e  # Exit on error

echo "========================================"
echo "Docker Build Test Script"
echo "Georgian Distribution Management System"
echo "========================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "[ERROR] Docker is not running!"
    echo "Please start Docker and try again."
    exit 1
fi

echo "[OK] Docker is running"
echo ""

# Check for required environment variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "[WARNING] NEXT_PUBLIC_SUPABASE_URL not set"
    echo "Using default: https://data.greenland77.ge"
    export NEXT_PUBLIC_SUPABASE_URL="https://data.greenland77.ge"
else
    echo "[OK] NEXT_PUBLIC_SUPABASE_URL: $NEXT_PUBLIC_SUPABASE_URL"
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "[ERROR] NEXT_PUBLIC_SUPABASE_ANON_KEY not set!"
    echo ""
    echo "Please set your Supabase anonymous key:"
    echo "export NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here"
    echo ""
    echo "Then run this script again."
    exit 1
else
    echo "[OK] NEXT_PUBLIC_SUPABASE_ANON_KEY: ***************"
fi

if [ -z "$NEXT_PUBLIC_APP_URL" ]; then
    echo "[WARNING] NEXT_PUBLIC_APP_URL not set"
    echo "Using default: http://localhost:3000"
    export NEXT_PUBLIC_APP_URL="http://localhost:3000"
else
    echo "[OK] NEXT_PUBLIC_APP_URL: $NEXT_PUBLIC_APP_URL"
fi

echo ""
echo "========================================"
echo "Step 1: Building Docker Image"
echo "========================================"
echo "This may take 10-15 minutes on first build..."
echo ""

docker-compose build \
    --build-arg NODE_ENV=production \
    --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
    --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
    --build-arg NEXT_PUBLIC_APP_URL="$NEXT_PUBLIC_APP_URL"

echo ""
echo "[OK] Build completed successfully!"
echo ""

echo "========================================"
echo "Step 2: Starting Container"
echo "========================================"
echo ""

docker-compose up -d

echo "[OK] Container started"
echo ""

echo "========================================"
echo "Step 3: Waiting for Application Startup"
echo "========================================"
echo "Waiting 60 seconds for health check grace period..."
echo ""

sleep 60

echo "========================================"
echo "Step 4: Testing Health Endpoint"
echo "========================================"
echo ""

# Try to reach health endpoint
if curl -f http://localhost:3000/api/health/liveness 2>/dev/null; then
    echo ""
    echo "[OK] Health check passed!"
else
    echo ""
    echo "[WARNING] Health check failed or curl not available"
    echo ""
    echo "Manual check: Open browser and go to:"
    echo "http://localhost:3000/api/health/liveness"
    echo ""
fi

echo ""
echo "========================================"
echo "Step 5: Checking Container Status"
echo "========================================"
echo ""

docker-compose ps

echo ""
echo "========================================"
echo "Step 6: Recent Container Logs"
echo "========================================"
echo ""

docker-compose logs --tail=50 frontend

echo ""
echo "========================================"
echo "Test Complete!"
echo "========================================"
echo ""
echo "Your application should now be running at:"
echo "http://localhost:3000"
echo ""
echo "To view live logs:"
echo "  docker-compose logs -f frontend"
echo ""
echo "To stop the container:"
echo "  docker-compose down"
echo ""
echo "To stop and remove volumes:"
echo "  docker-compose down -v"
echo ""
