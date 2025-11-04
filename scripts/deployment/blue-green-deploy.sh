#!/bin/bash

# Blue-Green Deployment Script
# This script performs a blue-green deployment in Kubernetes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE=${NAMESPACE:-georgian-distribution}
IMAGE_TAG=${IMAGE_TAG:-latest}
HEALTH_CHECK_RETRIES=${HEALTH_CHECK_RETRIES:-30}
HEALTH_CHECK_INTERVAL=${HEALTH_CHECK_INTERVAL:-10}

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

# Check if deployment is ready
check_deployment_ready() {
    local deployment=$1
    echo -e "${YELLOW}Checking if deployment georgian-distribution-$deployment is ready...${NC}"

    local retries=0
    while [ $retries -lt $HEALTH_CHECK_RETRIES ]; do
        local ready=$(kubectl get deployment georgian-distribution-$deployment -n $NAMESPACE \
            -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
        local desired=$(kubectl get deployment georgian-distribution-$deployment -n $NAMESPACE \
            -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")

        if [ "$ready" == "$desired" ] && [ "$ready" != "0" ]; then
            echo -e "${GREEN}✓ Deployment is ready: $ready/$desired replicas${NC}"
            return 0
        fi

        echo -e "${YELLOW}Waiting for deployment... ($ready/$desired replicas ready)${NC}"
        sleep $HEALTH_CHECK_INTERVAL
        retries=$((retries + 1))
    done

    echo -e "${RED}✗ Deployment failed to become ready${NC}"
    return 1
}

# Perform health check on deployment
health_check() {
    local deployment=$1
    echo -e "${YELLOW}Performing health check on $deployment deployment...${NC}"

    # Get a pod from the deployment
    local pod=$(kubectl get pods -n $NAMESPACE -l app=georgian-distribution,version=$deployment \
        -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

    if [ -z "$pod" ]; then
        echo -e "${RED}✗ No pods found for $deployment deployment${NC}"
        return 1
    fi

    # Check health endpoint
    local health_status=$(kubectl exec -n $NAMESPACE $pod -- \
        wget -qO- http://localhost:3000/api/health 2>/dev/null || echo "failed")

    if [[ $health_status == *"healthy"* ]]; then
        echo -e "${GREEN}✓ Health check passed${NC}"
        return 0
    else
        echo -e "${RED}✗ Health check failed${NC}"
        return 1
    fi
}

# Switch traffic to new deployment
switch_traffic() {
    local target=$1
    echo -e "${YELLOW}Switching traffic to $target deployment...${NC}"

    kubectl patch service georgian-distribution-service -n $NAMESPACE \
        -p "{\"spec\":{\"selector\":{\"version\":\"$target\"}}}"

    echo -e "${GREEN}✓ Traffic switched to $target${NC}"
}

# Scale down old deployment
scale_down_old() {
    local deployment=$1
    echo -e "${YELLOW}Scaling down $deployment deployment to 0...${NC}"

    kubectl scale deployment georgian-distribution-$deployment -n $NAMESPACE --replicas=0

    echo -e "${GREEN}✓ $deployment deployment scaled down${NC}"
}

# Rollback to previous deployment
rollback() {
    local target=$1
    echo -e "${RED}Rolling back to $target deployment...${NC}"

    # Switch traffic back
    switch_traffic $target

    echo -e "${GREEN}✓ Rollback complete${NC}"
}

# Main deployment flow
main() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Blue-Green Deployment${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""

    # Get active and inactive deployments
    ACTIVE=$(get_active_deployment)
    INACTIVE=$(get_inactive_deployment)

    echo -e "${YELLOW}Current active deployment: ${GREEN}$ACTIVE${NC}"
    echo -e "${YELLOW}Deploying to: ${GREEN}$INACTIVE${NC}"
    echo ""

    # Update the inactive deployment with new image
    echo -e "${YELLOW}Updating $INACTIVE deployment with image: $IMAGE_TAG${NC}"
    kubectl set image deployment/georgian-distribution-$INACTIVE \
        app=georgian-distribution:$IMAGE_TAG \
        -n $NAMESPACE

    # Scale up inactive deployment
    echo -e "${YELLOW}Scaling up $INACTIVE deployment...${NC}"
    kubectl scale deployment georgian-distribution-$INACTIVE -n $NAMESPACE --replicas=3

    # Wait for deployment to be ready
    if ! check_deployment_ready $INACTIVE; then
        echo -e "${RED}✗ Deployment failed. Keeping active deployment: $ACTIVE${NC}"
        scale_down_old $INACTIVE
        exit 1
    fi

    # Perform health check
    sleep 5  # Give the pods a moment to fully start
    if ! health_check $INACTIVE; then
        echo -e "${RED}✗ Health check failed. Rolling back...${NC}"
        scale_down_old $INACTIVE
        exit 1
    fi

    # Switch traffic to new deployment
    switch_traffic $INACTIVE

    # Wait a bit to ensure traffic is flowing properly
    echo -e "${YELLOW}Waiting for traffic to stabilize...${NC}"
    sleep 30

    # Final health check after traffic switch
    if ! health_check $INACTIVE; then
        echo -e "${RED}✗ Post-switch health check failed. Rolling back...${NC}"
        rollback $ACTIVE
        exit 1
    fi

    # Scale down old deployment
    scale_down_old $ACTIVE

    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Deployment Successful!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Active deployment is now: $INACTIVE${NC}"
    echo ""
}

# Run main function
main
