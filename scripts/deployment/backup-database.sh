#!/bin/bash

# Database Backup Script for Supabase PostgreSQL
# Performs automated backups with retention policy

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
BACKUP_DIR=${BACKUP_DIR:-/var/backups/georgian-distribution}
RETENTION_DAYS=${RETENTION_DAYS:-7}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${TIMESTAMP}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

# Supabase configuration
SUPABASE_PROJECT_REF=${SUPABASE_PROJECT_REF:-"akxmacfsltzhbnunoepb"}
SUPABASE_DB_PASSWORD=${SUPABASE_DB_PASSWORD:-""}

# Database connection details
DB_HOST="${SUPABASE_PROJECT_REF}.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Database Backup Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if pg_dump is available
if ! command -v pg_dump &> /dev/null; then
    echo -e "${RED}✗ pg_dump is not installed${NC}"
    echo -e "${YELLOW}Install PostgreSQL client: apt-get install postgresql-client${NC}"
    exit 1
fi

# Perform backup
echo -e "${YELLOW}Creating database backup...${NC}"
export PGPASSWORD="$SUPABASE_DB_PASSWORD"

pg_dump \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --format=plain \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    --file="$BACKUP_DIR/$BACKUP_FILE" \
    2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database backup created successfully${NC}"
else
    echo -e "${RED}✗ Database backup failed${NC}"
    exit 1
fi

# Compress backup
echo -e "${YELLOW}Compressing backup...${NC}"
gzip -f "$BACKUP_DIR/$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backup compressed: $COMPRESSED_FILE${NC}"
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/$COMPRESSED_FILE" | cut -f1)
    echo -e "${GREEN}  Backup size: $BACKUP_SIZE${NC}"
else
    echo -e "${RED}✗ Compression failed${NC}"
    exit 1
fi

# Upload to cloud storage (optional)
if [ -n "$S3_BUCKET" ]; then
    echo -e "${YELLOW}Uploading backup to S3...${NC}"
    aws s3 cp "$BACKUP_DIR/$COMPRESSED_FILE" \
        "s3://$S3_BUCKET/backups/$COMPRESSED_FILE" \
        --region "${AWS_REGION:-us-east-1}"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Backup uploaded to S3${NC}"
    else
        echo -e "${RED}✗ S3 upload failed${NC}"
    fi
fi

# Clean up old backups
echo -e "${YELLOW}Cleaning up old backups (retention: $RETENTION_DAYS days)...${NC}"
find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

if [ $? -eq 0 ]; then
    REMAINING=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" | wc -l)
    echo -e "${GREEN}✓ Old backups cleaned up${NC}"
    echo -e "${GREEN}  Remaining backups: $REMAINING${NC}"
fi

# Create backup metadata
cat > "$BACKUP_DIR/${BACKUP_FILE%.sql}_metadata.json" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "database": "$DB_NAME",
  "host": "$DB_HOST",
  "backup_file": "$COMPRESSED_FILE",
  "size": "$BACKUP_SIZE",
  "retention_days": $RETENTION_DAYS
}
EOF

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Backup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Backup location: $BACKUP_DIR/$COMPRESSED_FILE${NC}"
echo ""
