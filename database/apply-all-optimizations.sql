-- ============================================================================
-- PostgreSQL Production Optimization - Complete Migration Script
-- ============================================================================
-- Date: 2025-11-25
-- Purpose: Apply all Phase 2 optimizations in correct order
-- Target: Self-hosted Supabase @ data.greenland77.ge
--
-- This script applies ALL 9 migrations from today in the correct order:
-- 1. Order indexes (T014-T017)
-- 2. RLS indexes (T020-T021)
-- 3. RLS policy optimizations (T023-T024)
-- 4. Product indexes (T033-T034)
-- 5. Analytics RPC functions (T037)
--
-- Expected Results:
-- - 100X faster order queries
-- - 10X faster RLS checks
-- - 10-20X faster product search
-- - 20-50X faster analytics
-- ============================================================================

\timing on
\echo '=========================================='
\echo 'PostgreSQL Production Optimization'
\echo 'Starting migration at: ' :NOW
\echo '=========================================='

-- ============================================================================
-- PHASE 1: Order Indexes (T014-T017)
-- ============================================================================
\echo ''
\echo '>>> PHASE 1: Creating Order Indexes...'

-- Migration 1: Basic indexes
\echo '  → Creating idx_orders_user_id, idx_orders_created_at, idx_orders_status...'
\i migrations/20251125000001_create_indexes_orders.sql

-- Migration 2: Partial index for active orders
\echo '  → Creating idx_orders_active_partial...'
\i migrations/20251125000002_create_partial_index_active_orders.sql

-- Migration 3: Covering index for driver queries
\echo '  → Creating idx_orders_driver_status_created_covering...'
\i migrations/20251125000003_create_covering_index_orders.sql

\echo '✅ PHASE 1 COMPLETE: Order indexes created'

-- ============================================================================
-- PHASE 2: RLS Indexes (T020-T021)
-- ============================================================================
\echo ''
\echo '>>> PHASE 2: Creating RLS Indexes...'

-- Migration 4: Driver RLS index
\echo '  → Creating idx_orders_driver_id...'
\i migrations/20251125000004_create_index_orders_user_id.sql

-- Migration 5: Role-based RLS index
\echo '  → Creating idx_profiles_role...'
\i migrations/20251125000005_create_index_profiles_role.sql

\echo '✅ PHASE 2 COMPLETE: RLS indexes created'

-- ============================================================================
-- PHASE 3: RLS Policy Optimization (T023-T024)
-- ============================================================================
\echo ''
\echo '>>> PHASE 3: Optimizing RLS Policies...'

-- Migration 6: Optimized RLS policies
\echo '  → Optimizing RLS policies for orders, profiles, products...'
\i migrations/20251125000006_optimize_rls_policies.sql

\echo '✅ PHASE 3 COMPLETE: RLS policies optimized'

-- ============================================================================
-- PHASE 4: Product Indexes (T033-T034)
-- ============================================================================
\echo ''
\echo '>>> PHASE 4: Creating Product Indexes...'

-- Migration 7: Composite index for product catalog
\echo '  → Creating idx_products_category_active_created...'
\i migrations/20251125000007_create_indexes_products.sql

-- Migration 8: Full-text search index
\echo '  → Creating idx_products_search_vector (Georgian language support)...'
\i migrations/20251125000008_create_fulltext_index_products.sql

\echo '✅ PHASE 4 COMPLETE: Product indexes created'

-- ============================================================================
-- PHASE 5: Analytics RPC Functions (T037)
-- ============================================================================
\echo ''
\echo '>>> PHASE 5: Creating Analytics RPC Functions...'

-- Migration 9: Analytics server-side aggregations
\echo '  → Creating calculate_on_time_rate()...'
\echo '  → Creating calculate_avg_delivery_time()...'
\echo '  → Creating calculate_revenue_metrics()...'
\echo '  → Creating get_order_status_distribution()...'
\i migrations/20251125000009_create_analytics_rpc_functions.sql

\echo '✅ PHASE 5 COMPLETE: Analytics RPC functions created'

-- ============================================================================
-- VERIFICATION
-- ============================================================================
\echo ''
\echo '=========================================='
\echo 'Verification Summary'
\echo '=========================================='

\echo ''
\echo '1. Indexes Created:'
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexname LIKE '%2025%'
ORDER BY indexname;

\echo ''
\echo '2. RPC Functions Created:'
SELECT
  routine_name,
  routine_type,
  data_type as returns
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE 'calculate_%'
     OR routine_name LIKE 'get_order_%'
ORDER BY routine_name;

\echo ''
\echo '3. Full-Text Search Column:'
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'search_vector';

\echo ''
\echo '=========================================='
\echo 'Migration Complete!'
\echo 'Completed at: ' :NOW
\echo '=========================================='
\echo ''
\echo 'Next Steps:'
\echo '1. Run performance tests (T038)'
\echo '2. Validate 100X improvement (T013, T018)'
\echo '3. Test analytics RPC functions'
\echo '4. Deploy to production'
\echo ''

-- ============================================================================
-- PERFORMANCE TEST QUERIES
-- ============================================================================
\echo ''
\echo '=========================================='
\echo 'Quick Performance Test'
\echo '=========================================='

\echo ''
\echo 'Test 1: Driver order query (should use idx_orders_driver_id)'
EXPLAIN ANALYZE
SELECT * FROM orders
WHERE driver_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;

\echo ''
\echo 'Test 2: Product search (should use idx_products_search_vector)'
EXPLAIN ANALYZE
SELECT * FROM products
WHERE search_vector @@ plainto_tsquery('simple', 'ხინკალი')
LIMIT 10;

\echo ''
\echo 'Test 3: Analytics on-time rate (should be <50ms)'
EXPLAIN ANALYZE
SELECT * FROM calculate_on_time_rate(
  NOW() - INTERVAL '30 days',
  NOW(),
  ARRAY['delivered', 'completed']::TEXT[]
);

\echo ''
\echo '=========================================='
\echo 'All Tests Complete!'
\echo '=========================================='
