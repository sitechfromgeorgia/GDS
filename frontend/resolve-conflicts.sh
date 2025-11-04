#!/bin/bash

# Script to resolve all merge conflicts by accepting HEAD version

FILES=(
  "next.config.ts"
  "tsconfig.json"
  "src/types/database.ts"
  "src/app/layout.tsx"
  "src/app/page.tsx"
  "src/app/providers.tsx"
  "src/components/ErrorBoundary.tsx"
  "src/components/admin/ProductForm.tsx"
  "src/components/auth/AuthProvider.tsx"
  "src/components/auth/LoginForm.tsx"
  "src/components/orders/OrderTable.tsx"
  "src/components/ui/alert.tsx"
  "src/components/ui/badge.tsx"
  "src/components/ui/button.tsx"
  "src/components/ui/card.tsx"
  "src/components/ui/dialog.tsx"
  "src/components/ui/input.tsx"
  "src/components/ui/label.tsx"
  "src/hooks/useAuth.ts"
  "src/lib/supabase/client.ts"
  "src/lib/utils.ts"
  "src/services/admin/admin.service.ts"
  "src/services/auth/auth.service.ts"
  "src/services/orders/order.service.ts"
  "src/store/authStore.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Resolving conflicts in $file..."
    # Use git checkout --ours to keep HEAD version
    git checkout --ours "$file" 2>/dev/null || {
      # If git checkout doesn't work, use sed to remove conflict markers manually
      # This removes the conflict markers and keeps the HEAD version
      sed -i '/^<<<<<<< HEAD$/,/^=======$/!{/^=======$/,/^>>>>>>> /d;}; /^<<<<<<< HEAD$/d; /^=======$/d; /^>>>>>>> .*/d' "$file"
    }
  fi
done

echo "All conflicts resolved!"
