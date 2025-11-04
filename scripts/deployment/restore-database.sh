#!/bin/bash

# Database Restore Script
# Restores database from backup file

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
BACKUP_DIR=${BACKUP_DIR:-/var/backups/georgian-distribution}
BACKUP_FILE=$1

# Supabase configuration
SUPABASE_PROJECT_REF=${SUPABASE_PROJECT_REF:-"akxmacfsltzhbnunoepb"}
SUPABASE_DB_PASSWORD=${SUPABASE_DB_PASSWORD:-""}

# Database connection details
DB_HOST="${SUPABASE_PROJECT_REF}.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"

# Validate input
if [ -z "$BACKUP_FILE" ]; then
    echo -e "${RED}Usage: $0 <backup_file>${NC}"
    echo ""
    echo "Available backups:"
    ls -lh "$BACKUP_DIR"/backup_*.sql.gz
    exit 1
fi

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    # Try to find it in the backup directory
    if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
        BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILE"
    else
        echo -e "${RED}✗ Backup file not found: $BACKUP_FILE${NC}"
        exit 1
    fi
fi

echo -e "${RED}========================================${NC}"
echo -e "${RED}  Database Restore Script${NC}"
echo -e "${RED}========================================${NC}"
echo ""
echo -e "${YELLOW}⚠️  WARNING: This will REPLACE the current database!${NC}"
echo -e "${YELLOW}Backup file: $BACKUP_FILE${NC}"
echo ""
echo -e "${YELLOW}Are you sure you want to continue? (yes/no)${NC}"
read -r confirmation

if [ "$confirmation" != "yes" ]; then
    echo -e "${RED}Restore cancelled.${NC}"
    exit 0
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}✗ psql is not installed${NC}"
    echo -e "${YELLOW}Install PostgreSQL client: apt-get install postgresql-client${NC}"
    exit 1
fi

# Decompress backup if needed
TEMP_FILE="/tmp/restore_temp.sql"
if [[ $BACKUP_FILE == *.gz ]]; then
    echo -e "${YELLOW}Decompressing backup...${NC}"
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
else
    cp "$BACKUP_FILE" "$TEMP_FILE"
fi

# Perform restore
echo -e "${YELLOW}Restoring database...${NC}"
export PGPASSWORD="$SUPABASE_DB_PASSWORD"

psql \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --file="$TEMP_FILE" \
    2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database restored successfully${NC}"
else
    echo -e "${RED}✗ Database restore failed${NC}"
    rm -f "$TEMP_FILE"
    exit 1
fi

# Clean up
rm -f "$TEMP_FILE"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Restore Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
