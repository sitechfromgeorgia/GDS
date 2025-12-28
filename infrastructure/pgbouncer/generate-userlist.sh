#!/bin/bash
# PgBouncer User Authentication File Generator
# Usage: ./generate-userlist.sh <username> <password>
# Creates userlist.txt with MD5-hashed password for PgBouncer authentication

set -e

USERNAME=$1
PASSWORD=$2

if [ -z "$USERNAME" ] || [ -z "$PASSWORD" ]; then
  echo "Usage: $0 <username> <password>"
  echo ""
  echo "Example:"
  echo "  $0 postgres mypassword"
  echo ""
  echo "This generates userlist.txt in the format:"
  echo '  "username" "md5<hash>"'
  exit 1
fi

# Generate MD5 hash: MD5(password + username)
HASH=$(echo -n "${PASSWORD}${USERNAME}" | md5sum | cut -d' ' -f1)

# Create userlist.txt
echo "\"${USERNAME}\" \"md5${HASH}\"" > userlist.txt

echo "✅ Created userlist.txt for user: $USERNAME"
echo ""
cat userlist.txt
echo ""
echo "⚠️  IMPORTANT: Keep this file secure! It contains password hashes."
echo "📁 Add to .gitignore: userlist.txt"
