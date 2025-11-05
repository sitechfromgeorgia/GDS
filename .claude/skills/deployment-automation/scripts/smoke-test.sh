#!/bin/bash
# Comprehensive smoke test script for post-deployment verification
# Usage: ./smoke-test.sh <BASE_URL> [TIMEOUT_SECONDS]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${1:-}"
TIMEOUT="${2:-300}"
MAX_RETRIES=10
RETRY_DELAY=5
START_TIME=$(date +%s)

# Validation
if [ -z "$BASE_URL" ]; then
    echo -e "${RED}❌ Error: BASE_URL is required${NC}"
    echo "Usage: $0 <BASE_URL> [TIMEOUT_SECONDS]"
    echo "Example: $0 https://api.example.com 300"
    exit 1
fi

# Remove trailing slash from URL
BASE_URL="${BASE_URL%/}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Smoke Test Suite"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Target: $BASE_URL"
echo "Timeout: ${TIMEOUT}s"
echo "Started: $(date '+%Y-%m-%d %H:%M:%S')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to check elapsed time
check_timeout() {
    local current_time=$(date +%s)
    local elapsed=$((current_time - START_TIME))
    
    if [ $elapsed -ge $TIMEOUT ]; then
        echo -e "${RED}❌ Timeout exceeded (${elapsed}s / ${TIMEOUT}s)${NC}"
        exit 1
    fi
}

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "Testing: $test_name... "
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Test 1: Health Check Endpoint
echo "━━━ 1. Health Check ━━━"
for i in $(seq 1 $MAX_RETRIES); do
    check_timeout
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${BASE_URL}/health" || echo "000")
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        echo -e "${GREEN}✅ Health check passed (attempt $i/$MAX_RETRIES, HTTP $HTTP_CODE)${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        break
    else
        echo -e "${YELLOW}⚠️  Health check failed with HTTP $HTTP_CODE (attempt $i/$MAX_RETRIES)${NC}"
        
        if [ $i -eq $MAX_RETRIES ]; then
            echo -e "${RED}❌ Health check failed after $MAX_RETRIES attempts${NC}"
            FAILED_TESTS=$((FAILED_TESTS + 1))
            exit 1
        fi
        
        sleep $RETRY_DELAY
    fi
done
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

# Test 2: Response Time Check
echo "━━━ 2. Response Time ━━━"
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" --max-time 10 "${BASE_URL}/health")
RESPONSE_TIME_MS=$(echo "$RESPONSE_TIME * 1000" | bc)
RESPONSE_TIME_INT=${RESPONSE_TIME_MS%.*}

echo "Response time: ${RESPONSE_TIME_INT}ms"

if [ "$RESPONSE_TIME_INT" -lt 1000 ]; then
    echo -e "${GREEN}✅ Response time is excellent (<1s)${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
elif [ "$RESPONSE_TIME_INT" -lt 3000 ]; then
    echo -e "${YELLOW}⚠️  Response time is acceptable (1-3s)${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ Response time is too slow (>3s)${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

# Test 3: SSL/TLS Certificate Check (if HTTPS)
if [[ "$BASE_URL" == https* ]]; then
    echo "━━━ 3. SSL/TLS Certificate ━━━"
    
    if echo | timeout 10 openssl s_client -connect "${BASE_URL#https://}:443" -servername "${BASE_URL#https://}" 2>/dev/null | grep -q "Verify return code: 0"; then
        echo -e "${GREEN}✅ SSL certificate is valid${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ SSL certificate validation failed${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo ""
fi

# Test 4: API Endpoints (if applicable)
echo "━━━ 4. Critical Endpoints ━━━"

# Test root endpoint
run_test "Root endpoint" "curl -sf --max-time 10 '${BASE_URL}/' > /dev/null"

# Test API endpoint (common patterns)
if curl -sf --max-time 10 "${BASE_URL}/api/v1/health" > /dev/null 2>&1; then
    run_test "API v1 endpoint" "curl -sf --max-time 10 '${BASE_URL}/api/v1/health' > /dev/null"
fi

if curl -sf --max-time 10 "${BASE_URL}/api/status" > /dev/null 2>&1; then
    run_test "API status endpoint" "curl -sf --max-time 10 '${BASE_URL}/api/status' > /dev/null"
fi

echo ""

# Test 5: Database Connectivity (through API)
echo "━━━ 5. Service Dependencies ━━━"

# Check if health endpoint returns database status
DB_STATUS=$(curl -sf --max-time 10 "${BASE_URL}/health" | grep -i "database" || echo "")

if [ -n "$DB_STATUS" ]; then
    if echo "$DB_STATUS" | grep -qi "healthy\|connected\|up"; then
        echo -e "${GREEN}✅ Database connection healthy${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ Database connection unhealthy${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
else
    echo -e "${YELLOW}⚠️  Database status not available from health endpoint${NC}"
fi

echo ""

# Test 6: Load Test (lightweight)
echo "━━━ 6. Basic Load Test ━━━"

CONCURRENT_REQUESTS=10
SUCCESS_COUNT=0

for i in $(seq 1 $CONCURRENT_REQUESTS); do
    if curl -sf --max-time 10 "${BASE_URL}/health" > /dev/null 2>&1; then
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    fi
done

SUCCESS_RATE=$((SUCCESS_COUNT * 100 / CONCURRENT_REQUESTS))

echo "Success rate: ${SUCCESS_COUNT}/${CONCURRENT_REQUESTS} (${SUCCESS_RATE}%)"

if [ $SUCCESS_RATE -ge 90 ]; then
    echo -e "${GREEN}✅ Load test passed (≥90% success rate)${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ Load test failed (<90% success rate)${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

# Final Results
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Results Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo "Duration: ${DURATION}s"
echo "Completed: $(date '+%Y-%m-%d %H:%M:%S')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Exit with appropriate code
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ All smoke tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some smoke tests failed!${NC}"
    exit 1
fi
