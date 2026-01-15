#!/bin/sh

# Replace env vars in JavaScript files
echo "Injecting runtime env vars..."
ROOT_DIR=/usr/share/nginx/html

# Debug: List all environment keys (values hidden for security)
echo "Debug: Available Environment Variables:"
printenv | cut -d= -f1 | sort | grep -E "VITE_|NEXT_|SUPABASE_|COMPANY_"

# Support both VITE_* and NEXT_PUBLIC_* prefixes
# Check VITE_ first, then fall back to NEXT_PUBLIC_
SUPABASE_URL="${VITE_SUPABASE_URL:-$NEXT_PUBLIC_SUPABASE_URL}"
SUPABASE_KEY="${VITE_SUPABASE_ANON_KEY:-$NEXT_PUBLIC_SUPABASE_ANON_KEY}"
COMPANY_NAME="${VITE_COMPANY_NAME:-$NEXT_PUBLIC_COMPANY_NAME}"

# Generate config.js with both prefixes for maximum compatibility
echo "window.env = {" >$ROOT_DIR/config.js
echo "  VITE_SUPABASE_URL: \"$SUPABASE_URL\"," >>$ROOT_DIR/config.js
echo "  VITE_SUPABASE_ANON_KEY: \"$SUPABASE_KEY\"," >>$ROOT_DIR/config.js
echo "  VITE_COMPANY_NAME: \"$COMPANY_NAME\"," >>$ROOT_DIR/config.js
echo "  NEXT_PUBLIC_SUPABASE_URL: \"$SUPABASE_URL\"," >>$ROOT_DIR/config.js
echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY: \"$SUPABASE_KEY\"," >>$ROOT_DIR/config.js
echo "  NEXT_PUBLIC_COMPANY_NAME: \"$COMPANY_NAME\"" >>$ROOT_DIR/config.js
echo "};" >>$ROOT_DIR/config.js

# Allow correct permissions
chmod 644 $ROOT_DIR/config.js

echo "Config generated:"
cat $ROOT_DIR/config.js

exec "$@"
