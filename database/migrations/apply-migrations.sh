#!/bin/bash
# Database Migration Application Script
# Applies all pending migrations to self-hosted Supabase database
# Uses CONCURRENTLY flag for zero-downtime deployment

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         Database Migration Application                    ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║ Target: Self-hosted Supabase (data.greenland77.ge)       ║"
echo "║ Strategy: CONCURRENTLY - Zero downtime                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set!"
  echo ""
  echo "Please set it with your production database URL:"
  echo "  export DATABASE_URL='postgres://user:password@data.greenland77.ge:5432/postgres'"
  exit 1
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
  echo "❌ ERROR: psql is not installed"
  echo ""
  echo "Install PostgreSQL client:"
  echo "  Ubuntu/Debian: sudo apt-get install postgresql-client"
  echo "  macOS: brew install postgresql"
  exit 1
fi

# Test database connection
echo "🔌 Testing database connection..."
if ! psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1; then
  echo "❌ ERROR: Cannot connect to database"
  echo ""
  echo "Please check:"
  echo "  1. DATABASE_URL is correct"
  echo "  2. Database is accessible from this machine"
  echo "  3. Firewall allows connections on port 5432"
  exit 1
fi
echo "✅ Database connection successful"
echo ""

# List migration files
MIGRATION_FILES=(
  "20251125000001_create_indexes_orders.sql"
  "20251125000002_create_partial_index_active_orders.sql"
  "20251125000003_create_covering_index_orders.sql"
)

echo "📋 Migrations to apply:"
for file in "${MIGRATION_FILES[@]}"; do
  echo "   - $file"
done
echo ""

# Confirm before proceeding
read -p "⚠️  Apply these migrations to PRODUCTION? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "❌ Migration cancelled by user"
  exit 0
fi
echo ""

# Create migrations tracking table if it doesn't exist
echo "📊 Ensuring migrations tracking table exists..."
psql "$DATABASE_URL" << 'EOF'
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  description TEXT
);
EOF
echo "✅ Migrations tracking table ready"
echo ""

# Apply each migration
SUCCESS_COUNT=0
SKIP_COUNT=0
FAIL_COUNT=0

for file in "${MIGRATION_FILES[@]}"; do
  VERSION="${file%.*}"  # Remove .sql extension
  FILEPATH="$(dirname "$0")/$file"

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📄 Processing: $file"
  echo ""

  # Check if already applied
  ALREADY_APPLIED=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM schema_migrations WHERE version = '$VERSION';")

  if [ "$ALREADY_APPLIED" -gt 0 ]; then
    echo "⏭️  SKIPPED: Migration already applied"
    SKIP_COUNT=$((SKIP_COUNT + 1))
    echo ""
    continue
  fi

  # Apply migration
  echo "⚙️  Applying migration..."
  if psql "$DATABASE_URL" -f "$FILEPATH" 2>&1; then
    # Record in migrations table
    psql "$DATABASE_URL" -c "INSERT INTO schema_migrations (version, description) VALUES ('$VERSION', 'Applied via apply-migrations.sh');"
    echo "✅ SUCCESS: Migration applied"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  else
    echo "❌ FAILED: Migration encountered an error"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
  echo ""
done

# Summary
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              Migration Summary                            ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║ Total Migrations: ${#MIGRATION_FILES[@]}                                        ║"
echo "║ ✅ Applied:        $SUCCESS_COUNT                                        ║"
echo "║ ⏭️  Skipped:        $SKIP_COUNT                                        ║"
echo "║ ❌ Failed:         $FAIL_COUNT                                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

if [ $FAIL_COUNT -gt 0 ]; then
  echo "⚠️  WARNING: Some migrations failed!"
  echo "Please review the errors above and fix before proceeding."
  exit 1
fi

# Verify indexes were created
echo "🔍 Verifying indexes..."
echo ""

psql "$DATABASE_URL" << 'EOF'
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE indexrelname LIKE 'idx_orders%'
ORDER BY indexrelname;
EOF
echo ""

echo "✅ Migration application complete!"
echo ""
echo "📊 Next steps:"
echo "   1. Run EXPLAIN ANALYZE to verify index usage"
echo "   2. Measure query performance (p50, p95, p99)"
echo "   3. Monitor index growth over time"
echo ""
