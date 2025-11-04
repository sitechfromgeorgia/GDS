#!/bin/bash

# Rollback Script
# Quickly rollback to the previous deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE=${NAMESPACE:-georgian-distribution}

# Get current active deployment
get_active_deployment() {
    kubectl get service georgian-distribution-service -n $NAMESPACE \
        -o jsonpath='{.spec.selector.version}' 2>/dev/null || echo "blue"
}

# Get inactive deployment
get_inactive_deployment() {
    local active=$(get_active_deployment)
    if [ "$active" == "blue" ]; then
        echo "green"
    else
        echo "blue"
    fi
}

# Main rollback function
main() {
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}  Rollback Procedure${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""

    ACTIVE=$(get_active_deployment)
    PREVIOUS=$(get_inactive_deployment)

    echo -e "${YELLOW}Current active deployment: ${RED}$ACTIVE${NC}"
    echo -e "${YELLOW}Rolling back to: ${GREEN}$PREVIOUS${NC}"
    echo ""

    # Check if previous deployment exists and has pods
    local prev_replicas=$(kubectl get deployment georgian-distribution-$PREVIOUS -n $NAMESPACE \
        -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")

    if [ "$prev_replicas" == "0" ]; then
        echo -e "${YELLOW}Scaling up $PREVIOUS deployment...${NC}"
        kubectl scale deployment georgian-distribution-$PREVIOUS -n $NAMESPACE --replicas=3

        # Wait for pods to be ready
        echo -e "${YELLOW}Waiting for $PREVIOUS deployment to be ready...${NC}"
        kubectl wait --for=condition=ready pod \
            -l app=georgian-distribution,version=$PREVIOUS \
            -n $NAMESPACE \
            --timeout=300s
    fi

    # Switch traffic
    echo -e "${YELLOW}Switching traffic to $PREVIOUS deployment...${NC}"
    kubectl patch service georgian-distribution-service -n $NAMESPACE \
        -p "{\"spec\":{\"selector\":{\"version\":\"$PREVIOUS\"}}}"

    echo -e "${GREEN}✓ Traffic switched to $PREVIOUS${NC}"

    # Wait for traffic to stabilize
    sleep 10

    # Scale down failed deployment
    echo -e "${YELLOW}Scaling down $ACTIVE deployment...${NC}"
    kubectl scale deployment georgian-distribution-$ACTIVE -n $NAMESPACE --replicas=0

    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Rollback Complete!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Active deployment is now: $PREVIOUS${NC}"
    echo ""
}

# Confirm before rollback
echo -e "${YELLOW}Are you sure you want to rollback? (yes/no)${NC}"
read -r confirmation

if [ "$confirmation" != "yes" ]; then
    echo -e "${RED}Rollback cancelled.${NC}"
    exit 0
fi

main
