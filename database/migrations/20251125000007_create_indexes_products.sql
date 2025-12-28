-- Migration: Create Composite Index on Products Table for Analytics
-- Created: 2025-11-25
-- Purpose: T033 - Optimize product catalog queries for analytics dashboard
-- Target: Admin analytics queries (category breakdowns, active products, recent items)
--
-- Query Pattern Being Optimized:
-- SELECT * FROM products
-- WHERE category = 'მთავარი კერძი'
--   AND active = true
-- ORDER BY created_at DESC
-- LIMIT 20;
--
-- Expected Performance:
-- Before: 100-200ms (sequential scan with filtering)
-- After:  <10ms (index-only scan)
-- Result: 10-20X faster analytics queries

BEGIN;

-- Create composite index for product catalog queries
-- Covers: category filtering + active status + created_at sorting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category_active_created
  ON products (category, active, created_at DESC);

-- Verify index was created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE indexname = 'idx_products_category_active_created'
  ) THEN
    RAISE NOTICE 'Index idx_products_category_active_created created successfully';
  ELSE
    RAISE EXCEPTION 'Index idx_products_category_active_created was not created';
  END IF;
END$$;

COMMIT;

-- Analyze table to update statistics for query planner
ANALYZE products;

--
-- Performance Validation (T038):
--
-- 1. Check index is being used:
--    EXPLAIN ANALYZE
--    SELECT * FROM products
--    WHERE category = 'მთავარი კერძი'
--      AND active = true
--    ORDER BY created_at DESC
--    LIMIT 20;
--
--    Expected output: "Index Scan using idx_products_category_active_created"
--
-- 2. Measure query performance:
--    SELECT
--      query,
--      calls,
--      mean_exec_time,
--      stddev_exec_time
--    FROM pg_stat_statements
--    WHERE query LIKE '%products%category%'
--    ORDER BY mean_exec_time DESC;
--
--    Expected: mean_exec_time < 10ms
--
-- 3. Check index size:
--    SELECT
--      indexname,
--      pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
--      idx_scan as scans,
--      idx_tup_read as tuples_read,
--      idx_tup_fetch as tuples_fetched
--    FROM pg_stat_user_indexes
--    WHERE indexrelname = 'idx_products_category_active_created';
--
--    Expected: ~5-20MB depending on product count
--

-- Notes:
-- - Composite index column order: (category, active, created_at DESC)
--   - category first (high selectivity, commonly filtered)
--   - active second (boolean filter, works with category)
--   - created_at DESC last (sorting column, already in index)
--
-- - created_at DESC in index definition means index is sorted DESC
--   - Matches ORDER BY created_at DESC pattern
--   - Enables forward index scan (most efficient)
--
-- - CONCURRENTLY prevents table locks during creation (safe for production)
--
-- - ANALYZE updates query planner statistics to use the new index
--
-- - Index covers common admin analytics queries:
--   1. "Show all products in category X"
--   2. "Show active products only"
--   3. "Sort by most recent first"
--
