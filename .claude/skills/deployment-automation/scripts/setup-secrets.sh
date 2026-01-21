#!/bin/bash
# Interactive GitHub Secrets Setup Script
# Helps configure all required secrets for CI/CD pipeline
# Usage: ./setup-secrets.sh

set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 GitHub Secrets Setup Tool"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not authenticated with GitHub${NC}"
    echo "Run: gh auth login"
    exit 1
fi

echo -e "${GREEN}✅ GitHub CLI is ready${NC}"
echo ""

# Get repository
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")

if [ -z "$REPO" ]; then
    echo -e "${RED}❌ Not in a Git repository or repository not found${NC}"
    exit 1
fi

echo -e "${BLUE}Repository: $REPO${NC}"
echo ""

# Function to set secret
set_secret() {
    local secret_name="$1"
    local secret_description="$2"
    local secret_example="${3:-}"
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}Setting: $secret_name${NC}"
    echo "Description: $secret_description"
    
    if [ -n "$secret_example" ]; then
        echo "Example: $secret_example"
    fi
    
    echo ""
    read -p "Enter value (or press Enter to skip): " -s secret_value
    echo ""
    
    if [ -n "$secret_value" ]; then
        if gh secret set "$secret_name" --body "$secret_value"; then
            echo -e "${GREEN}✅ Secret '$secret_name' set successfully${NC}"
        else
            echo -e "${RED}❌ Failed to set secret '$secret_name'${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Skipped '$secret_name'${NC}"
    fi
    
    echo ""
}

# Vercel Secrets
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Vercel Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Get these values from:"
echo "1. Token: https://vercel.com/account/tokens"
echo "2. IDs: Run 'vercel link' then check .vercel/project.json"
echo ""

set_secret "VERCEL_TOKEN" \
    "Vercel authentication token" \
    "vTKqFh3..."

set_secret "VERCEL_ORG_ID" \
    "Vercel organization/team ID" \
    "team_xxx or org_xxx"

set_secret "VERCEL_PROJECT_ID" \
    "Vercel project ID" \
    "prj_xxx"

# Railway Secrets
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚂 Railway Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Get these values from:"
echo "1. Token: https://railway.app/account/tokens"
echo "2. Service ID: Service Settings → Copy Service ID"
echo ""

set_secret "RAILWAY_TOKEN" \
    "Railway authentication token" \
    "xxxxx-xxxxx-xxxxx"

set_secret "RAILWAY_SERVICE_ID" \
    "Railway service ID for production" \
    "xxxxx-xxxxx"

set_secret "RAILWAY_PROJECT_ID" \
    "Railway project ID" \
    "xxxxx-xxxxx"

# Optional: Canary/Staging
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 Optional: Canary/Staging Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Configure canary/staging secrets? (y/N): " configure_canary

if [[ "$configure_canary" =~ ^[Yy]$ ]]; then
    set_secret "CANARY_SERVICE_ID" \
        "Railway service ID for canary deployments"
    
    set_secret "STAGING_SERVICE_ID" \
        "Railway service ID for staging environment"
fi

# Notification Webhooks
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📢 Optional: Notifications"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Configure notification webhooks? (y/N): " configure_notifications

if [[ "$configure_notifications" =~ ^[Yy]$ ]]; then
    set_secret "SLACK_WEBHOOK" \
        "Slack webhook URL for deployment notifications" \
        "https://hooks.slack.com/services/..."
    
    set_secret "DISCORD_WEBHOOK" \
        "Discord webhook URL for deployment notifications" \
        "https://discord.com/api/webhooks/..."
fi

# Environment URLs
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Deployment URLs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

set_secret "FRONTEND_URL" \
    "Production frontend URL" \
    "https://example.vercel.app"

set_secret "BACKEND_URL" \
    "Production backend URL" \
    "https://api.example.com"

set_secret "CANARY_URL" \
    "Canary deployment URL (optional)" \
    "https://canary.example.com"

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Setup Complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "View all secrets:"
echo "  gh secret list"
echo ""
echo "Remove a secret:"
echo "  gh secret remove SECRET_NAME"
echo ""
echo "Update a secret:"
echo "  gh secret set SECRET_NAME"
echo ""
echo -e "${GREEN}✅ Done! Your secrets are configured.${NC}"
