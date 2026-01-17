#!/bin/sh
set -e

echo "Injecting runtime env vars..."
ROOT_DIR=/usr/share/nginx/html

# Support both VITE_* and NEXT_PUBLIC_* prefixes
SUPABASE_URL="${VITE_SUPABASE_URL:-$NEXT_PUBLIC_SUPABASE_URL}"
SUPABASE_KEY="${VITE_SUPABASE_ANON_KEY:-$NEXT_PUBLIC_SUPABASE_ANON_KEY}"
COMPANY_NAME="${VITE_COMPANY_NAME:-$NEXT_PUBLIC_COMPANY_NAME}"

# Validate required environment variables
if [ -z "$SUPABASE_URL" ]; then
    echo "WARNING: SUPABASE_URL not set. App may not function correctly."
fi

if [ -z "$SUPABASE_KEY" ]; then
    echo "WARNING: SUPABASE_KEY not set. App may not function correctly."
fi

# Function to escape special characters for JSON
escape_json() {
    printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g; s/\t/\\t/g; s/\r/\\r/g; s/\n/\\n/g'
}

# Generate config.js safely
cat > "$ROOT_DIR/config.js" << EOF
window.env = {
  VITE_SUPABASE_URL: "$(escape_json "$SUPABASE_URL")",
  VITE_SUPABASE_ANON_KEY: "$(escape_json "$SUPABASE_KEY")",
  VITE_COMPANY_NAME: "$(escape_json "$COMPANY_NAME")",
  NEXT_PUBLIC_SUPABASE_URL: "$(escape_json "$SUPABASE_URL")",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "$(escape_json "$SUPABASE_KEY")",
  NEXT_PUBLIC_COMPANY_NAME: "$(escape_json "$COMPANY_NAME")"
};
EOF

# Verify file was created
if [ ! -f "$ROOT_DIR/config.js" ]; then
    echo "ERROR: Failed to create config.js"
    exit 1
fi

# Set correct permissions
chmod 644 "$ROOT_DIR/config.js"

echo "Runtime env injection complete."

exec "$@"
