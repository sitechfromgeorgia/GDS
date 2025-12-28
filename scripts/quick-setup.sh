#!/bin/bash

# ========================================
# Quick Environment Files Setup
# ========================================

echo ""
echo "===================================="
echo "  Environment Files Setup"
echo "===================================="
echo ""

# Check if files exist
if [ ! -f ".env.production.new" ]; then
    echo "[ERROR] .env.production.new not found!"
    exit 1
fi

if [ ! -f "frontend/.env.local.new" ]; then
    echo "[ERROR] frontend/.env.local.new not found!"
    exit 1
fi

# Rename files
echo "[1/2] Renaming .env.production.new to .env.production..."
cp ".env.production.new" ".env.production"
echo "[OK] .env.production created"

echo "[2/2] Renaming frontend/.env.local.new to frontend/.env.local..."
cp "frontend/.env.local.new" "frontend/.env.local"
echo "[OK] frontend/.env.local created"

echo ""
echo "===================================="
echo "  SUCCESS! Files created:"
echo "===================================="
echo "  - .env.production"
echo "  - frontend/.env.local"
echo ""
echo "Next Steps:"
echo "  1. Setup GitHub Secrets (see GITHUB_SECRETS_UPDATE.md)"
echo "  2. Configure Dockploy (see DOCKPLOY_SETUP.md)"
echo "  3. Test locally: cd frontend && npm run dev"
echo ""
