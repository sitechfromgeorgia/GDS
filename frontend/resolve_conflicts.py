#!/usr/bin/env python3
import os
import re
import sys

def resolve_conflict_in_file(filepath):
    """Resolve merge conflicts by keeping HEAD version."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check if file has conflicts
        if '<<<<<<< HEAD' not in content:
            return False

        # Pattern to match conflict blocks and keep HEAD version
        # Matches: <<<<<<< HEAD\n...content...\n=======\n...other content...\n>>>>>>> hash
        pattern = r'<<<<<<< HEAD\n(.*?)\n=======\n.*?\n>>>>>>> [^\n]+\n'

        # Replace with just the HEAD content
        resolved = re.sub(pattern, r'\1\n', content, flags=re.DOTALL)

        # Also handle conflicts without newline after HEAD marker
        pattern2 = r'<<<<<<< HEAD\n(.*?)\n=======\n.*?\n>>>>>>> [^\n]+'
        resolved = re.sub(pattern2, r'\1', resolved, flags=re.DOTALL)

        # Write resolved content back
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(resolved)

        print(f"✓ Resolved: {filepath}")
        return True

    except Exception as e:
        print(f"✗ Error in {filepath}: {e}")
        return False

def main():
    files = [
        "next.config.ts",
        "tsconfig.json",
        "src/types/database.ts",
        "src/app/layout.tsx",
        "src/app/page.tsx",
        "src/app/providers.tsx",
        "src/components/ErrorBoundary.tsx",
        "src/components/admin/ProductForm.tsx",
        "src/components/auth/AuthProvider.tsx",
        "src/components/auth/LoginForm.tsx",
        "src/components/orders/OrderTable.tsx",
        "src/components/ui/alert.tsx",
        "src/components/ui/badge.tsx",
        "src/components/ui/button.tsx",
        "src/components/ui/card.tsx",
        "src/components/ui/dialog.tsx",
        "src/components/ui/input.tsx",
        "src/components/ui/label.tsx",
        "src/hooks/useAuth.ts",
        "src/lib/supabase/client.ts",
        "src/lib/utils.ts",
        "src/services/admin/admin.service.ts",
        "src/services/auth/auth.service.ts",
        "src/services/orders/order.service.ts",
        "src/store/authStore.ts",
    ]

    resolved_count = 0
    for filepath in files:
        if os.path.exists(filepath):
            if resolve_conflict_in_file(filepath):
                resolved_count += 1

    print(f"\nResolved conflicts in {resolved_count} files.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
