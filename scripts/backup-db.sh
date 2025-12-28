#!/bin/bash

# Database Backup Script for Georgian Distribution Management System
# Usage: ./backup-db.sh

# Configuration
BACKUP_DIR="/var/backups/postgres"
RETENTION_DAYS=7
RETENTION_WEEKS=4
DATE=$(date +%Y-%m-%d_%H-%M-%S)
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="postgres"
DB_NAME="postgres"

# Ensure backup directory exists
mkdir -p $BACKUP_DIR/daily
mkdir -p $BACKUP_DIR/weekly

# Create backup
echo "Starting backup for $DB_NAME at $DATE..."
PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -F c -b -v -f "$BACKUP_DIR/daily/db_backup_$DATE.dump"

if [ $? -eq 0 ]; then
  echo "Backup successful: $BACKUP_DIR/daily/db_backup_$DATE.dump"
else
  echo "Backup failed!"
  exit 1
fi

# Weekly Backup (Run on Sundays)
if [ $(date +%u) -eq 7 ]; then
  echo "Sunday detected, copying to weekly..."
  cp "$BACKUP_DIR/daily/db_backup_$DATE.dump" "$BACKUP_DIR/weekly/db_backup_weekly_$DATE.dump"
fi

# Cleanup Old Backups
echo "Cleaning up old backups..."
find $BACKUP_DIR/daily -type f -name "*.dump" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR/weekly -type f -name "*.dump" -mtime +$((RETENTION_WEEKS * 7)) -delete

echo "Backup process completed."
