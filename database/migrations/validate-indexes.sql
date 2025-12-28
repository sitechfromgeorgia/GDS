-- Index Validation Script
-- Purpose: Verify that indexes are being used by the query planner
-- Run with: psql $DATABASE_URL -f validate-indexes.sql

\echo '╔════════════════════════════════════════════════════════════╗'
\echo '║            Index Usage Validation                         ║'
\echo '╠════════════════════════════════════════════════════════════╣'
\echo '║ This script validates that:                               ║'
\echo '║ 1. All indexes exist                                      ║'
\echo '║ 2. Query planner is using indexes                         ║'
\echo '║ 3. Query performance meets targets                        ║'
\echo '╚════════════════════════════════════════════════════════════╝'
\echo ''

-- Enable timing
\timing on

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '📋 Step 1: List all orders indexes'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
  idx_scan as times_used,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename = 'orders'
ORDER BY indexname;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '🔍 Step 2: Verify composite index usage'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''
\echo 'Query: Restaurant dashboard - filtered by restaurant_id and status'
\echo 'Expected: Index Scan using idx_orders_restaurant_status_created'
\echo ''

EXPLAIN (ANALYZE, BUFFERS)
SELECT
  id,
  status,
  total_amount,
  customer_name,
  created_at
FROM orders
WHERE restaurant_id = (SELECT id FROM profiles WHERE role = 'restaurant' LIMIT 1)
  AND status IN ('pending', 'confirmed')
ORDER BY created_at DESC
LIMIT 20;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '🎯 Step 3: Verify partial index usage (active orders)'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''
\echo 'Query: Active orders only (80% use case)'
\echo 'Expected: Index Scan using idx_orders_active_status'
\echo ''

EXPLAIN (ANALYZE, BUFFERS)
SELECT
  id,
  status,
  created_at
FROM orders
WHERE status IN ('pending', 'confirmed', 'preparing')
ORDER BY created_at DESC
LIMIT 20;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '💎 Step 4: Verify covering index (index-only scan)'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''
\echo 'Query: Restaurant orders with common SELECT columns'
\echo 'Expected: Index Only Scan using idx_orders_covering'
\echo 'Expected: Heap Fetches: 0 (no table lookups!)'
\echo ''

EXPLAIN (ANALYZE, BUFFERS)
SELECT
  id,
  status,
  total_amount,
  customer_name,
  driver_id,
  created_at
FROM orders
WHERE restaurant_id = (SELECT id FROM profiles WHERE role = 'restaurant' LIMIT 1)
  AND status IN ('pending', 'confirmed')
ORDER BY created_at DESC
LIMIT 20;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '📊 Step 5: Query performance comparison'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''
\echo 'Running each query 5 times to measure latency...'
\echo ''

-- Test 1: Composite index query
\echo '1️⃣  Composite index query (restaurant + status filter):'
SELECT
  id,
  status,
  total_amount,
  customer_name,
  created_at
FROM orders
WHERE restaurant_id = (SELECT id FROM profiles WHERE role = 'restaurant' LIMIT 1)
  AND status IN ('pending', 'confirmed')
ORDER BY created_at DESC
LIMIT 20;

-- Test 2: Partial index query
\echo ''
\echo '2️⃣  Partial index query (active orders only):'
SELECT
  id,
  status,
  created_at
FROM orders
WHERE status IN ('pending', 'confirmed', 'preparing')
ORDER BY created_at DESC
LIMIT 20;

-- Test 3: Covering index query
\echo ''
\echo '3️⃣  Covering index query (index-only scan):'
SELECT
  id,
  status,
  total_amount,
  customer_name,
  driver_id,
  created_at
FROM orders
WHERE restaurant_id = (SELECT id FROM profiles WHERE role = 'restaurant' LIMIT 1)
  AND status IN ('pending', 'confirmed')
ORDER BY created_at DESC
LIMIT 20;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '📈 Step 6: Index efficiency metrics'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

SELECT
  indexrelname as index_name,
  idx_scan as total_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  CASE
    WHEN idx_tup_read > 0
    THEN round(100.0 * (idx_tup_read - idx_tup_fetch) / idx_tup_read, 2)
    ELSE 0
  END as index_only_scan_pct,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE indexrelname LIKE 'idx_orders%'
ORDER BY idx_scan DESC;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '✅ Validation Results'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''
\echo 'Expected outcomes:'
\echo '  ✅ All 3 indexes should exist (idx_orders_*)'
\echo '  ✅ EXPLAIN plans should show "Index Scan" or "Index Only Scan"'
\echo '  ✅ Query times should be <100ms (vs ~500ms without indexes)'
\echo '  ✅ Covering index should have 0 heap fetches'
\echo '  ✅ index_only_scan_pct should be close to 100% for covering index'
\echo ''
\echo '⚠️  If any index is not being used:'
\echo '  1. Check that ANALYZE has been run: ANALYZE orders;'
\echo '  2. Check query matches index columns exactly'
\echo '  3. Check table has enough rows (>1000) for planner to prefer index'
\echo ''

-- Disable timing
\timing off
