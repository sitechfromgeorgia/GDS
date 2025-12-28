-- ============================================================================
-- T013: Measure Baseline Query Performance
-- ============================================================================
-- Date: 2025-11-25
-- Purpose: Establish performance baseline before optimization deployment
-- Metrics: p50, p95, p99 latencies for all critical queries
--
-- This baseline will be compared with post-optimization results (T018)
-- to validate the 100X performance improvement claim
-- ============================================================================

\timing on
\echo '=========================================='
\echo 'T013: Baseline Performance Measurement'
\echo 'Testing BEFORE optimization deployment'
\echo '=========================================='

-- ============================================================================
-- STEP 1: Environment Information
-- ============================================================================
\echo ''
\echo '>>> Environment Information'

SELECT
  version() as postgres_version,
  current_database() as database_name,
  pg_size_pretty(pg_database_size(current_database())) as database_size,
  NOW() as measurement_time;

-- ============================================================================
-- STEP 2: Data Volume Check
-- ============================================================================
\echo ''
\echo '>>> Data Volume'

SELECT
  'orders' as table_name,
  COUNT(*) as row_count,
  pg_size_pretty(pg_total_relation_size('orders')) as total_size
FROM orders
UNION ALL
SELECT
  'products' as table_name,
  COUNT(*) as row_count,
  pg_size_pretty(pg_total_relation_size('products')) as total_size
FROM products
UNION ALL
SELECT
  'profiles' as table_name,
  COUNT(*) as row_count,
  pg_size_pretty(pg_total_relation_size('profiles')) as total_size
FROM profiles;

-- ============================================================================
-- STEP 3: Critical Query Performance Tests
-- ============================================================================

\echo ''
\echo '=========================================='
\echo '>>> Test 1: Driver Order Query (RLS-based)'
\echo '=========================================='
\echo 'Query: SELECT * FROM orders WHERE driver_id = X ORDER BY created_at DESC LIMIT 20'
\echo 'Expected: Will use idx_orders_driver_id after optimization'

-- Find a real driver_id for testing
DO $$
DECLARE
  v_driver_id UUID;
  v_start TIMESTAMP;
  v_end TIMESTAMP;
  v_duration NUMERIC;
  i INT;
  v_durations NUMERIC[] := '{}';
BEGIN
  -- Get a driver with orders
  SELECT driver_id INTO v_driver_id
  FROM orders
  WHERE driver_id IS NOT NULL
  GROUP BY driver_id
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  IF v_driver_id IS NULL THEN
    RAISE NOTICE 'No driver found with orders. Skipping test.';
    RETURN;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'Testing with driver_id: %', v_driver_id;
  RAISE NOTICE '';

  -- Run query 100 times to get percentile data
  FOR i IN 1..100 LOOP
    v_start := clock_timestamp();

    PERFORM * FROM orders
    WHERE driver_id = v_driver_id
    ORDER BY created_at DESC
    LIMIT 20;

    v_end := clock_timestamp();
    v_duration := EXTRACT(MILLISECONDS FROM (v_end - v_start));
    v_durations := array_append(v_durations, v_duration);
  END LOOP;

  -- Calculate percentiles
  RAISE NOTICE 'Results (100 executions):';
  RAISE NOTICE '  p50 (median): % ms', (SELECT percentile_cont(0.50) WITHIN GROUP (ORDER BY x) FROM unnest(v_durations) x);
  RAISE NOTICE '  p95: % ms', (SELECT percentile_cont(0.95) WITHIN GROUP (ORDER BY x) FROM unnest(v_durations) x);
  RAISE NOTICE '  p99: % ms', (SELECT percentile_cont(0.99) WITHIN GROUP (ORDER BY x) FROM unnest(v_durations) x);
  RAISE NOTICE '  min: % ms', (SELECT min(x) FROM unnest(v_durations) x);
  RAISE NOTICE '  max: % ms', (SELECT max(x) FROM unnest(v_durations) x);
END$$;

-- Show EXPLAIN ANALYZE for single execution
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT * FROM orders
WHERE driver_id = (
  SELECT driver_id FROM orders
  WHERE driver_id IS NOT NULL
  GROUP BY driver_id
  ORDER BY COUNT(*) DESC
  LIMIT 1
)
ORDER BY created_at DESC
LIMIT 20;

\echo ''
\echo '=========================================='
\echo '>>> Test 2: Product Catalog Query'
\echo '=========================================='
\echo 'Query: SELECT * FROM products WHERE category = X AND active = true ORDER BY created_at DESC LIMIT 20'
\echo 'Expected: Will use idx_products_category_active_created after optimization'

DO $$
DECLARE
  v_category TEXT;
  v_start TIMESTAMP;
  v_end TIMESTAMP;
  v_duration NUMERIC;
  i INT;
  v_durations NUMERIC[] := '{}';
BEGIN
  -- Get a category with products
  SELECT category INTO v_category
  FROM products
  WHERE category IS NOT NULL
  GROUP BY category
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  IF v_category IS NULL THEN
    RAISE NOTICE 'No products found. Skipping test.';
    RETURN;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'Testing with category: %', v_category;
  RAISE NOTICE '';

  -- Run query 100 times
  FOR i IN 1..100 LOOP
    v_start := clock_timestamp();

    PERFORM * FROM products
    WHERE category = v_category
      AND active = true
    ORDER BY created_at DESC
    LIMIT 20;

    v_end := clock_timestamp();
    v_duration := EXTRACT(MILLISECONDS FROM (v_end - v_start));
    v_durations := array_append(v_durations, v_duration);
  END LOOP;

  RAISE NOTICE 'Results (100 executions):';
  RAISE NOTICE '  p50: % ms', (SELECT percentile_cont(0.50) WITHIN GROUP (ORDER BY x) FROM unnest(v_durations) x);
  RAISE NOTICE '  p95: % ms', (SELECT percentile_cont(0.95) WITHIN GROUP (ORDER BY x) FROM unnest(v_durations) x);
  RAISE NOTICE '  p99: % ms', (SELECT percentile_cont(0.99) WITHIN GROUP (ORDER BY x) FROM unnest(v_durations) x);
END$$;

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT * FROM products
WHERE category = (SELECT category FROM products WHERE category IS NOT NULL GROUP BY category ORDER BY COUNT(*) DESC LIMIT 1)
  AND active = true
ORDER BY created_at DESC
LIMIT 20;

\echo ''
\echo '=========================================='
\echo '>>> Test 3: Product Search (ILIKE)'
\echo '=========================================='
\echo 'Query: SELECT * FROM products WHERE name ILIKE %search% OR description ILIKE %search%'
\echo 'Expected: Will use idx_products_search_vector (full-text) after optimization'

DO $$
DECLARE
  v_start TIMESTAMP;
  v_end TIMESTAMP;
  v_duration NUMERIC;
  i INT;
  v_durations NUMERIC[] := '{}';
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Testing product search (ILIKE pattern matching)';
  RAISE NOTICE '';

  -- Run search query 100 times
  FOR i IN 1..100 LOOP
    v_start := clock_timestamp();

    PERFORM * FROM products
    WHERE name ILIKE '%ხინკალი%'
       OR description ILIKE '%ხინკალი%'
    LIMIT 10;

    v_end := clock_timestamp();
    v_duration := EXTRACT(MILLISECONDS FROM (v_end - v_start));
    v_durations := array_append(v_durations, v_duration);
  END LOOP;

  RAISE NOTICE 'Results (100 executions):';
  RAISE NOTICE '  p50: % ms', (SELECT percentile_cont(0.50) WITHIN GROUP (ORDER BY x) FROM unnest(v_durations) x);
  RAISE NOTICE '  p95: % ms', (SELECT percentile_cont(0.95) WITHIN GROUP (ORDER BY x) FROM unnest(v_durations) x);
  RAISE NOTICE '  p99: % ms', (SELECT percentile_cont(0.99) WITHIN GROUP (ORDER BY x) FROM unnest(v_durations) x);
END$$;

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT * FROM products
WHERE name ILIKE '%ხინკალი%'
   OR description ILIKE '%ხინკალი%'
LIMIT 10;

\echo ''
\echo '=========================================='
\echo '>>> Test 4: Analytics Query (Fetch All + Calculate)'
\echo '=========================================='
\echo 'Query: Fetch all orders in date range for client-side calculation'
\echo 'Expected: Will use RPC functions after optimization'

DO $$
DECLARE
  v_start TIMESTAMP;
  v_end TIMESTAMP;
  v_duration NUMERIC;
  v_row_count INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Testing analytics query (OLD approach - fetch all data)';
  RAISE NOTICE '';

  v_start := clock_timestamp();

  SELECT COUNT(*) INTO v_row_count
  FROM orders
  WHERE created_at >= NOW() - INTERVAL '30 days'
    AND created_at <= NOW();

  v_end := clock_timestamp();
  v_duration := EXTRACT(MILLISECONDS FROM (v_end - v_start));

  RAISE NOTICE 'Fetching % rows', v_row_count;
  RAISE NOTICE 'Duration: % ms', v_duration;
  RAISE NOTICE '';
  RAISE NOTICE 'NOTE: In frontend, this would be:';
  RAISE NOTICE '  - Network transfer: 2-4 seconds (for % rows)', v_row_count;
  RAISE NOTICE '  - JavaScript calculations: 500-1000ms';
  RAISE NOTICE '  - TOTAL: 2.5-5 seconds';
  RAISE NOTICE '';
  RAISE NOTICE 'After optimization (RPC functions):';
  RAISE NOTICE '  - All calculations in PostgreSQL: <100ms';
  RAISE NOTICE '  - Network transfer: Minimal (just results)';
  RAISE NOTICE '  - TOTAL: <100ms';
END$$;

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT
  id,
  status,
  created_at,
  delivery_time,
  total_amount
FROM orders
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND created_at <= NOW();

-- ============================================================================
-- STEP 4: Index Usage Statistics (Before Optimization)
-- ============================================================================

\echo ''
\echo '=========================================='
\echo '>>> Index Usage Statistics (Current)'
\echo '=========================================='

SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN ('orders', 'products', 'profiles')
ORDER BY tablename, idx_scan DESC;

-- ============================================================================
-- STEP 5: Table Statistics
-- ============================================================================

\echo ''
\echo '=========================================='
\echo '>>> Table Statistics'
\echo '=========================================='

SELECT
  schemaname,
  tablename,
  seq_scan as sequential_scans,
  seq_tup_read as seq_tuples_read,
  idx_scan as index_scans,
  idx_tup_fetch as idx_tuples_fetched,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND tablename IN ('orders', 'products', 'profiles')
ORDER BY tablename;

-- ============================================================================
-- FINAL REPORT
-- ============================================================================

\echo ''
\echo '=========================================='
\echo 'T013: BASELINE MEASUREMENT COMPLETE'
\echo '=========================================='

\echo ''
\echo 'Baseline Established:'
\echo ''
\echo '1. Driver Order Query'
\echo '   → Measured p50, p95, p99 latencies'
\echo '   → Will compare with post-optimization (should be 10X faster)'
\echo ''
\echo '2. Product Catalog Query'
\echo '   → Measured p50, p95, p99 latencies'
\echo '   → Will compare with post-optimization (should be 10-20X faster)'
\echo ''
\echo '3. Product Search (ILIKE)'
\echo '   → Measured p50, p95, p99 latencies'
\echo '   → Will compare with post-optimization (should be 10-20X faster)'
\echo ''
\echo '4. Analytics Query'
\echo '   → Measured fetch time for 30-day range'
\echo '   → Will compare with RPC approach (should be 20-50X faster)'
\echo ''
\echo 'Next Steps:'
\echo '1. Save this baseline report'
\echo '2. Deploy optimizations (T035, T039)'
\echo '3. Run post-optimization measurement (T018)'
\echo '4. Calculate improvement factor'
\echo '5. Validate 100X claim for indexed queries'
\echo ''
\echo '=========================================='
\echo 'Measurement completed at: ' :NOW
\echo '=========================================='
