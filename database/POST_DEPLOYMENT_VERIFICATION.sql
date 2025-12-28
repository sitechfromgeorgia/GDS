-- ============================================================================
-- POST-DEPLOYMENT VERIFICATION SCRIPT
-- ============================================================================
-- Purpose: Verify successful deployment of Phase 2 optimizations
-- Run this AFTER EXECUTE_DEPLOYMENT.bat completes
-- Expected runtime: 2-3 minutes
-- ============================================================================

\timing on
\set QUIET on

-- ============================================================================
-- SECTION 1: HEADER
-- ============================================================================

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '  POST-DEPLOYMENT VERIFICATION'
\echo '  Self-Hosted Supabase at data.greenland77.ge'
\echo '  PostgreSQL Production Optimization - Phase 2'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

-- ============================================================================
-- SECTION 2: INDEX VERIFICATION
-- ============================================================================

\echo ''
\echo '1. Index Deployment Verification'
\echo '────────────────────────────────────────────────────────────────────────────'

\echo ''
\echo 'Expected Indexes (8 total):'
SELECT
  schemaname AS schema,
  tablename AS table_name,
  indexname AS index_name,
  CASE
    WHEN indexname LIKE '%_2025' THEN '✓ Newly created'
    ELSE '○ Pre-existing'
  END AS status
FROM pg_indexes
WHERE indexname IN (
  'idx_orders_restaurant_status_created_2025',
  'idx_orders_active_restaurant_2025',
  'idx_orders_covering_user_status_2025',
  'idx_orders_driver_id_2025',
  'idx_profiles_role_2025',
  'idx_products_category_active_created_2025',
  'idx_products_search_vector_2025',
  'idx_products_restaurant_category_2025'
)
ORDER BY tablename, indexname;

\echo ''
\echo 'Index Creation Verification:'
DO $$
DECLARE
  v_expected_indexes TEXT[] := ARRAY[
    'idx_orders_restaurant_status_created_2025',
    'idx_orders_active_restaurant_2025',
    'idx_orders_covering_user_status_2025',
    'idx_orders_driver_id_2025',
    'idx_profiles_role_2025',
    'idx_products_category_active_created_2025',
    'idx_products_search_vector_2025',
    'idx_products_restaurant_category_2025'
  ];
  v_missing TEXT[] := '{}';
  v_index TEXT;
BEGIN
  FOREACH v_index IN ARRAY v_expected_indexes
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = v_index) THEN
      v_missing := array_append(v_missing, v_index);
    END IF;
  END LOOP;

  IF array_length(v_missing, 1) > 0 THEN
    RAISE NOTICE '❌ MISSING INDEXES:';
    FOR i IN 1..array_length(v_missing, 1) LOOP
      RAISE NOTICE '  - %', v_missing[i];
    END LOOP;
    RAISE NOTICE '';
    RAISE NOTICE 'FIX: Re-run deployment or create indexes manually';
  ELSE
    RAISE NOTICE '✅ All 8 indexes created successfully';
  END IF;
END$$;

\echo ''
\echo 'Index Health Check:'
SELECT
  schemaname AS schema,
  tablename AS table_name,
  indexname AS index_name,
  idx_scan AS scans_performed,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched,
  CASE
    WHEN idx_scan = 0 THEN '⚠ Not yet used'
    WHEN idx_scan < 10 THEN '○ Low usage (new index)'
    ELSE '✓ Active'
  END AS usage_status
FROM pg_stat_user_indexes
WHERE indexname LIKE '%_2025'
ORDER BY tablename, indexname;

-- ============================================================================
-- SECTION 3: RPC FUNCTION VERIFICATION
-- ============================================================================

\echo ''
\echo ''
\echo '2. RPC Function Deployment Verification'
\echo '────────────────────────────────────────────────────────────────────────────'

\echo ''
\echo 'Expected RPC Functions (4 total):'
SELECT
  routine_schema AS schema,
  routine_name AS function_name,
  routine_type AS type,
  CASE
    WHEN routine_name LIKE 'calculate_%' OR routine_name LIKE 'get_order_%' THEN '✓ Analytics function'
    ELSE '○ Other'
  END AS category
FROM information_schema.routines
WHERE routine_name IN (
  'calculate_on_time_rate',
  'calculate_avg_delivery_time',
  'calculate_revenue_metrics',
  'get_order_status_distribution'
)
ORDER BY routine_name;

\echo ''
\echo 'Function Creation Verification:'
DO $$
DECLARE
  v_expected_functions TEXT[] := ARRAY[
    'calculate_on_time_rate',
    'calculate_avg_delivery_time',
    'calculate_revenue_metrics',
    'get_order_status_distribution'
  ];
  v_missing TEXT[] := '{}';
  v_function TEXT;
BEGIN
  FOREACH v_function IN ARRAY v_expected_functions
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.routines
      WHERE routine_name = v_function
    ) THEN
      v_missing := array_append(v_missing, v_function);
    END IF;
  END LOOP;

  IF array_length(v_missing, 1) > 0 THEN
    RAISE NOTICE '❌ MISSING RPC FUNCTIONS:';
    FOR i IN 1..array_length(v_missing, 1) LOOP
      RAISE NOTICE '  - %', v_missing[i];
    END LOOP;
    RAISE NOTICE '';
    RAISE NOTICE 'FIX: Re-run migration 20251125000009_create_analytics_rpc_functions.sql';
  ELSE
    RAISE NOTICE '✅ All 4 RPC functions created successfully';
  END IF;
END$$;

\echo ''
\echo 'Quick Function Test (calculate_on_time_rate):'
DO $$
DECLARE
  v_result RECORD;
  v_start TIMESTAMP;
  v_end TIMESTAMP;
  v_duration NUMERIC;
BEGIN
  v_start := clock_timestamp();

  SELECT * INTO v_result
  FROM calculate_on_time_rate(
    NOW() - INTERVAL '30 days',
    NOW(),
    NULL
  );

  v_end := clock_timestamp();
  v_duration := EXTRACT(MILLISECONDS FROM (v_end - v_start));

  RAISE NOTICE 'On-time rate: %%', COALESCE(v_result.on_time_rate, 0);
  RAISE NOTICE 'Execution time: % ms', ROUND(v_duration, 2);
  RAISE NOTICE 'Target: <50ms';
  RAISE NOTICE 'Status: %',
    CASE
      WHEN v_duration < 50 THEN '✅ EXCELLENT'
      WHEN v_duration < 100 THEN '✓ GOOD'
      WHEN v_duration < 200 THEN '○ ACCEPTABLE'
      ELSE '⚠ SLOW'
    END;
END$$;

-- ============================================================================
-- SECTION 4: MONITORING VIEW VERIFICATION
-- ============================================================================

\echo ''
\echo ''
\echo '3. Monitoring View Deployment Verification'
\echo '────────────────────────────────────────────────────────────────────────────'

\echo ''
\echo 'Expected Monitoring Views (8 total):'
SELECT
  schemaname AS schema,
  viewname AS view_name,
  CASE
    WHEN viewname LIKE 'monitoring_%' THEN '✓ Monitoring view'
    ELSE '○ Other'
  END AS category
FROM pg_views
WHERE viewname IN (
  'monitoring_query_performance',
  'monitoring_index_usage',
  'monitoring_table_stats',
  'monitoring_rpc_performance',
  'monitoring_connections',
  'monitoring_database_size',
  'monitoring_slow_queries',
  'monitoring_cache_hit_ratio'
)
ORDER BY viewname;

\echo ''
\echo 'View Creation Verification:'
DO $$
DECLARE
  v_expected_views TEXT[] := ARRAY[
    'monitoring_query_performance',
    'monitoring_index_usage',
    'monitoring_table_stats',
    'monitoring_rpc_performance',
    'monitoring_connections',
    'monitoring_database_size',
    'monitoring_slow_queries',
    'monitoring_cache_hit_ratio'
  ];
  v_missing TEXT[] := '{}';
  v_view TEXT;
BEGIN
  FOREACH v_view IN ARRAY v_expected_views
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_views
      WHERE viewname = v_view
    ) THEN
      v_missing := array_append(v_missing, v_view);
    END IF;
  END LOOP;

  IF array_length(v_missing, 1) > 0 THEN
    RAISE NOTICE '❌ MISSING MONITORING VIEWS:';
    FOR i IN 1..array_length(v_missing, 1) LOOP
      RAISE NOTICE '  - %', v_missing[i];
    END LOOP;
    RAISE NOTICE '';
    RAISE NOTICE 'FIX: Re-run migration 20251125000010_create_monitoring_views.sql';
  ELSE
    RAISE NOTICE '✅ All 8 monitoring views created successfully';
  END IF;
END$$;

\echo ''
\echo 'Quick View Test (monitoring_cache_hit_ratio):'
SELECT
  metric,
  cache_hit_ratio,
  rating
FROM monitoring_cache_hit_ratio
ORDER BY metric;

-- ============================================================================
-- SECTION 5: MONITORING ROLE VERIFICATION
-- ============================================================================

\echo ''
\echo ''
\echo '4. Monitoring Role Verification'
\echo '────────────────────────────────────────────────────────────────────────────'

\echo ''
\echo 'Monitoring Role Status:'
SELECT
  rolname AS role_name,
  rolcanlogin AS can_login,
  CASE
    WHEN rolcanlogin THEN '✓ Can login (required for Prometheus)'
    ELSE '✗ Cannot login'
  END AS login_status
FROM pg_roles
WHERE rolname = 'monitoring';

\echo ''
\echo 'Role Existence Verification:'
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'monitoring') THEN
    RAISE NOTICE '❌ Monitoring role does not exist';
    RAISE NOTICE 'FIX: Re-run migration 20251125000010_create_monitoring_views.sql';
  ELSE
    RAISE NOTICE '✅ Monitoring role exists';
    RAISE NOTICE '';
    RAISE NOTICE '⚠ SECURITY REMINDER:';
    RAISE NOTICE '  Default password: monitoring_change_this_password';
    RAISE NOTICE '  Change with: ALTER ROLE monitoring WITH PASSWORD ''your_secure_password'';';
  END IF;
END$$;

-- ============================================================================
-- SECTION 6: PERFORMANCE COMPARISON
-- ============================================================================

\echo ''
\echo ''
\echo '5. Performance Comparison (Before vs After)'
\echo '────────────────────────────────────────────────────────────────────────────'

\echo ''
\echo 'Reading baseline-results.txt and validation-results.txt...'
\echo '(Check these files for detailed performance comparison)'
\echo ''

DO $$
BEGIN
  RAISE NOTICE 'Expected Improvements:';
  RAISE NOTICE '  Driver orders query:     ~100ms → ~10ms  (10X faster)';
  RAISE NOTICE '  Product catalog query:   ~150ms → ~10ms  (15X faster)';
  RAISE NOTICE '  Product search query:    ~750ms → ~50ms  (15X faster)';
  RAISE NOTICE '  Analytics queries:      ~3500ms → ~100ms (35X faster)';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Detailed results in:';
  RAISE NOTICE '  - baseline-results.txt    (before optimization)';
  RAISE NOTICE '  - validation-results.txt  (after optimization)';
END$$;

-- ============================================================================
-- SECTION 7: QUERY PLAN VERIFICATION
-- ============================================================================

\echo ''
\echo ''
\echo '6. Query Plan Verification (Index Usage)'
\echo '────────────────────────────────────────────────────────────────────────────'

\echo ''
\echo 'Test Query 1: Restaurant Orders (should use idx_orders_restaurant_status_created_2025):'
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, status, created_at, total_amount
FROM orders
WHERE restaurant_id = (SELECT id FROM profiles WHERE role = 'restaurant' LIMIT 1)
  AND status IN ('pending', 'confirmed')
ORDER BY created_at DESC
LIMIT 20;

\echo ''
\echo 'Test Query 2: Product Search (should use idx_products_search_vector_2025):'
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, name, description
FROM products
WHERE search_vector @@ to_tsquery('simple', 'pizza | burger')
LIMIT 10;

\echo ''
\echo 'Index Usage Summary:'
DO $$
DECLARE
  v_scans INTEGER;
BEGIN
  SELECT SUM(idx_scan)::INTEGER INTO v_scans
  FROM pg_stat_user_indexes
  WHERE indexname LIKE '%_2025';

  RAISE NOTICE 'Total index scans (2025 indexes): %', COALESCE(v_scans, 0);

  IF COALESCE(v_scans, 0) = 0 THEN
    RAISE NOTICE '⚠ Indexes not yet used - run application queries to activate';
  ELSIF v_scans < 100 THEN
    RAISE NOTICE '○ Low usage - indexes are new';
  ELSE
    RAISE NOTICE '✓ Indexes are being actively used';
  END IF;
END$$;

-- ============================================================================
-- SECTION 8: DEPLOYMENT SUCCESS SUMMARY
-- ============================================================================

\echo ''
\echo ''
\echo '7. Deployment Success Summary'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

DO $$
DECLARE
  v_indexes_created INTEGER;
  v_functions_created INTEGER;
  v_views_created INTEGER;
  v_monitoring_role_exists BOOLEAN;
  v_success BOOLEAN := TRUE;
  v_issues TEXT[] := '{}';
BEGIN
  -- Count created resources
  SELECT COUNT(*)::INTEGER INTO v_indexes_created
  FROM pg_indexes
  WHERE indexname LIKE '%_2025';

  SELECT COUNT(*)::INTEGER INTO v_functions_created
  FROM information_schema.routines
  WHERE routine_name IN (
    'calculate_on_time_rate',
    'calculate_avg_delivery_time',
    'calculate_revenue_metrics',
    'get_order_status_distribution'
  );

  SELECT COUNT(*)::INTEGER INTO v_views_created
  FROM pg_views
  WHERE viewname LIKE 'monitoring_%';

  SELECT EXISTS(SELECT 1 FROM pg_roles WHERE rolname = 'monitoring')
  INTO v_monitoring_role_exists;

  -- Verify counts
  IF v_indexes_created < 8 THEN
    v_success := FALSE;
    v_issues := array_append(v_issues, format('Only %s/8 indexes created', v_indexes_created));
  END IF;

  IF v_functions_created < 4 THEN
    v_success := FALSE;
    v_issues := array_append(v_issues, format('Only %s/4 RPC functions created', v_functions_created));
  END IF;

  IF v_views_created < 8 THEN
    v_success := FALSE;
    v_issues := array_append(v_issues, format('Only %s/8 monitoring views created', v_views_created));
  END IF;

  IF NOT v_monitoring_role_exists THEN
    v_success := FALSE;
    v_issues := array_append(v_issues, 'Monitoring role not created');
  END IF;

  -- Print summary
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════════════════╗';

  IF v_success THEN
    RAISE NOTICE '║  ✅✅✅ DEPLOYMENT SUCCESSFUL ✅✅✅                                   ║';
    RAISE NOTICE '║                                                                        ║';
    RAISE NOTICE '║  Resources Created:                                                    ║';
    RAISE NOTICE '║    - Indexes:           %/8  ✓                                        ║', v_indexes_created;
    RAISE NOTICE '║    - RPC Functions:     %/4  ✓                                        ║', v_functions_created;
    RAISE NOTICE '║    - Monitoring Views:  %/8  ✓                                        ║', v_views_created;
    RAISE NOTICE '║    - Monitoring Role:   %     ✓                                        ║',
      CASE WHEN v_monitoring_role_exists THEN 'Yes' ELSE 'No' END;
    RAISE NOTICE '║                                                                        ║';
    RAISE NOTICE '║  Next Steps:                                                           ║';
    RAISE NOTICE '║    1. Deploy monitoring stack (docker-compose up -d)                   ║';
    RAISE NOTICE '║    2. Deploy frontend updates (npm run build && git push)              ║';
    RAISE NOTICE '║    3. Monitor Grafana dashboard at http://localhost:3000              ║';
    RAISE NOTICE '║    4. Verify performance improvements in production                    ║';
  ELSE
    RAISE NOTICE '║  ⚠⚠⚠ DEPLOYMENT INCOMPLETE ⚠⚠⚠                                      ║';
    RAISE NOTICE '║                                                                        ║';
    RAISE NOTICE '║  Resources Created:                                                    ║';
    RAISE NOTICE '║    - Indexes:           %/8  %                                        ║',
      v_indexes_created,
      CASE WHEN v_indexes_created = 8 THEN '✓' ELSE '✗' END;
    RAISE NOTICE '║    - RPC Functions:     %/4  %                                        ║',
      v_functions_created,
      CASE WHEN v_functions_created = 4 THEN '✓' ELSE '✗' END;
    RAISE NOTICE '║    - Monitoring Views:  %/8  %                                        ║',
      v_views_created,
      CASE WHEN v_views_created = 8 THEN '✓' ELSE '✗' END;
    RAISE NOTICE '║    - Monitoring Role:   %     %                                        ║',
      CASE WHEN v_monitoring_role_exists THEN 'Yes' ELSE 'No' END,
      CASE WHEN v_monitoring_role_exists THEN '✓' ELSE '✗' END;
    RAISE NOTICE '║                                                                        ║';
    RAISE NOTICE '║  Issues Found:                                                         ║';
    FOR i IN 1..array_length(v_issues, 1) LOOP
      RAISE NOTICE '║    - %                                                             ║', v_issues[i];
    END LOOP;
    RAISE NOTICE '║                                                                        ║';
    RAISE NOTICE '║  Action Required:                                                      ║';
    RAISE NOTICE '║    - Review deployment-results.txt for errors                          ║';
    RAISE NOTICE '║    - Re-run failed migrations manually                                 ║';
  END IF;

  RAISE NOTICE '╚════════════════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
END$$;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '  POST-DEPLOYMENT VERIFICATION COMPLETE'
\echo '  Generated: ' `date`
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

\set QUIET off
\timing off
