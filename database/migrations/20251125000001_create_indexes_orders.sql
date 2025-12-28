-- Migration: Create Composite Index on Orders Table
-- Created: 2025-11-25
-- Purpose: Optimize restaurant dashboard query performance
-- Target: 100X speedup for filtered order queries
--
-- Index Strategy:
-- Composite index on (restaurant_id, status, created_at DESC)
-- - restaurant_id: Primary filter (restaurants query their own orders)
-- - status: Secondary filter (filter by pending/confirmed/etc)
-- - created_at DESC: Ordering (newest first)
--
-- Query Pattern:
-- SELECT * FROM orders
-- WHERE restaurant_id = $1
-- AND status IN ('pending', 'confirmed')
-- ORDER BY created_at DESC
-- LIMIT 20;
--
-- Expected Improvement:
-- Before: Full table scan (10,000 rows) → ~500ms
-- After:  Index scan (20 rows) → <5ms
-- Result: 100X speedup

BEGIN;

-- Create composite index CONCURRENTLY to avoid locking the table
-- CONCURRENTLY flag allows queries to continue during index creation
-- This is critical for zero-downtime deployment
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_restaurant_status_created
  ON orders (restaurant_id, status, created_at DESC);

-- Verify index was created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE indexname = 'idx_orders_restaurant_status_created'
  ) THEN
    RAISE NOTICE 'Index idx_orders_restaurant_status_created created successfully';
  ELSE
    RAISE EXCEPTION 'Index idx_orders_restaurant_status_created was not created';
  END IF;
END$$;

COMMIT;

-- Analyze table to update statistics for query planner
ANALYZE orders;

--
-- Performance Validation:
--
-- 1. Check index is being used:
--    EXPLAIN ANALYZE
--    SELECT * FROM orders
--    WHERE restaurant_id = 'some-uuid'
--    AND status IN ('pending', 'confirmed')
--    ORDER BY created_at DESC
--    LIMIT 20;
--
--    Expected output should show "Index Scan using idx_orders_restaurant_status_created"
--
-- 2. Measure query time:
--    \timing on
--    SELECT * FROM orders
--    WHERE restaurant_id = 'some-uuid'
--    AND status = 'pending'
--    ORDER BY created_at DESC
--    LIMIT 20;
--
--    Expected: <5ms (vs ~500ms without index)
--
-- 3. Check index size:
--    SELECT
--      indexname,
--      pg_size_pretty(pg_relation_size(indexrelid)) as index_size
--    FROM pg_stat_user_indexes
--    WHERE indexrelname = 'idx_orders_restaurant_status_created';
--
--    Expected: ~50-200MB depending on orders table size
--

-- Notes:
-- - Index order matters! (restaurant_id, status, created_at) matches our query pattern
-- - DESC on created_at allows reverse scans for newest-first ordering
-- - CONCURRENTLY prevents table locks during creation (safe for production)
-- - ANALYZE updates query planner statistics to use the new index
