#!/bin/bash
# Production health check monitoring script
# Usage: ./health-check.sh <BASE_URL> [CHECK_INTERVAL_SECONDS] [MAX_FAILURES]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${1:-}"
CHECK_INTERVAL="${2:-60}"
MAX_FAILURES="${3:-3}"

# Validation
if [ -z "$BASE_URL" ]; then
    echo -e "${RED}❌ Error: BASE_URL is required${NC}"
    echo "Usage: $0 <BASE_URL> [CHECK_INTERVAL_SECONDS] [MAX_FAILURES]"
    echo "Example: $0 https://api.example.com 60 3"
    exit 1
fi

# Remove trailing slash from URL
BASE_URL="${BASE_URL%/}"

# State tracking
CONSECUTIVE_FAILURES=0
TOTAL_CHECKS=0
TOTAL_FAILURES=0
TOTAL_SUCCESSES=0
START_TIME=$(date +%s)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏥 Health Check Monitor"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Target: $BASE_URL"
echo "Interval: ${CHECK_INTERVAL}s"
echo "Max Failures: $MAX_FAILURES"
echo "Started: $(date '+%Y-%m-%d %H:%M:%S')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Press Ctrl+C to stop monitoring"
echo ""

# Function to send alert
send_alert() {
    local message="$1"
    local severity="$2"
    
    # Send to Slack if webhook is configured
    if [ -n "${SLACK_WEBHOOK:-}" ]; then
        local emoji
        case "$severity" in
            "critical") emoji="🚨" ;;
            "warning") emoji="⚠️" ;;
            "info") emoji="ℹ️" ;;
            "success") emoji="✅" ;;
            *) emoji="📢" ;;
        esac
        
        curl -X POST "$SLACK_WEBHOOK" \
             -H 'Content-Type: application/json' \
             -d "{\"text\":\"${emoji} ${message}\"}" \
             --silent > /dev/null 2>&1 || true
    fi
    
    # Log to file if LOG_FILE is configured
    if [ -n "${LOG_FILE:-}" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$severity] $message" >> "$LOG_FILE"
    fi
}

# Function to perform health check
perform_health_check() {
    local check_time=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Perform health check
    local response_code
    local response_time
    local response_body
    
    response_code=$(curl -s -o /tmp/health_response.json -w "%{http_code}" \
                         --max-time 10 \
                         "${BASE_URL}/health" 2>/dev/null || echo "000")
    
    response_time=$(curl -s -o /dev/null -w "%{time_total}" \
                         --max-time 10 \
                         "${BASE_URL}/health" 2>/dev/null || echo "0")
    
    # Try to read response body
    response_body=""
    if [ -f /tmp/health_response.json ]; then
        response_body=$(cat /tmp/health_response.json)
    fi
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    # Convert response time to milliseconds
    response_time_ms=$(echo "$response_time * 1000" | bc 2>/dev/null || echo "0")
    response_time_int=${response_time_ms%.*}
    
    # Evaluate health status
    local is_healthy=true
    local failure_reason=""
    
    # Check HTTP status code
    if [ "$response_code" -ne 200 ]; then
        is_healthy=false
        failure_reason="HTTP $response_code"
    fi
    
    # Check response time
    if [ "$response_time_int" -gt 3000 ]; then
        is_healthy=false
        failure_reason="${failure_reason:+$failure_reason, }Slow response (${response_time_int}ms)"
    fi
    
    # Check response body for health indicators (if available)
    if [ -n "$response_body" ]; then
        if echo "$response_body" | grep -iq "unhealthy\|error\|down"; then
            is_healthy=false
            failure_reason="${failure_reason:+$failure_reason, }Service reports unhealthy"
        fi
    fi
    
    # Update statistics and display status
    if [ "$is_healthy" = true ]; then
        CONSECUTIVE_FAILURES=0
        TOTAL_SUCCESSES=$((TOTAL_SUCCESSES + 1))
        
        # Display success with response time
        local time_color="$GREEN"
        if [ "$response_time_int" -gt 500 ]; then
            time_color="$YELLOW"
        fi
        
        echo -e "${check_time} ${GREEN}✓ HEALTHY${NC} | HTTP ${response_code} | Response: ${time_color}${response_time_int}ms${NC}"
        
        # Send recovery alert if we had previous failures
        if [ $TOTAL_FAILURES -gt 0 ] && [ $CONSECUTIVE_FAILURES -eq 0 ]; then
            send_alert "Service recovered: $BASE_URL" "success"
        fi
    else
        CONSECUTIVE_FAILURES=$((CONSECUTIVE_FAILURES + 1))
        TOTAL_FAILURES=$((TOTAL_FAILURES + 1))
        
        echo -e "${check_time} ${RED}✗ UNHEALTHY${NC} | ${failure_reason}"
        
        # Send alert on first failure
        if [ $CONSECUTIVE_FAILURES -eq 1 ]; then
            send_alert "Health check failed: $BASE_URL - $failure_reason" "warning"
        fi
        
        # Send critical alert if max failures reached
        if [ $CONSECUTIVE_FAILURES -ge $MAX_FAILURES ]; then
            echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            echo -e "${RED}🚨 CRITICAL: Service down after $CONSECUTIVE_FAILURES consecutive failures${NC}"
            echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            
            send_alert "CRITICAL: Service down for ${CONSECUTIVE_FAILURES} consecutive checks: $BASE_URL" "critical"
            
            # Exit if configured to do so
            if [ "${EXIT_ON_MAX_FAILURES:-true}" = "true" ]; then
                display_summary
                exit 1
            fi
        fi
    fi
    
    # Clean up temp file
    rm -f /tmp/health_response.json
}

# Function to display statistics
display_summary() {
    local current_time=$(date +%s)
    local uptime=$((current_time - START_TIME))
    local success_rate=0
    
    if [ $TOTAL_CHECKS -gt 0 ]; then
        success_rate=$((TOTAL_SUCCESSES * 100 / TOTAL_CHECKS))
    fi
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📊 Health Check Summary"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Monitoring Duration: ${uptime}s"
    echo "Total Checks: $TOTAL_CHECKS"
    echo -e "Successful: ${GREEN}$TOTAL_SUCCESSES${NC}"
    echo -e "Failed: ${RED}$TOTAL_FAILURES${NC}"
    echo "Success Rate: ${success_rate}%"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Trap Ctrl+C and display summary
trap 'echo ""; echo "Monitoring stopped."; display_summary; exit 0' INT TERM

# Initial health check
echo "Performing initial health check..."
perform_health_check
echo ""

# Continuous monitoring loop
while true; do
    sleep "$CHECK_INTERVAL"
    perform_health_check
done
