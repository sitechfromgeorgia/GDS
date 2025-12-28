#!/bin/sh

# Replace env vars in JavaScript files
echo "Injecting runtime env vars..."
ROOT_DIR=/usr/share/nginx/html

# Replace placeholders in JS files
# Note: This is a simple replacement. For production, consider a more robust solution like import-meta-env
# We are assuming the build process might have burned in some values or we want to overwrite them if they exist in a config object
# But since Vite burns env vars at build time, we can't easily change them at runtime unless we use a window object approach.

# Alternative: Generate a config.js file that is loaded by index.html
echo "window.env = {" > $ROOT_DIR/config.js
echo "  VITE_SUPABASE_URL: \"$VITE_SUPABASE_URL\"," >> $ROOT_DIR/config.js
echo "  VITE_SUPABASE_ANON_KEY: \"$VITE_SUPABASE_ANON_KEY\"," >> $ROOT_DIR/config.js
echo "  VITE_COMPANY_NAME: \"$VITE_COMPANY_NAME\"" >> $ROOT_DIR/config.js
echo "};" >> $ROOT_DIR/config.js

exec "$@"

