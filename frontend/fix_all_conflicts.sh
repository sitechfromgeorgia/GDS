#!/bin/bash

# Function to resolve conflicts by keeping HEAD version
resolve_file() {
    local file="$1"
    
    # Remove all conflict markers and keep HEAD content
    # This handles both standard conflicts and edge cases
    
    # Create a temporary file
    tmpfile=$(mktemp)
    
    # Process the file
    awk '
    BEGIN { in_conflict=0; in_head=0; }
    /^<<<<<<< HEAD/ { in_conflict=1; in_head=1; next; }
    /^=======/ && in_conflict { in_head=0; next; }
    /^>>>>>>> / && in_conflict { in_conflict=0; in_head=0; next; }
    in_conflict && !in_head { next; }
    !in_conflict || in_head { print; }
    ' "$file" > "$tmpfile"
    
    # Replace original file
    mv "$tmpfile" "$file"
    echo "✓ Fixed: $file"
}

# Fix all TypeScript and JSON files with conflicts
while IFS= read -r -d '' file; do
    if grep -q "<<<<<<< HEAD" "$file" 2>/dev/null || \
       grep -q ">>>>>>>" "$file" 2>/dev/null || \
       grep -q "^=======$" "$file" 2>/dev/null; then
        resolve_file "$file"
    fi
done < <(find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.json" \) -print0 2>/dev/null)

echo "All conflicts resolved!"
